// Inimigos do protótipo e onde eles aparecem no mapa.
// Para ajustar atributos ou adicionar um inimigo, mexa só neste arquivo.

import { configurarProjetilMob } from './projetil-mob.mjs';
import { PLANETS, areaPorId, naEscala, pontoNaZonaSegura } from './config.mjs';
import { podeAndar, pontoAlcancavelDesde } from './passagem.mjs';

// Quem aparece em cada hunt (decisão do Pedro, 03/11/2026): na inicial só os mobs básicos (Pássaro e
// Inseto de Namek, metade de cada, os dois atacando de perto); na média (decisão de 03/11), metade Guerreiros
// de Namek (de perto) e metade Veteranos de Namek (de longe e de perto), mais o subchefe; antes eram
// as sentinelas e um subchefe; na difícil, o chefe e os demais mobs, mais fortes.
// Os NÚMEROS são provisórios, à espera de balanceamento: cada hunt repete, para a faixa de nível
// recomendada dela, a proporção das Planícies no nível 1 (golpes para derrubar, dano recebido e
// mortes por nível). Arte também provisória: básico = Saibaman, sentinela = alienígena,
// subchefe = sentinela grande (provisório); chefe da hunt difícil = Porunga BOSS (folhas definitivas).
const ATRIBUTOS = {
  inicial: {
    passaro: { hp: 42, attack: 8, xp: 10, defesa: 1, speed: 115, name: 'Pássaro de Namek' },
    inseto: { hp: 42, attack: 8, xp: 10, defesa: 1, speed: 115, name: 'Inseto de Namek' },
    melee: { hp: 42, attack: 8, xp: 10, defesa: 1, speed: 115, name: 'Saibaman' }
  },
  media: {
    guerreiro: { hp: 210, attack: 17, xp: 45, defesa: 5, speed: 112, name: 'Guerreiro de Namek' },
    // Veterano de Namek: ataca de longe (rajada de ki) e de perto (soco).
    veterano: { hp: 190, attack: 16, xp: 45, defesa: 5, speed: 108, name: 'Veterano de Namek' },
    ranged: { hp: 200, attack: 17, xp: 45, defesa: 5, speed: 108, name: 'Sentinela alienígena' },
    subboss: { hp: 1800, attack: 45, xp: 400, defesa: 8, speed: 95, name: 'Comandante Sentinela · Subchefe' }
  },
  dificil: {
    // Porunga (decisão do Pedro, 03/11): o mob mais fraco da hunt difícil, voa e ataca de perto (garra).
    porunga: { hp: 380, attack: 33, xp: 90, defesa: 10, speed: 115, name: 'Porunga' },
    melee: { hp: 380, attack: 33, xp: 90, defesa: 10, speed: 115, name: 'Saibaman de elite' },
    ranged: { hp: 320, attack: 30, xp: 90, defesa: 10, speed: 108, name: 'Sentinela de elite' },
    // Chefe raro do Planalto (decisão do Pedro, 03/11): voa, ataque de perto por enquanto, 3× o Goku.
    boss: { hp: 12000, attack: 85, xp: 1500, defesa: 14, speed: 80, name: 'Porunga BOSS' }
  },
  // Planeta Vegeta (04/11/2026): MOBS PROVISÓRIOS, os de Namekusei com outros números, até o Pedro decidir quem
  // vive em cada hunt. Números pela mesma curva de Namek (vida 42 → 210 → 380 nos níveis 1, 10 e 20) estendida
  // ao nível do meio de cada hunt (33, 39, 45, 51, 57): vida ≈ 45 + 17,5 × (nível − 1), ataque ≈ 8 + 1,25 ×,
  // XP ≈ 10 + 4,2 ×, defesa ≈ 1 + 0,47 ×. Chefe raro da Cratera = o do Planalto × 2,7 (a vida dos mobs).
  // Planícies Vermelhas (decisão do Pedro, 05/11/2026): Tsufurujin Guerreiro (o mais fraco), Tsufurujin General
  // (o mediano) e Hatchiyack (o mais forte). Todos socam de perto e disparam ki de longe. Balanceados para um
  // nível 30 NÃO matar com facilidade (pedido do Pedro); números calibrados por simulação, ver PASSAGEM_CLAUDE.md.
  'vegeta-planicies': {
    tsufuruGuerreiro: { hp: 2000, attack: 64, xp: 220, defesa: 24, speed: 112, name: 'Tsufurujin Guerreiro' },
    tsufuruGeneral: { hp: 3000, attack: 78, xp: 420, defesa: 28, speed: 108, name: 'Tsufurujin General' },
    hatchiyack: { hp: 3800, attack: 98, xp: 850, defesa: 34, speed: 100, name: 'Hatchiyack' }
  },
  // Cânions (decisão do Pedro, 06/11/2026): Dodoria (o mais fraco) e Zarbon (o mais forte). Mesmo critério das
  // Planícies, um degrau acima: um nível 36 NÃO mata com facilidade. (Nappa, Raditz e Bardock foram para a Floresta.)
  'vegeta-canions': {
    dodoria: { hp: 2400, attack: 78, xp: 320, defesa: 28, speed: 104, corpo: 10, name: 'Dodoria' },
    zarbon: { hp: 4300, attack: 118, xp: 1200, defesa: 40, speed: 112, name: 'Zarbon' }
  },
  // Floresta Seca (decisão do Pedro, 06/11/2026): Nappa (o mais fraco), Raditz (o mediano) e Bardock (o mais forte),
  // vindos dos Cânions, mais fortes: um nível 42 NÃO mata com facilidade.
  'vegeta-floresta': {
    nappa: { hp: 3000, attack: 92, xp: 520, defesa: 34, speed: 108, name: 'Nappa' },
    raditz: { hp: 4300, attack: 110, xp: 950, defesa: 40, speed: 112, name: 'Raditz' },
    bardock: { hp: 4800, attack: 126, xp: 1800, defesa: 45, speed: 110, name: 'Bardock' }
  },
  // Campos de Lava (decisão do Pedro, 05/11/2026): Oozaru (o mais fraco) e Oozaru Guerreiro (o mais forte), mesmo
  // critério das outras hunts (nível 48 não mata com facilidade). Oozaru Super = chefe raro (6 a 12 h, em qualquer
  // ponto da hunt), forte demais para um nível 48–54 sozinho e sem equipamento (o "set" ainda não existe no jogo).
  'vegeta-lava': {
    // `corpo`: quanto o mob é mais largo que um personagem comum (unidades). Soma no alcance do soco dele e no de quem
    // bate nele: sem isso o gigante encostava no centro do Goku e ficava virando de lado (relato do Pedro, 05/11).
    oozaru: { hp: 3300, attack: 100, xp: 700, defesa: 38, speed: 104, corpo: 34, name: 'Oozaru' },
    oozaruGuerreiro: { hp: 5300, attack: 142, xp: 1600, defesa: 50, speed: 100, corpo: 38, name: 'Oozaru Guerreiro' },
    // Oozaru Super (dourado DE ARMADURA): fora da Lava desde 06/11 (Pedro), guardado para ser chefe de outro planeta.
    oozaruSuper: { hp: 30000, attack: 180, xp: 30000, defesa: 60, speed: 92, corpo: 62, name: 'Oozaru Super' },
    // Oozaru Dourado (sem armadura, como no GT): chefe raro da Lava no lugar dele (Pedro, 06/11). Golpes próprios:
    // pancada com os dois punhos (área em volta dele) e laser negro pela boca mirando o personagem. Mesma força por ora.
    oozaruDourado: { hp: 30000, attack: 180, xp: 30000, defesa: 60, speed: 92, corpo: 62, name: 'Oozaru Dourado' }
  },
  // Grande Cratera (decisão do Pedro, 06/11/2026): Rei Vegeta (o mais fraco) e Broly (o mais forte), no lugar dos
  // Porungas provisórios. Mesmo critério das outras hunts: um nível 54 não mata com facilidade.
  'vegeta-cratera': {
    reiVegeta: { hp: 3900, attack: 118, xp: 1100, defesa: 44, speed: 108, corpo: 12, name: 'Rei Vegeta' },
    broly: { hp: 5900, attack: 150, xp: 2600, defesa: 52, speed: 106, corpo: 30, name: 'Broly' },
    boss: { hp: 32000, attack: 200, xp: 4000, defesa: 38, speed: 80, name: 'Porunga BOSS' },
    // Freeza BOSS (ideia do Pedro, 05/11): em pé até 40% da vida (Death Beam), depois na nave, mais forte (Supernova).
    // PROVISÓRIO: lugar (chefe raro da Grande Cratera, no lugar do Porunga BOSS) e números, até o Pedro decidir.
    freezaBoss: { hp: 85000, attack: 230, xp: 60000, defesa: 70, speed: 96, corpo: 32, name: 'Freeza',
      nave: { aPartirDe: 0.4, ataque: 1.35, defesa: 1.25, velocidade: 0.8, corpo: 40, nome: 'Freeza (nave)' } }
  }
};
// Mobs de uma hunt pela curva de Namek, no nível dado: { tipo: velocidade } → { [area]: { tipo: atributos } }.
function mobsDaFaixa(area, nivel, tipos) {
  const n = nivel - 1, nomes = { passaro: 'Pássaro de Namek', inseto: 'Inseto de Namek', guerreiro: 'Guerreiro de Namek', veterano: 'Veterano de Namek', porunga: 'Porunga' };
  return { [area]: Object.fromEntries(Object.entries(tipos).map(([tipo, speed]) => [tipo,
    { hp: Math.round(45 + 17.5 * n), attack: Math.round(8 + 1.25 * n), xp: Math.round(10 + 4.2 * n), defesa: Math.round(1 + 0.47 * n), speed, name: nomes[tipo] }])) };
}
// Tipo que não existe na área (testes, mob avulso) usa a versão da hunt inicial ou da primeira que o tem.
// Aggro (pedido do Pedro, 05/11/2026), configurável por mob nos ATRIBUTOS; estes são os padrões:
// - agressivo: ataca quem chega perto (true) ou só reage quando é atacado (false, mob neutro);
// - aggro: raio em que o mob agressivo nota o jogador (unidades do mundo; chefe e mob grande enxergam mais longe);
// - perseguicao: quanto ele se afasta do ponto de origem antes de desistir e voltar (curando-se ao chegar).
// O raio antigo (300, fixo) era curto para os mapas do Vegeta: mobs a 400–500 do jogador não reagiam.
export const AGGRO_PADRAO = { agressivo: true, aggro: 380, perseguicao: 650 };
export function mobStats(type, area = 'inicial') {
  const base = ATRIBUTOS[area]?.[type] || Object.values(ATRIBUTOS).find(a => a[type])?.[type] || ATRIBUTOS.inicial.melee;
  const grande = type === 'boss' || type === 'subboss' || type === 'oozaruSuper' || type === 'oozaruDourado' || type === 'freezaBoss';
  return { ...AGGRO_PADRAO, aggro: AGGRO_PADRAO.aggro + (grande ? 80 : 0) + 2 * (base.corpo || 0), perseguicao: grande ? 560 : AGGRO_PADRAO.perseguicao, ...base, projetil:configurarProjetilMob(type,base) };
}
// Segundos até o mob voltar depois de derrotado.
// Chefe raro (decisão do Pedro, 03/11): volta num tempo sorteado entre 45 e 90 minutos.
export const CHEFE_RARO = { minimo: 45 * 60, maximo: 90 * 60 };
// Tempo de cada chefe raro, por tipo. Oozaru Super (Pedro, 05/11): entre 6 e 12 horas, "muito forte e raro".
export const TEMPO_CHEFE_RARO = { boss: CHEFE_RARO, oozaruSuper: { minimo: 6 * 3600, maximo: 12 * 3600 },
  oozaruDourado: { minimo: 6 * 3600, maximo: 12 * 3600 },
  freezaBoss: { minimo: 6 * 3600, maximo: 12 * 3600 } };   // Freeza: provisório, como o Oozaru Super
