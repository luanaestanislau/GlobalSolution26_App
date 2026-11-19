// Ponto de entrada do app AlertaBairro.

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { PreferenciasProvider } from './src/context/PreferenciasContext';
import Navegacao from './src/navigation';

export default function App() {
  return (
    <AuthProvider>
      <PreferenciasProvider>
        <StatusBar style="dark" />
        <Navegacao />
      </PreferenciasProvider>
    </AuthProvider>
  );
}
