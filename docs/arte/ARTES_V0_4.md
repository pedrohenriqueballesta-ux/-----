# Artes e animações da versão 0.4

As folhas PNG desta atualização foram produzidas com o gerador de imagens integrado, a partir das sprites anteriores como referência de identidade e estilo. Os PNGs mantêm seus pixels e a transparência originais. `public/sprite-data.mjs` descreve os recortes, escala de referência e âncora junto ao chão. O renderizador usa exatamente 16 recortes por ciclo, sem repetir uma lista de oito índices.

## Arquivos finais

Todos os caminhos abaixo são relativos à pasta do projeto.

| Arte | Arquivos em public/assets/ |
| --- | --- |
| Goku | goku-walk-16.png, goku-attack-16.png, goku-diagonals-16.png |
| Super Saiyajin | ssj-walk-16.png, ssj-attack-16.png, ssj-diagonals-16.png |
| Saibaman | saibaman-walk-16.png, saibaman-attack-16.png, saibaman-diagonals-walk-16.png, saibaman-diagonals-attack-16.png |
| Sentinela e Guardião | alien-walk-16.png, alien-attack-16.png, alien-diagonals-16.png |

O Guardião mantém a identidade visual ampliada da Sentinela, como nas versões anteriores. Tem o mesmo número de quadros, com passada proporcional ao tamanho e preparação sincronizada ao seu próprio aviso de golpe.

## Conjunto de instruções de arte

- **Identidade preservada:** Goku de cabelo preto, roupa laranja e azul; Super Saiyajin com cabelo dourado e olhos turquesa; Saibaman verde, cabeça com sulcos, olhos vermelhos e garras; alienígena roxo com cabeça pontilhada, armadura branca e ombreiras roxas.
- **Caminhada:** atlas em pixel art, fundo realmente transparente, câmera elevada de RPG clássico. Dezesseis fases de um ciclo completo de dois passos, com joelhos, pés e braços alternados. Escala constante, pés alinhados, espaço entre sprites e corpo inteiro dentro de cada recorte. Sem textos, grade, cenário, sombra, partículas ou trilhas de movimento.
- **Ataque:** dezesseis poses ordenadas de preparação, extensão e recuperação; soco para Goku, garra para Saibaman e gesto de disparo para o alienígena. A energia e os projéteis são desenhados separadamente pelo jogo.
- **Diagonais:** frente/esquerda em três quartos voltada ao sudoeste e costas/esquerda em três quartos voltada ao noroeste. Mostrar o lado do rosto ou do crânio, ombro e quadril; diferenciar a silhueta de uma vista frontal, lateral ou de costas. Os lados direitos são espelhados no renderizador.
- **Variação Super Saiyajin:** alterar apenas cabelo, sobrancelhas e olhos da folha do Goku, preservando posições, roupas, poses, escala, âncoras e direções; não acrescentar aura ou efeitos ao PNG.

As folhas amplas foram pedidas com 16 colunas e oito linhas. Algumas saídas do Goku contêm 17 colunas; o manifesto seleciona 16 recortes distintos e o jogo continua com 16 quadros. As folhas diagonais de Goku e alienígena usam oito colunas por oito linhas: dois pares de linhas de caminhada e dois pares de ataque. A folha de caminhada diagonal do Saibaman usa apenas as quatro primeiras linhas corretas da saída; o ataque diagonal foi gerado separadamente em oito colunas por quatro linhas. Trechos descartados não são apresentados no jogo.

## Reprodução e limites

Abra `/animacoes.html` com o servidor ligado. Cada passo depende da distância percorrida; não há rotação de uma figura frontal para simular a vista diagonal. As imagens são uma adaptação para o protótipo e ainda podem receber polimento artístico. Esta atualização não produz sequências de 16 quadros para morte, interação, uso de itens ou esquiva.
