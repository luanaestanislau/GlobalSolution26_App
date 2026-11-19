ALERTABAIRRO - APP (React Native + Expo + TypeScript)
=====================================================
Global Solution 2026 - Turma 3SIOA

EQUIPE
------
[Bruno Willian Neckel dos Santos - RM: 99074]
[Caroline Costa Carvalho de Andrade - RM: 554657]
[Guilherme Henrique Aragão - RM: 554629]
[Luana da Silva Estanislau - RM 556090]

REPOSITORIOS
------------
App (este):   https://github.com/luanaestanislau/GlobalSolution26_App
API + banco:  https://github.com/bruneckel/alertabairro-api  (Java Spring Boot + Oracle)

COMO RODAR O APP (modo dados falsos, sem API)
---------------------------------------------
Pre-requisitos: Node.js 20 ou superior e o aplicativo Expo Go no celular.

   cd app/alertabairro
   npm install
   npx expo start

Escaneie o QR code com o Expo Go (Android) ou com a Camera (iOS), ou tecle "a" / "i"
para abrir no emulador. No modo de dados falsos, entre com um e-mail que contenha
"voluntario" (ex.: voluntario@teste.com) para ver as acoes de voluntario.

COMO RODAR COM A API REAL
-------------------------
Ordem: banco + API -> app. Celular e computador na mesma rede Wi-Fi.

1. Suba a API e o banco (repositorio bruneckel/alertabairro-api):

   cp .env.example .env      (preencha JWT_SECRET, com openssl rand -hex 48)
   docker compose up -d --build
   curl localhost:8080/actuator/health      -> {"status":"UP"}

   Dados de demonstracao (opcional), senha alertabairro123:
   maria@alertabairro.demo (morador), joao@alertabairro.demo (idoso),
   ana@alertabairro.demo (voluntario).

2. Descubra o IP do computador na rede (ipconfig no Windows, ifconfig no Mac/Linux)
   e rode o app apontando para a API (use o IP, nao "localhost"):

   (bash)        EXPO_PUBLIC_API_URL=http://SEU_IP:8080 npx expo start
   (PowerShell)  $env:EXPO_PUBLIC_API_URL="http://SEU_IP:8080"; npx expo start

   No emulador Android, o computador e acessado por http://10.0.2.2:8080.

JUSTIFICATIVA DAS TECNOLOGIAS (resumo; versao completa mais abaixo)
-------------------------------------------------------------------
React Native + Expo (um codigo para Android e iOS, roda no Expo Go), TypeScript (tipos
evitam erros de integracao com a API) e axios (HTTP com timeout e token JWT).

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
Perfil                          dados do usuario, acessibilidade (Fonte grande, Alto
                                contraste) e sair

ACESSIBILIDADE (tela Perfil)
----------------------------
- Fonte grande: aumenta todos os textos em 30% (src/tema/index.ts, ESCALA_FONTE_GRANDE).
- Alto contraste: texto preto sobre fundo branco, bordas pretas e cores de status mais
  escuras (contraste de pelo menos 7:1).
- As duas opcoes ficam salvas no aparelho (AsyncStorage) e valem em todas as telas,
  mesmo depois de fechar o app. Ao trocar, as telas sao refeitas e a navegacao volta
  para o Perfil, sem perder o login.
- Como funciona: cores e fonte (src/tema) sao objetos "vivos"; estilos() refaz os estilos
  quando o tema muda; PreferenciasContext salva a escolha e remonta as telas.
- Alem disso, o app ja usa botoes e fontes grandes por padrao, area de toque ampla, cores
  de status acompanhadas de texto (nao so cor) e rotulos de acessibilidade nos controles.

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
- A rota no mapa e uma linha reta entre voce e o abrigo (nao segue as ruas).
- O token de login fica so em memoria (ao fechar o app, e preciso entrar de novo).
- O mapa usa o provedor padrao do react-native-maps; para publicar o app, o Android
  exige chave do Google Maps.