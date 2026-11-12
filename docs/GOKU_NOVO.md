# Goku novo — seis folhas da forma base

Implementação local em `feature/espelho-direcoes`, no repositório `~/idle-dbz/jogo`.
As seis folhas são entregues juntas, preservando a integração anterior das cinco primeiras.

## Arte e recorte

Arte original do Pedro, sem redesenho ou recoloração. Cada folha tem cinco linhas
(Sul, Sudeste, Leste, Nordeste, Norte) e quatro colunas. Lado esquerdo é espelhado
somente no código, por `drawSheet` e `SHEET_VIEWS`.

| Estado | Arte do pacote | Módulo | Registro |
| --- | --- | --- | --- |
| Parado | Folha 1 | `art/goku-parado.mjs` | `gokuParado` |
| Andar | Folha 2 | `art/goku-passo.mjs` | `gokuPasso` |
| Soco | Folha 3 | `art/goku-golpe.mjs` | `gokuGolpe` |
| Rajada de Ki | Folha 4 | `art/goku-ki.mjs` | `gokuKi` |
| Kamehameha | Folha 5 | `art/goku-kame.mjs` | `gokuKame` |
| Genki Dama | Folha 6 | `art/goku-genki.mjs` | `gokuGenki` |

Atlas transparentes e JSONs estão em `public/assets/goku/base/`. Todos passaram
por `ferramentas/fatiar_caminhada.py` → `ferramentas/gerar_modulo.py`.

A folha 6 foi lida da cópia original em
`~/idle-dbz/referencias/goku-novo/goku_base_06_genki.png`:

```sh
python3 ferramentas/fatiar_caminhada.py <original> public/assets/goku/base/genki.png public/assets/goku/base/genki.json 5 4 halo
python3 ferramentas/gerar_modulo.py public/assets/goku/base/genki.json public/art/goku-genki.mjs GOKU_GENKI /assets/goku/base/genki.png 0 "erguendo, canalizando em V, preparando arremesso, arremessando"
```

Resultado: atlas RGBA 1016×1575, células 254×315, referência de altura 255.
Nenhum quadro toca as bordas da célula; mãos e dedos erguidos foram preservados.
A escala real continua `70 / 253`, a mesma da caminhada: braços erguidos não fazem
o corpo encolher. Âncoras permanecem na mesma linha de chão de cada linha do atlas.

## Pose da Genki

Prioridade na forma base: morto > Genki > Kamehameha > rajada > soco > andar > parado.
Super Saiyajin mantém as folhas e a apresentação anteriores.

- Carga existente em `snapshot.genkiCharges`, identificada pelo `owner`: coluna 0
  nos primeiros 0,25 s; depois coluna 1 parada em V até terminar a carga de 1,92 s.
- Na emissão real do projétil, servidor registra `genkiLancado` e `genkiDirecao` no
  jogador. São metadados transitórios de apresentação, enviados apenas aos
  observadores do mesmo lugar pelo snapshot dos jogadores, sem persistência no save.
- Lançamento: coluna 2 por 0,15 s, coluna 3 até 0,35 s; depois volta ao normal.
- Morte, desconexão, portal, safe zone e cancelamentos existentes encerram a pose.
- Direção da carga e do lançamento é aplicada apenas à apresentação do Goku base,
  pela direção da Genki. Não muda o movimento, a mira ou as regras das técnicas.

A canalização reutiliza a energia já existente. Para a forma base nova, a ponta do V
fica a 58 unidades acima dos pés do sprite; SSJ mantém a altura anterior de 62.
Na Nimbus, energia e corpo recebem o mesmo deslocamento cosmético. Custo, dano,
recarga, velocidade, alcance de voo, colisão e área da habilidade permanecem iguais.

## Verificação e prévia

- `npm run check` inclui `goku-genki.mjs` e os módulos novos de apresentação/prévia.
- 440 testes passaram: fases, prioridade, escala, âncoras, oito direções, snapshot
  para observadores e cancelamentos, além das regras existentes do jogo.
- Chrome: prints das quatro fases nas oito direções, com/sem alvo, carga e arremesso
  na Nimbus e cancelamento na safe zone. Também foi conferida a ausência de corte
  nas bordas dos 20 quadros do atlas.
