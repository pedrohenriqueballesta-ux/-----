# Geometria preliminar das folhas do Galick Gun

Esta auditoria mede os PNGs atualmente no projeto sem alterar a arte ou o renderer. Todos os pontos abaixo estão em **pixels locais do frame**, com origem no canto superior esquerdo. Os limites são inclusivos. Transparência: alfa > 16; núcleo claro: R, G e B > 205 com alfa > 128. Essas regras detectam pixels, não comprovam âncoras anatômicas nem continuidade de animação.

`bbox` = energia visível; `núcleo X` = extensão dos pixels claros; `Y claro` = centro vertical médio desses pixels; `esp.` = espessura clara na coluna central; `ΔY/Δlarg. próximo` = mudança do centro claro e da largura da energia até o frame seguinte; é um indicador geométrico, não prova suavidade de movimento. `borda fonte` = pixels que tocavam as bordas no arquivo de origem segundo o `config.json` do pacote. A folha importada tem margem artificial: sua borda atual mede zero, o que **não prova** recuperação da arte original.

## Conclusões por arquivo

| Arquivo | Célula | Frames de origem com contato na borda | Uso seguro hoje |
|---|---:|---:|---|
| `v1.png` | 457 × 234 | 10/16 | Somente prévia/efeito fechado; sem corpo repetível validado |
| `v2.png` | 457 × 234 | 10/16 | Somente prévia/efeito fechado; sem corpo repetível validado |
| `v3.png` | 430 × 248 | 13/16 | Somente prévia/efeito fechado; sem corpo repetível validado |
| `v4.png` | 457 × 234 | 15/16 | Somente prévia/efeito fechado; sem corpo repetível validado |
| `v5.png` | 457 × 234 | 16/16 | Somente prévia/efeito fechado; sem corpo repetível validado |
| `impacto.png` | 326 × 326 | 0/16 | Explosão independente; validar centro visual e temporização |

## Medições por frame

Frames 0–3: concentração; a posição das mãos **não pode** ser deduzida desta folha de efeito. Frames 4–11: crescimento/feixe; 12–15: dissipação. `núcleo X` é um limite pixelar, não um ponto de encaixe. Um corpo horizontal repetível **não foi identificado nem certificado** em nenhuma das cinco folhas; o renderer atual usa recortes percentuais ou uma coluna de 2 px que não preservam o desenho.

### V1 — célula 457 × 234

| Frame | Fase | bbox da energia X0,Y0–X1,Y1 | Núcleo X0–X1 | Y claro | esp. | ΔY/Δlarg. próximo | Borda fonte |
|---:|---|---|---:|---:|---:|---:|
| 00 | carga | 174,89–261,175 | 187–253 | 132 | 36 | +3/+93 | 0 |
| 01 | carga | 134,49–314,207 | 150–306 | 135 | 98 | -3/+82 | 0 |
| 02 | carga | 86,12–348,226 | 98–340 | 132 | 131 | +4/+90 | 26 |
| 03 | carga | 47,6–399,226 | 64–380 | 136 | 134 | +12/-32 | 172 |
| 04 | feixe | 35,41–355,226 | 59–324 | 148 | 39 | -1/+42 | 53 |
| 05 | feixe | 27,42–389,226 | 52–360 | 147 | 59 | -3/+42 | 11 |
| 06 | feixe | 17,6–421,226 | 40–408 | 144 | 41 | +0/+36 | 35 |
| 07 | feixe | 9,6–449,226 | 32–428 | 144 | 85 | -11/-8 | 187 |
| 08 | feixe | 17,6–449,221 | 39–438 | 133 | 69 | +1/+11 | 56 |
| 09 | feixe | 6,6–449,220 | 43–435 | 134 | 69 | -1/-10 | 11 |
| 10 | feixe | 6,6–439,219 | 46–422 | 133 | 60 | -1/-81 | 11 |
| 11 | feixe | 26,6–378,211 | 49–354 | 132 | 22 | -20/-37 | 18 |
| 12 | dissipação | 30,30–345,191 | 49–308 | 112 | 52 | +0/-67 | 0 |
| 13 | dissipação | 48,46–296,173 | 64–278 | 112 | 8 | +3/-18 | 0 |
| 14 | dissipação | 55,66–285,163 | 72–257 | 115 | 2 | -1/-91 | 0 |
| 15 | dissipação | 81,80–220,153 | 95–178 | 114 | 0 | — | 0 |

