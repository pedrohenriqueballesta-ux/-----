import { ITENS_PREMIUM } from '../sistemas/itens-premium.mjs';
import { NOVOS_ITENS } from '../sistemas/catalogo-itens.mjs';
// Dados do mundo e números de balanceamento do protótipo. Todos ajustáveis.
import { PEGADAS } from '../mundo/pegadas-casas.mjs';
import { DECORACAO_NAMEK } from '../mundo/decoracao-namek.mjs';
import { OBJETOS_DECORACAO } from '../mundo/decoracao-objetos.mjs';
import { CURA } from '../tecnicas/cura.mjs';
import { TAMANHO_TERRA, PRACA_TERRA, MERCADORES_TERRA } from '../mundo/terra.mjs';

// Modo de teste GOD MODE (nível máximo + HP/Ki infinitos). DESLIGADO por padrão.
// Liga so no servidor local com a variavel de ambiente DBI_GODMODE=1.
// Seguro no navegador: process nao existe la, entao fica false (nao afeta o jogo real nem os testes).
export const GODMODE = typeof process !== 'undefined' && !!process.env && process.env.DBI_GODMODE === '1';

// DEV/provisório (pedido do Pedro): enquanto o mapa está grande, a Nimbus montada anda bem mais rápido para
// facilitar a locomoção durante o desenvolvimento. Serve o servidor (Game.move) e a predição do cliente para
// não tremer. AJUSTAR para a velocidade final de jogo quando o mapa/balanceamento estiver pronto (1 = sem bônus).
export const MULT_NIMBUS_DEV = 3;

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
// Solo da Terra das hunts (atlas hub + hunts, px). Escala 1 un/px: a mesma densidade de arte de Namek e Vegeta
// (8192 px para ~8.300 un). Com 1,8 a arte aparecia esticada (Pedro, 23/11/2026: "qualidade inferior").
export const SOLO_TERRA_HUNTS = Object.freeze({ w: 46507, h: 5461 });
export const ESCALA_TERRA_HUNTS = 1;
export const naEscala = v => v * ESCALA_MUNDO;

