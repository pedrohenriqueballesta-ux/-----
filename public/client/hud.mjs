// HUD: tudo o que o jogo mostra e liga na página (barras, botões, painéis, notificações, loja,
// janela do portal e mapa). O resto do cliente (mapa, rede, teclado, joystick) fica em game.mjs.
// A HUD está em troca (ramo hud-nova): qualquer elemento pode sumir da página sem derrubar o jogo.
// `$` devolve um elemento vazio que aceita tudo e não faz nada, e avisa no console uma vez por id.
import { CONFIG, PLANETS, PLANETAS_DE_HUNT, PORTAIS, ZONES, zonasDe, areaPorId, lugar } from '../shared/index.mjs';
import { CURA, curaPorNivel } from '../shared/cura.mjs';
import { instalarPainelMovel } from '../render/painel-movel.mjs';

const avisados = new Set();
const VAZIO = new Proxy(function () {}, {
  get: (_, chave) => chave === Symbol.toPrimitive ? () => '' : chave === Symbol.iterator ? [][Symbol.iterator].bind([]) : ['options', 'children'].includes(chave) ? [] : VAZIO,
  set: () => true,
  apply: () => VAZIO
});
export const $ = id => {
  const elemento = document.getElementById(id);
  if (elemento) return elemento;
  if (!avisados.has(id)) { avisados.add(id); console.warn('HUD: elemento #' + id + ' não existe na página (ignorado).'); }
  return VAZIO;
};

// Ligação com o jogo: ação no servidor, chamada à API, estado atual e soltar as teclas.
let ctx = null;
const action = data => ctx?.action(data);

const integer = v => Math.round(v).toLocaleString('pt-BR');
const clock = seconds => { const n = Math.max(0, Math.ceil(seconds)); return Math.floor(n / 60) + ':' + String(n % 60).padStart(2, '0'); };
const itemNames = { food: 'Presunto', ki: 'Poção de Ki', seed15: 'Semente 15%', seed30: 'Semente 30%', seed50: 'Semente 50%', seed100: 'Semente 100%' };

function renderSkillMeta(element, cost, detail) {
  if (!element) return;
  if (cost == null) { element.textContent = detail; return; }
  const costBadge = document.createElement('span'); costBadge.className = 'skill-cost'; costBadge.setAttribute('aria-label', cost + ' Ki');
  const costValue = document.createElement('b'); costValue.className = 'skill-cost-value'; costValue.textContent = cost;
  const costUnit = document.createElement('span'); costUnit.className = 'skill-cost-unit'; costUnit.textContent = 'KI';
  costBadge.replaceChildren(costValue, costUnit);
  const detailLabel = document.createElement('span');
  const isCooldown = /^(?:\d+(?:[.,]\d+)?s|\d+:\d{2})$/.test(detail);
  detailLabel.className = isCooldown ? 'skill-cost-detail skill-cooldown' : 'skill-cost-detail';
  detailLabel.textContent = detail;
  element.replaceChildren(costBadge, detailLabel);
}

export function notify(text) {
  if ($('shopDialog').open) $('shopNotice').textContent = text;
  const element = document.createElement('div'); element.className = 'toast'; element.textContent = text;
  $('notifications').append(element); setTimeout(() => element.remove(), 4200);
  while ($('notifications').children.length > 3) $('notifications').firstChild.remove();
  // O chat da HUD mostra os avisos como mensagens do sistema (o chat entre jogadores ainda não existe).
  const linhas = document.getElementById('chatLinhas');
  if (linhas) {
    const linha = document.createElement('p'), tag = document.createElement('b');
    tag.textContent = '[Sistema] '; linha.append(tag, text); linhas.append(linha);
    while (linhas.children.length > 40) linhas.firstChild.remove();
    linhas.scrollTop = linhas.scrollHeight;
  }
}

// Escala da HUD: tudo é medido em múltiplos de --e (1 = janela de 1600×950). Acompanha o tamanho da
// janela e a resolução; o teto e o piso evitam HUD gigante num 4K e ilegível numa janela pequena.
function ajustarEscala() {
  const e = Math.max(0.6, Math.min(2.2, innerWidth / 1600, innerHeight / 950));
  document.documentElement.style.setProperty('--e', e.toFixed(3));
}
ajustarEscala(); addEventListener('resize', ajustarEscala);

