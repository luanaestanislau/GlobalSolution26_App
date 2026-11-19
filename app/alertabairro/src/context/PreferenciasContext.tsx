// Preferências de acessibilidade ("Fonte grande" e "Alto contraste").
// Ficam salvas no aparelho (AsyncStorage) e valem para o app inteiro.
// Ao mudar, as telas são remontadas para refazer os estilos com o novo tema.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { aplicarPreferencias } from '../theme';

const CHAVE = 'alertabairro:preferencias';

type Preferencias = { fonteGrande: boolean; altoContraste: boolean };

type Valor = Preferencias & {
  definirFonteGrande: (v: boolean) => void;
  definirAltoContraste: (v: boolean) => void;
};

const Contexto = createContext<Valor | null>(null);

export function PreferenciasProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Preferencias>({ fonteGrande: false, altoContraste: false });
  const [pronto, setPronto] = useState(false);
  const [geracao, setGeracao] = useState(0); // muda a cada troca de tema: remonta as telas

  // Lê as preferências salvas antes de mostrar a primeira tela (evita "piscar" o tema).
  useEffect(() => {
    let ativo = true;
    AsyncStorage.getItem(CHAVE)
      .then((bruto) => {
        if (bruto && ativo) {
          const salvas = JSON.parse(bruto) as Preferencias;
          const lidas = { fonteGrande: !!salvas.fonteGrande, altoContraste: !!salvas.altoContraste };
          aplicarPreferencias(lidas);
          setPrefs(lidas);
        }
      })
      .catch(() => {}) // sem leitura: usa o tema padrão
      .finally(() => ativo && setPronto(true));
    return () => {
      ativo = false;
    };
  }, []);

  const mudar = useCallback((parcial: Partial<Preferencias>) => {
    setPrefs((atual) => {
      const novas = { ...atual, ...parcial };
      aplicarPreferencias(novas);
      AsyncStorage.setItem(CHAVE, JSON.stringify(novas)).catch(() => {});
      return novas;
    });
    setGeracao((g) => g + 1);
  }, []);

  const valor = useMemo<Valor>(
    () => ({
      ...prefs,
      definirFonteGrande: (v) => mudar({ fonteGrande: v }),
      definirAltoContraste: (v) => mudar({ altoContraste: v }),
    }),
    [prefs, mudar],
  );

  if (!pronto) return null;

  return (
    <Contexto.Provider value={valor}>
      <React.Fragment key={geracao}>{children}</React.Fragment>
    </Contexto.Provider>
  );
}

export function usePreferencias(): Valor {
  const v = useContext(Contexto);
  if (!v) throw new Error('usePreferencias deve ser usado dentro de PreferenciasProvider');
  return v;
}
