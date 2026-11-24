import { nomeDaForma } from '../shared/tecnicas/formas.mjs';
import { nivelDaTecnica, tecnicasDoPerfil } from '../shared/tecnicas/barra-tecnicas.mjs';
import {instalarIconesAnimados} from '../render/hud/icones-animados.mjs';
import {instalarStore} from '../render/hud/store.mjs';
import {instalarBattlePass} from '../render/hud/battle-pass-hud.mjs';
import {instalarBarraTecnicas,atualizarBarraTecnicas} from '../render/hud/barra-tecnicas-hud.mjs';
import { instalarComboAutoHunt } from '../render/hud/combo-auto-hunt.mjs';
import {atualizarHuntAnalyzer,instalarHuntAnalyzer} from '../render/hud/hunt-analyzer.mjs';
import {instalarJanelasHud} from '../render/hud/janelas-hud.mjs';
import {instalarAbasHud} from '../render/hud/abas-hud.mjs';
import {atualizarRetratoVocacao} from '../render/hud/vocacao-retrato.mjs';
// HUD: tudo o que o jogo mostra e liga na página (barras, botões, painéis, notificações, loja,
// janela do portal e mapa). O resto do cliente (mapa, rede, teclado, joystick) fica em game.mjs.
// A HUD está em troca (ramo hud-nova): qualquer elemento pode sumir da página sem derrubar o jogo.
// `$` devolve um elemento vazio que aceita tudo e não faz nada, e avisa no console uma vez por id.
import { CONFIG, PLANETS, PLANETAS_DE_HUNT, PORTAIS, ZONES, zonasDe, areaPorId, lugar } from '../shared/index.mjs';
import { instalarLoja } from '../render/hud/loja.mjs';
import { instalarBestiario } from '../render/hud/bestiario.mjs';
import { instalarNovidadesHud } from '../render/hud/novidades-hud.mjs';
import { instalarDetalhesHabilidades } from '../render/hud/detalhes-habilidades.mjs';
import { instalarGodmodeHud } from '../render/hud/godmode-hud.mjs';
import { instalarPainelMovel, instalarArrasto } from '../render/hud/painel-movel.mjs';

let atualizarDetalhes = () => {};
let atualizarComboAutoHunt;
let novidadesHud = null;
let lojaHud = null;let abasHud=null;let godmodeHud=null;
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



// Chat com canais em abas que a pessoa escolhe (padrão: só Global + o botão "+").
// Cada canal tem sua própria conversa e uma introdução curta; Sistema é um canal à parte.
const CANAIS = {
  global:  { nome: 'Global',   intro: 'Todos os jogadores, em qualquer lugar.' },
  local:   { nome: 'Local',    intro: 'Quem está na sua área agora.' },
  trade:   { nome: 'Comércio', intro: 'Compra, venda e troca de itens.' },
  sistema: { nome: 'Sistema',  intro: 'Avisos do jogo.' }
};
const chatMsgs = [];
let canaisAbertos = ['global'], canalChat = 'global';
try { const s = JSON.parse(localStorage.getItem('dbi-chat-abas')); if (Array.isArray(s) && s.length && s.every(c => CANAIS[c])) { canaisAbertos = s; canalChat = s[0]; } } catch {}
const salvarAbas = () => { try { localStorage.setItem('dbi-chat-abas', JSON.stringify(canaisAbertos)); } catch {} };

