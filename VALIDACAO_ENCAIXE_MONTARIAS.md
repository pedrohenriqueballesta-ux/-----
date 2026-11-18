# Validação real do encaixe: Rena Natalina e Goku Natalino

## Método

A prévia em `public/montaria-debug.html` usa diretamente `desenharNimbus` e `drawGoku`, sem cópia das regras de movimento. A direção é selecionada no controle; as caixas de seleção isolam a rena, o personagem ou a composição. Escala e offsets são apenas transformações do canvas da prévia e não alteram `ASSENTOS_MONTARIAS` nem o jogo.

Correção importante: a primeira versão passava `montaria:null` ao `drawGoku`, portanto o renderer selecionava `parado` em vez de `montado`. A ferramenta agora preserva `montaria:'rena_natalina'`, força o estado `montado` pelo mesmo caminho do jogo e exibe o caminho da folha, linha, coluna e dimensões do frame.

As camadas reais `mount_back.png` e `mount_front.png` permanecem isoladas no debug. A verificação pixel a pixel contra `original_rgba_referencia.png` encontrou 1.132.978 diferenças em 1.572.864 pixels (72,03%), portanto elas não podem ser aplicadas ao renderer do jogo com segurança. O jogo mantém a folha original da rena até que as camadas sejam regeneradas. As folhas de caminhada e invocação continuam usando a renderização original.

Abrir com `npm start` em `http://localhost:3000/montaria-debug.html`.

## Valores efetivos verificados

- Rena: `public/assets/montarias/rena-natalina/{parado,andando,invocacao}.png`, 1024×1536, grade 4×5, recorte por linha de 307/308 px, escala fixa do renderer `0.30`.
- Goku montado: `public/assets/goku/natalino/07_MONTADO.png`, 977×1609, grade 4×5. A folha é desenhada pelo recorte de `FOLHAS_GOKU_NATALINO`, com altura de referência da própria linha e escala de altura usada pela skin (`70 px` no renderer).
- A direção usa `direcaoNimbus`; SW/W/NW são espelhadas. A rena é desenhada primeiro; o personagem é desenhado depois.
- A composição experimental mede o centro da sela dentro do frame real da rena e o quadril dentro do frame real de `07_MONTADO.png`; os quatro marcadores distinguem mundo, sela, referência antiga do renderer, ponto de composição e quadril calculado.
- Assentos atuais: `N (0,-18)`, `NE (-3,-17)`, `E (-6,-16)`, `SE (-5,-16)`, `S (0,-19)`; opostas espelhadas pelo mapa de direção.

## Diagnóstico por direção

Use a prévia para confirmar visualmente cada orientação. Os marcadores verdes mostram o ponto de referência retornado pelo renderer da montaria; o amarelo mostra onde o Goku é composto após o offset temporário. O ponto anatômico definitivo do quadril não pode ser inferido do limite inferior da célula: ele precisa ser medido na arte da folha `07_MONTADO.png` e comparado à sela visível da rena.

Até essa medição, o resultado deve ser classificado como **não aprovado** para postura sentada. A camada única da rena também impede ocultar seletivamente a perna traseira; se houver interpenetração, a correção é artística/camada, não um deslocamento arbitrário.

| Direção | Verificação | Classificação provisória |
|---|---|---|
| S | sela, quadril, botas e chifres | validar na prévia; possível necessidade de camada frontal |
| SE | sela e pernas em perspectiva | validar; pode exigir postura diagonal específica |
| E | dorso e quadril laterais | validar; incompatibilidade se botas não acompanham o dorso |
| NE | personagem de costas/3⁄4 | validar; espelhamento não corrige perspectiva |
| N | cabeça da rena e costas do Goku | validar; camada frontal pode ser necessária |

## Critério de aprovação

Não aprovar uma direção quando o quadril estiver fora da superfície da sela, as botas atravessarem o corpo, os chifres atravessarem o personagem ou a perspectiva exigir uma postura que a folha não possui. Offset e escala só corrigem problemas de renderer; postura, proporção e ausência de camadas exigem nova arte.

## Capturas

As capturas devem ser feitas na própria página de depuração após selecionar cada direção, ajustar o zoom e deixar apenas os marcadores necessários ativos. A composição em camadas reais permanece pendente. Nenhum arquivo gráfico original é substituído por esta validação.
