ALERTABAIRRO - APP (React Native + Expo + TypeScript)
=====================================================

COMO APLICAR O CODIGO (passo a passo)
-------------------------------------
1. Crie o projeto Expo com TypeScript (na pasta app/ do repositorio):

   (o projeto Expo ja esta em app/alertabairro/: entre nela e rode "npm install")
   cd app

2. Instale as dependencias (use "expo install" para pegar versoes compativeis):

   npx expo install react-native-screens react-native-safe-area-context react-native-maps expo-location expo-image-picker expo-image-manipulator @expo/vector-icons
   npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs axios

3. Copie para dentro de app/ os arquivos deste pacote:
   - App.tsx (substitui o do template)
   - pasta src/ inteira

4. Permissoes (abra app.json e adicione dentro de "expo"):

   "plugins": [
     ["expo-location", { "locationWhenInUsePermission": "O AlertaBairro usa sua localizacao para registrar ocorrencias e achar abrigos." }],
     ["expo-image-picker", { "cameraPermission": "O AlertaBairro usa a camera para anexar fotos as ocorrencias." }]
   ]

5. Rode o app:

   npx expo start

   Abra no celular com o app Expo Go (QR code) ou no emulador (tecla a / i).

MODO DE DADOS (falsos x API real)
---------------------------------
Arquivo: src/servicos/api.ts
- Sem a variavel EXPO_PUBLIC_API_URL -> usa dados falsos (src/servicos/mock.ts).
- Com a variavel -> chama a API do grupo (repo bruneckel/alertabairro-api). Exemplo:
    (bash)        EXPO_PUBLIC_API_URL=http://SEU_IP:8080 npx expo start
    (PowerShell)  $env:EXPO_PUBLIC_API_URL="http://SEU_IP:8080"; npx expo start
  Celular e computador devem estar na mesma rede Wi-Fi.
- No modo de dados falsos, entre com um e-mail que contenha "voluntario"
  (ex.: voluntario@teste.com) para ver as acoes de voluntario.

Dependencia extra (contatos de emergencia salvos no aparelho):
   npx expo install @react-native-async-storage/async-storage

Integracao com a API real:
- A API devolve { erro: "mensagem" }; o app mostra essa mensagem nos alertas.
- Token expira em 8h: ao receber 401, o app avisa e volta para o Inicio.
- Perfil "voluntario": "Assumir atendimento" e "Marcar como resolvida" (Detalhe) e
  "Entrou 1 / Saiu 1" nas vagas dos abrigos. Os outros perfis recebem 403.
- Pedidos de ajuda: o app envia a posicao para a API calcular "distancia".
- Excluir ocorrencia, excluir pedido e marcar pedido como resolvido (aba Historico) usam
  DELETE /ocorrencias/:id, DELETE /ajuda/:id e PATCH /ajuda/:id {acao:"resolver"}; os botoes
  aparecem so nos itens com "meu: true" (autor). Exige o banco do repo da API.

Rotas da API usadas pelo app (repo bruneckel/alertabairro-api):
  POST  /auth/login, POST /auth/cadastro   -> { token, usuario }
  GET   /ocorrencias, POST /ocorrencias
  PATCH /ocorrencias/:id      -> { acao: "confirmar" | "atender" | "resolver" }
  GET   /abrigos, GET /abrigos/proximo?lat=&lng=
  PATCH /abrigos/:id/vagas    -> { quantidade }  (voluntario)
  GET   /ajuda?lat=&lng=, POST /ajuda
  POST  /checkins
Se a API devolver nomes de campos diferentes, ajuste so em src/servicos/api.ts.

ESTRUTURA
---------
App.tsx                   ponto de entrada
src/tema/                 cores, espacamentos e fontes
src/modelos/              tipos (Usuario, Ocorrencia, Abrigo, PedidoAjuda...)
src/utils/geo.ts          distancia (Haversine), formatacao, tempo decorrido
src/servicos/             api.ts (camada de acesso), mock.ts (dados falsos), localizacao.ts (GPS)
src/contexto/             AuthContext (usuario logado, entrar, cadastrar, sair)
src/componentes/          Botao, Chip, Campo, Cartao, Etiqueta, BotaoSOS
src/navegacao/            pilha de entrada + pilha do app + abas inferiores
src/telas/                11 telas (abaixo)

TELAS
-----
Inicio, Login, Cadastro         entrada (nao contam como funcionalidade)
Mapa, Detalhe, NovaOcorrencia   funcionalidade 1: mapa e ocorrencias
Abrigos                         funcionalidade 2: abrigos, rota e SOS
Ajuda, NovoPedido               funcionalidade 3: rede de ajuda e "estou bem";
                                aba Historico (itens marcados como resolvidos) e
                                botoes "Ja foi resolvido" e "Excluir" nos itens do autor
Contatos                        servicos de emergencia (190, 192, 193, 199) com botao
                                Ligar + contatos pessoais salvos no aparelho
                                (adicionar, ligar, excluir)
Perfil                          dados do usuario, preferencias e sair

GERENCIAMENTO DE MEMORIA E EFICIENCIA (para a documentacao)
-----------------------------------------------------------
- FlatList (virtualizada) com initialNumToRender, windowSize e removeClippedSubviews:
  renderiza so o que aparece na tela (Mapa.tsx).
- React.memo nos itens de lista e nos componentes de interface: evita re-renderizar
  o que nao mudou (ItemOcorrencia, ItemAbrigo, ItemPedido, Botao, Chip, Cartao, Etiqueta).
- useMemo para filtros (lista filtrada) e para o valor do contexto de autenticacao.
- useCallback em funcoes passadas como props, para manter referencias estaveis.
- Limpeza em useEffect/useFocusEffect: flag "ativo" evita atualizar estado depois
  que a tela foi fechada (sem vazamento de memoria nem aviso de estado desmontado).
- Fotos reduzidas (largura 1024, JPEG 60%) antes de guardar/enviar, com
  expo-image-manipulator (NovaOcorrencia.tsx): menos memoria e menos dados.
- Recarga de dados somente quando a tela ganha foco; Promise.all para chamadas em paralelo.
- Camada unica de API (api.ts): trocar de dados falsos para API real sem mexer nas telas.

JUSTIFICATIVA DAS TECNOLOGIAS
-----------------------------
- React Native + Expo: um codigo para Android e iOS, rodar com Expo Go sem configurar
  ambiente nativo, ideal para o prazo curto e para a demonstracao em video.
- TypeScript: tipos evitam erros de integracao com a API.
- React Navigation: padrao de navegacao (pilha + abas).
- react-native-maps: mapa nativo com marcadores e rota.
- expo-location / expo-image-picker / expo-image-manipulator: GPS, camera e compressao.
- axios: chamadas HTTP simples, com timeout e cabecalho de autenticacao (JWT).

LIMITES CONHECIDOS (deste prototipo)
------------------------------------
- Os botoes "Fonte grande" e "Alto contraste" do Perfil ainda nao alteram o app
  (apenas guardam o estado local).
- A rota no mapa e uma linha reta entre voce e o abrigo (nao segue as ruas).
- O token de login fica so em memoria (ao fechar o app, e preciso entrar de novo).
- O mapa usa o provedor padrao do react-native-maps; para publicar o app, o Android
  exige chave do Google Maps.