### V2 — célula 457 × 234

| Frame | Fase | bbox da energia X0,Y0–X1,Y1 | Núcleo X0–X1 | Y claro | esp. | ΔY/Δlarg. próximo | Borda fonte |
|---:|---|---|---:|---:|---:|---:|
| 00 | carga | 183,96–260,171 | 188–248 | 134 | 26 | +4/+89 | 0 |
| 01 | carga | 149,60–315,206 | 163–298 | 138 | 54 | +2/+84 | 0 |
| 02 | carga | 105,23–355,226 | 120–342 | 140 | 114 | -4/+76 | 35 |
| 03 | carga | 63,10–389,226 | 74–377 | 136 | 193 | +7/-8 | 129 |
| 04 | feixe | 44,31–362,226 | 67–313 | 143 | 46 | +0/+43 | 7 |
| 05 | feixe | 31,33–392,226 | 52–370 | 143 | 65 | -1/+36 | 4 |
| 06 | feixe | 16,6–413,226 | 36–402 | 142 | 88 | +0/+30 | 31 |
| 07 | feixe | 10,6–437,226 | 30–426 | 142 | 113 | -9/+11 | 131 |
| 08 | feixe | 11,6–449,225 | 28–436 | 133 | 100 | +0/+1 | 2 |
| 09 | feixe | 10,6–449,224 | 30–437 | 133 | 112 | +0/-11 | 3 |
| 10 | feixe | 10,6–438,217 | 31–426 | 133 | 61 | +0/-29 | 2 |
| 11 | feixe | 18,6–417,211 | 35–396 | 133 | 59 | -12/-57 | 7 |
| 12 | dissipação | 14,35–356,196 | 28–324 | 121 | 50 | +2/-55 | 0 |
| 13 | dissipação | 13,56–300,183 | 30–248 | 123 | 34 | +1/-44 | 0 |
| 14 | dissipação | 29,78–272,164 | 41–196 | 124 | 37 | -1/-85 | 0 |
| 15 | dissipação | 67,93–225,151 | 77–184 | 123 | 0 | — | 0 |

### V3 — célula 430 × 248

| Frame | Fase | bbox da energia X0,Y0–X1,Y1 | Núcleo X0–X1 | Y claro | esp. | ΔY/Δlarg. próximo | Borda fonte |
|---:|---|---|---:|---:|---:|---:|
| 00 | carga | 119,72–269,240 | 159–251 | 128 | 38 | +5/+57 | 23 |
| 01 | carga | 119,36–326,240 | 129–319 | 133 | 151 | +2/+96 | 1 |
| 02 | carga | 66,6–369,240 | 78–360 | 135 | 127 | -1/+79 | 68 |
| 03 | carga | 27,6–409,240 | 35–401 | 134 | 197 | -18/-2 | 234 |
| 04 | feixe | 20,6–400,240 | 29–335 | 116 | 61 | +0/+30 | 113 |
| 05 | feixe | 13,6–423,240 | 21–394 | 116 | 156 | +0/+7 | 88 |
| 06 | feixe | 6,6–423,240 | 19–401 | 116 | 72 | -1/+0 | 142 |
| 07 | feixe | 6,6–423,225 | 18–413 | 115 | 86 | +3/+0 | 240 |
| 08 | feixe | 6,6–423,232 | 24–415 | 118 | 117 | -1/+0 | 268 |
| 09 | feixe | 6,6–423,232 | 19–415 | 117 | 121 | +0/+0 | 294 |
| 10 | feixe | 6,6–423,227 | 17–413 | 117 | 85 | +1/+0 | 169 |
| 11 | feixe | 6,14–423,222 | 15–411 | 118 | 83 | -1/-14 | 78 |
| 12 | dissipação | 6,21–409,211 | 23–365 | 117 | 83 | +0/-66 | 23 |
| 13 | dissipação | 15,38–352,195 | 32–288 | 117 | 51 | +1/-64 | 0 |
| 14 | dissipação | 32,64–305,172 | 52–214 | 118 | 56 | +0/-79 | 0 |
| 15 | dissipação | 61,73–255,160 | 79–208 | 118 | 0 | — | 0 |