export function atualizarHud(snapshot, playerId) {
  const s = snapshot?.self, p = snapshot?.players.find(v => v.id === playerId); if (!s || !p) return;
  $('playerName').textContent = p.name; $('levelBadge').textContent = 'Nv. ' + s.level;
  $('hpBar').style.width = Math.max(0, 100 * s.hp / s.stats.hp) + '%';
  $('kiBar').style.width = Math.max(0, 100 * s.ki / s.stats.ki) + '%';
  $('hpText').textContent = 'HP ' + integer(s.hp) + ' / ' + integer(s.stats.hp);
  $('kiText').textContent = 'KI ' + integer(s.ki) + ' / ' + integer(s.stats.ki);
  const xpPct = Math.min(100, s.xp / Math.max(1, s.xpNext) * 100);
  $('xpLabel').textContent = 'Nível ' + s.level; $('xpNumbers').textContent = integer(s.xp) + ' / ' + integer(s.xpNext) + ' XP';
  $('xpBar').style.width = xpPct + '%';
  $('hudXpBar').style.width = xpPct + '%'; $('hudXpText').textContent = 'EXP ' + Math.round(xpPct) + '%';
  $('formLabel').textContent = s.transformed ? 'SUPER SAIYAJIN' : 'FORMA BASE';
  $('nextUnlock').textContent = s.level < 2 ? 'Próximo: Kaioken + Barreira de Ki · NV. 2' : s.level < 3 ? 'Próximo: Kamehameha · NV. 3' : s.level < 5 ? 'Próximo: Super Saiyajin · NV. 5' : s.level < 10 ? 'Próximo: Genki Dama · NV. 10' : 'Todas as técnicas principais desbloqueadas.';
  const stats = [['Vida', integer(s.stats.hp)], ['Ki', integer(s.stats.ki)], ['Ataque', s.stats.attack.toFixed(1)], ['Defesa', s.stats.defense.toFixed(1)], ['Cura / comida', s.stats.healing.toFixed(2) + '×'], ['Mochila', s.stats.capacity.toFixed(1) + ' kg'], ['Chance loot', Math.round(s.stats.lootChance * 100) + '%'], ['Movimento', Math.round(s.stats.mobility)]];
  $('stats').replaceChildren(...stats.map(pair => { const div = document.createElement('div'); div.className = 'stat'; const label = document.createElement('span'), value = document.createElement('b'); label.textContent = pair[0]; value.textContent = pair[1]; div.append(label, value); return div; }));
  for (const key of ['autoAttack', 'autoSkills', 'autoFood', 'autoKi', 'autoSeed']) $(key).checked = s[key];
  $('autoHeal').checked = s.autoHeal;
  for (const key of ['healThreshold', 'kiThreshold', 'seedThreshold']) {
    if (document.activeElement !== $(key)) $(key).value = s[key];
  }
  $('autoHuntSummary').textContent = s.autoHunt ? 'ON' : 'OFF';
  $('autoHuntButton').classList.toggle('ligado', s.autoHunt);
  const hunt = areaPorId(s.area);
  $('quickHunt').disabled = !s.autoHunt && (!hunt || hunt.segura);
  $('autoHuntLocation').textContent = !hunt || hunt.segura ? 'Entre em uma hunt para iniciar.' : (s.autoHunt ? 'Caçando em ' : 'Local: ') + hunt.name;
  $('autoKiInfo').textContent = `${s.inventory.ki} poções · ${!s.inventory.ki ? 'sem estoque' : s.kiRemaining > 0 ? 'recarga ' + s.kiRemaining.toFixed(1) + 's' : 'pronto para usar'}`;
  $('autoSeedInfo').textContent = `${s.inventory['seed' + s.seedSelected]} sementes de ${s.seedSelected}% · ${!s.inventory['seed' + s.seedSelected] ? 'sem estoque' : s.seedRemaining > 0 ? 'recarga ' + s.seedRemaining.toFixed(1) + 's' : 'pronto para usar'}`;
  $('huntButton').classList.toggle('running', s.autoHunt);
  $('huntButton').textContent = s.autoHunt ? 'Pausar caça automática  ■' : 'Iniciar caça automática  ↗';
  $('foodCount').textContent = s.inventory.food; $('kiCount').textContent = s.inventory.ki;
  $('zeni').textContent = integer(s.zeni) + ' Z'; $('materials').textContent = s.inventory.scrap + ' sucatas · ' + s.inventory.crystal + ' cristais';
  $('bagLabel').textContent = s.weight.toFixed(1).replace('.', ',') + ' / ' + Math.round(s.stats.capacity) + ' kg';
  $('hudZeni').textContent = integer(s.zeni);
  atualizarMochila(s);
  if (document.activeElement !== $('seedSelect')) $('seedSelect').value = String(s.seedSelected);
  for (const option of $('seedSelect').options) option.textContent = option.value + '% · ' + (s.inventory['seed' + option.value] || 0);
  $('seedButton').disabled = s.seedRemaining > 0 || !s.inventory['seed' + s.seedSelected];
  $('seedCount').textContent = s.inventory['seed' + s.seedSelected] || 0;
  $('seedCooldown').textContent = s.seedRemaining > 0 ? Math.ceil(s.seedRemaining) + 's' : '';
  $('kiPotionButton').disabled = s.kiRemaining > 0 || !s.inventory.ki;
  $('kiCooldown').textContent = s.kiRemaining > 0 ? Math.ceil(s.kiRemaining) + 's' : '';
  $('seedStatus').textContent = s.seedRemaining > 0 ? 'Todas as sementes em recarga · ' + Math.ceil(s.seedRemaining) + 's' : 'Cura instantânea · recarga compartilhada de 20s';
  $('seedStatus').classList.toggle('waiting', s.seedRemaining > 0);
  $('kiPotionText').textContent = s.kiRemaining > 0 ? 'Recarga: ' + Math.ceil(s.kiRemaining) + 's' : 'Recupera 45% · Q';
  $('foodBuff').textContent = s.foodRemaining > 0 ? '🍖 Comida • ' + clock(s.foodRemaining) : '🍖 Sem comida • F';
  $('foodBuff').classList.toggle('inactive', s.foodRemaining <= 0);
  $('huntStatus').textContent = s.autoHunt ? 'CAÇA AUTOMÁTICA ATIVA' : 'Exploração manual';
  for (const [botao, ligado] of [[$('quickHunt'), s.autoHunt], ...[...document.querySelectorAll('[data-toggle]')].map(b => [b, s[b.dataset.toggle]])]) {
    botao.classList.toggle('ligado', Boolean(ligado)); const estado = botao.querySelector('b'); if (estado) estado.textContent = ligado ? 'ON' : 'OFF';
  }
  // Região = a área fechada onde o jogador está (ou o planeta, na Terra).
  const z = areaPorId(s.area), seguro = !z || z.segura || s.naZonaSegura;
  $('safeZoneAviso').classList.toggle('visivel', Boolean(s.naZonaSegura));
  $('safeZoneAviso').setAttribute('aria-hidden', String(!s.naZonaSegura));
  // Mede a mensagem para manter o alvo logo abaixo em qualquer escala da HUD.
  $('targetHud').style.setProperty('--altura-safe-zone', ($('safeZoneAviso').offsetHeight + 12) + 'px');
  $('regionName').textContent = z?.name || PLANETS[snapshot.planet]?.name || 'Terra';
  $('regionType').textContent = z?.pvp ? 'ÁREA PVP' : seguro ? 'ÁREA SEGURA' : s.seguroRemaining > 0 ? 'CHEGADA PROTEGIDA' : 'HUNT · NÍVEL ' + z.nivel[0] + '–' + z.nivel[1];
  for (const [classe, ligado] of [['pvp', Boolean(z?.pvp)], ['seguro', !z?.pvp && seguro]]) document.querySelector('.hud-mapa')?.classList.toggle(classe, ligado);
  $('onlineText').textContent = snapshot.players.length + (snapshot.players.length === 1 ? ' jogador conectado' : ' jogadores conectados');
  $('coordsText').textContent = 'X: ' + Math.round(p.x) + '   Y: ' + Math.round(p.y);
  $('missionKills').textContent = Math.min(10, s.kills || 0);
  $('missionMaterials').textContent = (s.inventory.scrap || 0) + (s.inventory.crystal || 0);
  $('missionLevel').textContent = s.level;
  const target = snapshot.mobs.find(m => m.id === s.targetId) || snapshot.players.find(v => v.id === s.targetId);
  $('targetHud').classList.toggle('hidden', !target || target.hp <= 0);
  if (target) { $('targetName').textContent = target.name + (target.level ? ' • Nv. ' + target.level : ''); $('targetBar').style.width = 100 * target.hp / target.maxHp + '%'; $('targetHp').textContent = integer(target.hp) + ' / ' + integer(target.maxHp); }
  const cura = s.cura || { ...curaPorNivel(s.level), cooldown: CURA.cooldown, remaining: 0 };
  const skillState = {
    heal: { required: 1, cost: cura.custo, cooldown: cura.cooldown, remaining: cura.remaining,
      text: (cura.remaining > 0 ? cura.remaining.toFixed(1) : '1,5') + 's',
      detail: `Cura de Vida · Nv. ${cura.nivel} · ${Number((cura.percentual * 100).toFixed(1))}% do HP máximo · ${cura.custo} Ki · recarga 1,5s · tecla 1` },
    kame: { required: CONFIG.skills.kame, cost: CONFIG.skillCosts.kame, cooldown: CONFIG.skillCooldowns.kame, remaining: s.kameRemaining || 0, text: s.level < CONFIG.skills.kame ? CONFIG.skillCooldowns.kame + 's' : s.kameRemaining > 0 ? s.kameRemaining.toFixed(1) + 's' : CONFIG.skillCooldowns.kame + 's' },
    kaioken: { required: CONFIG.skills.kaioken, cost: CONFIG.skillCosts.kaioken, cooldown: CONFIG.skillCooldowns.kaioken, remaining: s.kaiokenRemaining || 0, text: s.level < CONFIG.skills.kaioken ? CONFIG.skillCooldowns.kaioken + 's' : s.kaiokenActive ? 'ATIVO' : s.kaiokenRemaining > 0 ? s.kaiokenRemaining.toFixed(1) + 's' : CONFIG.skillCooldowns.kaioken + 's', active: s.kaiokenActive },
    barrier: { required: CONFIG.skills.barrier, cost: CONFIG.skillCosts.barrier, cooldown: CONFIG.skillCooldowns.barrier, remaining: s.barrierRemaining || 0, text: s.level < CONFIG.skills.barrier ? CONFIG.skillCooldowns.barrier + 's' : s.barrierActive ? 'PROTEGIDO' : s.barrierRemaining > 0 ? s.barrierRemaining.toFixed(1) + 's' : CONFIG.skillCooldowns.barrier + 's', active: s.barrierActive },
    genki: { required: CONFIG.skills.genki, cost: CONFIG.skillCosts.genki, cooldown: CONFIG.skillCooldowns.genki, remaining: s.genkiRemaining || 0, text: s.level < CONFIG.skills.genki ? CONFIG.skillCooldowns.genki + 's' : s.genkiRemaining > 0 ? s.genkiRemaining.toFixed(1) + 's' : CONFIG.skillCooldowns.genki + 's' }
  };
  for (const button of document.querySelectorAll('[data-skill]')) {
    const skill = button.dataset.skill, state = skillState[skill]; if (!state) continue;
    const locked = s.level < state.required;
    button.classList.toggle('locked', locked); button.disabled = locked || state.remaining > 0 || (skill === 'kaioken' && s.kaiokenActive) || (skill === 'barrier' && s.barrierActive);
    if (skill === 'heal') button.disabled ||= s.hp <= 0 || s.hp >= s.stats.hp || s.ki < cura.custo;
    button.classList.toggle('active', Boolean(state.active));
    const label = button.querySelector('small');
    renderSkillMeta(label, state.cost, state.text);
    let cooldown = button.querySelector('.cooldown-overlay');
    if (!cooldown) { cooldown = document.createElement('span'); cooldown.className = 'cooldown-overlay'; cooldown.setAttribute('aria-hidden', 'true'); button.append(cooldown); }
    const remaining = state.remaining;
    cooldown.textContent = remaining > 0 ? (remaining >= 10 ? Math.ceil(remaining) : remaining.toFixed(1)) + 's' : '';
    button.classList.toggle('cooling', remaining > 0);
    button.title = state.detail || (button.querySelector('strong')?.textContent || skill) + ' · ' + state.text + (button.querySelector('kbd') ? ' · tecla ' + button.querySelector('kbd').textContent : '');
  }
  const transformLocked = s.level < CONFIG.skills.transform;
  $('transformButton').disabled = transformLocked || (!s.transformed && (s.transformRemaining || 0) > 0);
  $('transformButton').classList.toggle('locked', transformLocked); $('transformButton').classList.toggle('active', s.transformed);
  $('transformButton').classList.toggle('cooling', !s.transformed && s.transformRemaining > 0);
  let transformCooldown = $('transformButton').querySelector('.cooldown-overlay');
  if (!transformCooldown) { transformCooldown = document.createElement('span'); transformCooldown.className = 'cooldown-overlay'; transformCooldown.setAttribute('aria-hidden', 'true'); $('transformButton').append(transformCooldown); }
  transformCooldown.textContent = !s.transformed && s.transformRemaining > 0 ? s.transformRemaining.toFixed(1) + 's' : '';
  renderSkillMeta(document.getElementById('transformText'), CONFIG.skillCosts.transform, transformLocked ? CONFIG.skillCooldowns.transform + 's' : s.transformed ? 'ATIVO · 3,5 Ki/s' : s.transformRemaining > 0 ? Math.ceil(s.transformRemaining) + 's' : CONFIG.skillCooldowns.transform + 's');
  $('respawn').classList.toggle('hidden', s.hp > 0);
  $('respawnText').textContent = 'Voltando ao começo da área em ' + Math.ceil(s.respawnRemaining) + 's';
}