export const renasceEm = (type, random = Math.random) => TEMPO_CHEFE_RARO[type]
  ? TEMPO_CHEFE_RARO[type].minimo + random() * (TEMPO_CHEFE_RARO[type].maximo - TEMPO_CHEFE_RARO[type].minimo) : type === 'subboss' ? 60 : 12;
// Onde o chefe raro de cada hunt nasce: num ponto sorteado de um círculo (px da imagem → mundo).
// `aviso`: o que aparece para quem está na hunt quando ele surge.
export const CHEFES_RAROS = {
  dificil: { x: naEscala(4065), y: naEscala(1150), r: naEscala(190), aviso: 'apareceu no círculo do planalto!' },
  // Vegeta: no meio do chão da Grande Cratera (provisório, como o chefe).
  'vegeta-cratera': { x: 2100 * PLANETS.vegeta.escala, y: 2470 * PLANETS.vegeta.escala, r: 300 * PLANETS.vegeta.escala, aviso: 'chegou à Grande Cratera!' },
  // Oozaru Super: num ponto sorteado em qualquer lugar da hunt (todaHunt), não num círculo.
  'vegeta-lava': { todaHunt: true, aviso: 'surgiu nos Campos de Lava!' }
};
export const CIRCULO_DO_CHEFE = CHEFES_RAROS.dificil;
export function pontoNoCirculo(random, area = 'dificil') {
  const c = CHEFES_RAROS[area];
  const z = areaPorId(area);
  if (c.todaHunt) for (let i = 0; i < 300; i++) {
    const x = z.x + random() * z.w, y = z.y + random() * z.h;
    if (em_terra(area, x, y) && pontoAlcancavelDesde(z.planet, z.chegada, { x, y }, area)) return { x, y };
  }
  if (c.todaHunt) return pontoDeSpawnForaDaSafeZone(area, z.chegada);
  for (let i = 0; i < 40; i++) {
    const a = random() * Math.PI * 2, d = Math.sqrt(random()) * c.r;
    const x = c.x + Math.cos(a) * d, y = c.y + Math.sin(a) * d;
    if (em_terra(area, x, y) && pontoAlcancavelDesde(z.planet, z.chegada, { x, y }, area)) return { x, y };
  }
  for (let d = 0; d <= c.r; d += 36) for (let i = 0; i < 24; i++) {
    const a = i * Math.PI / 12, x = c.x + Math.cos(a) * d, y = c.y + Math.sin(a) * d;
    if (em_terra(area, x, y) && pontoAlcancavelDesde(z.planet, z.chegada, { x, y }, area)) return { x, y };
  }
  return pontoDeSpawnForaDaSafeZone(area, z.chegada);
}

