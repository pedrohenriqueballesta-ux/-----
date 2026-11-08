# Projétil universal de Ki dos mobs — TARGET

Branch: `feature/projeteis-mobs-target`, criada da `origin/main` atualizada após verificar branches/PRs do assunto.

## Escopo confirmado

Somente inimigos que já disparavam rajadas comuns de Ki: Veterano, Tsufurujins, Hatchiyack, Nappa, Raditz, Bardock, Oozarus comuns/Guerreiro, Rei Vegeta, Broly, Zarbon, Dodoria e a Sentinela (`ranged`, disponível para testes). O Oozaru Super reservado conserva suporte ao seu projétil comum. Mobs exclusivamente corpo a corpo continuam assim. Death Beam, Supernova, pancada e bola do Oozaru Dourado não foram convertidos. Ki/Genki do jogador e PvP também não mudam.

## Mecânica

O mesmo array `Game.projectiles` e o mesmo fluxo de dano são reutilizados. O alvo é fixado no início da preparação e validado novamente ao disparar. Depois, não troca de alvo quando a ameaça muda nem colide com jogadores intermediários.

O servidor corrige a trajetória a cada tick. A velocidade configurada define o tempo inicial de voo (`distância / velocidade`, mínimo 1/60 s). O percurso converge à posição atual do alvo nesse prazo, ajustando a velocidade instantânea conforme ele se move. Isso é necessário para garantir acerto também com projétil configurado mais lento que o jogador. Não há expiração por TTL, alcance percorrido ou destino inicial ultrapassado.

Dano apenas no impacto, uma vez. Dash não fornece esquiva contra este ataque TARGET; defesa, Barreira de Ki e proteções de safe zone/chegada continuam válidas. Morte, remoção/desconexão do alvo, safe zone ou troca de área/planeta removem o projétil. Um disparo já lançado continua se o mob morrer; a remoção da entidade do mob limpa o disparo sem erro.

Dano base, velocidade inicial 250, alcance 235 + corpo, preparação de 0,8 s e cooldown de 0,95 s após o disparo permanecem nos valores anteriores (Oozaru Super reservado: 1,5 s de cooldown). O DPS efetivo aumenta por deixar de perder impactos por movimentação, conforme solicitado; não houve aumento dos valores de dano. A cadência total continua incluindo preparação + cooldown.

## Configuração individual

Em `public/shared/projetil-mob.mjs`, `PROJETEIS_POR_MOB` aceita por espécie:

```js
veterano: {
  dano: 16,           // padrão: attack da ficha do mob
  velocidade: 250,   // positivo; define o tempo de voo
  tamanho: 48,       // largura visual em unidades do mundo
  cor: 105,          // tonalidade em graus: 0 vermelho, 120 verde, 240 azul
  cooldown: 0.95,    // segundos após disparar
  alcance: 235,      // distância necessária para começar a preparação
  fps: 12
}
```

A ficha de uma espécie/hunt em `enemies.mjs` também pode definir `projetil: { ... }`, sobrescrevendo o perfil somente naquele contexto. As cores iniciais foram escolhidas a partir das paletas saturadas das artes dos inimigos. Valores de velocidade, tamanho e FPS devem ser positivos.

## Arte e desempenho

O ZIP declara oito frames 288×256, mas a spritesheet fornecida só tem o primeiro preenchido. Os oito PNGs individuais são válidos: `ferramentas/preparar-projetil-mobs.ps1` remonta a folha 2304×256 sem redesenhar/recolorir os originais.

Uma única folha é usada por todos. Canvas aplica `hue-rotate` e redimensiona uma vez por tonalidade/tamanho/densidade de zoom, guardando o resultado em cache (até 32 entradas); não há leitura/processamento de pixels por projétil a cada frame. Branco do núcleo, alpha, partículas e brilho são preservados. O desenho gira no sentido do voo, com pivô perto do núcleo e sem cortar a cauda. Loop de oito frames, 12 FPS por padrão e configurável por mob.

## Verificação

`npm.cmd run check` e `npm.cmd test`. Os testes específicos cobrem os oito frames visíveis/distintos, cache de tonalidades, rotação, perseguição de alvo mais rápido, mudança de direção, movimento manual/automático, impacto único, alvo travado, jogadores intermediários, morte/desconexão/área/safe zone, dash, barreira, cooldown, alcance e preservação dos socos e rajadas do jogador. A suíte dos chefes especiais também permanece ativa.

Para testar no jogo, vá a uma hunt com Veteranos ou outro mob da lista, espere a rajada e mude de direção. Ela deve curvar e atingir seu personagem. Entre na safe zone para confirmar o cancelamento. A informação TARGET foi incluída na ficha do bestiário.

Validação realizada: 243 testes da suíte completa aprovados; testes específicos repetidos após otimizar o cache de zoom. No navegador, os quatro projéteis de teste mantiveram o alvo após movimentação e aplicaram dano. O ensaio sintético de 500 desenhos/frame passou de aproximadamente 19,3 ms para 10,7 ms médios com o cache redimensionado; esses números medem somente esse ensaio no ambiente headless, não garantem FPS do jogo inteiro.

As rajadas TARGET não exibem trajetória pontilhada durante a preparação. O tempo de preparação e a animação do mob permanecem. Os avisos dos golpes especiais dos chefes continuam visíveis.