- Prévia isolada: `http://localhost:3001/genki-goku.html`, controles de fase, alvo,
  Nimbus e safe zone. Simulação local no navegador; não usa o progresso original.
- Save original conferido sem alteração; servidor apenas no worktree de prévia.

## Validação para entrega — 09/11/2026

Commit e push autorizados pelo Pedro após a revisão visual. Base atualizada com
`origin/main`, incluindo a PR #73 (Auto Hunt com raio de 700 unidades), preservando
todas as alterações locais, sem stash nem troca do ramo original. Cópia de segurança
local feita antes da conciliação; save original verificado por hash e preservado.

Na base atualizada, **442 testes passaram e `npm run check` passou**. Esta é a
validação final da entrega completa das seis folhas e do espelhamento. Sem PR ou merge.

## Super Saiyajin novo (11/11/2026)

Seis folhas do Pedro (`goku_super_saiyajin_6_folhas.zip`), feitas no ChatGPT com as folhas base como molde: mesmas
poses e posição, cabelo de Super Saiyajin fase 1 (dourado, espetado para cima, olhos verde-azulados) e **quimono
inteiro** (decisão do Pedro). Fundo magenta, recorte `halo`, PNGs em `public/assets/goku/ssj/`, módulos
`art/goku-ssj-*.mjs` e conjunto `FOLHAS_GOKU_SSJ` (`art/goku-ssj.mjs`) com as mesmas chaves da base.

`drawGoku` usa essas folhas com a forma SSJ (`transformed`), na escala de pixel da base: o corpo não muda de tamanho
nem de lugar ao transformar; só o cabelo cresce (folha ~270 px contra 253 da base). Caminhada pelo `kind` `gokuSsj`.
As folhas antigas do SSJ (chibi) ficam só como reserva. Teste: `tests/goku-ssj.test.mjs`. Conferido no navegador:
base → SSJ no mesmo ponto, andando, e de volta à base.

## Super Saiyajin 2 (11/11/2026)

Seis folhas do Pedro feitas sobre as do SSJ (corpo idêntico pixel a pixel; cabelo um pouco mais cheio) em
`public/assets/goku/ssj2/`, módulos `art/goku-ssj2-*.mjs` e `FOLHAS_GOKU_SSJ2` (`art/goku-ssj2.mjs`). `drawGoku` usa-as
com `forma === 'ssj2'`, na escala da base; caminhada pelo `kind` `gokuSsj2`.

**Raios animados** (pedido do Pedro: "o raio fica fazendo animação, não é algo estático"; a equipe pediu em 12/11
que passem também pela frente do corpo): efeito separado do corpo, desenhado por cima do Goku em qualquer pose e
ancorado nos pés (`render/raios-ssj2.mjs`), com uma segunda passada em modo `lighter` para brilhar em chão claro.
Arte da equipe `ssj2_raios_azuis` (16 quadros de 315×311 a 90 ms, arcos de energia azul em volta e pela frente): veio
com a transparência invertida (fundo azul opaco, miolo apagado) e foi recuperada por código (fundo transparente,
miolo branco) em `public/assets/skills/raios-ssj2-corpo/frente.png`; original em `~/idle-dbz/referencias/goku-ssj/raios-amigo/`.
O módulo aceita uma camada `atras` (antes do corpo) se a arte vier com ela.
Teste: `tests/goku-ssj2.test.mjs`. Escada de formas e barra de técnicas: `docs/ATALHOS.md` e `shared/formas.mjs`.

## Super Saiyajin 3 (12/11/2026)

Seis folhas do Pedro feitas sobre as do SSJ2 (pés no mesmo pixel; cabelo longo até as coxas, sem sobrancelhas) em
`public/assets/goku/ssj3/`, módulos `art/goku-ssj3-*.mjs` e `FOLHAS_GOKU_SSJ3`. Forma `ssj3` no topo da escada
(`shared/formas.mjs`), nível 70 PROVISÓRIO, dano = SSJ2 × 1,5. O SSJ3 não tem os raios do SSJ2 (decisão do
Pedro, 12/11/2026): eles são a marca do SSJ2 (`FORMAS_COM_RAIOS`). Teste: `tests/goku-ssj3.test.mjs`.
Ryuken (Punho do Dragão) no lugar do Kamehameha enquanto em SSJ3: em espera (ramo `feature/ryuken`).