function linhaChat(msg) {
  const linha = document.createElement('p'), tag = document.createElement('b');
  if (msg.canal === 'sistema') { tag.className = 'chat-sistema'; tag.textContent = '• '; }
  else { tag.className = 'chat-nome'; tag.textContent = msg.nome + ': '; }
  linha.append(tag, msg.texto); return linha;
}
function pushChat(msg) {
  chatMsgs.push(msg); if (chatMsgs.length > 300) chatMsgs.shift();
  const linhas = document.getElementById('chatLinhas');
  if (linhas && msg.canal === canalChat) {
    linhas.append(linhaChat(msg));
    while (linhas.children.length > 60) linhas.firstChild.remove();
    linhas.scrollTop = linhas.scrollHeight;
  }
}
function renderChat() {
  const linhas = document.getElementById('chatLinhas'); if (linhas) { linhas.replaceChildren(...chatMsgs.filter(m => m.canal === canalChat).map(linhaChat)); linhas.scrollTop = linhas.scrollHeight; }
  const intro = document.getElementById('chatIntro'); if (intro) intro.textContent = CANAIS[canalChat]?.intro || '';
  const input = document.getElementById('chatInput');
  if (input) { const sis = canalChat === 'sistema'; input.disabled = sis; input.placeholder = sis ? 'Sistema — somente leitura' : (CANAIS[canalChat]?.nome || '') + ' — Enter para conversar…'; }
}
function renderAbas() {
  const nav = document.getElementById('chatAbas'); if (!nav) return;
  nav.replaceChildren();
  for (const c of canaisAbertos) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'chat-aba' + (c === canalChat ? ' ativa' : ''); b.dataset.canal = c;
    const nome = document.createElement('span'); nome.textContent = CANAIS[c].nome; b.append(nome);
    if (canaisAbertos.length > 1) { const x = document.createElement('i'); x.className = 'chat-aba-x'; x.textContent = '×'; x.title = 'Fechar aba'; b.append(x); }
    b.onclick = e => {
      if (e.target.classList.contains('chat-aba-x')) { canaisAbertos = canaisAbertos.filter(k => k !== c); if (canalChat === c) canalChat = canaisAbertos[0]; salvarAbas(); renderAbas(); renderChat(); return; }
      canalChat = c; renderAbas(); renderChat();
    };
    nav.append(b);
  }
  const mais = document.createElement('button'); mais.type = 'button'; mais.className = 'chat-mais'; mais.textContent = '+'; mais.title = 'Adicionar canal';
  mais.onclick = () => alternarMenuCanais();
  nav.append(mais);
}
function alternarMenuCanais() {
  const menu = document.getElementById('chatMenu'); if (!menu) return;
  if (!menu.classList.contains('hidden')) { menu.classList.add('hidden'); return; }
  const faltam = Object.keys(CANAIS).filter(c => !canaisAbertos.includes(c));
  menu.replaceChildren(...faltam.length
    ? faltam.map(c => { const b = document.createElement('button'); b.type = 'button'; b.textContent = CANAIS[c].nome; b.onclick = () => { canaisAbertos.push(c); canalChat = c; salvarAbas(); menu.classList.add('hidden'); renderAbas(); renderChat(); }; return b; })
    : [Object.assign(document.createElement('span'), { className: 'chat-menu-vazio', textContent: 'Todos os canais já estão abertos.' })]);
  menu.classList.remove('hidden');
}

export function notify(text) {
  if(document.documentElement.dataset.avisos==='false'){pushChat({canal:'sistema',texto:text});return;}
  if ($('shopDialog').open) $('shopNotice').textContent = text;
  const element = document.createElement('div'); element.className = 'toast'; element.textContent = text;
  $('notifications').append(element); setTimeout(() => element.remove(), 4200);
  while ($('notifications').children.length > 3) $('notifications').firstChild.remove();
  pushChat({ canal: 'sistema', texto: text }); // avisos vão para o canal Sistema (e continuam como toast)
}

// Mensagem de um jogador num canal do chat. Mostra "Nome: texto" com destaque no nome.
export function mensagemChat(nome, texto, canal = 'local') {
  pushChat({ canal: CANAIS[canal] ? canal : 'local', nome, texto });
}

// Escala da HUD: tudo é medido em múltiplos de --e (1 = janela de 1600×950). Acompanha o tamanho da
// janela e a resolução; o teto e o piso evitam HUD gigante num 4K e ilegível numa janela pequena.
function ajustarEscala() {
  const e = Math.max(0.6, Math.min(2.2, innerWidth / 1600, innerHeight / 950));
  document.documentElement.style.setProperty('--e', (e*(Number(document.documentElement.style.getPropertyValue?.('--hud-escala'))||1)).toFixed(3));
}
ajustarEscala(); addEventListener('resize', ajustarEscala);

