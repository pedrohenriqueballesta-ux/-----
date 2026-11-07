# Kamehameha evolutivo — 07/11/2026

Pedido confirmado nesta sessão: evolução conforme o **nível do personagem**, sem treino por uso ou nível individual da habilidade. O desbloqueio continua no nível 3. A faixa 1–19 usa a arte 1; 20–49 usa 20; 50–99 usa 50; 100–149 usa 100; 150+ usa 150. O estágio é escolhido em cada disparo, sem reiniciar, e permanece estável até o fim da animação.

Os alcances são 4, 6, 8, 10 e 12 tiles dos pacotes (32 unidades por tile): 128, 192, 256, 320 e 384 unidades a partir das mãos. O mundo não usa grade de tiles; a escala do solo não multiplica alcances. As mãos ficam 20 unidades à frente do personagem; a apresentação sobe 28 unidades para alinhar o efeito ao corpo.

Preservados: carga de 0,65 s, custo de 25 Ki, recarga de 5 s, dano de 4,2×ATK (6×ATK transformado), bônus de Kaioken e defesa do alvo. O feixe cresce durante a animação e atinge cada inimigo no máximo uma vez. O servidor confere comprimento e largura afunilada de cada quadro, área/planeta e ausência de PvP. O efeito termina ao entrar na safe zone, viajar, morrer ou desconectar. A caça automática verifica o novo alcance antes de usar Kamehameha.

## Arte e implementação

- `public/assets/skills/kamehameha/nivel-{1,20,50,100,150}/`: somente spritesheet e JSON originais de cada ZIP; frames soltos não foram duplicados.
- `public/shared/kamehameha-dados.mjs`: medidas de origem luminosa, extremidade e largura nos 16 quadros de cada pacote.
- `public/shared/kamehameha.mjs`: seleção do estágio, tempo, escala e colisão compartilhados entre cliente e servidor.
- `public/shared/game.mjs`: carga, feixe autoritativo e conjunto de alvos atingidos por disparo; snapshot envia só os efeitos da mesma hunt.
- `public/render/kamehameha.mjs` e `public/client/game.mjs`: sprites rotacionados com escala uniforme, cache das cinco imagens e dos quadros já usados. Correção visual pedida em 07/11: origem e ponta com metade da escala anterior; o corpo é prolongado com recortes em escala 1:1 e emendas com fade, mantendo o alcance. A borda inicial do sprite, em vez do centro da bola, fica à frente das mãos. O feixe aparece sobre os inimigos. Sem qualquer recorte retangular: para sul e diagonais para baixo, ele fica sobre o corpo do lançador; para norte, diagonais para cima e laterais, o sprite original do Goku é recomposto sobre o feixe, preservando o contorno real dos cabelos e do corpo. A prévia usa a mesma regra de profundidade. A bolinha antiga da carga foi removida. A largura da colisão acompanha a nova escala. Frames isolados com margem transparente evitam vazamento de células vizinhas durante a rotação. Alguns quadros originais encostam na borda direita: os últimos 10 pixels recebem atenuação de alpha em memória, sem redesenhar ou esticar a imagem original.
- `public/kamehameha.html` e `public/render/kamehameha-previa.mjs`: prévia visual independente do save; `tests/kamehameha.test.mjs`: regressões de arte, colisão, estágios, dano, cancelamento, automação e cache. `npm run check` inclui os novos módulos.

Os quatro primeiros quadros de formação ocupam os últimos 320 ms da carga. O quadro inicial permanece visível nos primeiros 330 ms. Depois, os outros quadros seguem a 80 ms cada, totalizando 16 quadros sem mudar o tempo de carga. O desenho permanece ancorado no personagem e acompanha a direção atual do corpo durante a carga e o feixe, inclusive no movimento. Manualmente, Kamehameha ignora o mouse e a seleção de inimigo para determinar a direção: segue `facing`. Somente com auto caça ligada, o servidor primeiro vira o corpo para o alvo, reavaliando sua posição durante o ataque; sprite, origem e colisão usam essa mesma orientação. O dano é calculado uma vez na liberação e aplicado pelo servidor quando o alvo entra na área efetiva do feixe. Virar não limpa o conjunto de inimigos já atingidos. Com auto caça OFF, ataque e técnicas automáticos não mudam a orientação do corpo: o jogador controla a direção e o Kamehameha acompanha.

## Testar

Execute `npm.cmd start` no Windows (ou `npm start` em outros sistemas). Abra `http://localhost:3000/kamehameha.html`: escolha o estágio, a direção e reproduza ou avance pelo controle de frames. A página não conecta um jogador nem grava progresso. O círculo pontilhado representa o alcance máximo; o efeito cresce dentro dele. No jogo normal, saia da safe zone, alinhe vários mobs e use a tecla **1** ou técnicas automáticas; o estágio acompanha seu nível atual.

O limite de nível do personagem continua em **100**. Portanto, o estágio 150 pode ser visto na prévia e testado na simulação, mas ainda não é alcançável pela progressão normal. Não foram alterados o limite, as outras habilidades ou o formato do save.

Validação: testes de regras, múltiplos alvos, alcance exato nos cinco estágios, oito direções, dano sem duplicação, safe zones/portal/desconexão/morte, carregamento e reutilização dos assets. Conferidos no navegador os cinco estágios, diagonal e disparo real: dois alvos dentro do alcance receberam dano uma vez e o terceiro, fora, não recebeu. Sem erros de JavaScript durante a conferência.