export const CONFIG = Object.freeze({
  progression: Object.freeze({
    nivelMaximo: 1000,
    // Mantém literalmente a curva histórica até o nível 100; depois acelera gradualmente.
    curvaXP: Object.freeze({ preservarAteNivel: 100, coeficiente: 30, expoentePreservado: 1.35, expoenteAvancado: 1.5 }),
    // Acima do nível da criatura, a recompensa cai suavemente e nunca zera.
    penalidadeXP: Object.freeze({ escalaDiferenca: 60, expoente: 0.5, minimo: 0.2 }),
    riscoHunt: Object.freeze({ danoPorDeficit: 7, danoPorDeficitQuadratico: 16, danoMaximo: 4 }),
    perdaXpMorte: Object.freeze({ niveisPorFaixa: 250 })
  }),
  // Tamanho de Namekusei em unidades do jogo (imagem do solo × ESCALA_MUNDO).
  width: naEscala(SOLO_NAMEK.w), height: naEscala(SOLO_NAMEK.h), foodDuration: 300, foodHealPerSecond: 2, autoFoodLimiteHp: 0.90,
  // Espaços da mochila (Pedro, 04/11: 30 no início, ajustável depois). Cada tipo de item ocupa um espaço.
  mochilaSlots: 30,
  // Raio de seleção de mobs pela Auto Hunt (Pedro, 09/11/2026).
  autoHuntRaio: 700,
  seedCooldown: 20, kiCooldown: CURA.cooldown, pickupRadius: 60, respawnDelay: 4,
  // Segundos protegido ao chegar por portal ou renascer ("seguro por uns segundos"; valor provisório).
  chegadaSegura: 3,
  seedPotencies: [15, 30, 50, 100],
  itemWeights: { ...Object.fromEntries(Object.values({ ...NOVOS_ITENS, ...ITENS_PREMIUM }).map(item => [item.id, item.peso])), food: 0.35, ki: 0.2, seed15: 0.08, seed30: 0.08, seed50: 0.08, seed100: 0.08, scrap: 0.07 },
  prices: { food: 12, ki: 18, 'pocao-energia': 50, seed15: 90, seed30: 210, seed50: 480, seed100: 1400 },
  // VALOR PROVISÓRIO: manutenção comum a todas as formas (Pedro, 09/11/2026).
  transformacao: Object.freeze({ drenoKi: 3.5, limiteAutomatico: 0.5, gogetaDuracao: 3600 }),
  skillCosts: { ki: 7, kame: 25, galick: 25, bigBangAttack: 120, finalFlash: 180, kaioken: 0, barrier: 30, transform: 0, genki: 60 },
  skillCooldowns: { ki: 0.7, kame: 5, galick: 5, bigBangAttack: 10, finalFlash: 18, kaioken: 0, barrier: 8, transform: 0, genki: 45 },
  // Marcos atuais das formas de Goku; parâmetros e comportamento compartilhados em shared/formas.mjs.
  // Habilidades implementadas progridem até a Genki Dama, alinhada ao marco do SSJ2.
  // Transformações atuais permanecem inalteradas até a implementação da nova escada.
  // ryuken (SSJ3 e SSJ4) e superKamehameha (SSJ4): técnicas próprias nos oito slots configuráveis (Pedro, 12 e
  // 16/11/2026); o Kamehameha continua em todas as formas (shared/ryuken.mjs, shared/kamehameha.mjs).
  skills: { ki: 20, dash: 20, kame: 40, galick: 40, bigBangAttack: 100, finalFlash: 200, kaioken: 50, barrier: 80, transform: 100, ssj2: 200, ssj3: 300, majin: 200, ryuken: 300, ssj4: 500, ssj4Vegeta: 300, ssjGod: 500, ssjBlue: 700, ultraEgo: 900, superKamehameha: 500, gogeta: 700, vegito: 900, genki: 200 },
  // Marcos planejados para técnicas futuras; não liberam nem ativam habilidades ainda inexistentes.
  plannedSkillUnlocks: Object.freeze({})
});
// Áreas fechadas de Namekusei (modelo do Pedro, 03/11/2026). Cada área é um lugar à parte: não se anda
// de uma para outra, troca-se pelos portais (PORTAIS). A caixa (x, y, w, h, em px da imagem) limita onde
// se anda; dentro dela vale a máscara de passagem. `chegada` é onde o jogador aparece ao entrar e, nas
// hunts, também onde fica a saída. `nivel` é só recomendação: entra quem quiser, mas é perigoso.
// Ilha norte aberta como quarta hunt (Pedro, 09/11/2026); noroeste e ilhotas continuam reservadas.
// Os ids são usados pelas regras e pelo save: mude nome, caixa e chegada à vontade, mas não os ids.
// Os ids valem para o jogo inteiro (todos os planetas): um planeta novo usa ids próprios (ex.: 'vegeta-…').
// `cor`: a do portal, do minimapa e do menu Mapa (verde, laranja e vermelho para as hunts; azul para a Vila).
const zonasEmPx = (planet, escala, zonas) => zonas.map(z => ({ planet, pvp: false, segura: false, ...z,
  x: z.x * escala, y: z.y * escala, w: z.w * escala, h: z.h * escala, chegada: { x: z.chegada.x * escala, y: z.chegada.y * escala } }));
