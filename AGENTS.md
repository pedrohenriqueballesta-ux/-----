# Guia do projeto

- Quarta hunt de Namekusei: Cratera de Nail na ilha norte, área fechada `norte`, faixa 30–40 provisória. Oito Nails e oito Piccolos Daimaoh andam e usam ataque curto/rajada; Neva é chefe raro, com magia da mão de perto e rajada de longe. Os três têm 1,25× a altura do Goku (Pedro, 10/11/2026; antes 2× e depois 1,5×), com corpo, passo e folha PARADO próprios.

- Todo mob e personagem que anda tem folha PARADO (respiração em loop, pés parados), registrada em `public/art/parado.mjs`; parado, o `drawWalk` usa essa folha em vez de um quadro da caminhada (Pedro, 10/11/2026). Voadores pairam e o Freeza na nave flutua: não precisam.
- Todo chefe (subchefe e chefes raros, lista `TIPOS_CHEFE` em `shared/enemies.mjs`) leva "BOSS" no nome — placa, alvo, Bestiário e avisos — para se diferenciar dos mobs comuns; chefe novo só precisa entrar na lista (Pedro, 10/11/2026).

- Goku Super Saiyajin usa as seis folhas novas feitas sobre as da base (mesmas poses, cabelo SSJ, quimono inteiro); detalhes em `docs/GOKU_NOVO.md` (Pedro, 11/11/2026).
- Escada implementada (Pedro, 13/11/2026): o terceiro dos cinco slots existentes, tecla 3/T, atualiza nome e ícone e ativa a forma mais forte liberada — Kaioken 50, SSJ1 100, SSJ2 200, SSJ3 300, SSJ4 500, Gogeta 700 e Vegetto 900. Uma forma por vez; todas drenam 3,5 Ki/s. Gogeta dura 3.600 s.
- Multiplicadores de dano mantêm a progressão de 1,5× por degrau SSJ; as formas de fusão seguem o mesmo incremento. Ainda não há sprites próprias de SSJ4, Gogeta ou Vegetto: usar fallback visual em folhas existentes e não desenhar assets novos sem solicitação.
- Ryuken / Punho do Dragão (Pedro, 12/11/2026): técnica do SSJ3, no lugar do Kamehameha (tecla 2) enquanto em SSJ3; o dragão persegue o alvo perto ou longe e acerta só ele; dano ×13,5, 40 Ki, 10 s, alcance do Kamehameha. `shared/ryuken.mjs`.
- Transformações são grátis e sem recarga; uma forma por vez, mantida enquanto houver Ki. Todas drenam Ki continuamente (3,5 Ki/s é valor provisório); Ki zerado, morte, viagem e desconexão devolvem à base. Repetir a técnica desliga a forma; ativar outra a substitui. Recuperação natural de Ki bloqueada em qualquer forma; forma não persiste no save (Pedro, 09/11/2026).

- Auto Hunt seleciona mobs a até 700 unidades (aproximadamente 22 SQMs), somente na mesma hunt e com caminho alcançável; raio confirmado pelo Pedro em 09/11/2026.

- Folhas de cinco direções usam o recorte existente e `drawSheet`/`SHEET_VIEWS`; só Sudoeste/Oeste/Noroeste espelham horizontalmente em torno da âncora. Nunca gerar PNGs da esquerda; efeitos acompanham o espelho e textos ficam fora dele (Pedro, 09/11/2026).

- Kamehameha mira o mob selecionado na HUD e acompanha esse alvo até o impacto, respeitando alcance por nível. Alvo principal recebe dano completo; uma parcela adicional igual ao dano base é dividida entre os demais mobs dentro da silhueta da sprite de impacto. Substitui a área anterior de três SQMs (pedido de 08/11/2026). Na Auto Hunt, antecipa a carga durante a aproximação pela distância percorrida em 0,65 s; feixe só dispara com carga pronta e alvo no alcance.

- Abas da HUD usam arrasto pelo cabeçalho; janelas têm cadeado para travar a posição, ao lado de minimizar na mochila (pedido de 08/11/2026).

- Inimigos têm colisão própria: não devem atravessar estruturas nem sobrepor outros inimigos vivos no mesmo lugar (pedido de 07/11/2026).
- Jogadores atravessam os corpos dos mobs para evitar cercos sem saída; a colisão entre mobs não bloqueia nem empurra jogadores (pedido de 07/11/2026).
- TPs de saída das hunts ficam dentro das respectivas safe zones de chegada (pedido de 07/11/2026).
- Cura de Vida é universal: cura HP gastando Ki, recarga de 0,7 s e estágios nos níveis 1/20/50/100/150+. Autocura usa limite configurável, padrão abaixo de 70% (pedido de 07/11/2026).
- Auto Hunt reúne a automação em painel expansível não modal. Cura, poção de Ki e semente usam limites configuráveis (padrões 70% HP, 25% Ki e 30% HP) validados no servidor; preferências persistem sem reativar a caça ao reconectar (pedido de 07/11/2026).
- Minimapa: clique envia destino à navegação do servidor; HUD ajustável de 1× a 2×, cresce só para baixo/esquerda; scroll sobre o minimapa altera seu zoom independentemente da câmera (pedido de 07/11/2026).
- Genki-Dama usa canalização, voo em loop até impacto sem limite por tiles e explosão única, com efeitos independentes do personagem. Preservar custo, cooldown e dano existentes (pedido de 07/11/2026).

Este é um protótipo local de RPG idle de Dragon Ball em 2D visto de cima.

## Fluxo de trabalho

