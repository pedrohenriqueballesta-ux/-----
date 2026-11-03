// Dados do mundo e números de balanceamento do protótipo. Todos ajustáveis.
import { PEGADAS } from './pegadas-casas.mjs';
import { DECORACAO_NAMEK } from './decoracao-namek.mjs';
import { OBJETOS_DECORACAO } from './decoracao-objetos.mjs';

// Escala do mundo de Namekusei: quantas unidades do jogo vale 1 px da imagem do solo
// (as posições são medidas no solo de 4608x3072; o assets/namek/solo.webp hoje tem 8192x5461, o mapa de
// 36 partes, e é esticado para o mesmo mundo). Ela amplia o terreno e tudo que está posto nele:
// regiões, casas, mercador, chegada, pontos de nascimento dos mobs e a máscara de passagem.
// NÃO amplia personagens, velocidades, alcances, tempos nem distâncias de interação.
// As posições abaixo continuam em px da imagem (as mesmas das ferramentas) e passam por `naEscala`.
export const ESCALA_MUNDO = 1.8;
// Tamanho das casas e ruínas em relação ao desenho original (px da imagem). Fica separado da
// escala do mundo: a proporção casa × personagem foi aprovada com 2 e não muda quando o mapa
// encurta ou alonga. Mudou um dos dois? Gere o solo de novo (assentar_casas.py) com a largura
// das casas em px da imagem = w × ESCALA_CONSTRUCOES ÷ ESCALA_MUNDO, para o terreiro acompanhar.
export const ESCALA_CONSTRUCOES = 2;
export const SOLO_NAMEK = Object.freeze({ w: 4608, h: 3072 });
export const naEscala = v => v * ESCALA_MUNDO;

export const CONFIG = Object.freeze({
  // Tamanho de Namekusei em unidades do jogo (imagem do solo × ESCALA_MUNDO).
  width: naEscala(SOLO_NAMEK.w), height: naEscala(SOLO_NAMEK.h), foodDuration: 300, foodHealPerSecond: 2,
  seedCooldown: 20, kiCooldown: 8, pickupRadius: 60, respawnDelay: 4,
  // Segundos protegido ao chegar por portal ou renascer ("seguro por uns segundos"; valor provisório).
  chegadaSegura: 3,
  seedPotencies: [15, 30, 50, 100],
  itemWeights: { food: 0.35, ki: 0.2, seed15: 0.08, seed30: 0.08, seed50: 0.08, seed100: 0.08, scrap: 0.7, crystal: 0.45 },
  prices: { food: 12, ki: 18, seed15: 90, seed30: 210, seed50: 480, seed100: 1400 },
  skillCosts: { kame: 25, kaioken: 12, barrier: 30, transform: 60, genki: 60 },
  skillCooldowns: { kame: 5, kaioken: 12, barrier: 8, transform: 30, genki: 45 },
  skills: { ki: 2, dash: 2, kame: 3, kaioken: 2, barrier: 2, transform: 5, genki: 10 }
});
// Áreas fechadas de Namekusei (modelo do Pedro, 03/11/2026). Cada área é um lugar à parte: não se anda
// de uma para outra, troca-se pelos portais (PORTAIS). A caixa (x, y, w, h, em px da imagem) limita onde
// se anda; dentro dela vale a máscara de passagem. `chegada` é onde o jogador aparece ao entrar e, nas
// hunts, também onde fica a saída. `nivel` é só recomendação: entra quem quiser, mas é perigoso.
// O que fica fora das caixas (ilha norte, ilha noroeste, ilhotas) está guardado para uma 4ª área.
// Os ids são usados pelas regras e pelo save: mude nome, caixa e chegada à vontade, mas não os ids.
export const ZONES = [
  { id: 'vila', name: 'Vila Namekiana', segura: true, x: 0, y: 850, w: 1000, h: 900, chegada: { x: 480, y: 1410 } },
  { id: 'inicial', name: 'Planícies de Namekusei', nivel: [1, 10], x: 1150, y: 640, w: 2230, h: 1160, chegada: { x: 1400, y: 1150 } },
  { id: 'media', name: 'Campo de Batalha', nivel: [10, 20], x: 1150, y: 1800, w: 3150, h: 1272, chegada: { x: 1450, y: 2330 } },
  { id: 'dificil', name: 'Planalto do Porunga', nivel: [20, 30], x: 3380, y: 500, w: 1228, h: 1300, chegada: { x: 3500, y: 1200 } }
].map(z => ({ pvp: false, segura: false, ...z, x: naEscala(z.x), y: naEscala(z.y), w: naEscala(z.w), h: naEscala(z.h),
  chegada: { x: naEscala(z.chegada.x), y: naEscala(z.chegada.y) } }));
