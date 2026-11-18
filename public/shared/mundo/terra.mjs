// Terra = Cidade do Oeste, cidade do rio (planta D2 aprovada pelo Pedro em 16/11/2026): cidade de ruas e quarteirões,
// 6×6 telas, com um rio que corta a cidade (3 pontes), parque com lago e a Corporação Cápsula a oeste.
// Chão: 36 partes emendadas (17/11/2026; ferramentas/gerar_chao_terra.py gera a planta texturizada). Prédios, muros,
// nave do Goku e decorações: shared/terra-cidade.mjs. Coordenadas em unidades do mundo (8400×5600).
import { OBJETOS_TERRA, NAVE_GOKU, INTERACOES, LOTES_INTERACAO, LAGO, dentroDoRio, objetoBloqueia } from './terra-cidade.mjs';
export { LOTES_INTERACAO, NAVE_GOKU, INTERACOES } from './terra-cidade.mjs';
export const TAMANHO_TERRA = Object.freeze({ w: 8400, h: 5600 });
export const CHAO_TERRA = Object.freeze({ url: '/assets/terra/chao.webp', w: 8192, h: 5461 });

// Chegada no largo da avenida central. O teleporte da Terra é a NAVE DO GOKU (Pedro, 17/11/2026): a nuvem saiu; o
// jogador vai até a porta da nave, na pista ao lado da Corporação Cápsula, e escolhe o planeta.
export const PRACA_TERRA = Object.freeze({ chegada: { x: 4400, y: 2300 }, portal: NAVE_GOKU.porta });

// Onde se anda: dentro da floresta da borda, fora da água (rio e lago), com as 3 pontes e o píer atravessando.
const CIDADE = { x0: 300, y0: 300, x1: 8100, y1: 5300 };
const PONTES = [1500, 3800, 6200].map(x => ({ x0: x - 120, x1: x + 120 }));     // pista de 220 + parapeito
const PIER = { x0: 4070, y0: 3800, x1: 4250, y1: 4060 };
const naCaixa = (c, x, y) => x >= c.x0 && x <= c.x1 && y >= c.y0 && y <= c.y1;
export const naAguaDaTerra = (x, y) => (dentroDoRio(x, y) && !PONTES.some(p => x >= p.x0 && x <= p.x1) && !naCaixa(PIER, x, y))
  || ((x - LAGO.cx) / LAGO.rx) ** 2 + ((y - LAGO.cy) / LAGO.ry) ** 2 < 1;
// Só o terreno (dentro da cidade e fora da água), sem contar prédios.
export const dentroDaCidade = (x, y) => naCaixa(CIDADE, x, y) && !naAguaDaTerra(x, y);

// Tudo o que é desenhado na Terra (prédios, muros, nave, decoração); quem tem `porta` mostra o nome ao chegar perto.
export const PREDIOS_TERRA = OBJETOS_TERRA;
export const RAIO_PORTA = 30;
// Os prédios de interação com loja contam como mercador (comprar e vender pedem estar perto de um).
export const MERCADORES_TERRA = Object.freeze(INTERACOES.filter(i => i.loja).map(i => Object.freeze({ planet: 'terra', area: null, ...i.porta, predio: true })));
// Prédio de interação perto do jogador (raio do botão de interação).
// Vale a calçada inteira na frente do prédio (largura dele e até 150 abaixo da fachada), não só um ponto.
export const interacaoPerto = (x, y) => INTERACOES.find(i => Math.abs(x - i.x) <= i.w / 2 + 10 && y >= i.y - 10 && y <= i.y + 150) || null;
export const predioNaPorta = (x, y) => PREDIOS_TERRA.find(p => p.porta && p.menu && Math.hypot(p.porta.x - x, p.porta.y - y) <= RAIO_PORTA) || null;
export const andavelNaTerra = (x, y) => dentroDaCidade(x, y) && !objetoBloqueia(x, y);

// Grade da busca de caminho (passagem.mjs): células de 20 unidades (a busca junta 4×4 = 80, ≈ 1 Goku de largura).
export const GRADE_TERRA = Object.freeze({ cols: TAMANHO_TERRA.w / 20, rows: TAMANHO_TERRA.h / 20, cellW: 20, cellH: 20 });
