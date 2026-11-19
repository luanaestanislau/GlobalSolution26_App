// Cartão branco com borda fina. Aceita onPress para virar um item tocável.

import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import { cores, espaco, raio, estilos } from '../theme';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  estilo?: ViewStyle;
}

function Cartao({ children, onPress, estilo }: Props) {
  if (onPress) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress} style={[styles.cartao, estilo]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.cartao, estilo]}>{children}</View>;
}

export default React.memo(Cartao);

const styles = estilos(() => ({
  cartao: {
    backgroundColor: cores.cartao,
    borderRadius: raio.cartao,
    borderWidth: 1,
    borderColor: cores.borda,
    padding: espaco.md,
    marginBottom: espaco.sm,
  },
}));
