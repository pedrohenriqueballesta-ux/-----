# Especificação de sprites de personagem montado

## A. Diagnóstico

O renderer atual desenha a montaria antes do personagem e alinha ambos por um ponto de mundo retornado por `desenharNimbus`. A Rena Natalina usa `ASSENTOS_MONTARIAS.rena_natalina`, com offsets por direção. A skin montada usa uma folha independente (`07_MONTADO.png`) e não anima a caminhada do personagem.

Os problemas de encaixe restantes são principalmente geométricos: a folha montada atual usa o limite inferior da célula como âncora, que é apenas um proxy do quadril, e a Rena é uma imagem única sem separação de cabeça/dorso/parte dianteira. Offsets corrigem a posição geral, mas não podem resolver pernas/chifres que exigem profundidade entre camadas.

## B. Arquivos

Preservar:

- `public/assets/montarias/rena-natalina/parado.png`
- `public/assets/montarias/rena-natalina/andando.png`
- `public/assets/montarias/rena-natalina/invocacao.png`
- `public/assets/goku/base/*` e demais folhas originais do Goku

Substituir futuramente apenas as folhas de personagem montado natalino, quando a nova arte for aprovada:

- `public/assets/goku/natalino/07_MONTADO.png`

O código que consome a folha está em `public/art/goku-natalino.mjs`, `public/art/goku.mjs` e `public/render/nimbus.mjs`.

## C. Dimensões verificadas

### Rena

- Folhas: 1024×1536 px.
- Grade: 5 linhas × 4 colunas.
- Limites verticais: `[0, 307, 614, 922, 1229, 1536]`.
- Cada linha representa uma direção: frente, diagonal frente-direita, perfil direita, diagonal costas-direita, costas.
- Direções esquerdas são espelhadas horizontalmente.

### Goku Natalino V2

- `01_PARADO.png`: 1024×1536 px.
- `02_ANDAR.png`: 1024×1536 px.
- `03_SOCO.png`: 1024×1536 px.
- `04_RAJADA_KI.png`: 970×1622 px.
- `05_KAMEHAMEHA.png`: 1024×1536 px.
- `06_GENKI_DAMA.png`: 977×1609 px.
- `07_MONTADO.png`: 977×1609 px.
- Grade lógica: 5 linhas × 4 colunas, com recorte por `round(row * H / 5)` e `round(column * W / 4)`.
- As folhas 04, 06 e 07 não podem reutilizar dimensões de 1024×1536.

## D. Organização

Linhas: `S`, `SE`, `E`, `NE`, `N`. Para `SW`, `W` e `NW`, espelhar respectivamente `SE`, `E` e `NE`. Nunca espelhar frente ou costas.

Colunas: quatro fases de cada ação. Para montado, a coluna 0 é o quadro de referência estável; as colunas seguintes só devem ser usadas se o movimento do dorso justificar uma animação discreta.

## E. Posturas exigidas

- Tronco sentado e ereto, sem aparência de personagem em pé.
- Quadril claramente apoiado no dorso/sela.
- Pernas dobradas e afastadas conforme a largura do dorso, sem atravessar a rena.
- Botas próximas às laterais do animal, sem flutuar abaixo da sela.
- Braços naturais, sem rédeas desenhadas permanentemente.
- Chapéu, cabeça, mangas e botas preservam proporções da skin natalina em todas as direções.
- A postura montada não deve alterar a altura visual do Goku em relação ao Goku base quando comparada pelo ponto do quadril.

## F. Ancoragem

O ponto do personagem deve ser o centro do quadril, não o centro geométrico da imagem. O ponto da montaria deve ser o centro da sela/dorso.

Na implementação atual, o ponto de mundo da Rena é o apoio inferior do frame e os ajustes de teste são:

```js
n:  { x: 0,  y: -18 }, ne: { x: -3, y: -17 }, e:  { x: -6, y: -16 },
se: { x: -5, y: -16 }, s:  { x: 0,  y: -19 }, sw: { x: 5,  y: -16 },
w:  { x: 6,  y: -16 }, nw: { x: 3,  y: -17 }
```

Esses números são offsets de composição atuais, não coordenadas anatômicas finais. A nova folha deve conter o quadril no mesmo ponto relativo em todas as colunas de uma direção, permitindo que o código alinhe o quadril à sela sem compensações agressivas.

## G. Camadas

O renderer atual suporta uma imagem completa da montaria seguida por uma imagem completa do personagem, mas não possui partes dianteiras/traseiras da Rena separadas. Portanto, ele não consegue ocultar apenas a perna distante ou recolocar chifres à frente do tronco sem uma arte adicional.

Se a nova arte ainda exigir profundidade, fornecer opcionalmente duas folhas sincronizadas da montaria:

1. `mount_back`: dorso, pernas traseiras e elementos atrás do personagem.
2. `mount_front`: cabeça, chifres, pescoço e elementos que devem passar à frente.

As duas folhas devem ter a mesma grade, dimensões, âncoras e frames. Não usar máscaras retangulares automáticas.

## H. Animação

- Parado: coluna 0 fixa ou respiração mínima sem deslocar o quadril.
- Andar: quatro colunas em loop na montaria; o personagem pode permanecer na coluna montada 0 se o quadril não variar.
- Invocação: montaria 0→1→2→3; desinvocação 3→2→1→0.
- Ataques e habilidades continuam sendo desenhados pelo motor; a folha montada não deve duplicar projéteis, aura, Kamehameha ou Genki-Dama.

## I. Qualidade

- PNG RGBA com fundo transparente real.
- Sem sombra de chão embutida.
- Sem rédeas fixas, halos magenta/verde ou pixels de chroma nas bordas.
- Contorno e escala compatíveis com as folhas base do Goku.
- O quadril deve permanecer estável entre colunas; variações pertencem ao dorso da montaria, não a uma flutuação do personagem.

## J. Implementação

O código deve continuar usando um catálogo de postura (`standing` para Nimbus, `seated` para montarias terrestres) e uma configuração de assento por montaria/direção. A Rena deve continuar reutilizando o sistema de oito direções e suas animações atuais. A nova folha deve substituir somente `07_MONTADO.png` após aprovação visual; não modificar regras de movimento, colisão, transformação ou outras skins.

