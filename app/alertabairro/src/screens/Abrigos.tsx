// Funcionalidade 2: abrigos, abrigo mais próximo, rota no mapa e botão SOS.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import BotaoSOS from '../components/BotaoSOS';
import Botao from '../components/Botao';
import Cartao from '../components/Cartao';
import Etiqueta from '../components/Etiqueta';
import { Abrigo } from '../models';
import { useAuth } from '../context/AuthContext';
import { abrigoMaisProximo, controlarVagas, listarAbrigos, mensagemErro } from '../services/api';
import { obterLocalizacao } from '../services/localizacao';
import { cores, espaco, fonte, estilos } from '../theme';
import { COORDENADA_PADRAO, Coordenada, distanciaKm, formatarDistancia } from '../utils/geo';

interface ItemProps {
  a: Abrigo;
  pos: Coordenada;
  voluntario: boolean;
  aoMudarVagas: (id: number, quantidade: number) => void;
}

const ItemAbrigo = React.memo(function ItemAbrigo({ a, pos, voluntario, aoMudarVagas }: ItemProps) {
  const vagas = a.capacidade - a.vagasOcupadas;
  return (
    <Cartao>
      <Text style={styles.itemTitulo}>{a.nome}</Text>
      <Text style={styles.sub}>{a.endereco}</Text>
      <Text style={styles.sub}>{formatarDistancia(distanciaKm(pos, a))}</Text>
      <View style={{ marginTop: espaco.xs }}>
        {vagas > 0 ? <Etiqueta texto={`${vagas} vagas`} tom="sucesso" /> : <Etiqueta texto="Lotado" tom="perigo" />}
      </View>

      {/* Só voluntários controlam as vagas (a API responde 403 para os outros perfis). */}
      {voluntario && (
        <View style={styles.vagas}>
          <Botao titulo="Entrou 1" icone="add" variante="secundario" onPress={() => aoMudarVagas(a.id, 1)} estilo={styles.botaoVaga} />
          <Botao titulo="Saiu 1" icone="remove" variante="secundario" onPress={() => aoMudarVagas(a.id, -1)} estilo={styles.botaoVaga} />
        </View>
      )}
    </Cartao>
  );
});

export default function Abrigos() {
  const { usuario } = useAuth();
  const [lista, setLista] = useState<Abrigo[]>([]);
  const [pos, setPos] = useState<Coordenada>(COORDENADA_PADRAO);
  const [destino, setDestino] = useState<Abrigo | null>(null);
  const [rota, setRota] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const mapa = useRef<MapView>(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      const [abrigos, p] = await Promise.all([listarAbrigos(), obterLocalizacao()]);
      if (!ativo) return;
      setLista(abrigos);
      setPos(p);
      setDestino(await abrigoMaisProximo(p));
      setCarregando(false);
    })().catch((e) => {
      if (!ativo) return;
      setCarregando(false);
      Alert.alert('Não foi possível carregar os abrigos', mensagemErro(e));
    });
    return () => {
      ativo = false;
    };
  }, []);

  // Voluntário registra entrada (+1) ou saída (-1); a procedure recusa passar da capacidade.
  const mudarVagas = useCallback(async (id: number, quantidade: number) => {
    try {
      const atualizado = await controlarVagas(id, quantidade);
      setLista((l) => l.map((a) => (a.id === id ? atualizado : a)));
    } catch (e) {
      Alert.alert('Não foi possível atualizar as vagas', mensagemErro(e));
    }
  }, []);

  const tracarRota = useCallback(() => {
    if (!destino) {
      Alert.alert('Sem vagas', 'Nenhum abrigo com vagas foi encontrado agora.');
      return;
    }
    setRota(true);
    mapa.current?.fitToCoordinates([pos, destino], { edgePadding: { top: 60, right: 60, bottom: 60, left: 60 }, animated: true });
  }, [destino, pos]);

  return (
    <View style={styles.tela}>
      <MapView ref={mapa} style={styles.mapa} initialRegion={{ ...pos, latitudeDelta: 0.03, longitudeDelta: 0.03 }} showsUserLocation>
        {lista.map((a) => (
          <Marker key={a.id} coordinate={{ latitude: a.latitude, longitude: a.longitude }} title={a.nome} pinColor={cores.primaria} />
        ))}
        {rota && destino && <Polyline coordinates={[pos, destino]} strokeColor={cores.primaria} strokeWidth={4} />}
      </MapView>

      {carregando ? (
        <ActivityIndicator style={{ margin: espaco.lg }} color={cores.primaria} />
      ) : (
        <FlatList
          data={lista}
          keyExtractor={(a) => String(a.id)}
          renderItem={({ item }) => (
            <ItemAbrigo a={item} pos={pos} voluntario={usuario?.perfil === 'voluntario'} aoMudarVagas={mudarVagas} />
          )}
          contentContainerStyle={{ padding: espaco.md, paddingBottom: 90 }}
          ListHeaderComponent={
            <Cartao estilo={{ backgroundColor: cores.primariaClara, borderColor: cores.primaria }}>
              <Text style={styles.itemTitulo}>Abrigo mais próximo</Text>
              <Text style={styles.sub}>
                {destino ? `${destino.nome} · ${formatarDistancia(distanciaKm(pos, destino))}` : 'Nenhum abrigo com vagas no momento'}
              </Text>
              <Botao titulo="Traçar rota" icone="navigate" onPress={tracarRota} estilo={{ marginTop: espaco.sm }} />
            </Cartao>
          }
        />
      )}
      <BotaoSOS />
    </View>
  );
}

const styles = estilos(() => ({
  tela: { flex: 1, backgroundColor: cores.fundo },
  mapa: { height: 220 },
  itemTitulo: { fontSize: fonte.normal, fontWeight: '600', color: cores.texto },
  sub: { fontSize: fonte.pequena, color: cores.textoSecundario, marginTop: 2 },
  vagas: { flexDirection: 'row', marginTop: espaco.sm },
  botaoVaga: { flex: 1, marginRight: espaco.sm, minHeight: 44 },
}));
