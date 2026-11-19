// Contatos de emergência pessoais, salvos só no aparelho (a API não tem rota para isso).
// Vantagem: funcionam sem internet, o que importa numa emergência, e o telefone dos
// familiares não vai para o servidor.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ContatoEmergencia, NovoContato } from '../models';

const CHAVE = 'alertabairro:contatos';

async function ler(): Promise<ContatoEmergencia[]> {
  try {
    const bruto = await AsyncStorage.getItem(CHAVE);
    return bruto ? (JSON.parse(bruto) as ContatoEmergencia[]) : [];
  } catch {
    return [];
  }
}

async function gravar(lista: ContatoEmergencia[]): Promise<void> {
  await AsyncStorage.setItem(CHAVE, JSON.stringify(lista));
}

export const listarContatos = ler;

export async function criarContato(novo: NovoContato): Promise<ContatoEmergencia> {
  const contato: ContatoEmergencia = { id: Date.now(), ...novo };
  await gravar([...(await ler()), contato]);
  return contato;
}

export async function excluirContato(id: number): Promise<void> {
  await gravar((await ler()).filter((c) => c.id !== id));
}