// Cor de cada destino: a da área (config.mjs: verde, laranja e vermelho para as hunts de Namekusei, azul
// para a Vila); azul para a Terra e as saídas (portal com vários destinos).
export const COR_DESTINO = { ...Object.fromEntries(ZONES.map(z => [z.id, z.cor])), terra: '#5fb6ff', saida: '#5fd8ff' };
const imagemDoDestino = id => PLANETS[lugar(id).planet].imagem;

// Janela do portal: um cartão por destino. Encostar no portal abre (client/game.mjs); escolher viaja.
// O servidor confere se o jogador está mesmo no portal e se o destino é dele.
export function abrirPortal(portal) {
  const nivel = ctx?.snapshot()?.self?.level || 1;
  $('portalTitulo').textContent = portal.planet === 'terra' ? 'PORTAL — ESCOLHA O PLANETA' : portal.destinos.length > 1 ? 'SAÍDA — ESCOLHA O DESTINO' : 'PORTAL';
  $('portalDestinos').replaceChildren(...portal.destinos.map(id => {
    const d = lugar(id), botao = document.createElement('button');
    botao.type = 'button'; botao.className = 'world-card';
    const orbe = document.createElement('span'); orbe.className = 'world-orb';
    orbe.style.backgroundImage = 'url(' + imagemDoDestino(id) + ')'; orbe.style.borderColor = COR_DESTINO[id];
    const nome = document.createElement('strong'); nome.textContent = d.planet === 'terra' ? 'Terra' : d.planet !== ctx?.snapshot()?.planet ? PLANETS[d.planet].name + ' — ' + d.name : d.name;
    const info = document.createElement('small');
    info.textContent = d.nivel ? 'Nível ' + d.nivel[0] + '–' + d.nivel[1] + (nivel < d.nivel[0] ? ' · perigoso' : '') : 'Área segura';
    if (d.nivel && nivel < d.nivel[0]) info.classList.add('perigo');
    botao.append(orbe, nome, info);
    botao.onclick = () => { $('portalDialog').close(); action({ type: 'portal', destino: id }); };
    return botao;
  }));
  $('portalDialog').showModal();
}

