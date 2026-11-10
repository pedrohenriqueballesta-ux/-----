# Ferramentas

Scripts de apoio usados para preparar arte e mapas. **O jogo não usa esta pasta** (ele roda só com `public/` e
`server.mjs`, sem dependências). Os scripts Python precisam de `Pillow`, `numpy` e `scipy`
(`pip3 install --user pillow numpy scipy`). As imagens de entrada (folhas do ChatGPT, partes do mapa) ficam fora do
repositório; o processo completo está em `docs/COMO_TRABALHAMOS.md`.

## Folhas de personagens e mobs
| Script | Para quê |
|---|---|
| `fatiar_caminhada.py` | Recorta uma folha 5×4 (fundo magenta ou verde) em atlas transparente + JSON dos quadros. Modos `halo` (padrão) e `conectado` (personagem roxo); 7º argumento `verde` para fundo verde. |
| `gerar_modulo.py` | Gera o módulo `public/art/<nome>.mjs` a partir do JSON do recorte. |
| `recortar_folha_8dir.py` | Recorta folhas antigas de 8 direções. |
| `recortar_mochila.py` | Recorta silhueta e ícones da janela da Mochila. |

## Mapas
| Script | Para quê |
|---|---|
| `partes_mapa.py` | Corta o mapa aprovado em N×N moldes com sobra (o que se anexa no ChatGPT). |
| `conferir_parte.py` | Confere uma parte refeita contra o molde (Namek: terra × mar). |
| `conferir_abismo.py` | Confere as partes do Vegeta contra os moldes (chão × abismo). |
| `igualar_mar.py` | Iguala o tom da água entre partes. |
| `montar_mapa.py` | Monta o mapa final emendando as partes pela linha de menor diferença (costura). |
| `cortar_blocos.py` | Corta o solo em blocos (teste; não usado hoje). |

## Passagem e cenário
| Script | Para quê |
|---|---|
| `gerar_mascara.py` / `converter_mascara.py` | Máscara de passagem de Namekusei e conversão para `public/shared/namek-passagem.mjs`. |
| `gerar_mascara_vegeta.py` / `gerar_modulo_vegeta.py` | Máscara do Planeta Vegeta (abismo, paredão, bloqueios à mão, vulcões) e o módulo `public/shared/vegeta-passagem.mjs` com a área de cada ilha. |
| `gerar_pegadas.py` | Pegada das casas (curva da base) a partir dos PNGs. |
| `assentar_casas.py` | Pinta o terreiro das casas no solo. |
| `gerar_decoracao.mjs` | Posiciona as árvores de Namekusei. |
| `recortar_objetos.py` | Recorta árvores/pedras da folha de decoração de Namek. |
| `recortar_arvore_vegeta.py` / `recortar_vulcoes.py` | Recortam árvores, cristais e vulcões do próprio solo do Vegeta para redesenhar com profundidade. |

## Outros
| Script | Para quê |
|---|---|
| `navegador_cdp.mjs` | Abre o jogo num Chrome sem janela, executa passos em JavaScript e tira prints: `node ferramentas/navegador_cdp.mjs <url> <prefixo> <passos.json>`. |
| `travas-git/instalar.sh` | Instala as travas que bloqueiam commit e envio para a `main` neste clone. |

### Recorte dos mobs da Cratera de Nail

As nove folhas usam `conectado magenta 210 150` após os argumentos de linhas e
colunas: tolerância do fundo conectado e dos buracos internos, respectivamente.
Isso remove contaminação do fundo entre braço/corpo sem apagar capas e faixas.
Os padrões antigos (110/45) continuam iguais quando os argumentos são omitidos.
O recorte só altera transparência/posição, sem recolorir os pixels preservados.

`node ferramentas/simular_namek_norte.mjs` mede duelos 30/35/40 e caça de cinco
minutos no nível 30, comparando com Planícies Vermelhas. Não acessa o save.
