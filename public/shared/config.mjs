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
// Planeta Vegeta (2º planeta de hunt, decidido pelo Pedro em 04/11/2026): mesmo sistema de Namekusei. Posições
// em px da imagem de 4608×3072 (o solo.webp tem 8192×5461, o mapa de 36 partes), mesma escala do mundo.
export const SOLO_VEGETA = Object.freeze({ w: 4608, h: 3072 });
export const ESCALA_VEGETA = ESCALA_MUNDO;
export const naEscala = v => v * ESCALA_MUNDO;

export const CONFIG = Object.freeze({
  // Tamanho de Namekusei em unidades do jogo (imagem do solo × ESCALA_MUNDO).
  width: naEscala(SOLO_NAMEK.w), height: naEscala(SOLO_NAMEK.h), foodDuration: 300, foodHealPerSecond: 2,
  // Espaços da mochila (Pedro, 04/11: 30 no início, ajustável depois). Cada tipo de item ocupa um espaço.
  mochilaSlots: 30,
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
// Os ids valem para o jogo inteiro (todos os planetas): um planeta novo usa ids próprios (ex.: 'vegeta-…').
// `cor`: a do portal, do minimapa e do menu Mapa (verde, laranja e vermelho para as hunts; azul para a Vila).
const zonasEmPx = (planet, escala, zonas) => zonas.map(z => ({ planet, pvp: false, segura: false, ...z,
  x: z.x * escala, y: z.y * escala, w: z.w * escala, h: z.h * escala, chegada: { x: z.chegada.x * escala, y: z.chegada.y * escala } }));
export const ZONES = [
  ...zonasEmPx('namek', ESCALA_MUNDO, [
    { id: 'vila', name: 'Vila Namekiana', segura: true, cor: '#5fb6ff', x: 0, y: 850, w: 1000, h: 900, chegada: { x: 480, y: 1410 } },
    { id: 'inicial', name: 'Planícies de Namekusei', nivel: [1, 10], cor: '#46e646', x: 1150, y: 640, w: 2230, h: 1160, chegada: { x: 1400, y: 1150 } },
    { id: 'media', name: 'Campo de Batalha', nivel: [10, 20], cor: '#ffa51e', x: 1150, y: 1800, w: 3150, h: 1272, chegada: { x: 1450, y: 2330 } },
    { id: 'dificil', name: 'Planalto do Porunga', nivel: [20, 30], cor: '#eb2d2d', x: 3380, y: 500, w: 1228, h: 1300, chegada: { x: 3500, y: 1200 } }
  ]),
  // Planeta Vegeta: cidade no centro e 5 hunts, cada uma numa ilha cercada de abismo, com uma estrada até a
  // cidade (nomes e temas propostos, a confirmar pelo Pedro). Caixas = contorno de cada ilha na máscara
  // (vegeta-passagem.mjs, que também diz a que área cada pedaço de chão pertence); chegada onde a estrada
  // entra. Níveis 30–60 em degraus de 6 (decisão do Pedro, 04/11).
  ...zonasEmPx('vegeta', ESCALA_VEGETA, [
    { id: 'vegeta-cidade', name: 'Cidade dos Saiyajins', segura: true, cor: '#5fb6ff', x: 1800, y: 936, w: 1026, h: 756, chegada: { x: 2301, y: 1323 } },
    { id: 'vegeta-planicies', name: 'Planícies Vermelhas', nivel: [30, 36], cor: '#46e646', x: 54, y: 780, w: 1590, h: 1584, chegada: { x: 1340, y: 1340 } },
    { id: 'vegeta-canions', name: 'Cânions', nivel: [36, 42], cor: '#d6e632', x: 636, y: 12, w: 1674, h: 1026, chegada: { x: 1715, y: 755 } },
    { id: 'vegeta-floresta', name: 'Floresta Seca', nivel: [42, 48], cor: '#ffa51e', x: 2436, y: 30, w: 2118, h: 1176, chegada: { x: 2935, y: 800 } },
    { id: 'vegeta-lava', name: 'Campos de Lava', nivel: [48, 54], cor: '#eb2d2d', x: 2772, y: 1116, w: 1788, h: 1380, chegada: { x: 3040, y: 1540 } },
    { id: 'vegeta-cratera', name: 'Grande Cratera', nivel: [54, 60], cor: '#b44dff', x: 1278, y: 2070, w: 1644, h: 798, chegada: { x: 2205, y: 2260 } }
  ])
];
export const areaPorId = id => ZONES.find(z => z.id === id) || null;
export const zonasDe = planet => ZONES.filter(z => z.planet === planet);
// Mercador na beira da praça da Vila Namekiana (px da imagem). A barraca e o vendedor
// mantêm o tamanho; só a posição acompanha o mapa.
export const MERCHANT = { planet: 'namek', area: 'vila', x: naEscala(560), y: naEscala(1290) };
// Mercadores de todos os planetas (um por Vila). Comprar e vender pede estar no mesmo lugar e perto.
export const MERCADORES = [MERCHANT, { planet: 'vegeta', area: 'vegeta-cidade', x: 2420 * ESCALA_VEGETA, y: 1220 * ESCALA_VEGETA }];
export const mercadorPerto = (p, alcance = 180) => MERCADORES.find(m => m.planet === p.planet && m.area === (p.area || null)
  && Math.hypot(m.x - p.x, m.y - p.y) <= alcance) || null;
// Árvores e pedras do mapa antigo saíram com o solo novo de Namekusei (28/10).
// Os novos obstáculos entram nas próximas etapas, posicionados sobre a imagem do solo.
export const OBSTACLES = [];
export function zoneAt(x, y, planet = 'namek') {
  return ZONES.find(z => z.planet === planet && x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) || null;
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
].map(c => comPegada({ ...c, planet: 'namek', x: naEscala(c.x), y: naEscala(c.y), w: c.w * ESCALA_CONSTRUCOES }));
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
export function casaBloqueia(planet, x, y) {
  return HOUSES.some(c => { if (c.planet !== planet) return false; const f = frenteDaCasa(c, x); return f !== null && y < f && y > 2 * c.pegada.centro - f; });
}
// Planetas (instâncias). 'terra' é o lobby verde pequeno e seguro (tela inicial); os planetas de hunt
// (por ora só 'namek') têm as áreas fechadas acima. Só se troca de lugar por portal.
// Ficha de um planeta de hunt: tamanho em unidades do jogo, escala (unidades por px da imagem do solo),
// `solo` = chave da imagem do chão em art/assets.mjs, `fundo` = cor sob o solo enquanto ele carrega,
// `imagem` = a do cartão no portal, `vila` = id da área segura onde se chega, `hunts` = ids das hunts
// na ordem de dificuldade. Para um planeta novo: ficha aqui, áreas em ZONES, máscara em passagem.mjs,
// mobs em enemies.mjs e portais da Vila em PORTAIS.
export const PLANETS = {
  terra: { id: 'terra', name: 'Terra', w: 1100, h: 760, spawn: { x: 550, y: 380 }, imagem: '/assets/worlds/terra.webp' },
  namek: { id: 'namek', name: 'Namekusei', w: CONFIG.width, h: CONFIG.height, escala: ESCALA_MUNDO, solo: 'namekSolo',
    soloUrl: '/assets/namek/solo.webp', fundo: '#385a2d', imagem: '/assets/worlds/namek.webp',
    vila: 'vila', hunts: ['inicial', 'media', 'dificil'], spawn: areaPorId('vila').chegada }, // praça da Vila Namekiana
  vegeta: { id: 'vegeta', name: 'Planeta Vegeta', w: SOLO_VEGETA.w * ESCALA_VEGETA, h: SOLO_VEGETA.h * ESCALA_VEGETA, escala: ESCALA_VEGETA,
    solo: 'vegetaSolo', soloUrl: '/assets/vegeta/solo.webp', fundo: '#0b0308', imagem: '/assets/worlds/vegeta.webp', vila: 'vegeta-cidade',
    hunts: ['vegeta-planicies', 'vegeta-canions', 'vegeta-floresta', 'vegeta-lava', 'vegeta-cratera'], spawn: areaPorId('vegeta-cidade').chegada }
};
export const PLANETAS_DE_HUNT = Object.values(PLANETS).filter(p => p.hunts);
// Lugar de destino de um portal: a Terra ou uma das áreas de um planeta de hunt.
export function lugar(id) {
  if (id === 'terra') return { id, planet: 'terra', area: null, name: 'Terra', chegada: PLANETS.terra.spawn, segura: true };
  const z = areaPorId(id);
  return z && { id, planet: z.planet, area: z.id, name: z.name, chegada: z.chegada, segura: z.segura, nivel: z.nivel };
}
// Portais (o desenho ainda vai ser escolhido). Encostar abre a janela com os destinos.
// Terra: um portal que leva à Vila de cada planeta. Vila: um portal por hunt, cada um em cima da estrada de terra que sai da
// praça na sua direção (leste, sul e norte; pedido do Pedro, 04/11: "guiando o personagem para fora pela
// estrada"), medido no mapa de 36 partes; e a volta para a Terra
// logo acima do ponto de chegada. Hunts: um só portal, logo acima do ponto de chegada (é a saída),
// com a Vila e as outras duas hunts; para ir à Terra passa-se pela Vila (decisão do Pedro).
export const RAIO_PORTAL = 55;
const acimaDaChegada = id => ({ x: areaPorId(id).chegada.x, y: areaPorId(id).chegada.y - 110 });
// Portais de um planeta de hunt: a volta para a Terra acima da chegada da Vila, um portal da Vila para
// cada hunt (`entradas`: posição em px da imagem do solo, por id de hunt) e a saída de cada hunt, com a
// Vila e as outras hunts do mesmo planeta (`saidas`, px da imagem; sem ela, logo acima da chegada).
function portaisDoPlaneta(planet, entradas, saidas = {}) {
  const { vila, hunts, escala } = PLANETS[planet];
  return [
    { id: vila + '-terra', planet, area: vila, ...acimaDaChegada(vila), destinos: ['terra'] },
    ...hunts.map(id => ({ id: vila + '-' + id, planet, area: vila, x: entradas[id].x * escala, y: entradas[id].y * escala, destinos: [id] })),
    ...hunts.map(id => ({ id: 'saida-' + id, planet, area: id, ...(saidas[id] ? { x: saidas[id].x * escala, y: saidas[id].y * escala } : acimaDaChegada(id)),
      destinos: [vila, ...hunts.filter(h => h !== id)] }))
  ];
}
export const PORTAIS = [
  { id: 'terra-namek', planet: 'terra', area: null, x: 550, y: 210, destinos: PLANETAS_DE_HUNT.map(p => p.vila) },
  ...portaisDoPlaneta('namek', { inicial: { x: 900, y: 1198 }, media: { x: 510, y: 1675 }, dificil: { x: 438, y: 910 } }),
  // Vegeta (Pedro, 04/11: "organizar tp para ficar em cima dos caminhos"): na cidade, um portal no meio de cada
  // estrada, perto da praça; em cada hunt, a saída onde a estrada chega, com a chegada ao lado, para dentro.
  ...portaisDoPlaneta('vegeta', { 'vegeta-planicies': { x: 1960, y: 1360 }, 'vegeta-canions': { x: 2040, y: 1140 },
    'vegeta-floresta': { x: 2570, y: 1165 }, 'vegeta-lava': { x: 2580, y: 1490 }, 'vegeta-cratera': { x: 2275, y: 1600 } },
  { 'vegeta-planicies': { x: 1420, y: 1335 }, 'vegeta-canions': { x: 1770, y: 795 }, 'vegeta-floresta': { x: 2880, y: 850 },
    'vegeta-lava': { x: 2960, y: 1540 }, 'vegeta-cratera': { x: 2205, y: 2175 } })
];

// Decoração de Namekusei (árvores, arbustos e pedras; decisão do Pedro, 03/11/2026). Posições geradas por
// ~/idle-dbz/ferramentas/gerar_decoracao.mjs. Só TRONCOS e PEDRAS GRANDES bloqueiam, com uma área pequena
// na base; copas, arbustos e pedra pequena são enfeite (o personagem passa na frente ou atrás).
export const DECORACAO_ESCALA = 0.45;   // unidades do mundo por px do recorte (árvore mais alta ≈ 3× o Goku)
const PEDRA_GRANDE = new Set([15, 16]);
// Árvores pequenas da folha (copa redonda pequena, tronco curto e a dupla) desenhadas com o dobro do
// tamanho (pedido do Pedro, 04/11); o tronco delas bloqueia um pouco mais.
const ARVORE_DOBRADA = new Set([5, 9, 10]);
// As que ainda ficavam perto da altura do Goku (102–129 na tela) ganham 50% (pedido do Pedro, 04/11).
const ARVORE_MAIS_50 = new Set([4, 6, 7, 8, 11]);
export const DECORACAO = DECORACAO_NAMEK.map(d => {
  const escala = d.escala * (ARVORE_DOBRADA.has(d.sprite) ? 2 : ARVORE_MAIS_50.has(d.sprite) ? 1.5 : 1);
  const [, , w] = OBJETOS_DECORACAO[d.sprite], largura = w * DECORACAO_ESCALA * escala;
  const raio = d.sprite < 12 ? (ARVORE_DOBRADA.has(d.sprite) ? 14 : 10) : PEDRA_GRANDE.has(d.sprite) ? largura * 0.32 : 0;
  return { ...d, planet: 'namek', escala, raio };
});
// Bloqueios num hash espacial (célula de 256): a conferência é chamada várias vezes por passo de cada ator.
const CELULA_DECO = 256, BLOQUEIOS_DECO = new Map();
for (const d of DECORACAO) if (d.raio) {
  const chave = d.planet + ':' + Math.floor(d.x / CELULA_DECO) + ':' + Math.floor(d.y / CELULA_DECO);
  if (!BLOQUEIOS_DECO.has(chave)) BLOQUEIOS_DECO.set(chave, []);
  BLOQUEIOS_DECO.get(chave).push(d);
}
// A base é uma elipse achatada (vista de cima): mais larga que funda.
export function decoracaoBloqueia(planet, x, y) {
  const cx = Math.floor(x / CELULA_DECO), cy = Math.floor(y / CELULA_DECO);
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) for (const d of BLOQUEIOS_DECO.get(planet + ':' + (cx + dx) + ':' + (cy + dy)) || [])
    if (((x - d.x) / d.raio) ** 2 + ((y - d.y) / (d.raio * 0.55)) ** 2 < 1) return true;
  return false;
}
