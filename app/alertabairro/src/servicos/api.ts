// Camada de acesso à API. As telas só importam deste arquivo.
// Sem EXPO_PUBLIC_API_URL, o app roda com os dados falsos de mock.ts.

import axios from 'axios';
import {
  Abrigo,
  DadosCadastro,
  NovaOcorrencia,
  NovoPedido,
  Ocorrencia,
  PedidoAjuda,
  RespostaLogin,
} from '../modelos';
import { Coordenada } from '../utils/geo';
import { obterLocalizacao } from './localizacao';
import * as mock from './mock';

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';
export const USE_MOCK = BASE_URL.length === 0;

const http = axios.create({ baseURL: BASE_URL, timeout: 10000 });

// A API responde erro como { "erro": "mensagem" }, escrita para o usuário final.
http.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    const mensagem = erro?.response?.data?.erro;
    return Promise.reject(typeof mensagem === 'string' ? new Error(mensagem) : erro);
  },
);

export function definirToken(token?: string) {
  if (token) http.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete http.defaults.headers.common.Authorization;
}

// A API conhece três status de pedido e o app conhece dois: 'resolvido' significa que o
// autor encerrou, e para as telas isso equivale a 'atendido'.
function paraStatusDoApp(pedido: PedidoAjuda): PedidoAjuda {
  return (pedido.status as string) === 'resolvido' ? { ...pedido, status: 'atendido' } : pedido;
}

export async function login(email: string, senha: string): Promise<RespostaLogin> {
  if (USE_MOCK) return mock.login(email, senha);
  return (await http.post('/auth/login', { email, senha })).data;
}

export async function cadastrar(dados: DadosCadastro): Promise<RespostaLogin> {
  if (USE_MOCK) return mock.cadastrar(dados);
  return (await http.post('/auth/cadastro', dados)).data;
}

export async function listarOcorrencias(): Promise<Ocorrencia[]> {
  if (USE_MOCK) return mock.listarOcorrencias();
  return (await http.get('/ocorrencias')).data;
}

export async function criarOcorrencia(nova: NovaOcorrencia): Promise<Ocorrencia> {
  if (USE_MOCK) return mock.criarOcorrencia(nova);
  return (await http.post('/ocorrencias', nova)).data;
}

export async function confirmarOcorrencia(id: number): Promise<Ocorrencia> {
  if (USE_MOCK) return mock.confirmarOcorrencia(id);
  return (await http.patch(`/ocorrencias/${id}`, { acao: 'confirmar' })).data;
}

export async function listarAbrigos(): Promise<Abrigo[]> {
  if (USE_MOCK) return mock.listarAbrigos();
  return (await http.get('/abrigos')).data;
}

export async function abrigoMaisProximo(pos: Coordenada): Promise<Abrigo | null> {
  if (USE_MOCK) return mock.abrigoMaisProximo(pos);
  const { data } = await http.get('/abrigos/proximo', {
    params: { lat: pos.latitude, lng: pos.longitude },
  });
  // Sem abrigo com vaga a API responde 200 com corpo vazio, e o axios entrega ''.
  // `?? null` não serviria: '' não é nullish e passaria adiante como se fosse um abrigo.
  return data || null;
}

export async function listarPedidos(): Promise<PedidoAjuda[]> {
  if (USE_MOCK) return mock.listarPedidos();
  const pos = await obterLocalizacao();
  const { data } = await http.get('/ajuda', {
    params: { lat: pos.latitude, lng: pos.longitude },
  });
  return (data as PedidoAjuda[]).map(paraStatusDoApp);
}

export async function criarPedido(novo: NovoPedido): Promise<PedidoAjuda> {
  if (USE_MOCK) return mock.criarPedido(novo);
  const pos = await obterLocalizacao();
  const { data } = await http.post('/ajuda', {
    ...novo,
    latitude: pos.latitude,
    longitude: pos.longitude,
  });
  return paraStatusDoApp(data);
}

export async function enviarCheckin(
  status: 'estou_bem' | 'preciso_de_ajuda',
  pos?: Coordenada,
): Promise<void> {
  if (USE_MOCK) return mock.enviarCheckin(status, pos);
  await http.post('/checkins', {
    status,
    latitude: pos?.latitude,
    longitude: pos?.longitude,
  });
}
