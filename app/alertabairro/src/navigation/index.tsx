// Navegação: telas de entrada (sem login) e telas do app (com login).

import React from 'react';
import { NavigationContainer, NavigationState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { cores, fonte } from '../theme';
import Abrigos from '../screens/Abrigos';
import Ajuda from '../screens/Ajuda';
import Cadastro from '../screens/Cadastro';
import Contatos from '../screens/Contatos';
import Detalhe from '../screens/Detalhe';
import Inicio from '../screens/Inicio';
import Login from '../screens/Login';
import Mapa from '../screens/Mapa';
import NovaOcorrencia from '../screens/NovaOcorrencia';
import NovoPedido from '../screens/NovoPedido';
import Perfil from '../screens/Perfil';

// Guarda onde o usuário está: ao trocar "Fonte grande"/"Alto contraste" as telas são
// remontadas, e a navegação volta exatamente para a tela atual (Perfil).
let estadoSalvo: NavigationState | undefined;

const Pilha = createNativeStackNavigator();
const Abas = createBottomTabNavigator();

const icones: Record<string, keyof typeof Ionicons.glyphMap> = {
  Mapa: 'map-outline',
  Abrigos: 'home-outline',
  Ajuda: 'heart-outline',
  Perfil: 'person-outline',
};

function AbasPrincipais() {
  return (
    <Abas.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => <Ionicons name={icones[route.name]} size={size} color={color} />,
        tabBarActiveTintColor: cores.primaria,
        tabBarInactiveTintColor: cores.textoSecundario,
        tabBarLabelStyle: { fontSize: fonte.pequena },
        headerTitleStyle: { fontWeight: '700' },
      })}
    >
      <Abas.Screen name="Mapa" component={Mapa} options={{ title: 'Mapa de ocorrências' }} />
      <Abas.Screen name="Abrigos" component={Abrigos} options={{ title: 'Abrigos e rota' }} />
      <Abas.Screen name="Ajuda" component={Ajuda} options={{ title: 'Rede de ajuda' }} />
      <Abas.Screen name="Perfil" component={Perfil} />
    </Abas.Navigator>
  );
}

export default function Navegacao() {
  const { usuario } = useAuth();

  return (
    <NavigationContainer initialState={estadoSalvo} onStateChange={(estado) => { estadoSalvo = estado; }}>
      {usuario ? (
        <Pilha.Navigator>
          <Pilha.Screen name="Tabs" component={AbasPrincipais} options={{ headerShown: false }} />
          <Pilha.Screen name="Detalhe" component={Detalhe} options={{ title: 'Detalhe da ocorrência' }} />
          <Pilha.Screen name="NovaOcorrencia" component={NovaOcorrencia} options={{ title: 'Nova ocorrência' }} />
          <Pilha.Screen name="NovoPedido" component={NovoPedido} options={{ title: 'Novo pedido de ajuda' }} />
          <Pilha.Screen name="Contatos" component={Contatos} options={{ title: 'Contatos de emergência' }} />
        </Pilha.Navigator>
      ) : (
        <Pilha.Navigator>
          <Pilha.Screen name="Inicio" component={Inicio} options={{ headerShown: false }} />
          <Pilha.Screen name="Login" component={Login} options={{ title: '' }} />
          <Pilha.Screen name="Cadastro" component={Cadastro} options={{ title: '' }} />
        </Pilha.Navigator>
      )}
    </NavigationContainer>
  );
}
