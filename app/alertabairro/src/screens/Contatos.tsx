// Contatos de emergência: serviços públicos fixos + contatos pessoais do usuário.

import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Botao from '../components/Botao';
import Campo from '../components/Campo';
import Cartao from '../components/Cartao';
import { ContatoEmergencia } from '../models';
import { criarContato, excluirContato, listarContatos } from '../services/contatosLocais';
import { cores, espaco, fonte, estilos } from '../theme';

// Números oficiais de emergência no Brasil.
const SERVICOS = [
  { nome: 'Polícia Militar', numero: '190' },
  { nome: 'SAMU (ambulância)', numero: '192' },
  { nome: 'Bombeiros', numero: '193' },
  { nome: 'Defesa Civil', numero: '199' },
];

function ligar(numero: string) {
  Linking.openURL(`tel:${numero}`).catch(() => Alert.alert('Não foi possível ligar', 'Este aparelho não consegue fazer ligações.'));
}

const LinhaContato = React.memo(function LinhaContato({
  nome,
  numero,
  aoExcluir,
}: {
  nome: string;
  numero: string;
  aoExcluir?: () => void;
}) {
  return (
    <Cartao>
      <View style={styles.linha}>
        <View style={{ flex: 1 }}>
          <Text style={styles.nome}>{nome}</Text>
          <Text style={styles.sub}>{numero}</Text>
        </View>
        <Botao titulo="Ligar" icone="call" variante="sucesso" onPress={() => ligar(numero)} estilo={styles.botaoLigar} />
        {aoExcluir && (
          <Ionicons name="trash-outline" size={24} color={cores.perigo} onPress={aoExcluir} accessibilityLabel={`Excluir contato ${nome}`} style={{ marginLeft: espaco.md }} />
        )}
      </View>
    </Cartao>
  );
});

export default function Contatos() {
  const [contatos, setContatos] = useState<ContatoEmergencia[]>([]);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [erros, setErros] = useState<{ nome?: string; telefone?: string }>({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;
    listarContatos().then((r) => ativo && setContatos(r));
    return () => {
      ativo = false;
    };
  }, []);

  async function adicionar() {
    const e: typeof erros = {};
    if (nome.trim().length < 2) e.nome = 'Digite o nome do contato.';
    if (telefone.replace(/\D/g, '').length < 8) e.telefone = 'Digite um telefone válido, com DDD.';
    setErros(e);
    if (Object.keys(e).length) return;

    setSalvando(true);
    try {
      const novo = await criarContato({ nome: nome.trim(), telefone: telefone.replace(/\D/g, '') });
      setContatos((l) => [...l, novo]);
      setNome('');
      setTelefone('');
    } catch {
      Alert.alert('Não foi possível salvar', 'Tente de novo.');
    } finally {
      setSalvando(false);
    }
  }

  const excluir = useCallback((c: ContatoEmergencia) => {
    Alert.alert('Excluir contato?', `${c.nome} será removido da sua lista.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await excluirContato(c.id);
            setContatos((l) => l.filter((x) => x.id !== c.id));
          } catch {
            Alert.alert('Não foi possível excluir', 'Tente de novo.');
          }
        },
      },
    ]);
  }, []);

  return (
    <ScrollView style={styles.tela} contentContainerStyle={{ padding: espaco.lg }} keyboardShouldPersistTaps="handled">
      <Text style={styles.secao}>Serviços de emergência</Text>
      {SERVICOS.map((s) => (
        <LinhaContato key={s.numero} nome={s.nome} numero={s.numero} />
      ))}

      <Text style={[styles.secao, { marginTop: espaco.lg }]}>Meus contatos</Text>
      {contatos.length === 0 && <Text style={styles.sub}>Você ainda não adicionou contatos.</Text>}
      {contatos.map((c) => (
        <LinhaContato key={c.id} nome={c.nome} numero={c.telefone} aoExcluir={() => excluir(c)} />
      ))}

      <Cartao estilo={{ marginTop: espaco.md }}>
        <Text style={styles.nome}>Adicionar contato</Text>
        <Campo rotulo="Nome" value={nome} onChangeText={setNome} placeholder="Ex.: Ana (filha)" erro={erros.nome} />
        <Campo rotulo="Telefone com DDD" value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" placeholder="11999990000" erro={erros.telefone} />
        <Botao titulo="Salvar contato" onPress={adicionar} carregando={salvando} />
      </Cartao>
    </ScrollView>
  );
}

const styles = estilos(() => ({
  tela: { flex: 1, backgroundColor: cores.fundo },
  secao: { fontSize: fonte.titulo, fontWeight: '700', color: cores.texto, marginBottom: espaco.sm },
  linha: { flexDirection: 'row', alignItems: 'center' },
  nome: { fontSize: fonte.normal, fontWeight: '600', color: cores.texto, marginBottom: espaco.xs },
  sub: { fontSize: fonte.pequena, color: cores.textoSecundario },
  botaoLigar: { minHeight: 44, paddingHorizontal: espaco.md },
}));