export const areaPorId = id => ZONES.find(z => z.id === id) || null;
// Mercador na beira da praça da Vila Namekiana (px da imagem). A barraca e o vendedor
// mantêm o tamanho; só a posição acompanha o mapa.
export const MERCHANT = { x: naEscala(560), y: naEscala(1290) };
// Árvores e pedras do mapa antigo saíram com o solo novo de Namekusei (28/10).
// Os novos obstáculos entram nas próximas etapas, posicionados sobre a imagem do solo.
export const OBSTACLES = [];
export function zoneAt(x, y) {
  return ZONES.find(z => x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) || null;
}
// Quanto a casa afunda no chão ao ser desenhada, em fração da largura (drawHouse usa o mesmo).
export const ENTERRA_CASA = 0.035;
// Casas dos namekuseijins na Vila (sprites em assets/namek/casas/casa_N.png).
// Cada uma fica num terreiro de terra batida pintado no próprio solo.webp por
// ~/idle-dbz/ferramentas/assentar_casas.py: ao mudar posição ou tamanho aqui, gere o solo de novo.
// x, y = centro da base da casa no chão; w = largura desenhada (a altura segue a proporção do sprite).
// x, y em px da imagem (acompanham o mapa); w em px do desenho original, ampliado por
// ESCALA_CONSTRUCOES: com 2, o vão das portas fica entre 1,0 e 1,1 vez a altura do Goku (70).
// Casas da Vila FORA DO MAPA por enquanto (pedido do Pedro, 03/11: tirar, ajustar e recolocar). Posições
// guardadas aqui; para recolocar, junte CASAS_DA_VILA_GUARDADAS em HOUSES e gere o solo de novo.
export const CASAS_DA_VILA_GUARDADAS = [
  { sprite: 2, x: 525, y: 1615, w: 190 },
  { sprite: 4, x: 285, y: 1405, w: 150 },
  { sprite: 5, x: 765, y: 1330, w: 240 },
  { sprite: 6, x: 525, y: 1075, w: 290 }
];
export const HOUSES = [
  // Casas destruídas na luta contra o Freeza, no Campo de Batalha (assets/namek/ruinas/ruina_N.png).
  { sprite: 1, x: 1760, y: 2470, w: 150, ruina: true },
  { sprite: 3, x: 2260, y: 2410, w: 300, ruina: true },
  { sprite: 5, x: 2660, y: 2230, w: 240, ruina: true },
  { sprite: 6, x: 2980, y: 2510, w: 290, ruina: true },
  { sprite: 4, x: 3400, y: 2650, w: 150, ruina: true },
  { sprite: 2, x: 3700, y: 2370, w: 190, ruina: true }
].map(c => comPegada({ ...c, x: naEscala(c.x), y: naEscala(c.y), w: c.w * ESCALA_CONSTRUCOES }));
// Pegada no chão: a base vista de cima é uma elipse, e a curva de baixo do desenho (PEGADAS,
// tirada do PNG) é a metade da frente dela. Fica em coordenadas do mundo junto de cada casa.
function comPegada(c) {
  const p = PEGADAS[c.ruina ? 'ruina' : 'casa'][c.sprite];
  const topo = Math.round(c.y - c.w * p.alto + Math.round(c.w * ENTERRA_CASA)), esq = c.x - c.w / 2;
  return { ...c, pegada: { esq: esq + p.x0 * c.w, dir: esq + p.x1 * c.w, centro: topo + p.centro * c.w, frente: p.frente.map(f => topo + f * c.w) } };
}
// Onde fica a frente da base da casa na coluna x (null fora dela).
export function frenteDaCasa(c, x) {
  const { esq, dir, frente } = c.pegada;
  if (x <= esq || x >= dir) return null;
  const t = (x - esq) / (dir - esq) * (frente.length - 1), i = Math.floor(t), j = Math.min(i + 1, frente.length - 1);
  return frente[i] + (frente[j] - frente[i]) * (t - i);
}
// A casa ocupa o chão de trás da elipse (2 × centro − frente) até a frente.
export function casaBloqueia(x, y) {
  return HOUSES.some(c => { const f = frenteDaCasa(c, x); return f !== null && y < f && y > 2 * c.pegada.centro - f; });
}
// Planetas (instâncias). 'terra' é o lobby verde pequeno e seguro (tela inicial);
// 'namek' é o mapa das áreas fechadas acima. Só se troca de lugar por portal.
export const PLANETS = {
  terra: { id: 'terra', name: 'Terra', w: 1100, h: 760, spawn: { x: 550, y: 380 } },
  namek: { id: 'namek', name: 'Namekusei', w: CONFIG.width, h: CONFIG.height, spawn: areaPorId('vila').chegada } // praça da Vila Namekiana
};
// Lugar de destino de um portal: a Terra ou uma das áreas de Namekusei.
export function lugar(id) {
  if (id === 'terra') return { id, planet: 'terra', area: null, name: 'Terra', chegada: PLANETS.terra.spawn, segura: true };
  const z = areaPorId(id);
  return z && { id, planet: 'namek', area: z.id, name: z.name, chegada: z.chegada, segura: z.segura, nivel: z.nivel };
}
// Portais (o desenho ainda vai ser escolhido). Encostar abre a janela com os destinos.
// Terra: um portal para Namekusei. Vila: um portal por hunt, em três entradas, e a volta para a Terra
// logo acima do ponto de chegada. Hunts: um só portal, logo acima do ponto de chegada (é a saída),
// com a Vila e as outras duas hunts; para ir à Terra passa-se pela Vila (decisão do Pedro).
export const RAIO_PORTAL = 55;
const acimaDaChegada = id => ({ x: areaPorId(id).chegada.x, y: areaPorId(id).chegada.y - 110 });
const HUNTS = ['inicial', 'media', 'dificil'];
export const PORTAIS = [
  { id: 'terra-namek', planet: 'terra', area: null, x: 550, y: 210, destinos: ['vila'] },
  { id: 'vila-terra', planet: 'namek', area: 'vila', ...acimaDaChegada('vila'), destinos: ['terra'] },
  { id: 'vila-inicial', planet: 'namek', area: 'vila', x: naEscala(900), y: naEscala(1250), destinos: ['inicial'] },
  { id: 'vila-media', planet: 'namek', area: 'vila', x: naEscala(620), y: naEscala(1700), destinos: ['media'] },
  { id: 'vila-dificil', planet: 'namek', area: 'vila', x: naEscala(480), y: naEscala(900), destinos: ['dificil'] },
  ...HUNTS.map(id => ({ id: 'saida-' + id, planet: 'namek', area: id, ...acimaDaChegada(id), destinos: ['vila', ...HUNTS.filter(h => h !== id)] }))
];