export const ZONES = [
  ...zonasEmPx('namek', ESCALA_MUNDO, [
    { id: 'vila', name: 'Vila Namekiana', segura: true, cor: '#5fb6ff', x: 0, y: 850, w: 1000, h: 900, chegada: { x: 480, y: 1410 } },
    { id: 'inicial', name: 'Planícies de Namekusei', nivel: [10, 25], cor: '#46e646', x: 1150, y: 640, w: 2230, h: 1160, chegada: { x: 1400, y: 1150 } },
    { id: 'media', name: 'Campo de Batalha', nivel: [70, 100], cor: '#ffa51e', x: 1150, y: 1800, w: 3150, h: 1272, chegada: { x: 1450, y: 2330 } },
    { id: 'dificil', name: 'Planalto do Porunga', nivel: [230, 300], cor: '#eb2d2d', x: 3380, y: 500, w: 1228, h: 1300, chegada: { x: 3500, y: 1200 } },
    // Contorno medido na máscara de 6 px; cortes 3380/640 preservam as hunts atuais.
    { id: 'norte', name: 'Cratera de Nail', nivel: [570, 690], cor: '#a35cff', x: 2058, y: 72, w: 1322, h: 568, chegada: { x: 2600, y: 570 } }
  ]),
  // Planeta Vegeta: cidade no centro e 5 hunts, cada uma numa ilha cercada de abismo, com uma estrada até a
  // cidade (nomes e temas propostos, a confirmar pelo Pedro). Caixas = contorno de cada ilha na máscara
  // (vegeta-passagem.mjs, que também diz a que área cada pedaço de chão pertence); chegada onde a estrada
  // entra. As faixas recomendadas se alternam com Terra e Namekusei.
  ...zonasEmPx('vegeta', ESCALA_VEGETA, [
    { id: 'vegeta-cidade', name: 'Cidade dos Saiyajins', segura: true, cor: '#5fb6ff', x: 1800, y: 936, w: 1026, h: 756, chegada: { x: 2301, y: 1323 } },
    { id: 'vegeta-planicies', name: 'Planícies Vermelhas', nivel: [45, 70], cor: '#46e646', x: 54, y: 780, w: 1590, h: 1584, chegada: { x: 1340, y: 1340 } },
    { id: 'vegeta-canions', name: 'Cânions', nivel: [140, 180], cor: '#d6e632', x: 636, y: 12, w: 1674, h: 1026, chegada: { x: 1715, y: 755 } },
    { id: 'vegeta-floresta', name: 'Floresta Seca', nivel: [300, 380], cor: '#ffa51e', x: 2436, y: 30, w: 2118, h: 1176, chegada: { x: 2935, y: 800 } },
    { id: 'vegeta-lava', name: 'Campos de Lava', nivel: [470, 570], cor: '#eb2d2d', x: 2772, y: 1116, w: 1788, h: 1380, chegada: { x: 3040, y: 1540 } },
    { id: 'vegeta-cratera', name: 'Grande Cratera', nivel: [830, 1000], cor: '#b44dff', x: 1278, y: 2070, w: 1644, h: 798, chegada: { x: 2205, y: 2260 } }
  ]),
  // Terra das hunts (Pedro, 22/11/2026): planeta à parte da Cidade do Oeste, feito do mapa-múndi da Terra. Cada hunt tem
  // o próprio mapa (tamanhos variados) e o solo é um atlas com o hub e as hunts lado a lado (só se troca por portal).
  // Caixas = contorno do chão na máscara (terra-hunts-passagem.mjs); chegadas em chão livre, longe da borda.
  ...zonasEmPx('terra-hunts', ESCALA_TERRA_HUNTS, [
    { id: 'terra-hub', name: 'Clareira do Centro', segura: true, cor: '#5fb6ff', x: 1110, y: 276, w: 708, h: 516, chegada: { x: 1461, y: 559 } },
    { id: 'terra-descampado', name: 'Descampado do Oeste', nivel: [25, 45], cor: '#46e646', x: 3096, y: 942, w: 5028, h: 2340, chegada: { x: 6981, y: 1996 } },
    // Deserto das mesas (6×6 telas, Pedro 23/11/2026): área da Saga do Cell.
    { id: 'terra-deserto', name: 'Deserto das Mesas', nivel: [100, 140], cor: '#ffa51e', x: 9450, y: 372, w: 7320, h: 3918, chegada: { x: 13397, y: 1386 } },
    // Montanhas nevadas (6×3 telas, Pedro 24/11/2026): área dos Androides.
    { id: 'terra-neve', name: 'Montanhas Nevadas', nivel: [690, 830], cor: '#9fd8ff', x: 20424, y: 660, w: 4968, h: 2010, chegada: { x: 22987, y: 1600 } },
    // Vale da Cachoeira (6×4 telas de mapa, Pedro 24/11/2026): por ora só o vale central é andável (o resto é mata e
    // montanha, sem passagem desenhada). Os dinossauros: primeira hunt do jogo (Pedro, 25/11).
    { id: 'terra-montanhas', name: 'Vale da Cachoeira', nivel: [1, 10], cor: '#eb2d2d', x: 27690, y: 1956, w: 2136, h: 1512, chegada: { x: 28843, y: 2293 } },
    // Ilha da Arena (4×4 telas, Pedro 25/11/2026; partes finais feitas pelo amigo dele): platô com a arena de terra.
    { id: 'terra-ilha', name: 'Ilha da Arena', nivel: [180, 230], cor: '#b44dff', x: 35934, y: 810, w: 2868, h: 2226, chegada: { x: 37419, y: 1880 } },
    // Floresta do Sudeste (5×5 telas de mapa, Pedro 25/11/2026): trilhas e clareiras do norte; a parte sul (colina) fica
    // fora até o ajuste de colisão.
    { id: 'terra-floresta', name: 'Floresta do Sudeste', nivel: [380, 470], cor: '#d6e632', x: 40128, y: 18, w: 4686, h: 2400, chegada: { x: 41982, y: 1042 } }
  ])
];
export const areaPorId = id => ZONES.find(z => z.id === id) || null;
// Safe zone na chegada de cada hunt (pedido de 07/11/2026); lado provisório de 180 unidades.
export function zonaSeguraDaHunt(area) {
  const z = areaPorId(area);
  return z && !z.segura ? { x: z.chegada.x - 90, y: z.chegada.y - 90, w: 180, h: 180 } : null;
}
export function naZonaSegura(p) {
  return pontoNaZonaSegura(p.planet, p.area, p.x, p.y);
}
export function pontoNaZonaSegura(planet, area, x, y, margem = 0) {
  const z = areaPorId(area), q = zonaSeguraDaHunt(area);
  return Boolean(q && planet === z.planet && x >= q.x - margem && x <= q.x + q.w + margem && y >= q.y - margem && y <= q.y + q.h + margem);
}
export const zonasDe = planet => ZONES.filter(z => z.planet === planet);
// Mercador na beira da praça da Vila Namekiana (px da imagem). A barraca e o vendedor
// mantêm o tamanho; só a posição acompanha o mapa.
export const MERCHANT = { planet: 'namek', area: 'vila', x: naEscala(560), y: naEscala(1290) };
// Mercadores de todos os planetas (um por Vila) e os da Cidade do Oeste (porta da Loja do Mestre Karin e do Mercado de
// comida, sem vendedor desenhado: `predio`). Comprar e vender pede estar no mesmo lugar e perto.
export const MERCADORES = [MERCHANT, { planet: 'vegeta', area: 'vegeta-cidade', x: 2420 * ESCALA_VEGETA, y: 1220 * ESCALA_VEGETA }, ...MERCADORES_TERRA];
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
// ferramentas/assentar_casas.py: ao mudar posição ou tamanho aqui, gere o solo de novo.
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
  // Cidade do Oeste: mapa grande integrado ao renderer da Terra. O spawn fica no largo
  // central e a saída interplanetária é a porta da nave, não mais a nuvem do lobby antigo.
  terra: { id: 'terra', name: 'Terra', w: TAMANHO_TERRA.w, h: TAMANHO_TERRA.h, solo: 'terraSolo', spawn: PRACA_TERRA.chegada,
    soloUrl: '/assets/terra/chao.webp', fundo: '#5a8f3c', imagem: '/assets/worlds/terra.webp' },
  namek: { id: 'namek', name: 'Namekusei', w: CONFIG.width, h: CONFIG.height, escala: ESCALA_MUNDO, solo: 'namekSolo',
    soloUrl: '/assets/namek/solo.webp', fundo: '#385a2d', imagem: '/assets/worlds/namek.webp',
    vila: 'vila', hunts: ['inicial', 'media', 'dificil', 'norte'], spawn: areaPorId('vila').chegada }, // praça da Vila Namekiana
  vegeta: { id: 'vegeta', name: 'Planeta Vegeta', w: SOLO_VEGETA.w * ESCALA_VEGETA, h: SOLO_VEGETA.h * ESCALA_VEGETA, escala: ESCALA_VEGETA,
    solo: 'vegetaSolo', soloUrl: '/assets/vegeta/solo.webp', fundo: '#0b0308', imagem: '/assets/worlds/vegeta.webp', vila: 'vegeta-cidade',
    hunts: ['vegeta-planicies', 'vegeta-canions', 'vegeta-floresta', 'vegeta-lava', 'vegeta-cratera'], spawn: areaPorId('vegeta-cidade').chegada },
  'terra-hunts': { id: 'terra-hunts', name: 'Terra Selvagem', w: SOLO_TERRA_HUNTS.w * ESCALA_TERRA_HUNTS, h: SOLO_TERRA_HUNTS.h * ESCALA_TERRA_HUNTS, escala: ESCALA_TERRA_HUNTS,
    solo: 'terraHuntsSolo', soloUrl: '/assets/terra-hunts/visao.webp', fundo: '#0c2846', imagem: '/assets/worlds/terra.webp',
    // Um chão por área (x, y, w, h = retângulo do mundo coberto): só a área onde se está fica carregada. `soloUrl` é a
    // visão geral pequena (menu Mapa).
    soloPorArea: {
      'terra-hub': { url: '/assets/terra-hunts/hub.webp', x: 0, y: 0, w: 2859, h: 982 },
      'terra-descampado': { url: '/assets/terra-hunts/descampado.webp', x: 2923, y: 0, w: 6144, h: 4096 },
      'terra-deserto': { url: '/assets/terra-hunts/deserto.webp', x: 9131, y: 0, w: 8192, h: 5461 },
      'terra-neve': { url: '/assets/terra-hunts/neve.webp', x: 17387, y: 0, w: 8192, h: 2731 },
      'terra-montanhas': { url: '/assets/terra-hunts/montanhas.webp', x: 25643, y: 0, w: 8192, h: 4096 },
      'terra-ilha': { url: '/assets/terra-hunts/ilha.webp', x: 33899, y: 0, w: 6144, h: 4096 },
      'terra-floresta': { url: '/assets/terra-hunts/floresta.webp', x: 40107, y: 0, w: 6400, h: 4267 }
    },
    vila: 'terra-hub', hunts: ['terra-descampado', 'terra-deserto', 'terra-floresta', 'terra-neve', 'terra-montanhas', 'terra-ilha'], spawn: areaPorId('terra-hub').chegada }
};
export const PLANETAS_DE_HUNT = Object.values(PLANETS).filter(p => p.hunts);
// Lugar de destino de um portal: a Terra ou uma das áreas de um planeta de hunt.
export function lugar(id) {
  if (id === 'terra') return { id, planet: 'terra', area: null, name: 'Terra', chegada: PLANETS.terra.spawn, segura: true };
  const z = areaPorId(id);
  return z && { id, planet: z.planet, area: z.id, name: z.name, chegada: z.chegada, segura: z.segura, nivel: z.nivel };
}
// Portais (o desenho ainda vai ser escolhido). Encostar abre a janela com os destinos.
// Terra: um portal que leva à Vila de cada planeta. Vila: um portal interplanetário com a Terra e todas as outras Vilas,
// mais um portal por hunt, cada um em cima da estrada de terra que sai da praça na sua direção
// (leste, sul e norte; pedido do Pedro, 04/11: "guiando o personagem para fora pela estrada"), medido no mapa de 36 partes.
// Hunts: um só portal, logo acima do ponto de chegada (é a saída),
// com a Vila e as demais hunts; para ir à Terra passa-se pela Vila (decisão do Pedro).
export const RAIO_PORTAL = 55;
const acimaDaChegada = id => ({ x: areaPorId(id).chegada.x, y: areaPorId(id).chegada.y - 110 });
// Portais de um planeta de hunt: portal interplanetário acima da chegada da Vila, um portal da Vila para
// cada hunt (`entradas`: posição em px da imagem do solo, por id de hunt) e a saída de cada hunt, com a
// Vila e as outras hunts do mesmo planeta. Saídas ficam dentro do quadrado seguro da chegada.
function portaisDoPlaneta(planet, entradas) {
  const { vila, hunts, escala } = PLANETS[planet];
  const destinosInterplanetarios = ['terra', ...PLANETAS_DE_HUNT.filter(p => p.id !== planet).map(p => p.vila)];
  return [
    { id: vila + '-terra', planet, area: vila, ...acimaDaChegada(vila), destinos: destinosInterplanetarios },
    ...hunts.map(id => ({ id: vila + '-' + id, planet, area: vila, x: entradas[id].x * escala, y: entradas[id].y * escala, destinos: [id] })),
    // Canto superior esquerdo: chegada fora do gatilho de 55, sem reabrir o menu ao viajar.
    ...hunts.map(id => ({ id: 'saida-' + id, planet, area: id, x: areaPorId(id).chegada.x - 60, y: areaPorId(id).chegada.y - 60,
      destinos: [vila, ...hunts.filter(h => h !== id)] }))
  ];
}
export const PORTAIS = [
  { id: 'terra-nave', planet: 'terra', area: null, ...PRACA_TERRA.portal, destinos: PLANETAS_DE_HUNT.map(p => p.vila) },
  ...portaisDoPlaneta('namek', { inicial: { x: 900, y: 1198 }, media: { x: 510, y: 1675 }, dificil: { x: 438, y: 910 }, norte: { x: 600, y: 1050 } }),
  // Vegeta (Pedro, 04/11: "organizar tp para ficar em cima dos caminhos"): na cidade, um portal no meio de cada
  // estrada, perto da praça. Saídas das hunts agora ficam dentro da safe zone (pedido de 07/11/2026).
  ...portaisDoPlaneta('vegeta', { 'vegeta-planicies': { x: 1960, y: 1360 }, 'vegeta-canions': { x: 2040, y: 1140 },
    'vegeta-floresta': { x: 2560, y: 1197 }, 'vegeta-lava': { x: 2675, y: 1480 }, 'vegeta-cratera': { x: 2275, y: 1600 } }),
  // Terra das hunts: no hub, o portal de cada hunt na beira da clareira, do lado onde a hunt fica no mapa-múndi.
  ...portaisDoPlaneta('terra-hunts', { 'terra-descampado': { x: 1204, y: 518 }, 'terra-deserto': { x: 1280, y: 640 }, 'terra-neve': { x: 1440, y: 322 }, 'terra-montanhas': { x: 1723, y: 470 }, 'terra-ilha': { x: 1665, y: 631 }, 'terra-floresta': { x: 1344, y: 464 } })
];

// Decoração de Namekusei (árvores, arbustos e pedras; decisão do Pedro, 03/11/2026). Posições geradas por
// ferramentas/gerar_decoracao.mjs. Só TRONCOS e PEDRAS GRANDES bloqueiam, com uma área pequena
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
