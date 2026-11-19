// Funcionalidade 3: rede de ajuda (pedidos, ofertas e histórico), check-in "estou bem"
// e atalho para os contatos de emergência.

import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Botao from '../components/Botao';
import BotaoSOS from '../components/BotaoSOS';
import Cartao from '../components/Cartao';
import Chip from '../components/Chip';
import Etiqueta from '../components/Etiqueta';
import { PedidoAjuda } from '../models';
import { enviarCheckin, excluirPedido, listarPedidos, mensagemErro, resolverPedido } from '../services/api';
import { obterLocalizacao } from '../services/localizacao';
import { cores, espaco, fonte, estilos } from '../theme';

type Aba = 'pedido' | 'oferta' | 'historico';

interface ItemProps {
  p: PedidoAjuda;
  aoResolver: (id: number) => void;
  aoExcluir: (id: number) => void;
}

const ItemPedido = React.memo(function ItemPedido({ p, aoResolver, aoExcluir }: ItemProps) {
  const resolvido = p.status === 'resolvido';
  return (
    <Cartao>
      <Text style={styles.itemTitulo}>{p.categoria}</Text>
      <Text style={styles.descricao}>{p.descricao}</Text>
      <Text style={styles.sub}>{p.distancia} de você</Text>
      <View style={{ marginTop: espaco.xs }}>
        <Etiqueta
          texto={resolvido ? 'Resolvido' : p.status === 'atendido' ? 'Atendido' : 'Aguardando'}
          tom={resolvido || p.status === 'atendido' ? 'sucesso' : 'atencao'}
        />
      </View>

      {/* Só o autor vê as ações. */}
      {p.meu && (
        <View style={styles.acoes}>
          {!resolvido && (
            <Botao titulo="Já foi resolvido" variante="sucesso" icone="checkmark" onPress={() => aoResolver(p.id)} estilo={styles.acao} />
          )}
          <Botao titulo="Excluir" variante="secundario" icone="trash-outline" onPress={() => aoExcluir(p.id)} estilo={styles.acao} />
        </View>
      )}
    </Cartao>
  );
});

export default function Ajuda() {
  const nav = useNavigation<any>();
  const [lista, setLista] = useState<PedidoAjuda[]>([]);
  const [aba, setAba] = useState<Aba>('pedido');
  const [carregando, setCarregando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      setCarregando(true);
      // A posição vai para a API calcular "distancia" de cada pedido.
      obterLocalizacao()
        .then((pos) => listarPedidos(pos))
        .then((r) => ativo && setLista(r))
        .catch((e) => ativo && Alert.alert('Não foi possível carregar', mensagemErro(e)))
        .finally(() => ativo && setCarregando(false));
      return () => {
        ativo = false;
      };
    }, []),
  );

  // Pedidos e Ofertas mostram só o que está ativo; o Histórico mostra o que foi resolvido.
  const filtrados = useMemo(() => {
    if (aba === 'historico') return lista.filter((p) => p.status === 'resolvido');
    return lista.filter((p) => p.modo === aba && p.status !== 'resolvido');
  }, [lista, aba]);

  const resolver = useCallback((id: number) => {
    Alert.alert('Já foi resolvido?', 'O item sai da lista e vai para o seu histórico.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sim, resolvido',
        onPress: async () => {
          try {
            const atualizado = await resolverPedido(id);
            setLista((l) => l.map((p) => (p.id === id ? atualizado : p)));
          } catch (e) {
            Alert.alert('Não foi possível atualizar', mensagemErro(e));
          }
        },
      },
    ]);
  }, []);

  const excluir = useCallback((id: number) => {
    Alert.alert('Excluir?', 'Use se houve algum erro ou engano. Não dá para desfazer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await excluirPedido(id);
            setLista((l) => l.filter((p) => p.id !== id));
          } catch (e) {
            Alert.alert('Não foi possível excluir', mensagemErro(e));
          }
        },
      },
    ]);
  }, []);

  const estouBem = useCallback(async () => {
    try {
      const pos = await obterLocalizacao();
      await enviarCheckin('estou_bem', pos);
      Alert.alert('Check-in enviado', 'Sua família e seus vizinhos sabem que você está bem.');
    } catch (e) {
      Alert.alert('Não foi possível enviar', mensagemErro(e));
    }
  }, []);

  return (
    <View style={styles.tela}>
      <FlatList
        data={filtrados}
        keyExtractor={(p) => String(p.id)}
        renderItem={({ item }) => <ItemPedido p={item} aoResolver={resolver} aoExcluir={excluir} />}
        contentContainerStyle={{ padding: espaco.md, paddingBottom: 100 }}
        ListHeaderComponent={
          <View>
            <Botao titulo="Estou bem" variante="sucesso" icone="checkmark-circle" onPress={estouBem} />
            <Botao titulo="Contatos de emergência" variante="secundario" icone="call-outline" onPress={() => nav.navigate('Contatos')} estilo={{ marginTop: espaco.sm }} />
            <View style={styles.filtros}>
              <Chip rotulo="Pedidos" ativo={aba === 'pedido'} onPress={() => setAba('pedido')} />
              <Chip rotulo="Ofertas" ativo={aba === 'oferta'} onPress={() => setAba('oferta')} />
              <Chip rotulo="Histórico" ativo={aba === 'historico'} onPress={() => setAba('historico')} />
            </View>
            {carregando && <ActivityIndicator color={cores.primaria} />}
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.vazio}>
            {carregando ? '' : aba === 'historico' ? 'Nada no histórico ainda.' : 'Nada por aqui ainda.'}
          </Text>
        }
      />
      <View style={styles.novo}>
        <Botao titulo="Novo pedido de ajuda" variante="secundario" onPress={() => nav.navigate('NovoPedido')} />
      </View>
      <BotaoSOS />
    </View>
  );
}

const styles = estilos(() => ({
  tela: { flex: 1, backgroundColor: cores.fundo },
  filtros: { flexDirection: 'row', flexWrap: 'wrap', marginTop: espaco.md },
  itemTitulo: { fontSize: fonte.normal, fontWeight: '600', color: cores.texto },
  descricao: { fontSize: fonte.pequena + 1, color: cores.texto, marginTop: 2 },
  sub: { fontSize: fonte.pequena, color: cores.textoSecundario, marginTop: 2 },
  vazio: { textAlign: 'center', color: cores.textoSecundario, marginTop: espaco.lg },
  acoes: { flexDirection: 'row', marginTop: espaco.sm },
  acao: { flex: 1, marginRight: espaco.sm, minHeight: 44 },
  novo: { position: 'absolute', left: espaco.md, right: 96, bottom: espaco.md },
}));