export function atualizarHud(snapshot, playerId) {
  const s = snapshot?.self, p = snapshot?.players.find(v => v.id === playerId); if (!s || !p) return;
  atualizarHuntAnalyzer(s.huntAnalyzer,playerId);
  const retrato = document.getElementById('playerPortrait');
  if (retrato) atualizarRetratoVocacao(retrato, s.vocacao);
  $('playerName').textContent = p.name; $('levelBadge').textContent = 'Nv. ' + s.level;
  $('hpBar').style.width = Math.max(0, 100 * s.hp / s.stats.hp) + '%';
  $('kiBar').style.width = Math.max(0, 100 * s.ki / s.stats.ki) + '%';
  $('hpText').textContent = 'HP ' + integer(s.hp) + ' / ' + integer(s.stats.hp);
  $('kiText').textContent = 'KI ' + integer(s.ki) + ' / ' + integer(s.stats.ki);
  const xpPct = Math.min(100, s.xp / Math.max(1, s.xpNext) * 100);
  $('xpLabel').textContent = 'Nível ' + s.level; $('xpNumbers').textContent = integer(s.xp) + ' / ' + integer(s.xpNext) + ' XP';
  $('xpBar').style.width = xpPct + '%';
  $('hudXpBar').style.width = xpPct + '%'; $('hudXpText').textContent = 'EXP ' + Math.round(xpPct) + '%';
  $('formLabel').textContent = !s.forma || s.forma === 'base' ? 'FORMA BASE' : nomeDaForma(s.forma).toUpperCase();
  const proximosDesbloqueios = tecnicasDoPerfil(s.vocacao)
    .map(tecnica => [tecnica.nome, nivelDaTecnica(tecnica, s.vocacao)]);
  if (s.vocacao === 'goku') proximosDesbloqueios.push(['Imagem Residual', CONFIG.skills.dash]);
  const pendentes = proximosDesbloqueios.filter(([, nivel]) => nivel > s.level).sort((a, b) => a[1] - b[1]);
  const primeiroDesbloqueio = pendentes[0], desbloqueiosNoNivel = primeiroDesbloqueio
    ? pendentes.filter(([, nivel]) => nivel === primeiroDesbloqueio[1]).map(([nome]) => nome) : [];
  $('nextUnlock').textContent = s.level >= CONFIG.progression.nivelMaximo ? 'Nível máximo alcançado.' : primeiroDesbloqueio
    ? `Próximo desbloqueio: ${desbloqueiosNoNivel.join(' e ')} · NV. ${primeiroDesbloqueio[1]}` : 'Todas as habilidades principais desbloqueadas.';
  const stats = [['Vida', integer(s.stats.hp)], ['Ki', integer(s.stats.ki)], ['Ataque', s.stats.attack.toFixed(1)], ['Defesa', s.stats.defense.toFixed(1)], ['Cura / comida', s.stats.healing.toFixed(2) + '×'], ['Mochila', s.stats.capacity.toFixed(1) + ' kg'], ['Chance loot', Math.round(s.stats.lootChance * 100) + '%'], ['Movimento', Math.round(s.stats.mobility)]];
  $('stats').replaceChildren(...stats.map(pair => { const div = document.createElement('div'); div.className = 'stat'; const label = document.createElement('span'), value = document.createElement('b'); label.textContent = pair[0]; value.textContent = pair[1]; div.append(label, value); return div; }));
  for (const key of ['autoAttack', 'autoSkills', 'autoFood', 'autoKi', 'autoSeed']) $(key).checked = s[key];
  $('autoHeal').checked = s.autoHeal;
  atualizarComboAutoHunt?.(s, snapshot.selfId);
  for (const key of ['healThreshold', 'kiThreshold', 'seedThreshold']) {
    if (document.activeElement !== $(key)) $(key).value = s[key];
  }
  $('autoHuntSummary').textContent = s.autoHunt ? 'ON' : 'OFF';
  $('autoHuntButton').classList.toggle('ligado', s.autoHunt);
  godmodeHud?.atualizar(s);
  const hunt = areaPorId(s.area);
  $('quickHunt').disabled = !s.autoHunt && (!hunt || hunt.segura);
  $('autoHuntLocation').textContent = !hunt || hunt.segura ? 'Entre em uma hunt para iniciar.' : (s.autoHunt ? 'Caçando em ' : 'Local: ') + hunt.name;
  $('autoKiInfo').textContent = `${s.inventory.ki} poções · ${!s.inventory.ki ? 'sem estoque' : s.kiRemaining > 0 ? 'recarga ' + s.kiRemaining.toFixed(1) + 's' : 'pronto para usar'}`;
  $('autoSeedInfo').textContent = `${s.inventory['seed' + s.seedSelected]} sementes de ${s.seedSelected}% · ${!s.inventory['seed' + s.seedSelected] ? 'sem estoque' : s.seedRemaining > 0 ? 'recarga ' + s.seedRemaining.toFixed(1) + 's' : 'pronto para usar'}`;
  $('huntButton').classList.toggle('running', s.autoHunt);
  $('huntButton').textContent = s.autoHunt ? 'Pausar caça automática  ■' : 'Iniciar caça automática  ↗';
  $('foodCount').textContent = s.inventory.food;
  $('zeni').textContent = integer(s.zeni) + ' Z'; $('materials').textContent = s.inventory.scrap + ' sucatas · ' + s.inventory.crystal + ' cristais';
  $('bagLabel').textContent = s.weight.toFixed(1).replace('.', ',') + ' / ' + Math.round(s.stats.capacity) + ' kg';
  $('hudZeni').textContent = integer(s.zeni);
  atualizarMochila(s);abasHud?.atualizar(snapshot);
  if (document.activeElement !== $('seedSelect')) $('seedSelect').value = String(s.seedSelected);
  for (const option of $('seedSelect').options) option.textContent = option.value + '% · ' + (s.inventory['seed' + option.value] || 0);
  atualizarBarraTecnicas(s);
  $('seedStatus').textContent = s.seedRemaining > 0 ? 'Todas as sementes em recarga · ' + Math.ceil(s.seedRemaining) + 's' : 'Cura instantânea · recarga compartilhada de 20s';
  $('seedStatus').classList.toggle('waiting', s.seedRemaining > 0);
  $('kiPotionText').textContent = s.kiRemaining > 0 ? 'Recarga: ' + Math.ceil(s.kiRemaining) + 's' : 'Recupera 45% · Q';
  // Buff da comida acima da barra de skills: aparece ao comer e conta o tempo restante.
  const comidaAtiva = s.foodRemaining > 0;
  $('buffComida').classList.toggle('hidden', !comidaAtiva);
  if (comidaAtiva) $('buffComidaTempo').textContent = clock(s.foodRemaining);
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
  atualizarDetalhes(s);
  novidadesHud?.atualizar(s);
  lojaHud?.atualizar();
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
  const interplanetario = portal.destinos.some(id => lugar(id).planet !== portal.planet);
  $('portalTitulo').textContent = interplanetario ? 'PORTAL — ESCOLHA O PLANETA' : portal.destinos.length > 1 ? 'SAÍDA — ESCOLHA O DESTINO' : 'PORTAL';
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
  if($('mapaDialog').open){$('mapaDialog').close();return;}
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
  $('mapaDialog').show();
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
// vazios, com o ícone fantasma do tipo. Itens usam as imagens do pacote de inventário fornecido.
const ITENS_MOCHILA = [
  { key: 'food', nome: 'Presunto', icone: '/assets/inventario/comida.png', tipo: 'consumivel', usar: { type: 'food' } },
  { key: 'ki', nome: 'Poção de Ki', icone: '/assets/inventario/pocao_ki.png', tipo: 'consumivel', usar: { type: 'potion' } },
  ...CONFIG.seedPotencies.map(n => ({ key: 'seed' + n, nome: 'Semente ' + n + '%', icone: '/assets/inventario/semente_dos_deuses.png', marca: n + '%', tipo: 'consumivel', usar: { type: 'seed', potency: n } })),
  { key: 'scrap', nome: 'Sucata', icone: '/assets/inventario/sucata.png', tipo: 'material' },
  { key: 'crystal', nome: 'Cristal', icone: '/assets/inventario/cristal.png', tipo: 'material' }
];
// Espaços de equipamento: caixa de cada um na imagem do modelo (px de 853×1280), dentro da área (x, y, l, a).
const AREA_EQUIP = [180, 140, 493, 445], SILHUETA = [318, 225, 534, 582];
const SLOTS_EQUIP = [['mochila', 'Mochila', 212, 189, 306, 276], ['cabeca', 'Cabeça', 377, 152, 476, 231], ['colar', 'Colar', 547, 189, 641, 276],
  ['anel', 'Anel', 212, 301, 306, 387], ['peito', 'Roupa', 379, 305, 475, 387], ['braco', 'Munhequeira', 547, 301, 641, 387],
  ['arma', 'Arma', 212, 411, 306, 497], ['calca', 'Calça', 379, 407, 475, 489], ['cinto', 'Faixa', 547, 411, 641, 497], ['botas', 'Botas', 379, 499, 475, 573]];
let abaMochila = 'tudo', mochilaDesenhada = '', arrastandoConsumivel=false, evitarCliqueConsumivel=0, arrastandoSlot=false;
// Item da mochila por chave (para desenhar cada espaço a partir do layout de slots s.slots).
const META_ITEM = Object.fromEntries(ITENS_MOCHILA.map(i => [i.key, i]));
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
  if (!s || !$('mochilaDialog').open || arrastandoConsumivel || arrastandoSlot) return;
  const pesoCheio = s.weight >= s.stats.capacity - 0.01;
  $('mochilaPeso').textContent = s.weight.toFixed(1).replace('.', ',') + ' / ' + Math.round(s.stats.capacity) + ' kg';
  $('mochilaPesoBarra').style.width = Math.min(100, 100 * s.weight / Math.max(1, s.stats.capacity)) + '%';
  $('mochilaPesoBarra').parentElement?.classList.toggle('cheia', pesoCheio);
  $('mochilaZeni').textContent = integer(s.zeni);
  // A grade desenha os ESPAÇOS por índice (s.slots): cada item fica onde o jogador o deixou. A aba só mostra
  // os espaços do tipo filtrado; os demais ocupados ficam ocultos (não recebem arrasto, para não esconder item).
  const slots = Array.isArray(s.slots) ? s.slots : [];
  const visivel = d => d && (abaMochila === 'tudo' || abaMochila === META_ITEM[d.item]?.tipo);
  const assinatura = abaMochila + '|' + Array.from({ length: CONFIG.mochilaSlots }, (_, n) => {
    const d = slots[n]; return d ? d.item + ':' + d.qty : '';
  }).join(',');
  if (assinatura === mochilaDesenhada) return;
  mochilaDesenhada = assinatura;
  $('mochilaGrade').replaceChildren(...Array.from({ length: CONFIG.mochilaSlots }, (_, n) => {
    const dado = slots[n] || null, item = dado && META_ITEM[dado.item], mostra = visivel(dado) && item;
    const slot = document.createElement('button'); slot.type = 'button'; slot.className = 'slot'; slot.dataset.slot = n;
    // Espaço vazio: alvo de arrasto (receber um item), sem clique. Espaço ocupado por item de outra aba: inerte.
    if (!mostra) { if (dado) slot.classList.add('slot-oculto'); else { slot.classList.add('slot-vazio'); ligarDropSlot(slot, n); } return slot; }
    const qtd = dado.qty;
    slot.dataset.item = item.key; slot.draggable = true;
    slot.addEventListener('dragstart', e => {
      arrastandoSlot = true; evitarCliqueConsumivel = performance.now() + 300;
      e.dataTransfer.effectAllowed = item.usar ? 'copyMove' : 'move';
      e.dataTransfer.setData('application/x-dbi-slot', String(n));
      if (item.usar) { e.dataTransfer.setData('application/x-dbi-consumivel', item.key); e.dataTransfer.setData('text/plain', item.key); }
      if (item.usar) arrastandoConsumivel = true;   // habilita soltar na hotkey 7/8
    });
    slot.addEventListener('dragend', () => { arrastandoSlot = false; arrastandoConsumivel = false; evitarCliqueConsumivel = performance.now() + 300; mochilaDesenhada = ''; atualizarMochila(ctx?.snapshot()?.self); });
    ligarDropSlot(slot, n);
    const imagem = document.createElement('img'); imagem.className = 'mochila-item-icone';
    imagem.src = item.icone; imagem.alt = ''; imagem.draggable = false; slot.append(imagem);
    slot.title = item.nome + ' × ' + qtd + (item.usar ? ' — clique para usar · arraste para mover ou para a hotkey 7/8 · botão direito para dividir/excluir' : ' — arraste para mover · botão direito para dividir/excluir');
    slot.setAttribute('aria-label', slot.title);
    if (item.marca) { const m = document.createElement('small'); m.textContent = item.marca; slot.append(m); }
    const q = document.createElement('em'); q.textContent = qtd; slot.append(q);
    slot.onclick = () => { slot.blur(); if (item.usar && !arrastandoConsumivel && !arrastandoSlot && performance.now() > evitarCliqueConsumivel) action(item.usar); };
    slot.addEventListener('contextmenu', e => { e.preventDefault(); abrirMenuItem(e, n, item, qtd); });
    return slot;
  }));
}
// Faz um espaço aceitar outro item arrastado da grade (reorganizar/juntar/trocar). Mandamos só a operação
// (de qual índice para qual) e o servidor aplica sobre os slots atuais dele.
function ligarDropSlot(slot, n) {
  slot.addEventListener('dragover', e => {
    if (!e.dataTransfer.types.includes('application/x-dbi-slot')) return;
    e.preventDefault(); e.dataTransfer.dropEffect = 'move'; slot.classList.add('slot-destino');
  });
  slot.addEventListener('dragleave', () => slot.classList.remove('slot-destino'));
  slot.addEventListener('drop', e => {
    if (!e.dataTransfer.types.includes('application/x-dbi-slot')) return;
    e.preventDefault(); e.stopPropagation(); slot.classList.remove('slot-destino');
    const de = Math.floor(Number(e.dataTransfer.getData('application/x-dbi-slot')));
    if (Number.isInteger(de) && de !== n) { action({ type: 'moverSlot', de, para: n }); mochilaDesenhada = ''; }
  });
}
// Menu de botão direito num item: Dividir (abre o seletor de quantidade) e Excluir (descarta a pilha do espaço).
let menuItemEl = null;
function fecharMenuItem() { menuItemEl?.remove(); menuItemEl = null; }
function abrirMenuItem(e, n, item, qtd) {
  fecharMenuItem();
  const menu = document.createElement('div'); menu.className = 'mochila-menu'; menuItemEl = menu;
  const titulo = document.createElement('strong'); titulo.textContent = item.nome + ' × ' + qtd; menu.append(titulo);
  if (qtd >= 2) {
    const dividir = document.createElement('button'); dividir.type = 'button'; dividir.textContent = 'Dividir';
    dividir.onclick = () => { fecharMenuItem(); abrirDividir(n, item, qtd); };
    menu.append(dividir);
  }
  const excluir = document.createElement('button'); excluir.type = 'button'; excluir.className = 'perigo'; excluir.textContent = 'Excluir';
  excluir.onclick = () => { fecharMenuItem(); confirmarExcluir(n, item, qtd); };
  menu.append(excluir);
  $('mochilaDialog').append(menu);
  // Posiciona junto ao cursor, mantendo o menu dentro da janela.
  const r = $('mochilaDialog').getBoundingClientRect(), m = menu.getBoundingClientRect();
  const x = Math.min(e.clientX - r.left, r.width - m.width - 6), y = Math.min(e.clientY - r.top, r.height - m.height - 6);
  menu.style.left = Math.max(6, x) + 'px'; menu.style.top = Math.max(6, y) + 'px';
}
// Seletor de quantidade da divisão: 1 a qtd-1 (precisa sobrar ao menos 1 no espaço original).
function abrirDividir(n, item, qtd) {
  fecharMenuItem();
  const fundo = document.createElement('div'); fundo.className = 'mochila-dialogo-fundo';
  const cx = document.createElement('div'); cx.className = 'mochila-dialogo';
  const h = document.createElement('strong'); h.textContent = 'Dividir ' + item.nome; cx.append(h);
  const linha = document.createElement('div'); linha.className = 'mochila-dialogo-qtd';
  const faixa = document.createElement('input'); faixa.type = 'range'; faixa.min = '1'; faixa.max = String(qtd - 1); faixa.value = String(Math.floor(qtd / 2) || 1);
  const num = document.createElement('input'); num.type = 'number'; num.min = '1'; num.max = String(qtd - 1); num.value = faixa.value;
  const sync = v => { const x = Math.max(1, Math.min(qtd - 1, Math.floor(Number(v)) || 1)); faixa.value = String(x); num.value = String(x); };
  faixa.oninput = () => sync(faixa.value); num.oninput = () => sync(num.value);
  linha.append(faixa, num); cx.append(linha);
  const nota = document.createElement('small'); nota.textContent = 'Fica uma pilha nova em outro espaço. Precisa de um espaço livre.'; cx.append(nota);
  const botoes = document.createElement('div'); botoes.className = 'mochila-dialogo-botoes';
  const cancelar = document.createElement('button'); cancelar.type = 'button'; cancelar.textContent = 'Cancelar'; cancelar.onclick = () => fundo.remove();
  const ok = document.createElement('button'); ok.type = 'button'; ok.className = 'primario'; ok.textContent = 'Dividir';
  ok.onclick = () => { action({ type: 'dividirSlot', de: n, quantidade: Math.floor(Number(num.value)) }); mochilaDesenhada = ''; fundo.remove(); };
  botoes.append(cancelar, ok); cx.append(botoes);
  fundo.append(cx); fundo.onclick = ev => { if (ev.target === fundo) fundo.remove(); };
  $('mochilaDialog').append(fundo); num.focus();
}
function confirmarExcluir(n, item, qtd) {
  const fundo = document.createElement('div'); fundo.className = 'mochila-dialogo-fundo';
  const cx = document.createElement('div'); cx.className = 'mochila-dialogo';
  const h = document.createElement('strong'); h.textContent = 'Excluir ' + item.nome; cx.append(h);
  const p = document.createElement('small'); p.textContent = 'Descartar ' + qtd + ' ' + item.nome + '? Não dá para desfazer.'; cx.append(p);
  const botoes = document.createElement('div'); botoes.className = 'mochila-dialogo-botoes';
  const cancelar = document.createElement('button'); cancelar.type = 'button'; cancelar.textContent = 'Cancelar'; cancelar.onclick = () => fundo.remove();
  const ok = document.createElement('button'); ok.type = 'button'; ok.className = 'primario perigo'; ok.textContent = 'Excluir';
  ok.onclick = () => { action({ type: 'descartarSlot', de: n }); mochilaDesenhada = ''; fundo.remove(); };
  botoes.append(cancelar, ok); cx.append(botoes);
  fundo.append(cx); fundo.onclick = ev => { if (ev.target === fundo) fundo.remove(); };
  $('mochilaDialog').append(fundo);
}
// Fecha o menu de item ao clicar fora, rolar ou apertar Esc.
addEventListener('pointerdown', e => { if (menuItemEl && !menuItemEl.contains(e.target)) fecharMenuItem(); }, true);
addEventListener('keydown', e => { if (e.key === 'Escape') fecharMenuItem(); });
// Encaixa a Mochila no vão entre o cartão do jogador e as pílulas (comida/conexão): começa logo abaixo do
// cartão e, se não couber inteira, encolhe tudo por igual (--m) até terminar acima das pílulas.
function encaixarMochila() {
  const janela = $('mochilaDialog'); if (!janela.open || janela.classList.contains('hud-tamanho-manual') || janela.style.left) return;
  const u = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--e')) || 1, folga = 8 * u;
  const cartao = document.querySelector('.hud-jogador')?.getBoundingClientRect(), pilulas = document.querySelector('.hud-pilulas')?.getBoundingClientRect();
  const topo = (cartao?.bottom ?? 0) + folga, fim = pilulas?.height ? pilulas.top - folga : innerHeight - folga;
  janela.style.top = topo + 'px'; janela.style.setProperty('--m', '1');
  const m = Math.min(1, Math.max(0.4, (fim - topo) / janela.offsetHeight));
  janela.style.setProperty('--m', m.toFixed(3));
}
addEventListener('resize', encaixarMochila);
// Abre/fecha a Mochila (menu Mochila, cartão de peso da HUD e tecla I).
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
  const topo = Math.max(caixa('.hud-topo')?.bottom || 0, caixa('.hud-mapa')?.bottom || 0, 0) + 8;
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
// Interação contextual acionada pela tecla E; a seleção de NPC é feita no cliente
// e as compras continuam validadas pelo servidor ao confirmar cada item.
export function abrirLojaNpc() { lojaHud?.abrir(); }

