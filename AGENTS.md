# Guia do projeto

- Inimigos têm colisão própria: não devem atravessar estruturas nem sobrepor outros inimigos vivos no mesmo lugar (pedido de 07/11/2026).
- Jogadores atravessam os corpos dos mobs para evitar cercos sem saída; a colisão entre mobs não bloqueia nem empurra jogadores (pedido de 07/11/2026).
- TPs de saída das hunts ficam dentro das respectivas safe zones de chegada (pedido de 07/11/2026).
- Cura de Vida é universal: cura HP gastando Ki, recarga de 1,5 s e estágios nos níveis 1/20/50/100/150+. Autocura usa limite configurável, padrão abaixo de 70% (pedido de 07/11/2026).
- Auto Hunt reúne a automação em painel expansível não modal. Cura, poção de Ki e semente usam limites configuráveis (padrões 70% HP, 25% Ki e 30% HP) validados no servidor; preferências persistem sem reativar a caça ao reconectar (pedido de 07/11/2026).

Este é um protótipo local de RPG idle de Dragon Ball em 2D visto de cima.

## Executar e verificar

- Node.js 22 ou superior. Não há dependências externas.
- npm start inicia o servidor em http://localhost:3000.
- npm test executa as regras e a integração de dois jogadores.
- npm run check verifica sintaxe.

## Arquitetura

- public/shared/ é a simulação autoritativa compartilhada, executada pelo servidor: config.mjs (mundo e números), math.mjs (helpers), characters.mjs (Goku/progressão), enemies.mjs (inimigos, incl. Freeza), game.mjs (classe Game) e index.mjs (ponto de entrada).
- server.mjs recebe intenções, valida sessões e transmite o estado.
- public/client/game.mjs apresenta o estado e recebe controles; o navegador não decide XP, dano, estoque ou recargas.
- public/art/ (por assunto: assets, atlas, terrain, goku, saibaman, alien, freeza, sprite-data) e public/render/camera.mjs cuidam, respectivamente, das artes e da câmera, sem alterar as regras do servidor.
- public/style.css cuida de desktop e telas pequenas.
- data/save.json é estado local de execução e fica fora das entregas de código.
- ferramentas/ guarda os scripts de apoio para arte e mapas (não carregados pelo jogo); docs/COMO_TRABALHAMOS.md é o manual de trabalho.
- Sem empacotador: o navegador carrega os módulos pela URL, então o código compartilhado fica dentro de public/.

## Decisões que devem ser preservadas

- Mundo compartilhado, dividido em lugares fechados (decisão do Pedro, 03/11/2026): Terra (lobby) e, em cada planeta de hunt, a Vila (segura) e as hunts: Namekusei com três; Planeta Vegeta, decidido em 04/11/2026, com cinco (níveis 30–60; mobs ainda provisórios). Não se anda de um lugar para outro; troca-se só por portal. Nada atravessa de um lugar para outro (dano, alvo, projétil, loot, o que cada jogador recebe).
- Sem PvP nesta versão (decisão do Pedro, 03/11/2026). Quando voltar, só em área marcada como pvp, validado para todos os tipos de dano.
- Movimento por teclado/toque e caça automática opcional, que roda a hunt inteira onde o jogador está.
- Aggro por ameaça (decisão do Pedro, 05/11/2026): mob agressivo nota quem chega perto, todo mob reage a quem o ataca, persegue quem causou mais ameaça e volta à origem (curando-se) ao passar do limite. Raio, limite e agressividade configuráveis por mob em enemies.mjs.
- Técnicas, transformações e todos os atributos progridem automaticamente conforme classe e nível. Não há distribuição manual de atributos.
- A comida gera a cura ao longo de um período. Não há regeneração gratuita de vida fora desse efeito.
- Sementes curam instantaneamente e todas as potências respeitam a mesma recarga. Trocar item ou potência não remove o intervalo.
- Inventário tem limite de peso que cresce com o nível.
- A sessão desconectada não continua caçando.
- Cada hunt tem um pequeno quadrado seguro na chegada: o jogador não causa nem recebe dano dentro dele. A caça automática sai do quadrado antes de selecionar alvos (pedido de 07/11/2026).
- Inimigos não nascem nem renascem dentro da safe zone. Depois de sair dela, a auto caça contorna o quadrado em perseguições e patrulhas; entrada manual continua permitida (pedido de 07/11/2026).

Os números, marcos de nível e decisões provisórias estão explicados em LEIA_PRIMEIRO.md. O conceito e o estado da entrega estão em docs/. Requisitos confirmados devem permanecer separados de novas propostas.

Use testes quando alterar regras de combate, recuperação, progressão e inventário. Preserve a execução sem instalação de pacotes enquanto isso atender ao protótipo. Goku é o único personagem implementado nesta versão.