### V4 — célula 457 × 234

| Frame | Fase | bbox da energia X0,Y0–X1,Y1 | Núcleo X0–X1 | Y claro | esp. | ΔY/Δlarg. próximo | Borda fonte |
|---:|---|---|---:|---:|---:|---:|
| 00 | carga | 166,88–268,183 | 179–258 | 138 | 57 | +5/+120 | 0 |
| 01 | carga | 108,46–330,226 | 134–322 | 143 | 95 | -4/+80 | 17 |
| 02 | carga | 68,18–370,226 | 73–366 | 139 | 201 | -4/+96 | 176 |
| 03 | carga | 29,6–427,226 | 35–419 | 135 | 186 | +14/+27 | 330 |
| 04 | feixe | 24,27–449,226 | 48–397 | 149 | 125 | +1/+18 | 211 |
| 05 | feixe | 6,6–449,226 | 24–419 | 150 | 134 | -4/+1 | 263 |
| 06 | feixe | 6,6–450,226 | 22–426 | 146 | 195 | -5/-1 | 634 |
| 07 | feixe | 6,6–449,226 | 12–435 | 141 | 217 | -5/+0 | 747 |
| 08 | feixe | 6,6–449,227 | 19–449 | 136 | 105 | +0/+0 | 591 |
| 09 | feixe | 6,6–449,227 | 6–449 | 136 | 121 | -1/+1 | 661 |
| 10 | feixe | 6,6–450,227 | 17–446 | 135 | 108 | +0/-1 | 723 |
| 11 | feixe | 6,6–449,227 | 13–435 | 135 | 171 | -13/+0 | 575 |
| 12 | dissipação | 6,6–449,215 | 20–380 | 122 | 127 | -1/-1 | 295 |
| 13 | dissipação | 6,6–448,200 | 22–280 | 121 | 79 | +1/-136 | 280 |
| 14 | dissipação | 6,6–312,181 | 22–201 | 122 | 56 | +1/-106 | 245 |
| 15 | dissipação | 23,6–223,161 | 61–170 | 123 | 0 | — | 120 |

### V5 — célula 457 × 234

| Frame | Fase | bbox da energia X0,Y0–X1,Y1 | Núcleo X0–X1 | Y claro | esp. | ΔY/Δlarg. próximo | Borda fonte |
|---:|---|---|---:|---:|---:|---:|
| 00 | carga | 151,74–283,226 | 164–276 | 144 | 48 | +4/+149 | 7 |
| 01 | carga | 70,34–351,226 | 92–325 | 148 | 108 | -7/+135 | 195 |
| 02 | carga | 34,6–450,226 | 49–450 | 141 | 197 | -7/+27 | 428 |
| 03 | carga | 6,6–449,226 | 6–431 | 134 | 195 | +13/+0 | 720 |
| 04 | feixe | 6,6–449,226 | 43–427 | 147 | 170 | +0/+0 | 429 |
| 05 | feixe | 6,6–449,226 | 13–449 | 147 | 132 | -5/+1 | 878 |
| 06 | feixe | 6,6–450,226 | 6–450 | 142 | 138 | -6/-1 | 1036 |
| 07 | feixe | 6,6–449,226 | 6–443 | 136 | 185 | +0/+0 | 1094 |
| 08 | feixe | 6,6–449,227 | 14–448 | 136 | 133 | +0/+0 | 873 |
| 09 | feixe | 6,6–449,227 | 13–447 | 136 | 104 | -2/+1 | 1000 |
| 10 | feixe | 6,6–450,227 | 12–446 | 134 | 140 | -1/-1 | 1111 |
| 11 | feixe | 6,6–449,227 | 8–444 | 133 | 48 | -15/+0 | 1005 |
| 12 | dissipação | 6,6–449,226 | 16–401 | 118 | 67 | +1/+0 | 562 |
| 13 | dissipação | 6,6–449,218 | 19–380 | 119 | 121 | +1/-52 | 520 |
| 14 | dissipação | 6,6–397,204 | 16–387 | 120 | 82 | -1/-5 | 456 |
| 15 | dissipação | 11,6–397,179 | 50–349 | 119 | 1 | — | 326 |

### IMPACTO — célula 326 × 326