- Antes de criar uma branch, verificar branches locais/remotas e PRs abertas do mesmo assunto. Reutilizar a branch em andamento; criar uma nova apenas quando não houver uma correspondente aberta.
- Não fazer commits nem pushs sem autorização explícita do Pedro para cada ação.
- Sempre que implementar algo em uma nova branch, reiniciar o servidor e confirmar o endereço para o Pedro testar.

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

- Mundo compartilhado, dividido em lugares fechados (decisão do Pedro, 03/11/2026): Terra (lobby) e, em cada planeta de hunt, a Vila (segura) e as hunts: Namekusei com quatro; Planeta Vegeta com cinco hunts existentes, agora recomendadas entre os níveis 40–150. Não se anda de um lugar para outro; troca-se só por portal. Nada atravessa de um lugar para outro (dano, alvo, projétil, loot, o que cada jogador recebe).
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

## Diretrizes de Vocações, Progressão e Balanceamento — Dragon Ball Idle

### Estado atual implementado

- Goku é a única vocação jogável. `public/shared/vocacoes.mjs` já fornece um catálogo compartilhado, mas atualmente registra somente `goku`; valores desconhecidos voltam para Goku. Os campos de personagem/vocação já podem ser salvos, sem que isso signifique que outras vocações estejam disponíveis.
- A progressão autoritativa do servidor aceita níveis de 1 a 1.000. `public/shared/progressao.mjs` define a curva de XP e a redução gradual de recompensas por diferença de nível; `public/shared/characters.mjs` calcula e restaura progresso e atributos. A fórmula histórica de XP até o nível 100 é preservada.
- Desbloqueios atuais de habilidades: Cura e ataque básico no nível 1; Rajada de Ki e Imagem Residual 20; Kamehameha 40; Barreira de Ki 80; Genki Dama 200. `CONFIG.skills` é a referência autoritativa usada pelo servidor e pela HUD. A Genki Dama coincide com o marco planejado do SSJ2.
- Kamehameha começa no nível 40 e evolui em 40/80/120/160/200; alcance e escala máxima atuais são atingidos no nível 200. Os marcos de arte antigos (pacotes 1/20/50/100/150) não são marcos de nível do personagem.
- As nove hunts atuais cobrem recomendações entre os níveis 1 e 150: Namekusei vai até 40 e Planeta Vegeta de 40 a 150. Os atributos dos mobs existentes em Vegeta acompanham essa curva; não adicionar criaturas ou hunts sem solicitação.
- Goku já possui atributos, habilidades, sprites e a escada de transformações implementada para esta versão. As regras atuais estão em `public/shared/config.mjs`, `public/shared/formas.mjs`, `public/shared/game.mjs` e `public/art/`; preservá-las é obrigatório.

### Diretrizes permanentes de arquitetura e balanceamento

- O projeto prevê Goku, Vegeta, Gohan, Cell, Buu e futuras vocações. Cada uma deverá ter identidade de combate própria, mantendo potencial competitivo equivalente ao longo da progressão; não precisam ter atributos, habilidades ou estilo idênticos.
- Avaliar o equilíbrio considerando XP por hora em hunts compatíveis, combate contra mobs e chefes, sobrevivência, consumo e recuperação de recursos e progressão de habilidades. PvP só entra nessa avaliação se for implementado e solicitado.
- Evoluir os sistemas compartilhados com configurações específicas por vocação quando isso for necessário e seguro. Reutilizar regras de progressão, combate, salvamento, HUD e simulação autoritativa; evitar duplicar sistemas inteiros ou exigir uma reescrita ao adicionar uma vocação.
- Não copiar automaticamente os atributos, habilidades ou transformações de Goku para outra vocação. Generalizar lógica específica de Goku apenas quando uma necessidade concreta justificar a mudança e quando o comportamento existente puder ser preservado.
- Preservar compatibilidade com personagens e saves existentes, incluindo progresso, vocação identificada e regras atuais. Não alterar dados de jogadores, curva de XP, nível máximo, desbloqueios, habilidades, transformações, sprites, caminhos de assets ou estrutura de animação sem uma tarefa específica.

### Planejamento futuro — ainda não implementado

- A forma Gogeta no nível 700 e Vegetto no 900 são jogáveis; a janela de fusão de Gogeta está ajustada para uma hora, em `CONFIG.transformacao.gogetaDuracao`.
- Ryuken implementado no nível 300 junto ao SSJ3 (`CONFIG.skills.ryuken`). Marco planejado para técnica futura: Super Kamehameha no nível 500 junto ao SSJ4. `CONFIG.plannedSkillUnlocks` registra a intenção, sem liberar ou ativar a técnica antes de ser implementada.
- Hunts, planetas e desafios acima do nível 150 ainda serão adicionados gradualmente. O teto 1.000 existe e o God Mode de teste usa esse nível, mas isso não implica que todo esse percurso tenha conteúdo ou balanceamento pronto.
- Cada vocação poderá ter habilidades e transformações próprias, configuradas sobre estruturas compartilhadas. Referências de design (Vegeta: ofensiva explosiva; Gohan: críticos e grande impacto; Cell: regeneração, resistência e absorção; Buu: sobrevivência e recuperação) são diretrizes, não atributos ou habilidades já disponíveis.
- Após o nível 1.000, o planejamento prevê Ascensão em cinco estágios, com evolução, transformações, habilidades, Poder de Combate, desafios, chefes e recompensas específicos por vocação. Esse sistema ainda não existe.
- Endgame e futuras vocações devem manter competitividade entre estilos diferentes, sem tornar uma opção superior em todos os aspectos.
- Itens listados como planejamento nesta seção não autorizam implementação automática. Só implementar uma vocação, progressão, habilidade, transformação, Ascensão ou mudança de balanceamento quando houver uma solicitação específica; até lá, documentar propostas como futuras e manter intacto o jogo atual.

