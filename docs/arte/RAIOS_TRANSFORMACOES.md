# Raios de transformação do Vegeta

O cliente lê a vocação e a forma ativa do snapshot e consulta `RAIOS_POR_FORMA`. O efeito usa a posição renderizada dos pés e é desenhado atrás do personagem, inclusive em movimento e durante ataques. A âncora horizontal de cada quadro alinha o centro da área visível dos raios aos pés. Cada ciclo exibe até uma célula do atlas. A escolha dos 36 quadros alterna a paridade a cada ciclo, com variações por jogador na cadência, na opacidade e nas pausas.

`aura_raios_universal_36f_rgba.png` é o PNG RGBA fornecido no pacote `aura_raios_universal_36f_pacote.zip`. A grade tem 6 × 6 células de 211 × 206 px. O cliente deriva uma textura por paleta quando ela é usada pela primeira vez. A recoloração mantém o fundo transparente e clareia o núcleo das descargas. O desenho reutiliza a textura e não mantém histórico por personagem.

| Forma | Cor principal | Brilho | Referência | Intensidade | Opacidade máxima | Escala | Intervalo | Ciclos de pausa |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| SSJ1 | `#F1A211` | `#D27E02` | Dourados do cabelo em `vegeta/ssj1/01_PARADO.png` | 0,64 | 0,96 | 1,17 | 110–160 ms | 24% |
| God | `#FC3279` | `#F2184D` | Paleta de raios definida com a folha anterior do God | 0,74 | 1,00 | 1,14 | 101–155 ms | 19% |
| Blue | `#4FE5FE` | `#02FDFE` | Azul e ciano da energia no ícone `vegeta_ssj_blue.png` | 0,96 | 1,00 | 1,17 | 81–131 ms | 11% |
| Ultra Ego | `#C184E7` | `#8B68A4` | Violeta e realces de energia no ícone `vegeta_ultra_ego.png` | 1,00 | 1,00 | 1,17 | 70–128 ms | 8% |

O alfa dos traços é multiplicado por 3 no SSJ1 e por 3,5 no God, no Blue e no Ultra Ego, até o limite de 255. Cada descarga visível usa entre 82% e 96% de opacidade no SSJ1 e entre 92% e 100% nas demais formas desta configuração.

Em jogo, as formas com os raios são SSJ1 no nível 100, God no 500, Blue no 700 e Ultra Ego no 900. Selecione cada forma na aba Técnicas e repita a seleção para voltar à base. Majin e SSJ4 ficam fora da configuração. O efeito legado do SSJ2 continua no renderer próprio.