| Frame | Fase | bbox da energia X0,Y0–X1,Y1 | Núcleo X0–X1 | Y claro | esp. | ΔY/Δlarg. próximo | Borda fonte |
|---:|---|---|---:|---:|---:|---:|
| 00 | explosão | 128,122–206,207 | 139–202 | 168 | 31 | -2/+82 | 0 |
| 01 | explosão | 82,78–242,247 | 88–233 | 166 | 98 | +5/+43 | 0 |
| 02 | explosão | 60,76–263,248 | 71–250 | 171 | 106 | -2/+50 | 0 |
| 03 | explosão | 32,36–285,277 | 51–265 | 169 | 84 | +3/+11 | 0 |
| 04 | explosão | 30,25–294,279 | 57–283 | 172 | 118 | +2/+3 | 0 |
| 05 | explosão | 35,26–302,278 | 48–293 | 174 | 144 | -1/+17 | 0 |
| 06 | explosão | 19,41–303,277 | 32–292 | 173 | 141 | -15/+5 | 0 |
| 07 | explosão | 17,28–306,273 | 26–296 | 158 | 141 | +5/-8 | 0 |
| 08 | explosão | 21,29–302,286 | 30–292 | 163 | 173 | +8/+3 | 0 |
| 09 | explosão | 21,30–305,285 | 32–298 | 171 | 192 | -8/-5 | 0 |
| 10 | explosão | 22,27–301,280 | 28–286 | 163 | 107 | -38/-10 | 0 |
| 11 | explosão | 27,28–296,274 | 33–284 | 125 | 9 | +16/-6 | 0 |
| 12 | explosão | 29,49–292,284 | 41–274 | 141 | 0 | +17/-8 | 0 |
| 13 | explosão | 44,71–299,271 | 77–274 | 158 | 0 | -17/-37 | 0 |
| 14 | explosão | 58,82–276,271 | 73–249 | 141 | 0 | +55/-4 | 0 |
| 15 | explosão | 49,109–263,274 | 236–246 | 196 | 0 | — | 0 |

## Diagnóstico e decisão antes da implementação

- **Origem nas mãos:** deve vir da folha de pose de Vegeta, por direção e coluna. A esfera do efeito fica centrada em uma posição diferente a cada frame. Os limites acima não substituem essa âncora.
- **Ponta:** o maior X visível é um limite do efeito. A ponta efetiva do ataque exige medir a região terminal em cada frame e associá-la à colisão, não usar uma porcentagem fixa da célula.
- **Centro e espessura:** variam entre frames e versões. O renderer atual centraliza todas as células em `-altura/2`, ignorando essa variação.
- **Continuidade:** a sequência visual cresce nos frames 0–11 e dissipa nos 12–15, mas o pacote não contém um corpo modular separado. Não há prova de uma faixa central com chamas e descargas que possa ser repetida sem costura.
- **Bordas:** V4 e V5 têm contato na maior parte ou totalidade dos frames de origem. É necessário conferir/reexportar essas folhas com margem real da arte original, não apenas adicionar transparência ao redor do recorte.
- **Escala:** os cinco PNGs precisam de escala artística própria. O alcance e a colisão atuais devem permanecer inalterados.
- **Próximos arquivos de arte necessários para um feixe variável confiável:** para cada versão, origem conectável às mãos, corpo animado repetível ou em laço com início/fim compatíveis, extremidade separada e frames com margem integral. Uma reexportação dos frames completos é prioritária em V4/V5 e deve ser verificada também em V1–V3. `impacto.png` pode continuar como sequência separada após validar seu centro.
- **Código a alterar após aprovação da estratégia/arte:** `public/render/vfx/galick-gun.mjs` (geometria e composição), `public/client/game.mjs` (uma origem/direção consistente e ciclo visual), `public/art/personagens/vegeta/vegeta.mjs`/`vegeta-folhas.mjs` (sincronização da pose, inclusive SSJ1), e um módulo novo de dados por frame para Galick Gun. Não alterar dano, alcance, custo, cooldown ou progressão no servidor.

## Limite desta auditoria

As medidas de alfa e cor são reproduzíveis. Não foi feita aprovação perceptual quadro a quadro em movimento; este documento não afirma que qualquer uma das cinco folhas é adequada para composição modular. A validação visual deve ocorrer antes de trocar o renderer do jogo.
