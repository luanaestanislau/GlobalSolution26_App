// Tema do AlertaBairro: cores, espaçamentos e tamanhos de fonte.
// Fontes e botões grandes de propósito (acessibilidade para idosos e emergências).
// O tema muda em tempo de execução: "Fonte grande" e "Alto contraste" (tela Perfil).

import { StyleSheet } from 'react-native';

const paletaPadrao = {
  primaria: '#185FA5', // azul de destaque: botões, navegação, filtros ativos
  primariaClara: '#E6F1FB',
  sucesso: '#3B6D11', // "estou bem", atendido
  sucessoClara: '#EAF3DE',
  atencao: '#BA7517', // aguardando, em atendimento
  atencaoClara: '#FAEEDA',
  perigo: '#D93B3B', // SOS, lotado, prioridade crítica
  perigoClara: '#FCEBEB',
  fundo: '#F4F6F8',
  cartao: '#FFFFFF',
  borda: '#DDE3EA',
  texto: '#14233A',
  textoSecundario: '#5B6B80',
  textoSobreCor: '#FFFFFF',
};

type Paleta = Record<keyof typeof paletaPadrao, string>;

// Alto contraste: texto preto sobre fundo branco, bordas pretas e cores de status
// mais escuras (razão de contraste de pelo menos 7:1 contra o branco).
const paletaContraste: Paleta = {
  primaria: '#0A3D91',
  primariaClara: '#DCE8FF',
  sucesso: '#1B5E20',
  sucessoClara: '#DDF2DD',
  atencao: '#7A4A00',
  atencaoClara: '#FFE9BF',
  perigo: '#A80018',
  perigoClara: '#FFDADD',
  fundo: '#FFFFFF',
  cartao: '#FFFFFF',
  borda: '#000000',
  texto: '#000000',
  textoSecundario: '#1A1A1A',
  textoSobreCor: '#FFFFFF',
};

const fontePadrao = { pequena: 13, normal: 16, titulo: 20, grande: 28 };
const ESCALA_FONTE_GRANDE = 1.3;

// Objetos "vivos": as telas leem sempre estes valores, e aplicarPreferencias os altera.
export const cores: Paleta = { ...paletaPadrao };
export const fonte = { ...fontePadrao };

export const espaco = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

export const raio = { botao: 12, cartao: 12, chip: 20 };

let versao = 0;

// Atualiza cores e fontes. Quem chama deve remontar as telas (ver PreferenciasContext).
export function aplicarPreferencias(p: { fonteGrande: boolean; altoContraste: boolean }): void {
  Object.assign(cores, p.altoContraste ? paletaContraste : paletaPadrao);
  const escala = p.fonteGrande ? ESCALA_FONTE_GRANDE : 1;
  (Object.keys(fontePadrao) as (keyof typeof fontePadrao)[]).forEach((k) => {
    fonte[k] = Math.round(fontePadrao[k] * escala);
  });
  versao += 1;
}

// Igual ao StyleSheet.create, mas refeito quando o tema muda: os estilos nunca ficam
// "congelados" com as cores e fontes do primeiro carregamento. O resultado fica em cache
// enquanto o tema não muda (sem recriar objetos a cada renderização).
type Estilos = Parameters<typeof StyleSheet.create>[0];

export function estilos<S extends Estilos>(fabrica: () => S & Estilos): Readonly<S> {
  let cache: Readonly<S> | null = null;
  let versaoDoCache = -1;
  return new Proxy({} as Readonly<S>, {
    get(_alvo, chave) {
      if (cache === null || versaoDoCache !== versao) {
        cache = StyleSheet.create(fabrica());
        versaoDoCache = versao;
      }
      return (cache as any)[chave];
    },
  });
}
