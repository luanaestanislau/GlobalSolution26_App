// Camada de acesso à API. As telas só importam deste arquivo.
//
// Integração: defina EXPO_PUBLIC_API_URL (ex.: http://192.168.0.10:8080) para usar a API real.
// Sem a variável, o app continua com os dados falsos (src/servicos/mock.ts).
//
// Rotas conforme a API do grupo (api/README_API.txt):
//   POST /auth/cadastro, POST /auth/login
//   GET/POST /ocorrencias, PATCH /ocorrencias/:id {acao: confirmar|atender|resolver}
//   GET /abrigos, GET /abrigos/proximo, PATCH /abrigos/:id/vagas
//   GET/POST /ajuda, POST /checkins

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
import * as mock from './mock';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
export const USE_MOCK = !API_URL;

// Use o IP do computador que roda a API (não use "localhost" no celular).
export const BASE_URL = API_URL ?? 'http://192.168.0.10:8080';

const http = axios.create({ baseURL: BASE_URL, timeout: 10000 });

// Guarda o token JWT para as próximas chamadas.
export function definirToken(token?: string) {
  if (token) http.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete http.defaults.headers.common.Authorization;
}

// O token expira em 8h: se a API responder 401 fora do login, o app volta para o Início.
let aoExpirarSessao: (() => void) | undefined;
export function definirAoExpirarSessao(cb?: () => void) {
  aoExpirarSessao = cb;
}
http.interceptors.response.use(
  (r) => r,
  (erro) => {
    const url: string = erro?.config?.url ?? '';
    if (erro?.response?.status === 401 && !url.startsWith('/auth/')) aoExpirarSessao?.();
    return Promise.reject(erro);
  },
);

// Texto amigável para mostrar ao usuário (usa a mensagem { erro } da API quando existe).
export function mensagemErro(e: unknown, padrao = 'Tente de novo em instantes.'): string {
  const err = e as any;
  if (err?.response?.data?.erro) return String(err.response.data.erro);
  if (err?.isAxiosError && !err.response) return 'Sem conexão com o servidor. Confira o Wi-Fi e o endereço da API.';
  if (err instanceof Error && err.message) return err.message;
  return padrao;
}

export async function login(email: string, senha: string): Promise<RespostaLogin> {
  if (USE_MOCK) return mock.login(email, senha);
  return (await http.post('/auth/login', { email, senha })).data;
}

export async function cadastrar(dados: DadosCadastro): Promise<RespostaLogin> {
  if (USE_MOCK) return mock.cadastrar(dados);
  return (await http.post('/auth/cadastro', dados)).data;
}

// ---------- ocorrências ----------

export async function listarOcorrencias(): Promise<Ocorrencia[]> {
  if (USE_MOCK) return mock.listarOcorrencias();
  return (await http.get('/ocorrencias')).data;
}

export async function criarOcorrencia(nova: NovaOcorrencia): Promise<Ocorrencia> {
  if (USE_MOCK) return mock.criarOcorrencia(nova);
  return (await http.post('/ocorrencias', nova)).data;
}

// "Também vejo isso aqui": soma um relato (o trigger do banco pode escalar a prioridade).
export async function confirmarOcorrencia(id: number): Promise<Ocorrencia> {
  if (USE_MOCK) return mock.confirmarOcorrencia(id);
  return (await http.patch(`/ocorrencias/${id}`, { acao: 'confirmar' })).data;
}

// Só voluntários (a API responde 403 para os demais perfis).
export async function atenderOcorrencia(id: number): Promise<Ocorrencia> {
  if (USE_MOCK) return mock.atenderOcorrencia(id);
  return (await http.patch(`/ocorrencias/${id}`, { acao: 'atender' })).data;
}

// Só voluntários.
export async function resolverOcorrencia(id: number): Promise<Ocorrencia> {
  if (USE_MOCK) return mock.resolverOcorrencia(id);
  return (await http.patch(`/ocorrencias/${id}`, { acao: 'resolver' })).data;
}

// ---------- abrigos ----------

export async function listarAbrigos(): Promise<Abrigo[]> {
  if (USE_MOCK) return mock.listarAbrigos();
  return (await http.get('/abrigos')).data;
}

export async function abrigoMaisProximo(pos: Coordenada): Promise<Abrigo | null> {
  if (USE_MOCK) return mock.abrigoMaisProximo(pos);
  return (await http.get('/abrigos/proximo', { params: { lat: pos.latitude, lng: pos.longitude } })).data;
}

// Só voluntários: +n = entrada de pessoas, -n = saída (procedure PRC_CONTROLE_VAGAS).
// A API responde 422 se faltar vaga ("Abrigo sem vagas suficientes").
export async function controlarVagas(id: number, quantidade: number): Promise<Abrigo> {
  if (USE_MOCK) return mock.controlarVagas(id, quantidade);
  return (await http.patch(`/abrigos/${id}/vagas`, { quantidade })).data;
}

// ---------- ajuda ----------

// Com a posição, a API calcula "distancia" (senão usa a do último check-in).
export async function listarPedidos(pos?: Coordenada): Promise<PedidoAjuda[]> {
  if (USE_MOCK) return mock.listarPedidos();
  const params = pos ? { lat: pos.latitude, lng: pos.longitude } : undefined;
  return (await http.get('/ajuda', { params })).data;
}

export async function criarPedido(novo: NovoPedido, pos?: Coordenada): Promise<PedidoAjuda> {
  if (USE_MOCK) return mock.criarPedido(novo);
  return (await http.post('/ajuda', { ...novo, latitude: pos?.latitude, longitude: pos?.longitude })).data;
}

export async function enviarCheckin(status: 'estou_bem' | 'preciso_de_ajuda', pos?: Coordenada): Promise<void> {
  if (USE_MOCK) return mock.enviarCheckin(status, pos);
  await http.post('/checkins', { status, latitude: pos?.latitude, longitude: pos?.longitude });
}

// ---------- excluir e resolver (só o autor do item; a API devolve "meu: true") ----------

export async function excluirOcorrencia(id: number): Promise<void> {
  if (USE_MOCK) return mock.excluirOcorrencia(id);
  await http.delete(`/ocorrencias/${id}`);
}

export async function excluirPedido(id: number): Promise<void> {
  if (USE_MOCK) return mock.excluirPedido(id);
  await http.delete(`/ajuda/${id}`);
}

export async function resolverPedido(id: number): Promise<PedidoAjuda> {
  if (USE_MOCK) return mock.resolverPedido(id);
  return (await http.patch(`/ajuda/${id}`, { acao: 'resolver' })).data;
}