// Pontos de nascimento dos inimigos: uma grade dentro de cada área, ficando só os pontos
// em terra firme (máscara de passagem) e com folga da água. O sorteio só desloca cada ponto
// um pouco, então funciona até com aleatoriedade fixa (testes). A grade acompanha a escala do
// mundo (do planeta da área); a folga da água (24) é do tamanho do mob e não cresce.
const em_terra = (area, x, y) => !pontoNaZonaSegura(areaPorId(area).planet, area, x, y, 24)
  && [[0, 0], [24, 0], [-24, 0], [0, 24], [0, -24]].every(([dx, dy]) => podeAndar(areaPorId(area).planet, x + dx, y + dy, area));
// Defesa também para pontos fixos/antigos e fallback de sorteios: nunca usar a chegada segura.
export function pontoDeSpawnForaDaSafeZone(area, ponto) {
  const z = areaPorId(area);
  if (!z || !pontoNaZonaSegura(z.planet, area, ponto.x, ponto.y, 24)) return { x: ponto.x, y: ponto.y };
  for (let r = 36; r <= Math.max(z.w, z.h); r += 36) for (let i = 0; i < 32; i++) {
    const a = i * Math.PI / 16, x = ponto.x + Math.cos(a) * r, y = ponto.y + Math.sin(a) * r;
    if (em_terra(area, x, y) && pontoAlcancavelDesde(z.planet, z.chegada, { x, y }, area)) return { x, y };
  }
  throw new Error('Sem ponto de spawn fora da safe zone: ' + area);
}
function espalhar(random, area, n, tipo) {
  const z = areaPorId(area), k = PLANETS[z.planet].escala, candidatos = [];
  const passo = 170 * k, margem = 90 * k, fim = 60 * k, sorteio = 60 * k;
  for (let y = z.y + margem; y < z.y + z.h - fim; y += passo) for (let x = z.x + margem; x < z.x + z.w - fim; x += passo) {
    const px = x + (random() - 0.5) * sorteio, py = y + (random() - 0.5) * sorteio;
    if (em_terra(area, px, py) && pontoAlcancavelDesde(z.planet, z.chegada, { x: px, y: py }, area)) candidatos.push({ x: px, y: py });
  }
  // Pega n pontos bem distribuídos ao longo da lista (em vez dos n primeiros, que ficariam todos no topo).
  const salto = Math.max(1, candidatos.length / n);
  return Array.from({ length: Math.min(n, candidatos.length) }, (_, i) => ({ ...candidatos[Math.floor(i * salto)], type: tipo(i), area }));
}
const [G, M, H] = ['tsufuruGuerreiro', 'tsufuruGeneral', 'hatchiyack'];
const PLANICIES_VERMELHAS = [G, M, G, H, G, M, G, G, M, H, G, M, G, G, M, H];
// Cânions: 10 mobs, 6 Dodorias e 4 Zarbons (60/40, como a Cratera). Floresta Seca: 16, 8 Nappas, 5 Raditz, 3 Bardocks.
const CANIONS = ['dodoria', 'zarbon', 'dodoria', 'zarbon', 'dodoria', 'dodoria', 'zarbon', 'dodoria', 'zarbon', 'dodoria'];
const FLORESTA = PLANICIES_VERMELHAS.map(t => ({ [G]: 'nappa', [M]: 'raditz', [H]: 'bardock' })[t]);
// Quantidade de mobs por hunt: na inicial, 20 (16 + 25%, pedido do Pedro, 03/11); nas outras, 16
// comuns, provisório (a densidade será decidida pelo Pedro com o modelo montado).
export function spawnPoints(random) {
  return [
    ...espalhar(random, 'inicial', 20, i => i % 2 ? 'inseto' : 'passaro'),
    ...espalhar(random, 'media', 16, i => i % 2 ? 'veterano' : 'guerreiro'),
    // Subchefe na cratera grande do Campo de Batalha; chefe no centro da arena do Planalto.
    { type: 'subboss', x: naEscala(3330), y: naEscala(2280), area: 'media' },
    // Planalto do Porunga: só Porungas (decisão do Pedro, 03/11) e o chefe raro no círculo.
    ...espalhar(random, 'dificil', 16, () => 'porunga'),
    { type: 'boss', ...pontoNoCirculo(random), area: 'dificil', raro: true },
    // Planeta Vegeta: 16 mobs por hunt (provisório, como em Namek), metade de cada tipo onde há dois.
    // Planícies Vermelhas: mais Guerreiros, menos Hatchiyacks (8 / 5 / 3; provisório), misturados pela hunt.
    ...espalhar(random, 'vegeta-planicies', 16, i => PLANICIES_VERMELHAS[i % PLANICIES_VERMELHAS.length]),
    // Cânions: mais Nappas, menos Bardocks (5 / 3 / 2), misturados. Só 10: o chão dos Cânions é menos da metade do
    // das Planícies, e com 16 a densidade dobrava (caça morria ~9 vezes em 5 min no nível 36; com 10, a das Planícies).
    ...espalhar(random, 'vegeta-canions', 10, i => CANIONS[i % CANIONS.length]),
    ...espalhar(random, 'vegeta-floresta', 16, i => FLORESTA[i % FLORESTA.length]),
    // Campos de Lava: 11 mobs (densidade das Planícies para o chão da Lava), mais Oozarus que Guerreiros, e o chefe raro.
    ...espalhar(random, 'vegeta-lava', 11, i => i % 3 === 2 ? 'oozaruGuerreiro' : 'oozaru'),
    { type: 'oozaruDourado', ...pontoNoCirculo(random, 'vegeta-lava'), area: 'vegeta-lava', raro: true },
    // Grande Cratera: 10 mobs, 60% Rei Vegeta e 40% Broly (Pedro, 06/11: 6 e 4), misturados, e o chefe raro.
    ...espalhar(random, 'vegeta-cratera', 10, i => i % 5 === 1 || i % 5 === 3 ? 'broly' : 'reiVegeta'),
    { type: 'freezaBoss', ...pontoNoCirculo(random, 'vegeta-cratera'), area: 'vegeta-cratera', raro: true }
  ];
}
