// Inimigos do protótipo e onde eles aparecem no mapa.
// Para ajustar atributos ou adicionar um inimigo, mexa só neste arquivo.

import { configurarProjetilMob } from '../mundo/projetil-mob.mjs';
import { PLANETS, areaPorId, naEscala, pontoNaZonaSegura } from './config.mjs';
import { statsFor } from './characters.mjs';
import { xpForLevel } from '../sistemas/progressao.mjs';
import { podeAndar, pesLivres, pontoAlcancavelDesde } from '../mundo/passagem.mjs';

// Quem aparece em cada hunt (decisão do Pedro, 03/11/2026): na inicial só os mobs básicos (Pássaro e
// Inseto de Namek, metade de cada, os dois atacando de perto); na média (decisão de 03/11), metade Guerreiros
// de Namek (de perto) e metade Veteranos de Namek (de longe e de perto), mais o subchefe; antes eram
// as sentinelas e um subchefe; na difícil, o chefe e os demais mobs, mais fortes.
// Os NÚMEROS são provisórios, à espera de balanceamento: cada hunt repete, para a faixa de nível
// recomendada dela, a proporção das Planícies no nível 1 (golpes para derrubar, dano recebido e
// mortes por nível). Arte também provisória: básico = Saibaman, sentinela = alienígena,
// subchefe = sentinela grande (provisório); chefe da hunt difícil = Porunga BOSS (folhas definitivas).
// Níveis e atributos históricos servem de referência para as diferenças entre espécies.
const ATRIBUTOS = {
  // Cratera de Nail: atributos PROVISÓRIOS, calibrados por duelos 30/35/40 e caça.
  norte: {
    // Percepção 250 provisória: evita que o tamanho dos corpos atraia grupos inteiros na ilha estreita.
    nail: { level:30, hp:2200, attack:64, xp:260, defesa:24, speed:104, corpo:20, aggro:250, name:'Nail' },
    piccoloDaimaoh: { level:40, hp:4900, attack:120, xp:1100, defesa:40, speed:100, corpo:22, aggro:250, name:'Piccolo Daimaoh' },
    neva: { level:40, hp:40000, attack:200, xp:35000, defesa:65, speed:85, corpo:25, name:'Neva' }
  },
  inicial: {
    passaro: { level:5, hp: 42, attack: 8, xp: 10, defesa: 1, speed: 115, name: 'Pássaro de Namek' },
    inseto: { level:5, hp: 42, attack: 8, xp: 10, defesa: 1, speed: 115, name: 'Inseto de Namek' },
    melee: { level:5, hp: 42, attack: 8, xp: 10, defesa: 1, speed: 115, name: 'Saibaman' }
  },
  media: {
    guerreiro: { level:15, hp: 210, attack: 17, xp: 45, defesa: 5, speed: 112, name: 'Guerreiro de Namek' },
    // Veterano de Namek: ataca de longe (rajada de ki) e de perto (soco).
    veterano: { level:15, hp: 190, attack: 16, xp: 45, defesa: 5, speed: 108, name: 'Veterano de Namek' },
    ranged: { level:15, hp: 200, attack: 17, xp: 45, defesa: 5, speed: 108, name: 'Sentinela alienígena' },
    subboss: { level:20, hp: 1800, attack: 45, xp: 400, defesa: 8, speed: 95, name: 'Comandante Sentinela' }
  },
  dificil: {
    // Porunga (decisão do Pedro, 03/11): o mob mais fraco da hunt difícil, voa e ataca de perto (garra).
    porunga: { level:25, hp: 380, attack: 33, xp: 90, defesa: 10, speed: 115, name: 'Porunga' },
    melee: { level:25, hp: 380, attack: 33, xp: 90, defesa: 10, speed: 115, name: 'Saibaman de elite' },
    ranged: { level:25, hp: 320, attack: 30, xp: 90, defesa: 10, speed: 108, name: 'Sentinela de elite' },
    // Chefe raro do Planalto (decisão do Pedro, 03/11): voa, ataque de perto por enquanto, 3× o Goku.
    boss: { level:30, hp: 12000, attack: 85, xp: 1500, defesa: 14, speed: 80, name: 'Porunga BOSS' }
  },
  // Os níveis originais dos mobs de Vegeta são mantidos como referência de calibração. mobStats ajusta
  // HP/ataque/defesa/XP junto das novas faixas recomendadas sem criar criaturas ou mudar seus papéis.
  // Planícies Vermelhas (decisão do Pedro, 05/11/2026): Tsufurujin Guerreiro (o mais fraco), Tsufurujin General
  // (o mediano) e Hatchiyack (o mais forte). Todos socam de perto e disparam ki de longe. Balanceados para um
  // nível 30 NÃO matar com facilidade (pedido do Pedro); números calibrados por simulação, ver PASSAGEM_CLAUDE.md.
  'vegeta-planicies': {
    tsufuruGuerreiro: { level:40, nivelBase:30, hp: 2000, attack: 64, xp: 220, defesa: 24, speed: 112, name: 'Tsufurujin Guerreiro' },
    tsufuruGeneral: { level:51, nivelBase:33, hp: 3000, attack: 78, xp: 420, defesa: 28, speed: 108, name: 'Tsufurujin General' },
    hatchiyack: { level:62, nivelBase:36, hp: 3800, attack: 98, xp: 850, defesa: 34, speed: 100, name: 'Hatchiyack' }
  },
  // Cânions (decisão do Pedro, 06/11/2026): Dodoria (o mais fraco) e Zarbon (o mais forte). Mesmo critério das
  // Planícies, um degrau acima: um nível 36 NÃO mata com facilidade. (Nappa, Raditz e Bardock foram para a Floresta.)
  'vegeta-canions': {
    dodoria: { level:62, nivelBase:36, hp: 2400, attack: 78, xp: 320, defesa: 28, speed: 104, corpo: 10, name: 'Dodoria' },
    zarbon: { level:68, nivelBase:42, hp: 4300, attack: 118, xp: 1200, defesa: 40, speed: 112, corpo: 10, name: 'Zarbon' }
  },
  // Floresta Seca (decisão do Pedro, 06/11/2026): Nappa (o mais fraco), Raditz (o mediano) e Bardock (o mais forte),
  // vindos dos Cânions, mais fortes: um nível 42 NÃO mata com facilidade.
  'vegeta-floresta': {
    nappa: { level:84, nivelBase:42, hp: 3000, attack: 92, xp: 520, defesa: 34, speed: 108, name: 'Nappa' },
    raditz: { level:95, nivelBase:45, hp: 4300, attack: 110, xp: 950, defesa: 40, speed: 112, name: 'Raditz' },
    bardock: { level:106, nivelBase:48, hp: 4800, attack: 126, xp: 1800, defesa: 45, speed: 110, name: 'Bardock' }
  },
  // Campos de Lava (decisão do Pedro, 05/11/2026): Oozaru (o mais fraco) e Oozaru Guerreiro (o mais forte), mesmo
  // critério das outras hunts (nível 48 não mata com facilidade). Oozaru Super = chefe raro (6 a 12 h, em qualquer
  // ponto da hunt), forte demais para um nível 48–54 sozinho e sem equipamento (o "set" ainda não existe no jogo).
  'vegeta-lava': {
    // `corpo`: quanto o mob é mais largo que um personagem comum (unidades). Soma no alcance do soco dele e no de quem
    // bate nele: sem isso o gigante encostava no centro do Goku e ficava virando de lado (relato do Pedro, 05/11).
    oozaru: { level:106, nivelBase:48, hp: 3300, attack: 100, xp: 700, defesa: 38, speed: 104, corpo: 34, name: 'Oozaru' },
    oozaruGuerreiro: { level:128, nivelBase:54, hp: 5300, attack: 142, xp: 1600, defesa: 50, speed: 100, corpo: 38, name: 'Oozaru Guerreiro' },
    // Oozaru Super (dourado DE ARMADURA): fora da Lava desde 06/11 (Pedro), guardado para ser chefe de outro planeta.
    oozaruSuper: { level:128, nivelBase:54, hp: 30000, attack: 180, xp: 30000, defesa: 60, speed: 92, corpo: 62, name: 'Oozaru Super' },
    // Oozaru Dourado (sem armadura, como no GT): chefe raro da Lava no lugar dele (Pedro, 06/11). Golpes próprios:
    // pancada com os dois punhos (área em volta dele) e laser negro pela boca mirando o personagem. Mesma força por ora.
    oozaruDourado: { level:128, nivelBase:54, hp: 30000, attack: 180, xp: 30000, defesa: 60, speed: 92, corpo: 62, name: 'Oozaru Dourado' }
  },
  // Grande Cratera (decisão do Pedro, 06/11/2026): Rei Vegeta (o mais fraco) e Broly (o mais forte), no lugar dos
  // Porungas provisórios. Mesmo critério das outras hunts: um nível 54 não mata com facilidade.
  'vegeta-cratera': {
    reiVegeta: { level:128, nivelBase:54, hp: 3900, attack: 118, xp: 1100, defesa: 44, speed: 108, corpo: 12, name: 'Rei Vegeta' },
    broly: { level:150, nivelBase:60, hp: 5900, attack: 150, xp: 2600, defesa: 52, speed: 106, corpo: 30, name: 'Broly' },
    boss: { level:150, nivelBase:60, hp: 32000, attack: 200, xp: 4000, defesa: 38, speed: 80, name: 'Porunga BOSS' },
    // Freeza BOSS (ideia do Pedro, 05/11): em pé até 40% da vida (Death Beam), depois na nave, mais forte (Supernova).
    // PROVISÓRIO: lugar (chefe raro da Grande Cratera, no lugar do Porunga BOSS) e números, até o Pedro decidir.
    freezaBoss: { level:150, nivelBase:60, hp: 85000, attack: 230, xp: 60000, defesa: 70, speed: 96, corpo: 32, name: 'Freeza',
      nave: { aPartirDe: 0.4, ataque: 1.35, defesa: 1.25, velocidade: 0.8, corpo: 40, nome: 'Freeza (nave)' } }
  },
  // Terra Selvagem (Pedro, 25/11/2026): os dinossauros são a PRIMEIRA hunt do jogo (Vale da Cachoeira) e os robôs do
  // Pilaf ficam no Descampado do Oeste. Ordem de força decidida pelo Pedro (do mais fraco ao mais forte); os NÚMEROS
  // são PROVISÓRIOS, pela curva da hunt inicial de Namek, até o Pedro ajustar os níveis das hunts.
  'terra-montanhas': {
    estegossauro: { level:2, hp: 62, attack: 9, xp: 14, defesa: 1, speed: 100, corpo: 12, name: 'Estegossauro' },
    triceratops: { level:4, hp: 98, attack: 12, xp: 23, defesa: 2, speed: 110, corpo: 12, name: 'Triceratops' },
    espinossauro: { level:7, hp: 150, attack: 16, xp: 35, defesa: 4, speed: 112, corpo: 16, name: 'Espinossauro' },
    // Yamcha e Puar (Pedro, 25/11/2026): Punho do Lobo de perto e rajada de ki de longe; PROVISÓRIO, entre o Espinossauro e o T-Rex.
    yamcha: { level:9, hp: 185, attack: 18, xp: 44, defesa: 5, speed: 118, name: 'Yamcha' },
    tiranossauro: { level:10, hp: 202, attack: 19, xp: 48, defesa: 5, speed: 115, corpo: 20, name: 'Tiranossauro' }
  },
  // Saga do Cell (Pedro, 25/11/2026): o Deserto das Mesas é a hunt do Cell (Cell Jr., Cell Imperfeito e o C20 como chefe
  // raro, que derruba o Bilhete de Ouro do Dr. Gero). Semiperfeito e Perfeito são chefes PESSOAIS da cadeia (saga-cell.mjs).
  // Números PROVISÓRIOS, na faixa atual do Deserto; balanceamento em aberto.
  'terra-deserto': {
    cellJr: { level:40, nivelBase:30, hp: 2000, attack: 64, xp: 220, defesa: 24, speed: 118, name: 'Cell Jr.' },
    cellImperfeito: { level:56, nivelBase:34, hp: 3400, attack: 88, xp: 600, defesa: 31, speed: 106, name: 'Cell Imperfeito' },
    c20: { level:62, nivelBase:36, hp: 16000, attack: 110, xp: 6000, defesa: 36, speed: 92, corpo: 6, name: 'C20 (Dr. Gero)' },
    cellSemiperfeito: { level:62, nivelBase:36, hp: 26000, attack: 125, xp: 9000, defesa: 40, speed: 98, corpo: 14, name: 'Cell Semiperfeito' },
    cellPerfeito: { level:62, nivelBase:36, hp: 45000, attack: 150, xp: 20000, defesa: 48, speed: 104, corpo: 10, name: 'Cell Perfeito' }
  },
  // Ilha da Arena: área da última task da Saga do Cell, liberada após vencer o Semiperfeito do Deserto.
  'terra-ilha': {
    androide18Pos: { level:56, nivelBase:34, hp: 3200, attack: 86, xp: 560, defesa: 30, speed: 112, name: 'C18' },
    androide17Pos: { level:58, nivelBase:35, hp: 3500, attack: 92, xp: 640, defesa: 32, speed: 114, name: 'C17' },
    cellImperfeito: { level:56, nivelBase:34, hp: 3400, attack: 88, xp: 600, defesa: 31, speed: 106, name: 'Cell Imperfeito' },
    cellSemiperfeito: { level:62, nivelBase:36, hp: 26000, attack: 125, xp: 9000, defesa: 40, speed: 98, corpo: 14, name: 'Cell Semiperfeito' }
  },
  // Montanhas Nevadas: os Androides (Pedro, 25/11/2026), 18 < 17 < 16. Números PROVISÓRIOS, na faixa atual da hunt.
  'terra-neve': {
    androide18: { level:84, nivelBase:42, hp: 3000, attack: 92, xp: 520, defesa: 34, speed: 112, name: 'Androide 18' },
    androide17: { level:95, nivelBase:45, hp: 4300, attack: 110, xp: 950, defesa: 40, speed: 114, name: 'Androide 17' },
    androide16: { level:106, nivelBase:48, hp: 5600, attack: 130, xp: 1900, defesa: 48, speed: 100, corpo: 14, name: 'Androide 16' }
  },
  'terra-descampado': {
    roboMai: { level:6, hp: 132, attack: 14, xp: 31, defesa: 3, speed: 108, name: 'Robô da Mai' },
    roboShu: { level:8, hp: 168, attack: 17, xp: 39, defesa: 4, speed: 108, name: 'Robô do Shu' },
    roboPilaf: { level:12, hp: 238, attack: 22, xp: 56, defesa: 6, speed: 104, name: 'Robô do Pilaf' },
    // Chefe raro do Descampado (aparece num ponto sorteado da hunt, 45–90 min), números PROVISÓRIOS.
    maquinaPilaf: { level:18, hp: 3600, attack: 42, xp: 700, defesa: 9, speed: 90, corpo: 28, name: 'Máquina Pilaf' }
  }
};
// Tipo que não existe na área (testes, mob avulso) usa a versão da hunt inicial ou da primeira que o tem.
// Aggro (pedido do Pedro, 05/11/2026), configurável por mob nos ATRIBUTOS; estes são os padrões:
// - agressivo: ataca quem chega perto (true) ou só reage quando é atacado (false, mob neutro);
// - aggro: raio em que o mob agressivo nota o jogador (unidades do mundo; chefe e mob grande enxergam mais longe);
// - perseguicao: quanto ele se afasta do ponto de origem antes de desistir e voltar (curando-se ao chegar).
// O raio antigo (300, fixo) era curto para os mapas do Vegeta: mobs a 400–500 do jogador não reagiam.
export const AGGRO_PADRAO = { agressivo: true, aggro: 380, perseguicao: 650 };
// Chefes (subchefe e chefes raros). Pedido do Pedro (10/11/2026): todo chefe leva "BOSS" no nome, para se
// diferenciar dos mobs comuns na placa, no alvo, no Bestiário e nos avisos. Chefe novo: basta entrar nesta lista.
export const TIPOS_CHEFE = new Set(['neva', 'boss', 'subboss', 'oozaruSuper', 'oozaruDourado', 'freezaBoss', 'maquinaPilaf', 'c20', 'cellSemiperfeito', 'cellPerfeito']);
// Apenas chefes que têm um spawn real no mundo; compartilhado pelo God Mode e pela validação no servidor.
export const CHEFES_TESTE = Object.freeze([
  { type:'subboss', area:'media' },
  { type:'neva', area:'norte' },
  { type:'boss', area:'dificil' },
  { type:'oozaruDourado', area:'vegeta-lava' },
  { type:'freezaBoss', area:'vegeta-cratera' }
]);
// Forma entre parênteses fica no fim: "Freeza (nave)" → "Freeza BOSS (nave)".
export const nomeDeChefe = nome => /\bBOSS\b/.test(nome) ? nome : nome.replace(/^(.*?)(\s*\([^)]*\))?$/, (_, n, forma = '') => n + ' BOSS' + forma);
export function mobStats(type, area = 'inicial') {
  // A Floresta do Sudeste usa as mesmas espécies dos Cânions, com a faixa da Terra.
  const especies = ATRIBUTOS[area === 'terra-floresta' ? 'vegeta-canions' : area];
  const base = especies?.[type] || Object.values(ATRIBUTOS).find(a => a[type])?.[type] || ATRIBUTOS.inicial.melee;
  const faixa = areaPorId(area)?.nivel;
  const atributosEscalados = especies?.[type] && faixa ? balancearInimigo(type, especies, base, faixa) : {};
  const grande = TIPOS_CHEFE.has(type);
  const chefe = TIPOS_CHEFE.has(type) ? { name: nomeDeChefe(base.name), ...(base.nave ? { nave: { ...base.nave, nome: nomeDeChefe(base.nave.nome) } } : {}) } : {};
  const { nivelBase: _nivelBase, ...atributosOriginais } = base;
  const mob = { ...AGGRO_PADRAO, aggro: AGGRO_PADRAO.aggro + (grande ? 80 : 0) + 2 * (base.corpo || 0), perseguicao: grande ? 560 : AGGRO_PADRAO.perseguicao, ...atributosOriginais, ...atributosEscalados, ...chefe };
  return { ...mob, projetil:configurarProjetilMob(type,mob) };
}
function balancearInimigo(tipo, especies, base, [inicio, fim]) {
  const chefe = TIPOS_CHEFE.has(tipo);
  const referencia = base.nivelBase ?? base.level;
  const comuns = Object.entries(especies).filter(([id]) => !TIPOS_CHEFE.has(id)).map(([, mob]) => mob.level);
  const primeiro = Math.min(...comuns), ultimo = Math.max(...comuns);
  const posicao = primeiro === ultimo ? 0.5 : (base.level - primeiro) / (ultimo - primeiro);
  const level = tipo === 'cellPerfeito' ? areaPorId('terra-ilha').nivel[1]
    : chefe ? fim : inicio === 1 ? base.level : Math.round(inicio + (fim - inicio) * (0.25 + 0.75 * posicao));
  const jogador = statsFor(level);
  const original = statsFor(referencia);
  // Defesa inimiga cresce mais devagar que a do jogador. HP considera essa mitigação
  // para evitar multiplicar o tempo de combate em duas frentes nos níveis altos.
  const defesa = inicio === 1 ? base.defesa : Math.round(2 + 1.9 * Math.sqrt(level) + (chefe ? 7 : posicao * 4));
  const mitigacao = 1 + defesa * 0.03;
  const resistencia = chefe ? Math.max(12, base.hp / (original.attack * (1 + base.defesa * 0.03)) * 0.65) : 4.5 + 2.5 * posicao;
  const hp = inicio === 1 ? Math.round(base.hp * 0.7) : Math.round(jogador.attack * resistencia * mitigacao);
  const proporcaoDano = chefe ? Math.min(0.085, (base.attack / original.hp) * 0.8) : 0.028 + 0.009 * posicao;
  const attack = inicio === 1 ? Math.round(base.attack * 0.35) : Math.round(jogador.hp * (1 + jogador.defense * 0.03) * proporcaoDano);
  // A curva de XP do personagem fica intacta. A recompensa é uma fração menor da
  // barra nos níveis mais altos mesmo quando a criatura está no nível do jogador.
  const abatesPorNivel = 4 + 10 * level ** 0.48;
  const bonusXP = tipo === 'subboss' ? 4 : chefe ? Math.min(20, Math.max(8, resistencia / 3)) : 1;
  const xp = Math.max(1, Math.round(xpForLevel(level) / abatesPorNivel * bonusXP));
  // A primeira hunt apresenta os dinossauros sem puxar vários grupos enquanto o
  // jogador ainda depende do ataque básico e dos consumíveis iniciais.
  const aggro = inicio === 1 ? { aggro: 210 } : {};
  return { level, hp, attack, defesa, xp, ...aggro };
}
// Segundos até o mob voltar depois de derrotado.
// Chefe raro (decisão do Pedro, 03/11): volta num tempo sorteado entre 45 e 90 minutos.
export const CHEFE_RARO = { minimo: 45 * 60, maximo: 90 * 60 };
// Tempo de cada chefe raro, por tipo. Oozaru Super (Pedro, 05/11): entre 6 e 12 horas, "muito forte e raro".
export const TEMPO_CHEFE_RARO = { neva: CHEFE_RARO, boss: CHEFE_RARO, maquinaPilaf: CHEFE_RARO, c20: CHEFE_RARO, oozaruSuper: { minimo: 6 * 3600, maximo: 12 * 3600 },
  oozaruDourado: { minimo: 6 * 3600, maximo: 12 * 3600 },
  freezaBoss: { minimo: 6 * 3600, maximo: 12 * 3600 } };   // Freeza: provisório, como o Oozaru Super