// Liga os botões e janelas da HUD ao jogo. Chamado uma vez por game.mjs.
export function ligarHud(contexto) {
  document.getElementById('huntAnalyzerReset')?.addEventListener('click',()=>action({type:'huntAnalyzerReset'}));
  ctx = contexto;
  godmodeHud = instalarGodmodeHud(action);
  instalarIconesAnimados();
  instalarHuntAnalyzer();
  atualizarComboAutoHunt = instalarComboAutoHunt($('autoHuntDialog'), dados => ctx.api('action', dados));
  abasHud=instalarAbasHud(ctx,{autoHunt:alternarAutoHunt,avisar:notify});
  atualizarDetalhes = instalarDetalhesHabilidades();
  novidadesHud = instalarNovidadesHud(action);
  lojaHud = instalarLoja({janela:document.getElementById('shopDialog'),obterEstado:()=>ctx?.snapshot()?.self,comprar:dados=>ctx.api('action',dados),avisar:notify});
  // Menus do topo: Loja, Mapa e Mochila abrem janelas; os outros ainda não têm tela.
  const abrirBestiario = instalarBestiario(() => ctx?.snapshot()?.self);
  const telas = {store:instalarStore(ctx),battlepass:instalarBattlePass(ctx), bestiario:abrirBestiario, loja: () => lojaHud.abrir(), mapa: abrirMapa, mochila: alternarMochila };
  montarMochila();
  const mochila=$('mochilaDialog'),minimizar=$('mochilaMinimizar');
  const exibirMochilaCompacta=compacta=>{
    mochila.classList.toggle('mochila-compacta',compacta);
    $('mochilaEquip').hidden=compacta;$('mochilaInfo').hidden=compacta;
    minimizar.textContent=compacta?'▢':'−';minimizar.setAttribute('aria-expanded',String(!compacta));
    minimizar.setAttribute('aria-label',compacta?'Expandir mochila':'Minimizar mochila');
    minimizar.title=compacta?'Mostrar equipamentos e informações':'Ocultar equipamentos e informações';
  };
  try{exibirMochilaCompacta(localStorage.getItem('dbi-mochila-compacta')==='true');}catch{}
  minimizar.onclick=()=>{
    const compacta=!mochila.classList.contains('mochila-compacta');exibirMochilaCompacta(compacta);
    try{localStorage.setItem('dbi-mochila-compacta',String(compacta));}catch{}
    encaixarMochila();
  };
  instalarJanelasHud();
  const fecharMenu = () => { $('hudMenus').classList.remove('aberto'); $('menuAlternar').setAttribute('aria-expanded', 'false'); };
  for (const btn of document.querySelectorAll('[data-menu]')) btn.onclick = () => { fecharMenu(); if(abasHud.abrir(btn.dataset.menu))return; if (novidadesHud.abrir(btn.dataset.menu)) return; (telas[btn.dataset.menu] || (() => notify('Em breve: ' + btn.title + '.')))(); };
  $('menuAlternar').onclick = () => { const aberto = $('hudMenus').classList.toggle('aberto'); $('menuAlternar').setAttribute('aria-expanded', String(aberto)); };
  // Setas do chat rolam as mensagens.
  $('chatCima').onclick = () => $('chatLinhas').scrollBy({ top: -40, behavior: 'smooth' });
  $('chatBaixo').onclick = () => $('chatLinhas').scrollBy({ top: 40, behavior: 'smooth' });
  // Abas do chat: monta as abas escolhidas + o botão "+"; fecha o menu "+" ao clicar fora.
  renderAbas(); renderChat();
  document.addEventListener('pointerdown', e => { if (!e.target.closest('#chatMenu, .chat-mais')) $('chatMenu').classList.add('hidden'); });
  // Chat: Enter envia no canal ativo; Escape devolve o foco ao jogo. Teclas no campo não acionam o jogo.
  $('chatForm').addEventListener('submit', e => { e.preventDefault(); const txt = $('chatInput').value.trim(); if (txt && canalChat !== 'sistema') action({ type: 'chat', texto: txt.slice(0, 120), canal: canalChat }); $('chatInput').value = ''; });
  $('chatInput').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') $('chatInput').blur(); });
  // Ataque e técnicas automáticos (a caça automática é o botão quickHunt).
  for (const btn of document.querySelectorAll('[data-toggle]')) btn.onclick = () => action({ type: 'toggle', key: btn.dataset.toggle, value: !ctx.snapshot()?.self?.[btn.dataset.toggle] });
  for (const key of ['autoAttack', 'autoSkills', 'autoFood', 'autoKi', 'autoSeed']) $(key).addEventListener('change', () => action({ type: 'toggle', key, value: $(key).checked }));
  $('autoHeal').onchange = () => action({ type: 'toggle', key: 'autoHeal', value: $('autoHeal').checked });
  for (const key of ['healThreshold', 'kiThreshold', 'seedThreshold']) $(key).onchange = () => {
    const input = $(key), value = Number(input.value);
    if (!input.checkValidity() || !Number.isInteger(value)) { input.reportValidity(); return; }
    action({ type: 'automationThreshold', key, value });
  };
  $('autoHuntButton').onclick = alternarAutoHunt;
  autoHuntMovel = instalarPainelMovel($('autoHuntDialog'), $('autoHuntDialog').querySelector('.auto-hunt-head'), 'dbi-auto-hunt-posicao');
  // Apenas os painéis configuráveis recebem alças; HUDs fixas ignoram posições antigas.
  for(const seletor of ['.hud-chat','.hud-tecnicas','.hud-topo','.hud-logo','.hud-pilulas','.hud-dica']){
    document.querySelector(seletor)?.querySelectorAll('.arrasto-alca,.hud-redimensionar').forEach(alca=>alca.remove());
  }
  // Cabeçalhos substituem as antigas bolinhas sem capturar os controles do painel.
  for(const [sel,cabecalho] of [['.hud-mapa','#regionName'],['.hud-auto',null],['.hud-jogador','.hud-nome'],['.hud-alvo','#targetName']]){
    const painel=document.querySelector(sel);if(!painel)continue;
    painel.querySelectorAll('.arrasto-alca').forEach(alca=>alca.remove());
    let topo=cabecalho?painel.querySelector(cabecalho):null;
    if(!topo){topo=document.createElement('div');topo.className='hud-cabecalho-movel';topo.textContent=painel.getAttribute('aria-label')||'Automação';painel.prepend(topo);}
    topo.classList.add('janela-arrastavel');topo.title='Arraste para mover · duplo clique restaura posição';
    instalarArrasto(painel,topo,sel==='.hud-mapa'?'dbi-pos-mapa':sel==='.hud-auto'?'dbi-pos-auto':'dbi-pos-'+sel.slice(1));
  }
  for(const sel of ['.hud-godmode','.hud-missao']){
    const painel=document.querySelector(sel);if(!painel)continue;
    const alca=document.createElement('span');alca.className='arrasto-alca';alca.textContent='⠿';alca.title='Arrastar HUD · duplo clique restaura posição';painel.append(alca);
    instalarArrasto(painel,alca,'dbi-pos-'+sel.slice(1));
  }
  $('autoHuntButton').addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') e.stopPropagation(); });
  $('autoHuntDialog').addEventListener('close', () => $('autoHuntButton').setAttribute('aria-expanded', 'false'));
  $('autoHuntDialog').addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); $('autoHuntDialog').close(); }
    else if (e.key === ' ' || e.key === 'Enter') e.stopPropagation();
  });
  $('huntButton').addEventListener('click', alternarCaca);
  $('foodButton').onclick = () => action({ type: 'food' });
  instalarBarraTecnicas(action);
  $('seedSelect').onchange = () => action({ type: 'selectSeed', potency: Number($('seedSelect').value) });
  $('godmodeToggle').onclick = () => action({ type: 'godmode' });
  $('helpButton').onclick = () => { ctx.soltarTeclas(); $('helpDialog').showModal(); };
  $('panelButton').onclick = () => { const open = $('panel').classList.toggle('open'); $('panelButton').setAttribute('aria-expanded', String(open)); };
  $('quickHunt').onclick = alternarCaca;
  $('shopButton').onclick = () => lojaHud.abrir();
  for (const btn of document.querySelectorAll('[data-close]')) btn.onclick = () => $(btn.dataset.close).close();
  $('saveButton').onclick = async () => { try { await ctx.api('save'); notify('Progresso salvo no servidor.'); } catch (e) { notify(e.message); } };
  $('sellButton').onclick = () => action({ type: 'sell' });
}
