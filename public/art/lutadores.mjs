// Mobs que andam, socam de perto e disparam ki de longe, com as 3 folhas desenhadas (andar, soco, ki), recortadas
// por fatiar_caminhada.py. Planeta Vegeta, Planícies Vermelhas (decisão do Pedro, 05/11/2026): Tsufurujin
// Guerreiro (o mais fraco), Tsufurujin General (o mediano) e Hatchiyack (o mais forte, maior). Cânions (05/11):
// Nappa (o mais fraco, o mais corpulento), Raditz (o mediano) e Bardock (o mais forte). Campos de Lava (05/11):
// Oozaru e Oozaru Guerreiro (gigantes), e o chefe raro Oozaru Super (o maior; a folha de ki é o rugido com rajada pela boca).
// O quadro de impacto (coluna 3) cai no instante do dano, como no Veterano.
import { FOLHAS_NAMEK_NORTE } from './namek-norte.mjs';
import { art } from './assets.mjs';
import { drawWalk, drawSheet, GOLPE } from './atlas.mjs';
import { strikeColumn } from '../render/camera.mjs';

// Altura na tela (Goku = 70). Provisório: o Hatchiyack é maior, o General um pouco maior que o Guerreiro.
// Revisão do Pedro, 10/11/2026: Nail, Piccolo e Neva têm 1,5× a altura do Goku (70); antes, 2×.
const ALTURA_NAMEK_NORTE = 70 * 1.5;
// Pedro, 10/11/2026 (2º ajuste): Nail e Piccolo com 1,25× o Goku; o Neva, chefe, continua com 1,5×.
const ALTURA_NAMEK_NORTE_COMUM = 70 * 1.25;
// `passo` = distância percorrida por ciclo de 4 quadros, medida no próprio desenho (10/11/2026): com a regra geral
// (96 × altura/70) os pés não acompanhavam o chão. Goku usa 1,25× o passo desenhado (77 → 96); aqui vale o mesmo
// fator, medido nas folhas de andar refeitas pelo Pedro com 1,5× o Goku: Nail 142 → 178 (passada larga), Piccolo
// 96 → 120, Neva 63 → 80 (passinho de ancião com cajado). O passo cresce com a altura: em 1,25× vale 5/6 disso.
// Folha nova = medir de novo.
export const LUTADORES = { nail: { altura:ALTURA_NAMEK_NORTE_COMUM, passo: 148 }, piccoloDaimaoh: { altura:ALTURA_NAMEK_NORTE_COMUM, passo: 100 }, neva: { altura:ALTURA_NAMEK_NORTE, passo: 80 }, tsufuruGuerreiro: { altura: 70 }, tsufuruGeneral: { altura: 76 }, hatchiyack: { altura: 92 },
  nappa: { altura: 84 }, raditz: { altura: 80 }, bardock: { altura: 76 },
  oozaru: { altura: 120 }, oozaruGuerreiro: { altura: 128 }, oozaruSuper: { altura: 175 },
  // Grande Cratera (06/11): Rei Vegeta (o mais fraco) e Broly (o mais forte, o maior dos humanoides).
  reiVegeta: { altura: 98 }, broly: { altura: 130 },
  // Oozaru Dourado (sem armadura): chefe raro dos Campos de Lava; o Oozaru Super (de armadura) fica guardado para outro planeta.
  oozaruDourado: { altura: 175 },
  // Cânions (06/11): Dodoria (baixo e largo) e Zarbon (alto).
  dodoria: { altura: 78 }, zarbon: { altura: 84 } };   // Pedro, 06/11: Rei +20%, Broly +35%
export function drawLutador(ctx, tipo, x, y, moving, facing, phase, attackProgress = null, travelled = 0, tiro = false, tempo = 0) {
  const pos = { x, y, travelled }, altura = LUTADORES[tipo].altura;
  const [sheet, key] = GOLPE[tipo + (tiro ? 'Ki' : '')];
  // Oozaru Dourado: a folha do ataque de longe foi feita para um raio; com a bola (Pedro, 06/11) o quadro do disparo
  // (que tem um pedaço de raio na boca) é trocado pelo da boca aberta com a energia.
  let coluna = attackProgress !== null ? strikeColumn(attackProgress) : 0;
  if (tipo === 'oozaruDourado' && tiro && coluna === 2) coluna = 1;
  const alturaAtaque = FOLHAS_NAMEK_NORTE[tipo] ? altura * sheet.referenceHeight / FOLHAS_NAMEK_NORTE[tipo].andar[0].referenceHeight : altura;
  if (attackProgress !== null && drawSheet(ctx, sheet, art[key], pos, alturaAtaque, facing, coluna)) return true;
  // Parado com folha própria: respiração em loop pelo tempo (~3 quadros/s, como o Goku), com a fase do mob
  // para o grupo não respirar junto. Mesma escala da caminhada, para o corpo não mudar de tamanho ao parar.
  const parado = !moving && FOLHAS_NAMEK_NORTE[tipo]?.parado;
  if (parado) {
    const [folha, chave] = parado, alturaParado = altura * folha.referenceHeight / FOLHAS_NAMEK_NORTE[tipo].andar[0].referenceHeight;
    if (drawSheet(ctx, folha, art[chave], pos, alturaParado, facing, Math.floor(tempo * 3 + phase * 4) % 4)) return true;
  }
  // Passo proporcional ao tamanho: o gigante anda mais por ciclo, senão os pés "patinam" (Goku: 70 de altura, 96 por ciclo).
  return drawWalk(ctx, tipo, pos, altura, facing, moving, LUTADORES[tipo].passo ?? 96 * Math.max(1, altura / 70), phase);
}
