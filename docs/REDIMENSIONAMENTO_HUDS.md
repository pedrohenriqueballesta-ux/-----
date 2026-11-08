# Redimensionamento das HUDs

Branch feature/redimensionamento-huds criada de origin/main após verificar que as branches antigas de ajustes de HUD já estavam incorporadas.

Use a alça ◢ no canto inferior direito para ajustar o tamanho. Cabeçalhos e alças ⠿ continuam movendo o painel. Duplo clique na alça ◢ restaura somente o tamanho. Com foco nessa alça, use as setas (Shift aumenta o passo nas janelas) e Home para restaurar.

Janelas (personagem, configurações, missões, ranking, guildas, correio, loja, mochila, mapa, portal, bestiário e Auto Hunt) ajustam largura e altura; conteúdo que não cabe pode ser rolado. Os painéis fixos (personagem/status, alvo, minimapa, Auto Hunt, conexão, dicas, missão acompanhada e gráfico do Hunt Analyzer) ajustam a escala mantendo proporções. Chat, habilidades/itens, barra central superior e logo mantêm tamanho e posição padrão, sem alças, ignorando preferências antigas de posição e escala. O minimapa usa somente a alça para tamanho: removidos +, − e o indicador de tamanho; centralizar, zoom com scroll e navegação pelo canvas continuam disponíveis.

Cada tamanho é salvo no localStorage deste navegador, independentemente da posição. Reabrir/recarregar conserva a preferência. Valores inválidos são ignorados; tamanho e posição são limitados à tela atual sem apagar a preferência para uma tela maior. HUDs usam escala de 60% a 200%, admitindo redução adicional quando necessária para caber. Janelas têm mínimo de 220×160, limitado pela tela. Login e tutorial não são painéis de organização do jogo.

Implementação central em public/render/redimensionar-hud.mjs, integrada aos controladores existentes de arrasto e janelas. A mochila deixa de encaixar automaticamente quando tem tamanho manual; o Auto Hunt usa a altura manual ao arrastar. O texto da missão acompanhada preserva as alças durante atualizações. Não muda simulação, combate, hotkeys ou inventário.

Verificação: npm run check e npm test; testes de limites de tamanho/escala e regressão do arrasto. Navegador: arrasto real para diminuir Auto Hunt e habilidades, restauração ao reabrir e após reload, reset com Home, todas as janelas principais, desktop e 420×740.
Indicadores de conexão e dicas não recebem alças, evitando controles soltos quando esses textos estão ocultos. O minimapa mantém apenas seu indicador de zoom; removido o cartão separado de zoom da câmera. O scroll fora do minimapa continua ajustando a câmera normalmente.