export function janelaRenascimento(tipo, area) {
  if (TEMPO_CHEFE_RARO[tipo]) return TEMPO_CHEFE_RARO[tipo];
  if (tipo === 'subboss') return { minimo: 60, maximo: 60 };
  const nivel = areaPorId(area)?.nivel?.[0];
  if (nivel == null) return { minimo: 12, maximo: 12 };
  if (nivel < 100) return { minimo: 40, maximo: 55 };
  if (nivel < 380) return { minimo: 50, maximo: 70 };
  return { minimo: 65, maximo: 85 };
}
export function renasceEm(tipo, random = Math.random, area) {
  const { minimo, maximo } = janelaRenascimento(tipo, area);
  return minimo === maximo ? minimo : minimo + random() * (maximo - minimo);
}
// Onde o chefe raro de cada hunt nasce: num ponto sorteado de um círculo (px da imagem → mundo).
// `aviso`: o que aparece para quem está na hunt quando ele surge.
export const CHEFES_RAROS = {
  // Neva na cratera central; raio e respawn 45–90 min são provisórios (09/11/2026).
  norte: { x:naEscala(2730), y:naEscala(400), r:naEscala(100), aviso:'despertou na Cratera de Nail!' },
  dificil: { x: naEscala(4065), y: naEscala(1150), r: naEscala(190), aviso: 'apareceu no círculo do planalto!' },
  // Vegeta: no meio do chão da Grande Cratera (provisório, como o chefe).
  'vegeta-cratera': { x: 2100 * PLANETS.vegeta.escala, y: 2470 * PLANETS.vegeta.escala, r: 300 * PLANETS.vegeta.escala, aviso: 'chegou à Grande Cratera!' },
  // Oozaru Super: num ponto sorteado em qualquer lugar da hunt (todaHunt), não num círculo.
  'vegeta-lava': { todaHunt: true, aviso: 'surgiu nos Campos de Lava!' },
  // Máquina Pilaf: num ponto sorteado do Descampado do Oeste (Pedro, 25/11/2026).
  'terra-descampado': { todaHunt: true, aviso: 'invadiu o Descampado do Oeste!' },
  // C20: num ponto sorteado do Deserto das Mesas (Saga do Cell, 25/11/2026).
  'terra-deserto': { todaHunt: true, aviso: 'apareceu no Deserto das Mesas! Ele guarda o Bilhete de Ouro do Dr. Gero.' }
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
function espalhar(random, area, n, tipo, opcoes = {}) {
  const z = areaPorId(area), k = PLANETS[z.planet].escala, candidatos = [];
  const passo = (opcoes.passo ?? 170) * k, margem = 90 * k, fim = 60 * k, sorteio = 60 * k;
  for (let y = z.y + margem; y < z.y + z.h - fim; y += passo) for (let x = z.x + margem; x < z.x + z.w - fim; x += passo) {
    const px = x + (random() - 0.5) * sorteio, py = y + (random() - 0.5) * sorteio;
    const corpoLivre = !opcoes.raio || (pesLivres(z.planet, px, py, opcoes.raio, area) && !pontoNaZonaSegura(z.planet, area, px, py, opcoes.raio));
    if (corpoLivre && em_terra(area, px, py) && pontoAlcancavelDesde(z.planet, z.chegada, { x: px, y: py }, area)) candidatos.push({ x: px, y: py });
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
    // Grade própria e margem do maior corpo: os gigantes não nascem presos na costa.
    // Os oito Nails ficam na metade sul, perto da chegada; Piccolos ocupam o norte.
    ...espalhar(random, 'norte', 16, i => i < 8 ? 'piccoloDaimaoh' : 'nail', { passo:120, raio:(22 + 22) / 0.6 }),
    { type:'neva', ...pontoNoCirculo(random,'norte'), area:'norte', raro:true },
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
    { type: 'freezaBoss', ...pontoNoCirculo(random, 'vegeta-cratera'), area: 'vegeta-cratera', raro: true },
    // Descampado do Oeste: robôs do Pilaf (Pedro, 25/11/2026), mais Mai e Shu que Pilaf; a Máquina Pilaf é o chefe raro.
    ...espalhar(random, 'terra-descampado', 20, i => ['roboMai', 'roboShu', 'roboMai', 'roboShu', 'roboPilaf'][i % 5]),
    { type: 'maquinaPilaf', ...pontoNoCirculo(random, 'terra-descampado'), area: 'terra-descampado', raro: true },
    // Deserto das Mesas = hunt do Cell (Pedro, 25/11/2026): mais Cell Jr. que Cell Imperfeito, e o C20 como chefe raro.
    ...espalhar(random, 'terra-deserto', 20, i => i % 3 === 2 ? 'cellImperfeito' : 'cellJr'),
    { type: 'c20', ...pontoNoCirculo(random, 'terra-deserto'), area: 'terra-deserto', raro: true },
    // Montanhas Nevadas: os Androides (Pedro, 25/11/2026), mais 18 e 17 que 16.
    ...espalhar(random, 'terra-neve', 16, i => ['androide18', 'androide17', 'androide18', 'androide17', 'androide16'][i % 5]),
    // Vale da Cachoeira: os dinossauros, primeira hunt do jogo (Pedro, 25/11/2026); mais dos fracos que dos fortes.
    ...espalhar(random, 'terra-montanhas', 10, i => ['estegossauro', 'triceratops', 'estegossauro', 'espinossauro', 'triceratops', 'yamcha', 'tiranossauro'][i % 7], { passo: 110 }),
    // Ilha da Arena: mobs da Grande Cratera PROVISÓRIOS (Pedro, 25/11/2026).
    // Ilha da Arena: última task da Saga do Cell — só C17, C18 (pós-batalha) e Cell Imperfeito (Pedro, 25/11/2026).
    ...espalhar(random, 'terra-ilha', 12, i => ['androide18Pos', 'androide17Pos', 'cellImperfeito'][i % 3]),
    // Floresta do Sudeste: mobs dos Cânions PROVISÓRIOS (Pedro, 25/11/2026).
    ...espalhar(random, 'terra-floresta', 12, i => CANIONS[i % CANIONS.length])
  ];
}