// Mapa (menu do topo): só consulta, não teleporta (decisão do Pedro, 03/11). Mostra o planeta onde o
// jogador está (na Terra, o primeiro planeta de hunt) com as áreas, os portais e onde ele está;
// viajar é sempre pelos portais.
function abrirMapa() {
  const snapshot = ctx?.snapshot(), aqui = snapshot?.self?.area, tela = $('mapaTela');
  const mundo = PLANETS[snapshot?.planet]?.hunts ? PLANETS[snapshot.planet] : PLANETAS_DE_HUNT[0], zonas = zonasDe(mundo.id);
  $('mapaTitulo').textContent = 'MAPA — ' + mundo.name.toUpperCase();
  $('mapaOnde').textContent = 'Você está em: ' + (areaPorId(aqui)?.name ? PLANETS[areaPorId(aqui).planet].name + ' — ' + areaPorId(aqui).name : 'Terra (lobby)');
  $('mapaLista').replaceChildren(...zonas.map(z => {
    const item = document.createElement('li'); item.style.setProperty('--cor', COR_DESTINO[z.id]);
    item.classList.toggle('aqui', z.id === aqui);
    item.textContent = z.name + (z.nivel ? ' · nível ' + z.nivel[0] + '–' + z.nivel[1] : ' · área segura') + (z.id === aqui ? ' · você está aqui' : '');
    return item;
  }));
  $('mapaDialog').showModal();
  const c = tela.getContext?.('2d'); if (!c) return;
  const kx = tela.width / mundo.w, ky = tela.height / mundo.h, solo = new Image();
  const desenhar = () => {
    c.fillStyle = '#0b2a2a'; c.fillRect(0, 0, tela.width, tela.height);
    if (solo.naturalWidth) c.drawImage(solo, 0, 0, tela.width, tela.height);
    c.fillStyle = '#04080c99'; c.fillRect(0, 0, tela.width, tela.height);
    // Cada área pelo nome, na cor dela, sobre a ilha (sem moldura: o próprio mapa mostra onde ela acaba).
    for (const z of zonas) {
      const x = (z.x + z.w / 2) * kx, y = (z.chegada.y - z.h * 0.18) * ky;
      c.font = (z.id === aqui ? 'bold 15px' : 'bold 13px') + ' system-ui, sans-serif'; c.textAlign = 'center'; c.lineJoin = 'round';
      c.lineWidth = 4; c.strokeStyle = '#000d'; c.strokeText(z.name, x, y); c.fillStyle = COR_DESTINO[z.id]; c.fillText(z.name, x, y);
    }
    for (const o of PORTAIS) if (o.planet === mundo.id) { c.fillStyle = o.destinos.length === 1 ? COR_DESTINO[o.destinos[0]] : COR_DESTINO.saida; c.beginPath(); c.arc(o.x * kx, o.y * ky, 4, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.stroke(); }
    const eu = snapshot?.players.find(v => v.id === snapshot.selfId);
    if (eu && snapshot.planet === mundo.id) { c.fillStyle = '#ff2bd6'; c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.arc(eu.x * kx, eu.y * ky, 6, 0, Math.PI * 2); c.fill(); c.stroke(); }
  };
  solo.onload = desenhar; solo.src = mundo.soloUrl; desenhar();
}

// Mochila: janela não modal (o jogo segue por trás). Cada tipo de item ocupa um espaço, com a quantidade;
// clicar num consumível usa. Equipamento ainda não existe no jogo: os espaços em volta da silhueta ficam
// vazios, com o ícone fantasma do tipo. Ícones dos itens em emoji, provisórios (como na barra de atalhos).
const ITENS_MOCHILA = [
  { key: 'food', nome: 'Presunto', icone: '🍖', tipo: 'consumivel', usar: { type: 'food' } },
  { key: 'ki', nome: 'Poção de Ki', icone: '🧪', tipo: 'consumivel', usar: { type: 'potion' } },
  ...CONFIG.seedPotencies.map(n => ({ key: 'seed' + n, nome: 'Semente ' + n + '%', icone: '🌱', marca: n + '%', tipo: 'consumivel', usar: { type: 'seed', potency: n } })),
  { key: 'scrap', nome: 'Sucata', icone: '⚙️', tipo: 'material' },
  { key: 'crystal', nome: 'Cristal', icone: '💎', tipo: 'material' }
];
// Espaços de equipamento: caixa de cada um na imagem do modelo (px de 853×1280), dentro da área (x, y, l, a).
const AREA_EQUIP = [180, 140, 493, 445], SILHUETA = [318, 225, 534, 582];
const SLOTS_EQUIP = [['mochila', 'Mochila', 212, 189, 306, 276], ['cabeca', 'Cabeça', 377, 152, 476, 231], ['colar', 'Colar', 547, 189, 641, 276],
  ['anel', 'Anel', 212, 301, 306, 387], ['peito', 'Roupa', 379, 305, 475, 387], ['braco', 'Munhequeira', 547, 301, 641, 387],
  ['arma', 'Arma', 212, 411, 306, 497], ['calca', 'Calça', 379, 407, 475, 489], ['cinto', 'Faixa', 547, 411, 641, 497], ['botas', 'Botas', 379, 499, 475, 573]];
let abaMochila = 'tudo', mochilaDesenhada = '';
const naArea = (el, x0, y0, x1, y1) => {
  const [ax, ay, al, aa] = AREA_EQUIP;
  Object.assign(el.style, { left: (x0 - ax) / al * 100 + '%', top: (y0 - ay) / aa * 100 + '%', width: (x1 - x0) / al * 100 + '%', height: (y1 - y0) / aa * 100 + '%' });
};
function montarMochila() {
  const equip = $('mochilaEquip'); naArea(equip.querySelector('.mochila-silhueta') || VAZIO, ...SILHUETA);
  for (const [id, nome, ...caixa] of SLOTS_EQUIP) {
    const slot = document.createElement('button'); slot.type = 'button'; slot.className = 'slot slot-equip'; slot.title = nome + ' (vazio)';
    const img = document.createElement('img'); img.src = '/assets/hud/mochila/' + id + '.png'; img.alt = '';
    slot.append(img); naArea(slot, ...caixa); equip.append(slot);
  }
  for (const aba of document.querySelectorAll('[data-aba]')) aba.onclick = () => {
    abaMochila = aba.dataset.aba; mochilaDesenhada = '';
    for (const a of document.querySelectorAll('[data-aba]')) a.classList.toggle('ativa', a === aba);
    atualizarMochila(ctx?.snapshot()?.self);
  };
}
function atualizarMochila(s) {
  if (!s || !$('mochilaDialog').open) return;
  const pesoCheio = s.weight >= s.stats.capacity - 0.01;
  $('mochilaPeso').textContent = s.weight.toFixed(1).replace('.', ',') + ' / ' + Math.round(s.stats.capacity) + ' kg';
  $('mochilaPesoBarra').style.width = Math.min(100, 100 * s.weight / Math.max(1, s.stats.capacity)) + '%';
  $('mochilaPesoBarra').parentElement?.classList.toggle('cheia', pesoCheio);
  $('mochilaZeni').textContent = integer(s.zeni);
  const itens = ITENS_MOCHILA.filter(i => s.inventory[i.key] > 0 && (abaMochila === 'tudo' || abaMochila === i.tipo));
  const assinatura = abaMochila + itens.map(i => i.key + ':' + s.inventory[i.key]).join();
  if (assinatura === mochilaDesenhada) return;
  mochilaDesenhada = assinatura;
  $('mochilaGrade').replaceChildren(...Array.from({ length: CONFIG.mochilaSlots }, (_, n) => {
    const slot = document.createElement('button'), item = itens[n]; slot.type = 'button'; slot.className = 'slot';
    if (!item) { slot.disabled = true; return slot; }
    const qtd = s.inventory[item.key];
    slot.textContent = item.icone; slot.title = item.nome + ' × ' + qtd + (item.usar ? ' — clique para usar' : '');
    if (item.marca) { const m = document.createElement('small'); m.textContent = item.marca; slot.append(m); }
    const q = document.createElement('em'); q.textContent = qtd; slot.append(q);
    slot.onclick = () => { slot.blur(); if (item.usar) action(item.usar); };
    return slot;
  }));
}
// Encaixa a Mochila no vão entre o cartão do jogador e as pílulas (comida/conexão): começa logo abaixo do
// cartão e, se não couber inteira, encolhe tudo por igual (--m) até terminar acima das pílulas.
function encaixarMochila() {
  const janela = $('mochilaDialog'); if (!janela.open) return;
  const u = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--e')) || 1, folga = 8 * u;
  const cartao = document.querySelector('.hud-jogador')?.getBoundingClientRect(), pilulas = document.querySelector('.hud-pilulas')?.getBoundingClientRect();
  const topo = (cartao?.bottom ?? 0) + folga, fim = pilulas?.height ? pilulas.top - folga : innerHeight - folga;
  janela.style.top = topo + 'px'; janela.style.setProperty('--m', '1');
  const m = Math.min(1, Math.max(0.4, (fim - topo) / janela.offsetHeight));
  janela.style.setProperty('--m', m.toFixed(3));
}
addEventListener('resize', encaixarMochila);
// Abre/fecha a Mochila (menu Mochila, cartão de peso da HUD e tecla B).
export function alternarMochila() {
  const janela = $('mochilaDialog');
  if (janela.open) { janela.close(); return; }
  mochilaDesenhada = ''; janela.show(); atualizarMochila(ctx?.snapshot()?.self); encaixarMochila();
}

// Liga ou pausa a caça automática (botão de caça e tecla H). Ela roda a hunt inteira onde o jogador está.
export function alternarCaca() {
  action({ type: 'hunt', enabled: !ctx?.snapshot()?.self?.autoHunt });
}

let autoHuntMovel = null;
export function encaixarAutoHunt() {
  const painel = $('autoHuntDialog'); if (!painel.open) return;
  if (autoHuntMovel?.restaurar()) return;
  const caixa = seletor => document.querySelector?.(seletor)?.getBoundingClientRect();
  const topo = Math.max(caixa('.hud-topo')?.bottom || 0, caixa('.hud-mapa')?.bottom || 0, caixa('.hud-zoom')?.bottom || 0) + 8;
  const fim = Math.min(caixa('.hud-tecnicas')?.top ?? innerHeight - 16, caixa('.hud-auto')?.top ?? innerHeight - 16) - 8;
  painel.style.bottom = Math.max(8, innerHeight - fim) + 'px';
  painel.style.maxHeight = Math.max(0, Math.min(380, fim - topo)) + 'px';
}
addEventListener('resize', encaixarAutoHunt);

export function alternarAutoHunt() {
  const painel = $('autoHuntDialog');
  if (painel.open) painel.close(); else painel.show();
  $('autoHuntButton').setAttribute('aria-expanded', String(painel.open));
  encaixarAutoHunt();
}

// Liga os botões e janelas da HUD ao jogo. Chamado uma vez por game.mjs.
export function ligarHud(contexto) {
  ctx = contexto;
  // Menus do topo: Loja, Mapa e Mochila abrem janelas; os outros ainda não têm tela.
  const telas = { loja: () => $('shopDialog').showModal(), mapa: abrirMapa, mochila: alternarMochila };
  montarMochila();
  const fecharMenu = () => { $('hudMenus').classList.remove('aberto'); $('menuAlternar').setAttribute('aria-expanded', 'false'); };
  for (const btn of document.querySelectorAll('[data-menu]')) btn.onclick = () => { fecharMenu(); (telas[btn.dataset.menu] || (() => notify('Em breve: ' + btn.title + '.')))(); };
  $('menuAlternar').onclick = () => { const aberto = $('hudMenus').classList.toggle('aberto'); $('menuAlternar').setAttribute('aria-expanded', String(aberto)); };
  // Setas do chat rolam as mensagens.
  $('chatCima').onclick = () => $('chatLinhas').scrollBy({ top: -40, behavior: 'smooth' });
  $('chatBaixo').onclick = () => $('chatLinhas').scrollBy({ top: 40, behavior: 'smooth' });
  // Ataque e técnicas automáticos (a caça automática é o botão quickHunt).
  for (const btn of document.querySelectorAll('[data-toggle]')) btn.onclick = () => action({ type: 'toggle', key: btn.dataset.toggle, value: !ctx.snapshot()?.self?.[btn.dataset.toggle] });
  for (const button of document.querySelectorAll('[data-skill]')) button.addEventListener('click', () => action({ type: 'skill', skill: button.dataset.skill }));
  for (const key of ['autoAttack', 'autoSkills', 'autoFood', 'autoKi', 'autoSeed']) $(key).addEventListener('change', () => action({ type: 'toggle', key, value: $(key).checked }));
  $('autoHeal').onchange = () => action({ type: 'toggle', key: 'autoHeal', value: $('autoHeal').checked });
  for (const key of ['healThreshold', 'kiThreshold', 'seedThreshold']) $(key).onchange = () => {
    const input = $(key), value = Number(input.value);
    if (!input.checkValidity() || !Number.isInteger(value)) { input.reportValidity(); return; }
    action({ type: 'automationThreshold', key, value });
  };
  $('autoHuntButton').onclick = alternarAutoHunt;
  autoHuntMovel = instalarPainelMovel($('autoHuntDialog'), $('autoHuntDialog').querySelector('.auto-hunt-head'), 'dbi-auto-hunt-posicao');
  $('autoHuntButton').addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') e.stopPropagation(); });
  $('autoHuntDialog').addEventListener('close', () => $('autoHuntButton').setAttribute('aria-expanded', 'false'));
  $('autoHuntDialog').addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); $('autoHuntDialog').close(); }
    else if (e.key === ' ' || e.key === 'Enter') e.stopPropagation();
  });
  $('huntButton').addEventListener('click', alternarCaca);
  $('foodButton').onclick = () => action({ type: 'food' });
  $('kiPotionButton').onclick = () => action({ type: 'potion' });
  $('seedButton').onclick = () => action({ type: 'seed', potency: Number($('seedSelect').value) });
  $('seedSelect').onchange = () => action({ type: 'selectSeed', potency: Number($('seedSelect').value) });
  $('transformButton').onclick = () => action({ type: 'transform' });
  $('helpButton').onclick = () => { ctx.soltarTeclas(); $('helpDialog').showModal(); };
  $('panelButton').onclick = () => { const open = $('panel').classList.toggle('open'); $('panelButton').setAttribute('aria-expanded', String(open)); };
  $('quickHunt').onclick = alternarCaca;
  $('shopButton').onclick = () => $('shopDialog').showModal();
  for (const btn of document.querySelectorAll('[data-close]')) btn.onclick = () => $(btn.dataset.close).close();
  $('saveButton').onclick = async () => { try { await ctx.api('save'); notify('Progresso salvo no servidor.'); } catch (e) { notify(e.message); } };
  for (const [key, price] of Object.entries(CONFIG.prices)) {
    const row = document.createElement('div'); row.className = 'shop-item';
    const label = document.createElement('span'); label.textContent = itemNames[key];
    const btn = document.createElement('button'); btn.textContent = price + ' Z · comprar'; btn.onclick = () => action({ type: 'buy', item: key });
    row.append(label, btn); $('shopItems').append(row);
  }
  $('sellButton').onclick = () => action({ type: 'sell' });
}
