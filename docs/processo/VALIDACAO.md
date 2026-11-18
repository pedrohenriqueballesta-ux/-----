# Estado da entrega — protótipo 0.1

Data: 27 de outubro de 2026.

## Resultado

Projeto local executado com Node.js 24.22.1. Sem dependências externas. Requisito declarado para o usuário: Node.js 22 ou superior.

Os comandos npm run check e npm test passaram. Foram dez testes:

1. Cooldown compartilhado entre potências de semente, sem perda de item em tentativa bloqueada.
2. Regeneração apenas com comida ativa e término do efeito.
3. Crescimento automático dos atributos e desbloqueio por nível.
4. Bloqueio de PvP fora da região e permissão dentro dela.
5. Kamehameha que cruza a fronteira respeita a regra de PvP.
6. Capacidade de mochila e compra bloqueada sem gasto.
7. Entrada manual encerra a caça; desconexão suspende a recuperação/atividade do personagem.
8. Transformação exige nível e termina quando o Ki acaba.
9. Caça automática de um minuto derrota mobs e evolui sem comandos adicionais.
10. Duas conexões reais recebem o mundo compartilhado; entradas não podem escrever atributos diretamente.

## Navegador

A interface foi aberta no Chrome. Duas abas mostraram dois jogadores conectados. A primeira sessão evoluiu do nível 1 ao 7 durante a verificação. Foram observados:

- Caça automática, ganho de experiência e aumento dos status.
- Interrupção da caça com tecla de movimento.
- Uso de semente e seleção de outra potência permanecendo em recarga.
- Compra de presunto no mercado: estoque passou de 5 para 6 e Zeni de 200 para 188.
- Recuperação da sessão e do nível após recarregar a página.

Não houve teste em celular físico nem teste de carga para produção. Os controles de toque e o layout responsivo estão implementados.

## Escopo

Um personagem, um mapa pequeno e valores de teste. Não há contas de produção nem comércio entre jogadores. A entrega é local e inclui o código para desenvolver os próximos sistemas.


## Atualização visual 0.2

- `npm run check` e `npm test`: aprovados, incluindo as dez verificações de regras e sessões reais.
- Navegador desktop: artes e mapa renderizados; painel de personagem, caça automática, retomada manual, poção de Ki e transformação Super Saiyajin verificados.
- A animação usa poses isoladas da folha adaptada com um movimento simples; não é uma animação quadro a quadro completa em oito direções.
- O teste visual não usou aparelho físico de toque.

## Atualização visual 0.3

- `npm run check` e 13 testes automatizados passaram. As novas verificações cobrem zoom, limites da câmera, cálculo da mira e seleção de quadros.
- Navegador desktop: roda do mouse aproximou e afastou; botões de zoom funcionaram; um Saibaman foi selecionado por clique com o zoom em 120%.
- Foram observados passos e mudança de direção do Goku e mobs, caminhos arredondados, pedras junto ao chão, caça e barra de habilidades compacta.
- O salvamento da versão 0.2 foi recuperado na 0.3 em teste local, preservando nível, XP e inventário.
- Não houve teste em aparelho físico de toque. Os ciclos de caminhada e ataque são de dois quadros por direção; outros movimentos ainda podem receber mais quadros.

## Atualização de animações 0.4

- `npm run check` e os 19 testes automatizados passaram após a integração das folhas finais.
- Todos os mobs atuais (Saibaman, Sentinela e Guardião) têm 16 quadros por ciclo de caminhada e ataque; Goku base e Super Saiyajin também.
- Foram acrescentadas folhas específicas para as diagonais dianteiras e traseiras. Vistas opostas são espelhadas para manter a anatomia consistente. A tela `animacoes.html` permite inspecionar cada quadro nas oito direções, sem acessar nem alterar a sessão do jogador.
- Os testes verificam a velocidade constante nas quatro diagonais para entrada manual e condução automática, a orientação transmitida dos mobs, a passagem pelos 16 quadros, o congelamento da marcha sem deslocamento e o reinício após teleporte.
- Os testes também validam os recortes dentro dos PNGs transparentes e os 16 índices distintos por sequência, incluindo as folhas diagonais. O impacto mantém os tempos de aviso e dano anteriores; a recuperação continua por 0,32 s apenas na apresentação.
- No navegador desktop, foram conferidos caminhada, vistas em três quartos, preparação e golpe na prévia quadro a quadro. A integração usa as mesmas funções de desenho do jogo. No mapa, a caça permaneceu ativa, houve transformação e o personagem de teste passou do nível 13 para o 14.
- A inspeção dos pixels confirmou 16 conteúdos distintos em todas as sequências selecionadas; não são oito recortes indexados duas vezes.
- Um salvamento real produzido pelo servidor 0.3 foi copiado para o servidor 0.4: a mesma sessão recuperou nível 7, XP 13 e o estoque de sementes. O formato do salvamento permanece o mesmo. O pacote não inclui dados de teste nem o progresso de outros jogadores.
- Sem teste em aparelho físico de toque ou medição de capacidade multiplayer em produção. Morte, esquiva e uso de itens não foram convertidos em ciclos próprios de 16 quadros nesta etapa.


## Atualização integrada 0.6 — HUD, técnicas e Freeza

- A HUD foi integrada sobre o mapa Canvas do jogo existente (não é uma captura de tela colocada como fundo). Inclui retrato, nível, HP, Ki, EXP, recursos, minimapa/bússola, controles laterais, missões rápidas, chat de demonstração, atalhos e cinco poderes com bloqueio e recarga.
- Atalhos novos: 1 Kamehameha (NV. 3), 2 Kaioken (NV. 2), 3 Barreira de Ki (NV. 2), 4 Super Saiyajin (NV. 5), 5 Genki Dama (NV. 10). Espaço realiza ataque básico e Shift faz esquiva. T continua como atalho alternativo da transformação.
- Kaioken aplica bônus temporário de dano; Barreira de Ki reduz dano recebido temporariamente; Genki Dama usa projétil de área e recarga longa.
- O chefe da Cratera Rubra é desenhado como Freeza, usando 16 sprites de quatro vistas, com flip para vistas opostas e aura violeta. Goku, Super Saiyajin, Saibaman e Alien continuam usando folhas animadas com quadros de caminhada/ataque nas direções documentadas.
- Foram adicionados os arquivos PNG de Freeza em `public/assets/freeza/` e o retrato `public/assets/goku-avatar.png`. As pranchas de referência de biomas ficam em `docs/referencias/map-biomes/` (material de referência, não usado pelo jogo); a renderização contínua do mapa continua no Canvas.
- `npm test`: 21 de 21 testes passaram. `npm run check`: passou. O endpoint local `/api/health` respondeu com versão `0.6.0`. Não consegui verificar a renderização visual com o navegador de teste automatizado deste ambiente, então a aparência final deve ser conferida abrindo o ZIP no computador do usuário.
