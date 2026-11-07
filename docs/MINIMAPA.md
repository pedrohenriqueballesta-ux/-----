# Minimapa interativo

Pedido de 07/11/2026, branch `feature/ajustes-minimapa` criada de `origin/main`.

- Clique esquerdo no mapa envia `moveTo` para o ponto correspondente ao recorte
  exibido. Usa a navegação autoritativa existente, sem teleporte ou movimento
  decidido pelo navegador. Um círculo verde marca brevemente o destino escolhido.
- Os botões −/+ abaixo do mapa mudam o tamanho da HUD em passos de 0,25×,
  de 1× (tamanho original mínimo) até 2×. O canto superior direito fica fixo;
  o crescimento ocorre para baixo e para a esquerda.
- A informação de zoom da tela do jogador é reposicionada abaixo da HUD do mapa
  por medição do tamanho real, inclusive após mudar de região ou redimensionar a janela.
- Scroll sobre o canvas do minimapa ajusta só sua aproximação. O scroll sobre a
  tela do jogador mantém o zoom da câmera. Zoom do minimapa: 100% a 400%, aplicado
  após limitar o recorte à área, eliminando valores sem efeito em áreas pequenas.
  O tamanho físico da HUD e o zoom do conteúdo são independentes.
- Segurar o botão esquerdo e arrastar explora o mapa sem mover o personagem.
  O gesto só conta como arrasto após 4 px; clique simples envia o destino ao soltar.
  A visão explorada permanece fixa até clicar em ◎, que volta a seguir o personagem.
  Trocar de lugar também restaura o acompanhamento. O arrasto respeita as bordas.

O cálculo do clique usa o mesmo recorte desenhado e desconta a borda do canvas.
Cliques de um recorte de outro lugar ou durante a transição são ignorados. O
minimapa não mostra nem seleciona pontos além do lugar atual. Resolução do canvas
acompanha seu tamanho para evitar ampliar uma imagem fixa de baixa resolução.

O painel Auto Hunt com posição padrão recalcula o espaço disponível quando o
minimapa muda de tamanho. Posição manual do Auto Hunt continua sendo respeitada.
Os controles atuais da câmera, ataques e regras de viagem não foram alterados.

## Destinos inacessíveis

Cliques em água, estruturas, pontos fora da hunt ou terra isolada são resolvidos
no servidor antes de iniciar o movimento. Se o ponto exato não tiver rota válida,
busca somente a componente realmente alcançável pelo jogador, escolhe um ponto
próximo ao pedido e aproxima o destino do limite caminhável em passos de 2 unidades.
A rota corrigida termina nesse ponto e a ordem é encerrada. Uma proteção adicional
cancela movimento manual sem progresso por mais de 1 s, evitando insistência ou tremor.
Vale para cenário e minimapa, sem alterar perseguição dos mobs ou caça automática.

Validação: 209 testes passaram e `npm run check` passou. Cobertura específica inclui
limites e unidades do scroll, independência do zoom da câmera, cliques em vários
tamanhos/zooms, bordas de todas as áreas e movimento pelo servidor contornando
uma estrutura até o destino selecionado, zoom funcional em áreas pequenas e
conversão de cliques depois de explorar o mapa por arrasto.
Regressões novas cobrem água, terra desconectada, limite de hunt, estrutura,
parada estável e novo clique/controle por teclado após corrigir o destino.

Conferência visual no navegador pendente: host de acesso ao navegador indisponível.
Servidor reiniciado para teste do usuário. Commit autorizado em 07/11/2026.
Push e merge aguardam autorização.