// Decoração de Namekusei (árvores, arbustos e pedras; decisão do Pedro, 03/11/2026). Posições geradas por
// ~/idle-dbz/ferramentas/gerar_decoracao.mjs. Só TRONCOS e PEDRAS GRANDES bloqueiam, com uma área pequena
// na base; copas, arbustos e pedra pequena são enfeite (o personagem passa na frente ou atrás).
export const DECORACAO_ESCALA = 0.45;   // unidades do mundo por px do recorte (árvore mais alta ≈ 3× o Goku)
const PEDRA_GRANDE = new Set([15, 16]);
export const DECORACAO = DECORACAO_NAMEK.map(d => {
  const [, , w] = OBJETOS_DECORACAO[d.sprite], largura = w * DECORACAO_ESCALA * d.escala;
  const raio = d.sprite < 12 ? 10 : PEDRA_GRANDE.has(d.sprite) ? largura * 0.32 : 0;
  return { ...d, raio };
});
// Bloqueios num hash espacial (célula de 256): a conferência é chamada várias vezes por passo de cada ator.
const CELULA_DECO = 256, BLOQUEIOS_DECO = new Map();
for (const d of DECORACAO) if (d.raio) {
  const chave = Math.floor(d.x / CELULA_DECO) + ':' + Math.floor(d.y / CELULA_DECO);
  if (!BLOQUEIOS_DECO.has(chave)) BLOQUEIOS_DECO.set(chave, []);
  BLOQUEIOS_DECO.get(chave).push(d);
}
// A base é uma elipse achatada (vista de cima): mais larga que funda.
export function decoracaoBloqueia(x, y) {
  const cx = Math.floor(x / CELULA_DECO), cy = Math.floor(y / CELULA_DECO);
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) for (const d of BLOQUEIOS_DECO.get((cx + dx) + ':' + (cy + dy)) || [])
    if (((x - d.x) / d.raio) ** 2 + ((y - d.y) / (d.raio * 0.55)) ** 2 < 1) return true;
  return false;
}
