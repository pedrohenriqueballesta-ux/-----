import {registrarAtividadePasse} from './battle-pass.mjs';
import {consumivelValido,acaoConsumivel} from './consumiveis-hotkeys.mjs';
import {registrar as analisar, resumo as resumoHunt, novaSessao, registrarEncontro} from './hunt-analyzer.mjs';
import {preferenciasValidas} from './preferencias.mjs';
import {perfilPersonagem} from './perfil.mjs';
import {registrarMissao,listarMissoes,resgatarMissao} from './missoes.mjs';
import {acaoCorreio} from './correio.mjs';
import {restaurarNovidades} from './novidades.mjs';
import {Guildas} from './guildas.mjs';
// Regras autoritativas do jogo: combate, movimento, inventário e mundo.
// Rodam no servidor; o navegador apenas apresenta o estado que chega daqui.
import { CONFIG, OBSTACLES, PLANETS, PORTAIS, RAIO_PORTAL, areaPorId, lugar, mercadorPerto, naZonaSegura, zonaSeguraDaHunt } from './config.mjs';
import { clamp, distance, norm, segmentDistance } from './math.mjs';
import { statsFor, xpForLevel, bagWeight, createPlayer, exportPlayer as serializePlayer, aplicarGodmode } from './characters.mjs';
import { mobStats, renasceEm, spawnPoints, pontoNoCirculo, CHEFES_RAROS, pontoDeSpawnForaDaSafeZone, TIPOS_CHEFE } from './enemies.mjs';
import { deslocar, caminhoPorTerra, temMascara, pesLivres, planejarClique } from './passagem.mjs';
import { KAME, estagioKame, geometriaKame, origemKame, atingidoPeloKame, IMPACTO_KAME, distanciaContatoKame, atingidoPeloImpactoKame } from './kamehameha.mjs';
import { TIPOS_SOCA_E_ATIRA, iniciarVooTarget, avancarVooTarget } from './projetil-mob.mjs';
import { Mercado } from './mercado.mjs';
import { ITENS_NEGOCIAVEIS, creditarZeni } from './itens-negociaveis.mjs';
import { LIMITE_ESTOQUE_LOJA, avaliarCarrinho } from './loja.mjs';
import { CURA, curaPorNivel } from './cura.mjs';
import { RECOMPENSAS_MOBS } from './recompensas-mobs.mjs';
import { validarNovidade } from './novidades.mjs';
import { GENKI } from './genki.mjs';

// Mobs que socam de perto e disparam ki de longe (têm folha de soco e de ki).
export const SOCA_E_ATIRA = new Set(TIPOS_SOCA_E_ATIRA);
// Chefes (subchefe e chefes raros): golpe maior e mais lento, e a caça automática não os enfrenta sozinha.
export const CHEFES = TIPOS_CHEFE;
// Oozaru Dourado: pancada com os dois punhos (área em volta dele) e bola de energia negra pela boca, mirando o alvo
// (Pedro, 06/11: no lugar do laser; metade do tamanho da Supernova). A bola carrega na boca, voa até o alvo e explode.
export const OOZARU_DOURADO = { pancadaAviso: 0.95, pancadaRaio: 150, bolaCarga: 1.0, bolaVoo: 0.45, bolaAlcance: 620, bolaRaio: 75, bolaRecarga: 2.6 };
// Freeza: tempos dos dois golpes (segundos). Death Beam: aviso curto e raio rápido. Supernova: a bola cresce acima da
// mão por CARGA, voa por VOO até o ponto marcado no chão e explode numa área grande.
export const FREEZA = { beamAviso: 0.55, beamVelocidade: 720, novaCarga: 1.7, novaVoo: 0.45, novaRaio: 150, novaRecarga: 3.2 };

export class Game {
  constructor({ now = Date.now() / 1000, random = Math.random, populate = true, chefeJa = false } = {}) {
    this.time = now; this.random = random; this.chefeJa = chefeJa; this.players = new Map(); this.mobs = new Map();
    this.projectiles = []; this.kamehamehas = []; this.loot = []; this.events = []; this.serial = 0;
    this.genkiCharges = []; this.genkiExplosions = []; this.mercado = new Mercado();this.guildas=new Guildas();this.agora=()=>Date.now();
    if (populate) this.populate();
  }
  uid(prefix) { return prefix + (++this.serial); }
  emit(type, data = {}) { this.events.push({ id: this.uid('e'), type, at: this.time, ...data }); }
  notify(p, text) { this.emit('message', { playerId: p.id, text }); }
  notificarNovidade(p, novidade) {
    if (!p || !validarNovidade(novidade) || p.novidades.some(n => n.id === novidade.id)) return false;
    p.novidades.push(...restaurarNovidades([{...novidade,data:this.agora(),lida:false,resgatada:p.correioResgatadas.includes(novidade.id)}]));
    p.novidades = p.novidades.slice(-100); return true;
  }
  addPlayer(id, name = 'Guerreiro', saved = null) {
    const p = createPlayer(id, name, saved, this.time);
    this.players.set(id, p); return p;
  }
  exportPlayer(p) { return serializePlayer(p); }
  addMob(type, x, y, area = 'inicial') {
    ({ x, y } = pontoDeSpawnForaDaSafeZone(area, { x, y }));
    const info = mobStats(type, area);
    const m = { id: this.uid('m'), type, area, x, y, homeX: x, homeY: y, ...info, maxHp: info.hp,
      attackReady: this.time + 1, telegraph: null, deadUntil: 0, moving: false,
      facing: { x: 0, y: 1 }, strike: null, planet: areaPorId(area)?.planet || 'namek' };
    this.mobs.set(m.id, m); return m;
  }
  populate() {
    for (const s of spawnPoints(this.random)) {
      const m = this.addMob(s.type, s.x, s.y, s.area);
      // O chefe raro não está no mapa quando o servidor liga: aparece depois do primeiro sorteio.
      if (s.raro) { m.raro = true; m.hp = 0; m.deadUntil = this.time + (this.chefeJa ? 10 : renasceEm(m.type, this.random)); }
    }
  }
  // Mesmo lugar = mesmo planeta e mesma área fechada. Nada atravessa de um lugar para outro:
  // dano, alvo, aggro, projéteis, loot e o que cada jogador recebe no snapshot.
  mesmoLugar(a, b) { return Boolean(a && b) && a.planet === b.planet && (a.area || null) === (b.area || null); }
  // Proteção permanente na Terra, Vila e quadrado da hunt, além da proteção breve de chegada.
  protegido(p) { return !p.area || Boolean(areaPorId(p.area)?.segura) || naZonaSegura(p) || this.time < p.seguroAte; }
  // Avisa quem está na hunt que o chefe raro apareceu.
  anunciarChefe(m) {
    for (const p of this.players.values()) if (p.connected && this.mesmoLugar(p, m)) this.notify(p, m.name + ' ' + (CHEFES_RAROS[m.area]?.aviso || 'apareceu!'));
  }
  // Leva o jogador para a chegada de um lugar (portal ou renascimento).
  levar(p, destino) {
    p.forma = 'base';
    p.genkiLancado = null; p.genkiDirecao = null;
    this.genkiCharges = this.genkiCharges.filter(g => g.owner !== p.id);
    this.projectiles = this.projectiles.filter(s => s.kind !== 'genki' || s.owner !== p.id);
    this.kamehamehas = this.kamehamehas.filter(k => k.owner !== p.id);
    p.planet = destino.planet; p.area = destino.area; p.x = destino.chegada.x; p.y = destino.chegada.y;
    p.saidaSegura = null; p.autoHunt = false; p.moveTo = null; p.targetId = null; p.charge = null; p.rota = null; p.input = { x: 0, y: 0 };
    p.seguroAte = this.time + CONFIG.chegadaSegura;
  }
  usePortal(p, destinoId) {
    const portal = PORTAIS.find(o => o.planet === p.planet && o.area === (p.area || null) && o.destinos.includes(destinoId) && distance(p, o) <= RAIO_PORTAL + 45);
    const destino = lugar(destinoId);
    if (!portal || !destino) return this.reject(p, 'Chegue perto de um portal para viajar.');
    this.levar(p, destino);
    const aviso = destino.nivel && p.level < destino.nivel[0] ? ' Recomendado a partir do nível ' + destino.nivel[0] + ': cuidado!' : '';
    this.notify(p, 'Portal: ' + destino.name + '.' + aviso); return { ok: true };
  }
  setInput(id, data) {
    const p = this.players.get(id); if (!p || !p.connected) return;
    let x = clamp(Number(data.x) || 0, -1, 1), y = clamp(Number(data.y) || 0, -1, 1);
    if (Math.hypot(x, y) > 1) ({ x, y } = norm(x, y));
    p.input = { x, y }; p.inputAt = this.time;
    if (x || y) { p.autoHunt = false; p.moveTo = null; p.facing = norm(x, y); }
    if (Number.isFinite(data.aimX) && Number.isFinite(data.aimY)) { const w = PLANETS[p.planet] || PLANETS.namek; p.aim = { x: clamp(data.aimX, 0, w.w), y: clamp(data.aimY, 0, w.h) }; }
  }
  targetOf(p) {
    const mob = this.mobs.get(p.targetId);
    if (mob && mob.hp > 0 && this.mesmoLugar(p, mob)) return mob;
    const player = this.players.get(p.targetId);
    if (player && this.canPvp(p, player)) return player;
    return null;
  }
  // PvP só numa área marcada como pvp (nenhuma hoje: o PvP saiu nesta versão, decisão do Pedro).
  canPvp(a, b) {
    if (!a || !b || a.id === b.id || !a.connected || !b.connected || a.hp <= 0 || b.hp <= 0) return false;
    return this.mesmoLugar(a, b) && Boolean(areaPorId(a.area)?.pvp);
  }
  // Distância até a borda do corpo do alvo: mob grande (Oozaru) é alcançado de mais longe.
  distanciaAoCorpo(a, b) { return Math.max(0, distance(a, b) - (b.corpo || 0)); }
  nearestMob(p, radius = 350, aceita = null) {
    let best = null, d = radius;
    for (const m of this.mobs.values()) {
      if (m.hp <= 0 || !this.mesmoLugar(p, m) || (aceita && !aceita(m))) continue;
      const dd = this.distanciaAoCorpo(p, m); if (dd < d) { d = dd; best = m; }
    }
    return best;
  }
  // Prioriza alvos próximos, mas só considera inimigos alcançáveis pelo caminho de colisão.
  alvoMaisProximo(p, raio = CONFIG.autoHuntRaio) {
    const vivos = [...this.mobs.values()].filter(m => m.hp > 0 && !CHEFES.has(m.type) && !naZonaSegura(m) && this.mesmoLugar(p, m)
      && distance(p, m) < raio && (p.ignorar?.[m.id] || 0) <= this.time)
      .sort((a, b) => distance(p, a) - distance(p, b));
    const alcançavel = m => distance(p, m) < 49 || caminhoPorTerra(p.planet, p, m, p.area, 40, true);
    const opcoes = vivos.filter(alcançavel);
    const atual = this.mobs.get(p.targetId);
    if (atual && vivos.includes(atual) && alcançavel(atual)) {
      const maisPerto = vivos.find(m => m !== atual && distance(p, m) + 35 < distance(p, atual) && alcançavel(m));
      if (maisPerto) {
        p.alvosRecentes = [...(p.alvosRecentes || []), maisPerto.id].slice(-3);
        return maisPerto;
      }
      return atual;
    }
    if (!opcoes.length) return null;
    const recentes = p.alvosRecentes || [];
    // O primeiro alvo continua sendo o mais próximo. Depois de cada abate, varia entre
    // inimigos alcançáveis a no máximo 35 unidades do mais próximo, sem repetir os três
    // últimos quando há alternativas. A margem respeita a prioridade e a histerese atuais.
    const maisPerto = distance(p, opcoes[0]);
    const grupo = recentes.length ? opcoes.filter(m => distance(p, m) <= maisPerto + 35) : [opcoes[0]];
    const novos = grupo.filter(m => !recentes.includes(m.id));
    const escolhas = novos.length ? novos : grupo;
    const escolhido = escolhas[Math.min(escolhas.length - 1, Math.floor(this.random() * escolhas.length))];
    p.alvosRecentes = [...recentes, escolhido.id].slice(-3);
    return escolhido;
  }
  // Entre combates, patrulha pontos de nascimento espalhados pela hunt. Evita repetir os três
  // últimos pontos para sair da mesma área e encontrar outros inimigos.
  proximaPatrulha(p) {
    const historico = p.patrulhasRecentes || [];
    let pontos = [...this.mobs.values()].filter(m => this.mesmoLugar(p, m) && distance(p, { x: m.homeX, y: m.homeY }) > 350 && !historico.includes(m.id));
    if (!pontos.length) pontos = [...this.mobs.values()].filter(m => this.mesmoLugar(p, m) && distance(p, { x: m.homeX, y: m.homeY }) > 120);
    if (!pontos.length) return null;
    const ponto = pontos[Math.min(pontos.length - 1, Math.floor(this.random() * pontos.length))];
    p.patrulhasRecentes = [...historico, ponto.id].slice(-3);
    return { id: ponto.id, x: ponto.homeX, y: ponto.homeY };
  }
  // Sai por um caminho livre antes de procurar alvos, mesmo que haja mobs ao lado.
  saidaDaZonaSegura(p) {
    const q = zonaSeguraDaHunt(p.area), candidatos = [];
    for (let i = 0; i < 32; i++) {
      const a = i * Math.PI / 16, ponto = { x: q.x + q.w / 2 + Math.cos(a) * 145, y: q.y + q.h / 2 + Math.sin(a) * 145 };
      if (pesLivres(p.planet, ponto.x, ponto.y, 15, p.area) && caminhoPorTerra(p.planet, p, ponto, p.area, 0)) candidatos.push(ponto);
    }
    return candidatos.sort((a, b) => distance(p, a) - distance(p, b))[0] || null;
  }
  aimDirection(p, target = null) {
    if (target) return norm(target.x - p.x, target.y - p.y);
    if (p.aim) return norm(p.aim.x - p.x, p.aim.y - p.y);
    return p.facing;
  }
  action(id, data) {
    const p = this.players.get(id); if (!p || !p.connected || p.hp <= 0) return { ok: false, reason: 'Personagem indisponível.' };
    const kind = data.type;
    if(kind==='montaria'){if(data.valor!==null&&data.valor!=='nimbus')return{ok:false,reason:'Montaria inválida.'};p.montaria=data.valor;return{ok:true};}
    if(kind==='atribuirConsumivelHotkey'){
      if(![7,8].includes(data.slot)||!consumivelValido(data.item)||!(p.inventory[data.item]>0))return {ok:false,reason:'Arraste um consumível da mochila para os slots 7 ou 8.'};
      p.hotkeysConsumiveis[data.slot]=data.item;return {ok:true};
    }
    if(kind==='removerConsumivelHotkey'){
      if(![7,8].includes(data.slot)||p.hotkeysConsumiveis[data.slot]!==data.item||!consumivelValido(data.item))return {ok:false};
      p.hotkeysConsumiveis[data.slot]=null;return {ok:true};
    }
    if(kind==='usarConsumivelHotkey'){
      if(![7,8].includes(data.slot))return {ok:false};
      const uso=acaoConsumivel(p.hotkeysConsumiveis[data.slot]);return uso?this.action(id,uso):{ok:false};
    }
    if(kind === 'huntAnalyzerReset'){p.huntAnalyzer=novaSessao();return {ok:true};}
    if (kind === 'target') {
      const candidate = this.mobs.get(data.id) || this.players.get(data.id);
      if (candidate && candidate.id !== p.id) p.targetId = candidate.id;
      return { ok: true };
    }
    if (kind === 'chat') {
      const texto = String(data.texto ?? '').replace(/\s+/g, ' ').trim().slice(0, 120);
      if (!texto) return { ok: false };
      const canal = ['global', 'local', 'trade'].includes(data.canal) ? data.canal : 'local';
      // Local: só a mesma área (o evento leva planet+area → o filtro do snapshot restringe).
      // Global e Comércio: todo mundo (sem planet no evento → o filtro deixa passar para todos).
      const lugar = canal === 'local' ? { planet: p.planet, area: p.area || null } : {};
      this.emit('chat', { nome: p.name, texto, canal, ...lugar });
      return { ok: true };
    }
    if(kind==='preferencias'){p.preferencias=preferenciasValidas(data.valor);return{ok:true};}
    if(kind==='resgatarMissao')return resgatarMissao(this,p,data.id);
    if(kind==='acompanharMissao'){if(data.id!==null&&!listarMissoes(p,this.agora()).some(m=>m.id===data.id))return{ok:false};p.missoes.acompanhada=data.id;return{ok:true};}
    if(kind==='correio')return acaoCorreio(p,data);
    if (kind === 'lerNovidades') {
      if (!Array.isArray(data.ids) || data.ids.length > 100 || data.ids.some(id => typeof id !== 'string')) return { ok:false };
      for (const n of p.novidades) if (data.ids.includes(n.id)) n.lida = true;
      return { ok:true };
    }
    if (kind === 'toggle') {
      if (!['autoAttack', 'autoSkills', 'autoFood', 'autoKi', 'autoSeed', 'autoHeal'].includes(data.key)) return { ok: false };
      p[data.key] = Boolean(data.value); return { ok: true };
    }
    if (kind === 'godmode') {
      aplicarGodmode(p, !p.godmode);
      this.notify(p, p.godmode ? 'God mode LIGADO: nível 100, invencível, Zeni e peso infinitos.' : 'God mode desligado: status restaurados.');
      return { ok: true };
    }
    if (kind === 'healThreshold' || kind === 'automationThreshold') {
      const key = kind === 'healThreshold' ? 'healThreshold' : data.key;
      if (!['healThreshold', 'kiThreshold', 'seedThreshold'].includes(key)) return { ok: false };
      if (!Number.isInteger(data.value) || data.value < 1 || data.value > 100) return this.reject(p, 'Escolha um limite entre 1% e 100%.');
      p[key] = data.value; return { ok: true };
    }
    // Caça automática: roda a hunt inteira onde o jogador está (sem escolher região).
    if (kind === 'hunt') {
      const z = areaPorId(p.area);
      if (data.enabled !== false && (!z || z.segura)) return this.reject(p, 'A caça automática funciona dentro das hunts. Entre por um portal da Vila.');
      p.saidaSegura = null; p.autoHunt = data.enabled !== false; p.moveTo = null; p.targetId = null; p.caca = null; p.patrulha = null; p.patrulhasRecentes = []; p.alvosRecentes = []; p.rota = null;
      if (p.autoHunt) { p.autoAttack = true; p.autoSkills = true; p.aim = null; this.notify(p, 'Caça automática: ' + z.name); }
      return { ok: true };
    }
    if (kind === 'moveTo' && Number.isFinite(data.x) && Number.isFinite(data.y)) {
      p.autoHunt = false; const w = PLANETS[p.planet] || PLANETS.namek;
      const plano = planejarClique(p.planet, p, { x: clamp(data.x, 30, w.w - 30), y: clamp(data.y, 30, w.h - 30) }, p.area);
      p.rota = null;
      p.moveTo = { ...plano.destino, pontos: plano.pontos, progresso: { x: p.x, y: p.y, em: this.time } };
      return { ok: true };
    }
    if (kind === 'selectSeed' && CONFIG.seedPotencies.includes(Number(data.potency))) { p.seedSelected = Number(data.potency); return { ok: true }; }
    if (kind === 'food') return this.useFood(p);
    if (kind === 'seed') return this.useSeed(p, Number(data.potency) || p.seedSelected);
    if (kind === 'potion') return this.usePotion(p);
    if (kind === 'buyAll') return this.buyAll(p,data.itens);
    if (kind === 'buy') return this.buy(p, data.item, data.quantidade);
    if (kind === 'sell') return this.sell(p);
    if (kind === 'venderItem') return this.venderItem(p,data.item,data.quantidade);
    if (['mercadoAnunciar','mercadoComprar','mercadoCancelar','mercadoReceber'].includes(kind)) {
      const metodo={mercadoAnunciar:'anunciar',mercadoComprar:'comprar',mercadoCancelar:'cancelar',mercadoReceber:'receber'}[kind];
      const resultado=this.mercado[metodo](p,data,this.time);
      if(!resultado.ok)return this.reject(p,resultado.reason);
      this.notify(p,({mercadoAnunciar:'Anúncio publicado. Os itens estão reservados no mercado.',mercadoComprar:'Compra no mercado concluída.',mercadoCancelar:'Anúncio cancelado. Itens devolvidos.',mercadoReceber:'Saldo de vendas recebido.'})[kind]);
      return resultado;
    }
    if (kind === 'transform') {
      return this.cast(p, 'transform');
    }
    if (kind === 'portal') return this.usePortal(p, data.destino);
    if (kind === 'skill') return this.cast(p, data.skill);
    return { ok: false, reason: 'Ação inválida.' };
  }
  reject(p, reason) { this.notify(p, reason); return { ok: false, reason }; }
  addItem(p, key, count = 1) {
    if (!(key in CONFIG.itemWeights) || !Number.isInteger(count) || count < 1) return false;
    if (bagWeight(p.inventory) + CONFIG.itemWeights[key] * count > p.stats.capacity + 0.0001) return false;
    p.inventory[key] = (p.inventory[key] || 0) + count; return true;
  }
  useFood(p) {
    if (!p.inventory.food) return this.reject(p, 'Você está sem comida. Visite o mercado da vila.');
    if (p.foodUntil > this.time + 1) return this.reject(p, 'A comida ainda está ativa.');
    analisar(p,'supplies',1,'food'); p.inventory.food--; p.foodUntil = this.time + CONFIG.foodDuration;
    this.notify(p, 'Presunto: regeneração por 5 minutos.'); return { ok: true };
  }
  useSeed(p, potency) {
    if (!CONFIG.seedPotencies.includes(potency)) return { ok: false, reason: 'Potência inválida.' };
    if (this.time < p.seedReady) return this.reject(p, 'Sementes em recarga: ' + Math.ceil(p.seedReady - this.time) + 's.');
    const key = 'seed' + potency;
    if (!p.inventory[key]) return this.reject(p, 'Sem semente de ' + potency + '%.');
    if (p.hp >= p.stats.hp) return this.reject(p, 'Sua vida já está cheia.');
    analisar(p,'supplies',1,key); const hpAntes=p.hp; p.inventory[key]--; p.hp = Math.min(p.stats.hp, p.hp + p.stats.hp * potency / 100);
    analisar(p,'cura',p.hp-hpAntes); p.seedReady = this.time + CONFIG.seedCooldown;
    this.emit('heal', { x: p.x, y: p.y, text: '+' + potency + '%', playerId: p.id });
    this.notify(p, 'Semente usada. Todas as potências em recarga por ' + CONFIG.seedCooldown + 's.'); return { ok: true };
  }
  usePotion(p) {
    if (this.time < p.kiReady) return this.reject(p, 'Poção de Ki em recarga.');
    if (!p.inventory.ki) return this.reject(p, 'Você está sem poções de Ki.');
    if (p.ki >= p.stats.ki) return this.reject(p, 'Seu Ki já está cheio.');
    analisar(p,'supplies',1,'ki'); p.inventory.ki--; p.ki = Math.min(p.stats.ki, p.ki + p.stats.ki * 0.45); p.kiReady = this.time + CONFIG.kiCooldown;
    this.emit('ki', { x: p.x, y: p.y, playerId: p.id }); return { ok: true };
  }
  buy(p, item, quantidade = 1) {
    if (!mercadorPerto(p)) return this.reject(p, 'Aproxime-se do mercado na Vila.');
    if (!Object.hasOwn(CONFIG.prices,item)) return { ok:false };
    if (!Number.isSafeInteger(quantidade) || quantidade < 1 || quantidade > LIMITE_ESTOQUE_LOJA)
      return this.reject(p, 'Escolha uma quantidade inteira entre 1 e ' + LIMITE_ESTOQUE_LOJA + '.');
    const total = CONFIG.prices[item] * quantidade;
    if (p.zeni < total) return this.reject(p, 'Zeni insuficiente para essa quantidade.');
    if ((p.inventory[item] || 0) + quantidade > LIMITE_ESTOQUE_LOJA) return this.reject(p, 'Limite de estoque desse item atingido.');
    // A compra inteira é validada antes de descontar Zeni; nunca entrega um lote parcial.
    if (!this.addItem(p, item, quantidade)) return this.reject(p, 'A mochila está sem capacidade para essa quantidade.');
    p.zeni -= total; this.notify(p, 'Compra concluída: ' + quantidade + (quantidade === 1 ? ' item.' : ' itens.'));
    return { ok:true, item, quantidade, total };
  }
  buyAll(p,itens) {
    if(!mercadorPerto(p))return this.reject(p,'Aproxime-se do mercado na Vila.');
    const resultado=avaliarCarrinho(p,itens);if(!resultado.ok)return this.reject(p,resultado.reason);
    for(const[item,q]of Object.entries(itens))if(q)p.inventory[item]=(p.inventory[item]||0)+q;
    p.zeni-=resultado.total;this.notify(p,'Compra conjunta concluída: '+resultado.quantidade+' itens por '+resultado.total+' Z.');return resultado;
  }
  venderItem(p,item,quantidade) {
    if(!mercadorPerto(p))return this.reject(p,'Aproxime-se do mercador para vender.');
    if(!Object.hasOwn(ITENS_NEGOCIAVEIS,item)||!Number.isSafeInteger(quantidade)||quantidade<1||quantidade>LIMITE_ESTOQUE_LOJA)return this.reject(p,'Item ou quantidade inválidos.');
    if((p.inventory[item]||0)<quantidade)return this.reject(p,'Você não possui essa quantidade.');
    const total=ITENS_NEGOCIAVEIS[item].precoNpc*quantidade;
    if(!creditarZeni(p,total))return this.reject(p,'Seu saldo de Zeni está no limite. Venda uma quantidade menor.');
    p.inventory[item]-=quantidade;this.notify(p,'Venda ao NPC concluída: '+quantidade+' por '+total+' Z.');
    return{ok:true,item,quantidade,total};
  }
  sell(p) {
    if (!mercadorPerto(p)) return this.reject(p, 'Aproxime-se do mercado na vila.');
    const value = p.inventory.scrap * 8 + p.inventory.crystal * 15;
    if (!value) return this.reject(p, 'Sem materiais para vender.');
    if(!creditarZeni(p,value))return this.reject(p,'Seu saldo de Zeni está no limite.');
    p.inventory.scrap = 0; p.inventory.crystal = 0;
    this.notify(p, 'Materiais vendidos por ' + value + ' Zeni.'); return { ok: true, value };
  }
  cast(p,skill,automated=false){
    const r=this.executarTecnica(p,skill,automated);
    this.verificarKiDaForma(p);
    if(r.ok&&skill!=='basic'&&skill!=='heal')registrarMissao(p,'skills',1,this.agora());return r;
  }
  executarTecnica(p, skill, automated = false) {
    if (!p.connected || p.hp <= 0) return { ok: false };
    if (skill === 'kaioken' || skill === 'transform') return this.alternarForma(p, skill, automated);
    if (skill === 'heal') return this.curarVida(p, automated);
    if (naZonaSegura(p) && ['basic', 'ki', 'kame', 'genki'].includes(skill)) return automated ? { ok: false } : this.reject(p, 'Saia da safe zone para atacar.');
    const target = this.targetOf(p) || this.nearestMob(p, skill === 'basic' ? 70 : 430);
    if (skill === 'basic') {
      if (this.time < p.basicReady) return { ok: false };
      p.basicReady = this.time + 0.45;
      const dir = this.aimDirection(p, target); if (p.autoHunt) p.facing = dir;
      this.emit('punch', { x: p.x, y: p.y, dx: dir.x, dy: dir.y, playerId: p.id });
      if (target && this.distanciaAoCorpo(p, target) <= 70) this.hit(p, target, p.stats.attack * (p.transformed ? 1.5 : 1) * (p.forma === 'kaioken' ? 1.4 : 1));
      return { ok: true };
    }
    if (skill === 'dash') {
      if (p.level < CONFIG.skills.dash || this.time < p.dashReady) return automated ? { ok: false } : this.reject(p, 'Imagem Residual: nível 2 e recarga de 4s.');
      const dir = Math.hypot(p.input.x, p.input.y) > 0.1 ? norm(p.input.x, p.input.y) : this.aimDirection(p, null);
      p.dashDirection = dir; p.dashUntil = this.time + 0.18; p.dashReady = this.time + (p.godmode ? 1 : 4); p.charge = null;
      this.emit('dash', { x: p.x, y: p.y, playerId: p.id }); return { ok: true };
    }
    if (skill === 'ki') {
      if (p.level < CONFIG.skills.ki) return automated ? { ok: false } : this.reject(p, 'Rajada de Ki libera no nível 2.');
      if (this.time < p.shotReady || p.ki < 7 || p.charge) return { ok: false };
      p.ki -= 7; p.shotReady = this.time + 0.7;
      const dir = this.aimDirection(p, target); if (p.autoHunt) p.facing = dir;
      this.emit('kiShot', {x:p.x,y:p.y,playerId:p.id});
      this.projectiles.push({ id: this.uid('s'), x: p.x, y: p.y, planet: p.planet, area: p.area, dx: dir.x, dy: dir.y, speed: 470,
        owner: p.id, ownerType: 'player', damage: p.stats.attack * (p.transformed ? 2.1 : 1.4) * (p.forma === 'kaioken' ? 1.4 : 1),
        ttl: 0.95, kind: 'ki', started: this.time, cor: 213, corHex: '#0072FB', tamanho: 48, fps: 12 });
      return { ok: true };
    }
    if (skill === 'kame') {
      if (p.level < CONFIG.skills.kame) return automated ? { ok: false } : this.reject(p, 'Kamehameha libera no nível 3.');
      if (p.charge || this.time < p.kameReady || p.ki < CONFIG.skillCosts.kame) return automated ? { ok: false } : this.reject(p, 'Kamehameha em recarga ou Ki insuficiente.');
      const alvoKame = this.mobs.get(p.targetId);
      const alcance = estagioKame(p.level).alcance + KAME.mao;
      const antecipacao = automated && p.autoHunt && p.moving ? p.stats.mobility * KAME.carga : 0;
      if (!alvoKame || alvoKame.hp <= 0 || !this.mesmoLugar(p, alvoKame) || naZonaSegura(alvoKame) || this.distanciaAoCorpo(p, alvoKame) > alcance + antecipacao)
        return automated ? { ok: false } : this.reject(p, 'Selecione um mob vivo dentro do alcance do Kamehameha.');
      const dir = norm(alvoKame.x - p.x, alvoKame.y - p.y);p.facing = dir;
      p.ki -= CONFIG.skillCosts.kame; p.kameReady = this.time + (p.godmode ? 1 : CONFIG.skillCooldowns.kame);
      const nivel = estagioKame(p.level).nivel;
      p.charge = { targetId: alvoKame.id, automated, until: this.time + KAME.carga, started: this.time + KAME.carga - KAME.primeiroFeixe * KAME.quadro, direction: dir, nivel };
      return { ok: true };
    }
    if (skill === 'barrier') {
      if (p.level < CONFIG.skills.barrier) return automated ? { ok: false } : this.reject(p, 'Barreira de Ki libera no nível 2.');
      if (this.time < p.barrierReady || p.ki < CONFIG.skillCosts.barrier) return automated ? { ok: false } : this.reject(p, 'Barreira em recarga ou Ki insuficiente.');
      p.ki -= CONFIG.skillCosts.barrier; p.barrierUntil = this.time + 2.5; p.barrierReady = this.time + (p.godmode ? 1 : CONFIG.skillCooldowns.barrier);
      p.barrierStarted = this.time; // Só sincroniza a animação nos clientes.
      this.emit('barrier', { x: p.x, y: p.y, playerId: p.id }); this.notify(p, 'Barreira de Ki ativada!'); return { ok: true };
    }
    if (skill === 'genki') {
      if (p.level < CONFIG.skills.genki) return automated ? { ok: false } : this.reject(p, 'Genki Dama libera no nível 10.');
      if (this.time < p.genkiReady || p.ki < CONFIG.skillCosts.genki || p.charge || this.genkiCharges.some(g => g.owner === p.id)) return automated ? { ok: false } : this.reject(p, 'Genki Dama em recarga ou Ki insuficiente.');
      const dir = this.aimDirection(p, target); if (p.autoHunt) p.facing = dir; p.ki -= CONFIG.skillCosts.genki; p.genkiReady = this.time + (p.godmode ? 1 : CONFIG.skillCooldowns.genki);
      p.genkiLancado = null;p.genkiDirecao = null;
      this.genkiCharges.push({ id: this.uid('g'), x: p.x, y: p.y, planet: p.planet, area: p.area,
        owner: p.id, targetId: target?.id || null, direction: dir,
        aim: p.aim ? { x: p.aim.x, y: p.aim.y - GENKI.alturaAlvo } : null, started: this.time, until: this.time + GENKI.carga,
        damage: p.stats.attack * (p.transformed ? 14 : 10) * (p.forma === 'kaioken' ? 1.4 : 1) });
      this.emit('genki', { x: p.x, y: p.y, dx: dir.x, dy: dir.y, playerId: p.id }); return { ok: true };
    }
    return { ok: false };
  }
  alternarForma(p, tecnica, automatica = false) {
    const forma = tecnica === 'kaioken' ? 'kaioken' : 'ssj';
    const nome = forma === 'kaioken' ? 'Kaioken' : 'Super Saiyajin';
    if (p.level < CONFIG.skills[tecnica]) return automatica ? { ok: false } : this.reject(p, nome + ' libera no nível ' + CONFIG.skills[tecnica] + '.');
    // A automação nunca alterna/desliga formas; o limite de entrada é provisório.
    if (automatica && (p.forma !== 'base' || p.ki <= p.stats.ki * CONFIG.transformacao.limiteAutomatico)) return { ok: false };
    p.forma = p.forma === forma ? 'base' : forma;
    if (p.forma === 'kaioken') this.emit('kaioken', { x: p.x, y: p.y, playerId: p.id });
    this.notify(p, p.forma === 'base' ? 'Forma base.' : nome + ' ativado!');
    return { ok: true };
  }
  verificarKiDaForma(p) {
    if (p.forma !== 'base' && p.ki <= 0 && !p.godmode) {
      p.forma = 'base'; this.notify(p, 'Ki esgotado. Forma base.');
    }
  }
  atualizarGenkis(dt) {
    // Metadados transitórios da pose não sobrevivem a cancelamento nem reconexão.
    for (const p of this.players.values()) if (!p.connected || p.hp <= 0 || naZonaSegura(p) || this.time - p.genkiLancado >= .35) {
      p.genkiLancado = null;p.genkiDirecao = null;
    }
    this.genkiExplosions = this.genkiExplosions.filter(g => this.time - g.started < GENKI.explosao);
    const ativo = (p, g) => p && p.connected && p.hp > 0 && this.mesmoLugar(p, g) && !naZonaSegura(p);
    const alvoValido = (alvo, g) => alvo && alvo.hp > 0 && this.mesmoLugar(alvo, g) && !naZonaSegura(alvo)
      && (!this.players.has(alvo.id) || (alvo.connected && this.canPvp(this.players.get(g.owner), alvo)));
    this.genkiCharges = this.genkiCharges.filter(g => {
      const p = this.players.get(g.owner);
      if (!ativo(p, g)) return false;
      const alvo = this.mobs.get(g.targetId) || this.players.get(g.targetId);
      if (g.targetId && !alvoValido(alvo, g)) return false;
      g.x = p.x; g.y = p.y;
      if (this.time + 1e-9 < g.until) return true;
      const origem = { x: p.x, y: p.y - (g.targetId || g.aim ? GENKI.alturaOrigem : GENKI.alturaAlvo) };
      const direcao = !g.targetId && g.aim ? norm(g.aim.x - origem.x, g.aim.y - origem.y) : g.direction;
      p.genkiLancado = this.time;p.genkiDirecao = { ...direcao };
      this.projectiles.push({ id: this.uid('s'), kind: 'genki', owner: p.id, ownerType: 'player',
        ...origem, planet: g.planet, area: g.area,
        dx: direcao.x, dy: direcao.y, speed: GENKI.velocidade, targetId: g.targetId,
        damage: g.damage, radius: GENKI.area, started: this.time, ttl: 1 });
      return false;
    });
    for (const s of this.projectiles) {
      if (s.kind !== 'genki' || s.ttl <= 0) continue;
      const p = this.players.get(s.owner);
      if (!ativo(p, s)) { if(p){p.genkiLancado=null;p.genkiDirecao=null;} s.ttl = 0; continue; }
      const alvo = this.mobs.get(s.targetId) || this.players.get(s.targetId);
      if (s.targetId && !alvoValido(alvo, s)) { if(p){p.genkiLancado=null;p.genkiDirecao=null;} s.ttl = 0; continue; }
      const antes = { x: s.x, y: s.y };
      let passo = s.speed * dt;
      if (alvo) {
        const direcao = norm(alvo.x - s.x, alvo.y - GENKI.alturaAlvo - s.y);
        s.dx = direcao.x; s.dy = direcao.y;
        passo = Math.min(passo, Math.hypot(alvo.x - s.x, alvo.y - GENKI.alturaAlvo - s.y));
      }
      const fim = { x: s.x + s.dx * passo, y: s.y + s.dy * passo };
      const candidatos = [...this.mobs.values(), ...this.players.values()].filter(t => t.id !== p.id && alvoValido(t, s)
        && !naZonaSegura(t) && segmentDistance(t.x, t.y, antes.x, antes.y, fim.x, fim.y) < GENKI.colisao);
      candidatos.sort((a, b) => distance(antes, a) - distance(antes, b));
      const atingido = candidatos.find(t => this.hit(p, t, s.damage));
      if (atingido) {
        const dx = fim.x - antes.x, dy = fim.y - antes.y, quadrado = dx * dx + dy * dy;
        const t = quadrado ? clamp(((atingido.x - antes.x) * dx + (atingido.y - antes.y) * dy) / quadrado, 0, 1) : 0;
        s.x = antes.x + dx * t; s.y = antes.y + dy * t;
        for (const extra of [...this.mobs.values(), ...this.players.values()]) {
          if (extra.id !== atingido.id && extra.id !== p.id && alvoValido(extra, s) && distance(extra, atingido) <= s.radius) this.hit(p, extra, s.damage * 0.45);
        }
        this.genkiExplosions.push({ id: this.uid('gx'), x: s.x, y: s.y, planet: s.planet, area: s.area, started: this.time });
        s.ttl = 0;
      } else {
        s.x = fim.x; s.y = fim.y;
        const lim = areaPorId(s.area) || { x: 0, y: 0, w: PLANETS[s.planet].w, h: PLANETS[s.planet].h };
        if (!alvo && (s.x < lim.x || s.x > lim.x + lim.w || s.y < lim.y || s.y > lim.y + lim.h)) s.ttl = 0;
      }
    }
  }
  curarVida(p, automated = false) {
    const falha = motivo => automated ? { ok: false } : this.reject(p, motivo);
    if (!p.connected || p.hp <= 0) return { ok: false };
    const cura = curaPorNivel(p.level);
    if (p.hp >= p.stats.hp) return falha('Sua vida já está cheia.');
    if (this.time + 1e-9 < p.healReady) return falha('Cura de Vida em recarga.');
    if (p.ki < cura.custo) return falha('Ki insuficiente para curar vida.');
    // Um único caminho para tecla, botão e automação: reserva a recarga antes de curar.
    p.healReady = this.time + (p.godmode ? 1 : CURA.cooldown); p.ki -= cura.custo;
    registrarMissao(p,'skills',1,this.agora());
    p.healStarted = this.time; // Um único efeito por ativação confirmada, inclusive na autocura.
    const antes = p.hp;
    p.hp = Math.min(p.stats.hp, p.hp + p.stats.hp * cura.percentual);
    analisar(p,'cura',p.hp-antes);
    this.emit('heal', { x: p.x, y: p.y, playerId: p.id, planet: p.planet, area: p.area,
      amount: p.hp - antes, text: '+' + (p.hp - antes).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' HP' });
    return { ok: true };
  }
  hit(attacker, target, raw, { ignorarEsquiva = false } = {}) {
    if (target.hp <= 0 || (attacker && !this.mesmoLugar(attacker, target))) return false;
    if (attacker && this.players.has(attacker.id) && naZonaSegura(attacker)) return false;
    const playerTarget = this.players.has(target.id);
    if (playerTarget) {
      if (attacker && this.players.has(attacker.id) && !this.canPvp(attacker, target)) return false;
      if ((!ignorarEsquiva && this.time < target.dashUntil) || this.protegido(target)) return false;
    }
    const defense = playerTarget ? target.stats.defense : target.defesa ?? 1;
    const guardedRaw = playerTarget && this.time < target.barrierUntil ? raw * 0.28 : raw;
    const damage = Math.max(1, Math.round(guardedRaw * 100 / (100 + defense * 3)));
    const hpAntes=target.hp;
    if(playerTarget) analisar(target,'danoRecebido',Math.min(hpAntes,damage));
    if(attacker && this.players.has(attacker.id)) analisar(attacker,'danoCausado',Math.min(hpAntes,damage));
    if(damage>=hpAntes){
      if(playerTarget) registrarEncontro(target,'mortes',attacker,Boolean(attacker && (attacker.raro||CHEFES.has(attacker.type))));
      else if(attacker && this.players.has(attacker.id)) registrarEncontro(attacker,'abates',target,Boolean(target.raro||CHEFES.has(target.type)));
    }
    target.hp = Math.max(0, target.hp - damage);
    // Ameaça: quem bate num mob vira (ou reforça) o alvo dele, mesmo de longe e mesmo sendo mob neutro.
    if (!playerTarget && attacker && this.players.has(attacker.id)) this.somarAmeaca(target, attacker, damage);
    this.emit('damage', { x: target.x, y: target.y - 20, amount: damage, targetId: target.id });
    if (target.hp <= 0) {
      if (playerTarget) { target.respawnAt = this.time + CONFIG.respawnDelay; target.autoHunt = false; target.transformed = false; target.charge = null; this.notify(target, 'Derrotado. Volta ao começo da área em ' + CONFIG.respawnDelay + ' segundos.'); }
      else {
        target.deadUntil = this.time + (target.raro && this.chefeJa ? 60 : renasceEm(target.type, this.random)); target.telegraph = null; target.ameaca = null; target.voltando = false;
        if (attacker && this.players.has(attacker.id)) {
          analisar(attacker,'xp',target.xp);const zeniAntes=attacker.zeni; this.awardXp(attacker, target.xp); attacker.kills++;registrarMissao(attacker,'kills',1,this.agora()); attacker.zeni += target.raro ? RECOMPENSAS_MOBS.zeniChefe : RECOMPENSAS_MOBS.zeniMinimo + Math.floor(this.random() * RECOMPENSAS_MOBS.zeniVariacao);
          analisar(attacker,'zeni',attacker.zeni-zeniAntes);
          if(!target.raro&&CHEFES.has(target.type))registrarAtividadePasse(attacker,'bosses',1,this.agora());
          if (target.raro) { attacker.bossKills++;registrarMissao(attacker,'bosses',1,this.agora()); this.notify(attacker, target.name + ' derrotado! +100 Zeni e experiência.'); }
          const onde = { planet: target.planet, area: target.area };
          if (this.random() < attacker.stats.lootChance) this.loot.push({ id: this.uid('l'), x: target.x, y: target.y, ...onde, item: this.random() < RECOMPENSAS_MOBS.fracaoCristal ? 'crystal' : 'scrap', owner: attacker.id, until: this.time + 45 });
          if (this.random() < RECOMPENSAS_MOBS.chanceSemente15) this.loot.push({ id: this.uid('l'), x: target.x + 12, y: target.y, ...onde, item: 'seed15', owner: attacker.id, until: this.time + 45 });
        }
      }
    }
    return true;
  }
  awardXp(p, amount) {
    p.xp += amount;
    while (p.level < 100 && p.xp >= xpForLevel(p.level)) {
      p.xp -= xpForLevel(p.level); p.level++; const old = p.stats; p.stats = statsFor(p.level);
      p.hp = Math.min(p.stats.hp, p.hp + p.stats.hp - old.hp); p.ki = Math.min(p.stats.ki, p.ki + p.stats.ki - old.ki);
      this.emit('level', { playerId: p.id, x: p.x, y: p.y, level: p.level });
      const unlock = p.level === 2 ? ' Kaioken, Barreira de Ki e Imagem Residual liberados!' : p.level === 3 ? ' Kamehameha liberado!' : p.level === 5 ? ' Super Saiyajin liberado!' : p.level === 10 ? ' Genki Dama liberada!' : '';
      this.notify(p, 'Nível ' + p.level + '! Todos os atributos aumentaram.' + unlock);
    }
  }
  move(entity, dx, dy, dt, speed, radius = 15) {
    // Só mobs bloqueiam outros mobs. Jogadores atravessam seus corpos para sair de cercos.
    if (this.mobs.get(entity.id) === entity) {
      const antes = { x: entity.x, y: entity.y };
      this.moverMob(entity, dx * speed * dt, dy * speed * dt, true);
      entity.moving = distance(antes, entity) > 0.01;
      return;
    }
    [entity.x, entity.y] = deslocar(entity.planet, entity.x, entity.y, dx, dy, speed * dt, radius, entity.area, Boolean(entity.autoHunt && !naZonaSegura(entity)));
    entity.moving = Math.hypot(dx, dy) > 0.05;
  }
  // Raio no chão, incluindo a largura extra dos gigantes (pedido do Pedro, 07/11).
  raioMob(m) { return 22 + (m.corpo || 0); }
  moverMob(m, dx, dy, colidir = false) {
    const raio = this.raioMob(m), passos = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 4));
    const mundo = PLANETS[m.planet];
    const livre = (x, y) => x >= raio && y >= raio && x <= mundo.w - raio && y <= mundo.h - raio
      && pesLivres(m.planet, x, y, raio / 0.6, m.area)
      && (!colidir || ![...this.mobs.values()].some(outro => outro !== m && outro.hp > 0 && this.mesmoLugar(m, outro)
        && Math.hypot(x - outro.x, y - outro.y) < raio + this.raioMob(outro) - 0.001));
    // Passos curtos impedem atravessar uma parede ou outro corpo entre dois ticks.
    for (let i = 0; i < passos; i++) {
      if (livre(m.x + dx / passos, m.y)) m.x += dx / passos;
      if (livre(m.x, m.y + dy / passos)) m.y += dy / passos;
    }
  }
  separarMobs() {
    const vivos = [...this.mobs.values()].filter(m => m.hp > 0);
    // Resolve também nascimento, renascimento e crescimento da forma do Freeza.
    for (let rodada = 0; rodada < 32; rodada++) {
      let sobrepostos = false;
      for (let i = 0; i < vivos.length; i++) for (let j = i + 1; j < vivos.length; j++) {
        const a = vivos[i], b = vivos[j];
        if (!this.mesmoLugar(a, b)) continue;
        const d = distance(a, b), falta = this.raioMob(a) + this.raioMob(b) - d;
        if (falta <= 0.01) continue;
        sobrepostos = true;
        const angulo = (i + j) * 2.399963229728653;
        const nx = d > 0.001 ? (b.x - a.x) / d : Math.cos(angulo);
        const ny = d > 0.001 ? (b.y - a.y) / d : Math.sin(angulo);
        const antes = { x: a.x, y: a.y };
        this.moverMob(a, -nx * falta / 2, -ny * falta / 2);
        const afastou = Math.max(0, (antes.x - a.x) * nx + (antes.y - a.y) * ny);
        this.moverMob(b, nx * (falta - afastou), ny * (falta - afastou));
      }
      if (!sobrepostos) break;
    }
  }
  // Em planetas com máscara, segue pontos da rota livre (recalculados quando o alvo se move ou a cada 1,5 s).
  // A caça automática para se o alvo ficou sem rota; cliques e inimigos mantêm o desvio local de segurança.
  steer(entity, target, dt, speed, alcanceFinal = 0) {
    let alcancavel = true;
    if (temMascara(entity.planet)) {
      const rota = entity.rota;
      const evitarZonaSegura = Boolean(entity.autoHunt && !naZonaSegura(entity));
      const velha = !rota || this.time - rota.em > 1.5 || rota.alcance !== alcanceFinal || rota.evitarZonaSegura !== evitarZonaSegura || Math.hypot(rota.alvo.x - target.x, rota.alvo.y - target.y) > 60;
      if (velha) {
        const pontos = caminhoPorTerra(entity.planet, entity, target, entity.area, alcanceFinal, evitarZonaSegura);
        entity.rota = { alvo: { x: target.x, y: target.y }, em: this.time, alcance: alcanceFinal, evitarZonaSegura, pontos: pontos || [], encontrada: pontos !== null };
        alcancavel = Boolean(pontos);
      }
      alcancavel = alcancavel && entity.rota.encontrada;
      if (!alcancavel && (alcanceFinal > 0 || evitarZonaSegura)) return false;
      const pontos = entity.rota.pontos;
      while (pontos.length > 1 && Math.hypot(pontos[0].x - entity.x, pontos[0].y - entity.y) < 5) pontos.shift();
      if (pontos.length && (alcanceFinal > 0 || pontos.length > 1 || Math.hypot(pontos[0].x - entity.x, pontos[0].y - entity.y) > 12)) target = pontos[0];
    }
    if (distance(entity, target) < 1) { entity.moving = false; return alcancavel; }
    let dir = norm(target.x - entity.x, target.y - entity.y);
    const obstacle = OBSTACLES.find(o => segmentDistance(o.x, o.y, entity.x, entity.y, entity.x + dir.x * 90, entity.y + dir.y * 90) < o.r + 22 && distance(entity, o) < o.r + 100);
    if (obstacle) {
      const cross = dir.x * (obstacle.y - entity.y) - dir.y * (obstacle.x - entity.x);
      const side = cross > 0 ? -1 : 1;
      dir = norm(dir.x - dir.y * side * 1.8, dir.y + dir.x * side * 1.8);
    }
    // Se o passo não sai do lugar (encostado num canto), tenta desviar em 45° e depois 90°, para os dois
    // lados, em vez de ficar empurrando a parede.
    const dtMovimento = speed > 0 ? Math.min(dt, distance(entity, target) / speed) : dt;
    const antes = { x: entity.x, y: entity.y };
    for (const giro of [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2]) {
      const c = Math.cos(giro), s = Math.sin(giro), d = { x: dir.x * c - dir.y * s, y: dir.x * s + dir.y * c };
      this.move(entity, d.x, d.y, dtMovimento, speed);
      if (Math.hypot(entity.x - antes.x, entity.y - antes.y) > speed * dtMovimento * 0.3) break;
      entity.x = antes.x; entity.y = antes.y;
    }
    entity.facing = dir;
    return alcancavel;
  }
  updatePlayer(p, dt) {
    analisar(p,'segundos',dt);
    p.moving = false;
    if (!p.connected) { p.forma = 'base'; return; }
    if (p.godmode) { p.hp = p.stats.hp; p.ki = p.stats.ki; }
    if (p.hp <= 0) {
      p.forma = 'base';
      // Renasce no começo da mesma área (decisão do Pedro; pode mudar), protegido por alguns segundos.
      if (this.time >= p.respawnAt) { this.levar(p, lugar(p.area || 'terra')); p.hp = p.stats.hp; p.ki = p.stats.ki; }
      return;
    }
    // O botão principal pausa toda a automação, sem apagar as preferências.
    if (!p.autoHunt && p.charge?.automated) p.charge = null;
    if (p.foodUntil > this.time) {const antes=p.hp;p.hp = Math.min(p.stats.hp, p.hp + CONFIG.foodHealPerSecond * p.stats.healing * dt);analisar(p,'cura',p.hp-antes);}
    if (p.autoHunt && p.autoHeal && p.hp / p.stats.hp < p.healThreshold / 100) this.cast(p, 'heal', true);
    // Ki tem recuperação lenta apenas fora da caça/ataques; é um valor provisório de teste.
    if (p.forma === 'base' && !p.autoHunt && !p.charge && this.time - p.shotReady > 1.5 && this.time - p.basicReady > 1.5) p.ki = Math.min(p.stats.ki, p.ki + dt * 4);
    if (p.forma !== 'base' && !p.godmode) p.ki = Math.max(0, p.ki - dt * CONFIG.transformacao.drenoKi);
    this.verificarKiDaForma(p);
    if (this.time - p.inputAt > 0.35) p.input = { x: 0, y: 0 };
    if (this.time < p.dashUntil) this.move(p, p.dashDirection.x, p.dashDirection.y, dt, 620);
    else if (p.input.x || p.input.y) this.move(p, p.input.x, p.input.y, dt, p.stats.mobility * (p.charge ? 0.35 : 1));
    else if (p.autoHunt && naZonaSegura(p)) {
      p.targetId = null; p.charge = null;
      p.saidaSegura ||= this.saidaDaZonaSegura(p);
      if (p.saidaSegura) this.steer(p, p.saidaSegura, dt, p.stats.mobility);
    }
    else if (p.autoHunt) {
      p.saidaSegura = null;
      // Reavalia a cada passo: sempre persegue o inimigo mais próximo, inclusive
      // quando outro se aproxima durante a perseguição atual.
      const raioCaca = p.autoSkills && p.level >= CONFIG.skills.kame
        ? Math.max(CONFIG.autoHuntRaio, estagioKame(p.level).alcance + KAME.mao + p.stats.mobility * KAME.carga) : CONFIG.autoHuntRaio;
      const target = this.alvoMaisProximo(p, raioCaca);
      if (target) {
        if (target.id !== p.caca?.alvo) { p.caca = { alvo: target.id, melhor: Infinity, desde: this.time }; p.rota = null; }
        p.targetId = target.id;
        if (distance(p, target) > 49) {
          const alcancavel = this.steer(p, target, dt, p.stats.mobility, 40);
          const d = distance(p, target);
          if (!alcancavel) { (p.ignorar ||= {})[target.id] = this.time + 10; p.targetId = null; p.caca = null; p.rota = null; }
          else if (d < p.caca.melhor - 8) { p.caca.melhor = d; p.caca.desde = this.time; }
          else if (this.time - p.caca.desde > 3) { (p.ignorar ||= {})[target.id] = this.time + 10; p.targetId = null; p.caca = null; p.rota = null; }
        } else if (p.caca) p.caca.desde = this.time;
      } else {
        p.targetId = null;
        if (!p.patrulha || distance(p, p.patrulha) < 55) p.patrulha = this.proximaPatrulha(p);
        if (p.patrulha) {
          const idPatrulha = 'patrulha:' + p.patrulha.id;
          if (idPatrulha !== p.caca?.alvo) p.caca = { alvo: idPatrulha, melhor: Infinity, desde: this.time };
          const alcancavel = this.steer(p, p.patrulha, dt, p.stats.mobility, 40);
          const d = distance(p, p.patrulha);
          if (!alcancavel) { p.patrulha = null; p.caca = null; p.rota = null; }
          else if (d < p.caca.melhor - 8) { p.caca.melhor = d; p.caca.desde = this.time; }
          else if (this.time - p.caca.desde > 3) { p.patrulha = null; p.caca = null; p.rota = null; }
        }
      }
    } else if (p.moveTo) {
      const destino = p.moveTo;
      if (distance(p, destino) < (destino.pontos ? 2 : 16)) { p.moveTo = null; p.rota = null; }
      else {
        if (destino.pontos) {
          while (destino.pontos.length > 1 && distance(p, destino.pontos[0]) < 1) destino.pontos.shift();
          const alvo = destino.pontos[0], d = distance(p, alvo), dir = norm(alvo.x - p.x, alvo.y - p.y);
          this.move(p, dir.x, dir.y, Math.min(dt, d / p.stats.mobility), p.stats.mobility); p.facing = dir;
        } else this.steer(p, destino, dt, p.stats.mobility);
        if (!destino.progresso || distance(p, destino.progresso) > 4) destino.progresso = { x: p.x, y: p.y, em: this.time };
        else if (this.time - destino.progresso.em > 1) { p.moveTo = null; p.rota = null; p.moving = false; }
      }
    }
    if (naZonaSegura(p)) { p.charge = null; return; }
    if (p.autoFood && p.autoHunt && p.foodUntil <= this.time && p.inventory.food > 0) this.useFood(p);
    if (p.autoHunt && p.autoKi && p.ki / p.stats.ki < p.kiThreshold / 100 && p.inventory.ki > 0 && this.time >= p.kiReady) this.usePotion(p);
    if (p.autoHunt && p.autoSeed && p.hp / p.stats.hp < p.seedThreshold / 100 && p.inventory['seed' + p.seedSelected] > 0 && this.time >= p.seedReady) this.useSeed(p, p.seedSelected);
    let target = this.targetOf(p) || (p.autoHunt ? this.alvoMaisProximo(p, CONFIG.autoHuntRaio) : this.nearestMob(p, 320));
    // O caminho pode apontar para um desvio: na hora de lutar, o corpo olha para o inimigo.
    if (p.autoHunt && target) p.facing = this.aimDirection(p, target);
    if (p.autoHunt && p.autoAttack && target && this.distanciaAoCorpo(p, target) < 70) this.cast(p, 'basic', true);
    // O golpe pode ter derrotado o alvo neste mesmo passo; nunca calcule uma skill
    // usando o HP antigo nem gaste Ki em um cadáver.
    if (target && target.hp <= 0 && p.autoHunt) {
      target = this.alvoMaisProximo(p, CONFIG.autoHuntRaio);
      p.targetId = target?.id || null;
    }
    if (p.autoHunt && p.autoSkills && target) {
      const attackFactor = (p.transformed ? 1.5 : 1) * (p.forma === 'kaioken' ? 1.4 : 1);
      const danoBasico = Math.max(1, Math.round(p.stats.attack * attackFactor * 100 / (100 + (target.defesa ?? 1) * 3)));
      const danoKi = Math.max(1, Math.round(p.stats.attack * (p.transformed ? 2.1 : 1.4) * (p.forma === 'kaioken' ? 1.4 : 1) * 100 / (100 + (target.defesa ?? 1) * 3)));
      const basicoPronto = this.time >= p.basicReady;
      const pertoParaBasico = this.distanciaAoCorpo(p, target) <= 70;
      const morreriaNoBasico = p.autoAttack && pertoParaBasico && basicoPronto && target.hp <= danoBasico;
      const prefereBasico = p.autoAttack && pertoParaBasico && (target.hp <= danoBasico || (basicoPronto && target.hp <= danoKi));
      const noAlcanceKame = this.distanciaAoCorpo(p, target) <= estagioKame(p.level).alcance + KAME.mao + (p.moving ? p.stats.mobility * KAME.carga : 0);
      if (!morreriaNoBasico && !prefereBasico && p.level >= 3 && p.ki > p.stats.ki * 0.35 && noAlcanceKame && target.hp > danoKi) this.cast(p, 'kame', true);
      else if (!morreriaNoBasico && !prefereBasico && p.ki > p.stats.ki * 0.15 && distance(p, target) < 390 && target.hp > danoBasico) this.cast(p, 'ki', true);
    }
    if (p.charge) {
      let alvo = this.mobs.get(p.charge.targetId);
      if (p.charge.automated && (!alvo || alvo.hp <= 0 || !this.mesmoLugar(p, alvo) || naZonaSegura(alvo) || p.targetId !== alvo.id)) {
        alvo = this.alvoMaisProximo(p, CONFIG.autoHuntRaio);
        if (alvo) { p.charge.targetId = alvo.id; p.targetId = alvo.id; }
      }
      if (!alvo || alvo.hp <= 0 || !this.mesmoLugar(p, alvo) || naZonaSegura(alvo)) p.charge = null;
      else p.facing = p.charge.direction = norm(alvo.x - p.x, alvo.y - p.y);
    }
    // Auto Hunt prepara durante a aproximação, mas o feixe só sai no alcance real.
    const alvoCarga = p.charge && this.mobs.get(p.charge.targetId);
    const cargaNoAlcance = p.charge && (!p.charge.automated || this.distanciaAoCorpo(p, alvoCarga) <= estagioKame(p.charge.nivel).alcance + KAME.mao);
    if (p.charge && this.time >= p.charge.until && cargaNoAlcance) {
      this.kamehamehas.push({ id: this.uid('k'), owner: p.id, planet: p.planet, area: p.area, ...origemKame(p, p.charge.direction),
        targetId: p.charge.targetId, direction: p.charge.direction, nivel: p.charge.nivel, started: this.time - KAME.primeiroFeixe * KAME.quadro,
        damage: p.stats.attack * (p.transformed ? 6 : 4.2) * (p.forma === 'kaioken' ? 1.4 : 1), automated: p.charge.automated, atingidos: new Set() });
      p.charge = null;
    }
    for (const l of this.loot) if (!l.taken && this.mesmoLugar(p, l) && (l.owner === p.id || this.time > l.until - 30) && distance(p, l) < CONFIG.pickupRadius) {
      if (this.addItem(p, l.item)) { l.taken = true;analisar(p,'loot',1,l.item);registrarMissao(p,'coleta',1,this.agora()); this.emit('pickup', { x: l.x, y: l.y, playerId: p.id, item: l.item }); }
      else if (this.time - p.lastBagNotice > 8) { p.lastBagNotice = this.time; this.notify(p, 'Mochila cheia: XP continua, novos itens ficam no chão.'); }
    }
  }
  atualizarKamehamehas() {
    this.kamehamehas = this.kamehamehas.filter(k => {
      const p = this.players.get(k.owner), g = geometriaKame(k.nivel, this.time - k.started);
      if (!p?.connected || p.hp <= 0 || !this.mesmoLugar(p, k) || naZonaSegura(p)) return false;
      if (k.impacto) return this.time - k.impacto.started < IMPACTO_KAME.quadros * IMPACTO_KAME.quadro;
      if (!g) return false;
      let principal = this.mobs.get(k.targetId);
      if (!principal || principal.hp <= 0 || !this.mesmoLugar(k, principal) || naZonaSegura(principal)) {
        if (!k.automated) return false;
        principal = this.alvoMaisProximo(p, CONFIG.autoHuntRaio);
        if (!principal) return true;
        k.targetId = principal.id;
      }
      k.direction = norm(principal.x - p.x, principal.y - p.y);p.facing = k.direction;
      Object.assign(k, origemKame(p, k.direction, principal));
      if (atingidoPeloKame(principal, k, k.direction, g)) {
        const distancia = Math.min(g.alcance, distanciaContatoKame(principal, k, k.direction));
        k.impacto = { x: principal.x, y: principal.y, started: this.time, distancia,
          contatoX: k.x + k.direction.x * distancia, contatoY: k.y + k.direction.y * distancia };
        const secundarios = [...this.mobs.values()].filter(alvo => alvo !== principal && alvo.hp > 0 &&
          this.mesmoLugar(k, alvo) && !naZonaSegura(alvo) && atingidoPeloImpactoKame(alvo, k.impacto, k.direction));
        if (this.hit(p, principal, k.damage)) k.atingidos.add(principal.id);
        for (const alvo of secundarios) {
          if (this.hit(p, alvo, k.damage / secundarios.length)) k.atingidos.add(alvo.id);
        }
      }
      return true;
    });
  }
  // ---- Aggro ----
  // Cada mob guarda uma tabela de ameaça { idDoJogador: { valor, em } }: dano soma ameaça; o mob agressivo também
  // ganha um pouco de ameaça de quem entra no raio dele. O alvo é quem tem mais ameaça, com folga de 20% para não
  // trocar de alvo a toda hora. A ameaça some quando o jogador morre, desconecta, sai do lugar, fica protegido
  // (chegada/Vila) ou se afasta demais sem bater; e o mob larga tudo e volta quando passa do limite de perseguição.
  somarAmeaca(m, p, valor) {
    if (m.hp <= 0 || m.voltando) return;
    if (!m.ameaca) m.ameaca = new Map();
    const a = m.ameaca.get(p.id) || { valor: 0, em: this.time };
    a.valor += valor; a.em = this.time; m.ameaca.set(p.id, a);
  }
  alvoDoMob(m) {
    const valido = p => p && p.connected && p.hp > 0 && this.mesmoLugar(p, m) && !this.protegido(p);
    // Esquece quem não vale mais, ou quem está longe sem bater há 6 s.
    if (m.ameaca) for (const [id, a] of m.ameaca) {
      const p = this.players.get(id);
      if (!valido(p) || (distance(p, m) > m.aggro * 2 && this.time - a.em > 6)) m.ameaca.delete(id);
    }
    // Agressivo: quem entra no raio ganha ameaça mínima (proximidade), para o mob notar e perseguir.
    if (m.agressivo) for (const p of this.players.values()) {
      if (valido(p) && distance(p, m) < m.aggro && !m.ameaca?.has(p.id)) this.somarAmeaca(m, p, 1);
    }
    if (!m.ameaca?.size) return null;
    let melhor = null, maior = -1;
    for (const [id, a] of m.ameaca) if (a.valor > maior) { maior = a.valor; melhor = this.players.get(id); }
    const atual = this.players.get(m.alvoId), aAtual = m.ameaca.get(m.alvoId);
    if (atual && aAtual && melhor !== atual && maior < aAtual.valor * 1.2) melhor = atual;
    m.alvoId = melhor.id; return melhor;
  }
  // Freeza: troca de forma. Em pé usa os atributos base; na nave, ataque e defesa maiores (`nave` em enemies.mjs).
  formaFreeza(m, forma) {
    const base = mobStats('freezaBoss', m.area), n = base.nave;
    m.forma = forma; m.transicao = null;
    m.attack = forma === 'nave' ? Math.round(base.attack * n.ataque) : base.attack;
    m.defesa = forma === 'nave' ? Math.round(base.defesa * n.defesa) : base.defesa;
    m.speed = forma === 'nave' ? base.speed * n.velocidade : base.speed;
    m.corpo = forma === 'nave' ? n.corpo : base.corpo;
    m.name = forma === 'nave' ? n.nome : base.name;
  }
  // Ataque e troca de forma do Freeza. Devolve true quando cuidou do turno do mob.
  turnoFreeza(m, target, closest, dt) {
    if (!m.forma) this.formaFreeza(m, 'pe');
    if (m.transicao) {   // entrando na nave: parado, invulnerável à troca, sem atacar
      if (this.time >= m.transicao.until) this.formaFreeza(m, 'nave');
      return true;
    }
    if (m.forma === 'pe' && m.hp <= m.maxHp * mobStats('freezaBoss', m.area).nave.aPartirDe) {
      m.transicao = { started: this.time, until: this.time + 1.2 }; m.telegraph = null; m.strike = null;
      this.emit('freezaNave', { x: m.x, y: m.y, planet: m.planet, area: m.area, mobId: m.id });
      for (const p of this.players.values()) if (p.connected && this.mesmoLugar(p, m)) this.notify(p, 'O Freeza entrou na nave: ele ficou mais forte!');
      return true;
    }
    if (!target) return false;
    const nave = m.forma === 'nave', alcance = nave ? 340 : 300;
    if (closest > alcance) { this.steer(m, target, dt, m.speed); return true; }
    if (this.time < m.attackReady) { if (closest > 150) this.steer(m, target, dt, m.speed); return true; }
    m.facing = norm(target.x - m.x, target.y - m.y);
    if (nave) {   // Supernova: mira o personagem (a área acompanha o alvo até o impacto); a bola cresce, voa e explode nele
      m.telegraph = { kind: 'supernova', alvoId: target.id, x: target.x, y: target.y, ox: m.x, oy: m.y, radius: FREEZA.novaRaio,
        started: this.time, lanca: this.time + FREEZA.novaCarga, until: this.time + FREEZA.novaCarga + FREEZA.novaVoo };
    } else {      // Death Beam: aviso curto na linha, depois o raio fino e rápido
      m.telegraph = { kind: 'shot', beam: true, x: m.x, y: m.y, dx: m.facing.x, dy: m.facing.y, until: this.time + FREEZA.beamAviso, started: this.time, radius: 25 };
    }
    m.strike = { started: this.time, release: nave ? m.telegraph.lanca : m.telegraph.until, until: m.telegraph.until + 0.32, direction: m.facing, kind: nave ? 'supernova' : 'beam' };
    return true;
  }
  // Oozaru Dourado: perto, pancada no chão; longe, bola negra que segue o alvo (carga e voo) e explode nele.
  turnoOozaruDourado(m, target, closest, dt) {
    if (!target) return false;
    const O = OOZARU_DOURADO, perto = 70 + (m.corpo || 0);
    if (this.time < m.attackReady) { if (closest > perto - 10) this.steer(m, target, dt, m.speed); return true; }
    if (closest > O.bolaAlcance) { this.steer(m, target, dt, m.speed); return true; }
    m.facing = norm(target.x - m.x, target.y - m.y);
    if (closest <= perto) {
      const c = { x: m.x + m.facing.x * (m.corpo || 0) * 0.8, y: m.y + m.facing.y * (m.corpo || 0) * 0.8 };
      m.telegraph = { kind: 'pancada', x: c.x, y: c.y, radius: O.pancadaRaio, started: this.time, until: this.time + O.pancadaAviso };
      m.strike = { started: this.time, release: m.telegraph.until, until: m.telegraph.until + 0.32, direction: m.facing, kind: 'area' };
    } else {
      m.telegraph = { kind: 'bolaNegra', alvoId: target.id, x: m.x, y: m.y, tx: target.x, ty: target.y, radius: O.bolaRaio,
        started: this.time, lanca: this.time + O.bolaCarga, until: this.time + O.bolaCarga + O.bolaVoo };
      m.strike = { started: this.time, release: m.telegraph.lanca, until: m.telegraph.lanca + 0.4, direction: m.facing, kind: 'shot' };
    }
    return true;
  }
  dispararProjetilMob(m, alvoId) {
    const alvo=this.players.get(alvoId),config=m.projetil;
    if(!config || !alvo?.connected || alvo.hp<=0 || !this.mesmoLugar(m,alvo) || this.protegido(alvo))return false;
    if(!(config.velocidade>0) || !Number.isFinite(config.velocidade))return false;
    this.projectiles.push({id:this.uid('s'),kind:'mobKiTarget',owner:m.id,ownerType:'mob',alvoId:alvo.id,
      planet:m.planet,area:m.area,...iniciarVooTarget(m,alvo,config,this.time)});
    return true;
  }
  updateMob(m, dt) {
    m.moving = false;
    if (m.hp <= 0) { if (this.time >= m.deadUntil) { m.hp = m.maxHp; if (m.raro) { const pt = pontoNoCirculo(this.random, m.area); m.homeX = pt.x; m.homeY = pt.y; this.anunciarChefe(m); } const nascimento = pontoDeSpawnForaDaSafeZone(m.area, { x: m.homeX, y: m.homeY }); m.homeX = nascimento.x; m.homeY = nascimento.y; m.x = m.homeX; m.y = m.homeY; m.attackReady = this.time + 1; if (m.type === 'freezaBoss') this.formaFreeza(m, 'pe'); m.strike = null; } return; }
    // Chefe e subchefe: golpe de área maior, aviso mais longo e alcance maior.
    const grande = CHEFES.has(m.type);
    const casa = { x: m.homeX, y: m.homeY }, longeDeCasa = distance(m, casa);
    // Passou do limite de perseguição: larga o alvo e volta para casa; ao chegar, recupera a vida.
    if (!m.voltando && longeDeCasa > m.perseguicao) { m.voltando = true; m.ameaca = null; m.alvoId = null; }
    if (m.voltando && longeDeCasa < 40) { m.voltando = false; m.hp = m.maxHp; }
    const target = m.voltando ? null : this.alvoDoMob(m), closest = target ? distance(target, m) : Infinity;
    // Freeza: a Supernova segue o alvo durante a carga e o voo (o turno dele roda depois do telegrafo).
    // Oozaru Dourado: a bola acompanha o alvo na carga e no voo (mira o personagem); na carga ele gira junto.
    if (m.type === 'oozaruDourado' && m.telegraph?.kind === 'bolaNegra') { const a = this.players.get(m.telegraph.alvoId); if (a && a.hp > 0 && a.connected && this.mesmoLugar(a, m)) { m.telegraph.tx = a.x; m.telegraph.ty = a.y; m.facing = norm(a.x - m.x, a.y - m.y); if (m.strike) m.strike.direction = m.facing; } }
    if (m.type === 'freezaBoss' && m.telegraph?.kind === 'supernova') { const a = this.players.get(m.telegraph.alvoId); if (a && a.hp > 0 && a.connected && this.mesmoLugar(a, m)) { m.telegraph.x = a.x; m.telegraph.y = a.y; } }
    if (m.telegraph) {
      if (this.time >= m.telegraph.until) {
        const t = m.telegraph;
        if (t.kind === 'shot' && !t.beam) this.dispararProjetilMob(m,t.alvoId);
        else if (t.kind === 'shot') this.projectiles.push({ id: this.uid('s'), x: m.x, y: m.y, planet: m.planet, area: m.area, dx: t.dx, dy: t.dy, speed: t.beam ? FREEZA.beamVelocidade : 250, owner: m.id, ownerType: 'mob', damage: m.attack, ttl: t.beam ? 0.75 : 2, kind: t.beam ? 'deathbeam' : undefined });
        else if (t.kind === 'bolaNegra') {   // a bola chega no alvo e explode em área pequena
          for (const p of this.players.values()) if (p.connected && p.hp > 0 && this.mesmoLugar(p, m) && Math.hypot(p.x - t.tx, p.y - t.ty) < t.radius) this.hit(m, p, m.attack * 1.4);
          this.emit('bolaNegra', { x: t.tx, y: t.ty, radius: t.radius, planet: m.planet, area: m.area });
        } else if (t.kind === 'pancada') {
          for (const p of this.players.values()) if (p.connected && p.hp > 0 && this.mesmoLugar(p, m) && Math.hypot(p.x - t.x, p.y - t.y) < t.radius) this.hit(m, p, m.attack * 1.3);
          this.emit('pancada', { x: t.x, y: t.y, radius: t.radius, planet: m.planet, area: m.area });
        }
        else if (t.kind === 'supernova') {
          for (const p of this.players.values()) if (p.connected && p.hp > 0 && this.mesmoLugar(p, m) && Math.hypot(p.x - t.x, p.y - t.y) < t.radius) this.hit(m, p, m.attack * 1.6);
          this.emit('supernova', { x: t.x, y: t.y, radius: t.radius, planet: m.planet, area: m.area });
        }
        else for (const p of this.players.values()) if (p.connected && p.hp > 0 && this.mesmoLugar(p, m) && Math.hypot(p.x - t.x, p.y - t.y) < t.radius) this.hit(m, p, m.attack);
        m.telegraph = null; m.attackReady = this.time + (t.kind === 'shot' && !t.beam ? m.projetil?.cooldown ?? 0.95 : m.type === 'oozaruDourado' ? OOZARU_DOURADO.bolaRecarga : m.type === 'freezaBoss' ? (m.forma === 'nave' ? FREEZA.novaRecarga : 1.6) : grande ? 1.5 : 0.95);
      }
      return;
    }
    if (m.type === 'freezaBoss' && this.turnoFreeza(m, target, closest, dt)) return;
    if (m.type === 'oozaruDourado' && this.turnoOozaruDourado(m, target, closest, dt)) return;
    if (!target) {
      if (longeDeCasa > 10) this.steer(m, casa, dt, m.voltando ? m.speed * 1.25 : m.speed);
      return;
    }
    // Quem soca e atira (Veterano de Namek; Tsufurujins e Hatchiyack no Vegeta) dispara de longe e soca de perto.
    const socaEAtira = SOCA_E_ATIRA.has(m.type);
    // Mob grande soca de mais longe (o braço é maior) e para antes de encostar no centro do alvo.
    const corpo = m.corpo || 0, soco = 62 + corpo;
    const atira = m.type === 'ranged' || (socaEAtira && closest > soco);
    const range = m.type === 'ranged' || socaEAtira ? m.projetil?.alcance ?? 235 + corpo : grande ? 150 : soco;
    // E não fica parado atirando: continua se aproximando até a distância do soco.
    if (socaEAtira && closest > soco - 7 && (closest > range || this.time < m.attackReady)) this.steer(m, target, dt, m.speed);
    else if (closest > range) this.steer(m, target, dt, m.speed);
    else if (this.time >= m.attackReady) {
      if (atira) { const dir = norm(target.x - m.x, target.y - m.y); m.telegraph = { kind: 'shot', alvoId:target.id, x: m.x, y: m.y, dx: dir.x, dy: dir.y, until: this.time + 0.8, started: this.time, radius: 25 }; }
      else m.telegraph = { kind: 'area', x: target.x, y: target.y, radius: m.type === 'boss' ? 125 : m.type === 'oozaruSuper' ? 115 : m.type === 'subboss' ? 95 : 43, until: this.time + (grande ? 1.15 : 0.65), started: this.time };
      m.facing = norm(target.x - m.x, target.y - m.y);
      // Presentation timestamps only: impact, warning duration and cooldown are unchanged.
      m.strike = { started: this.time, release: m.telegraph.until, until: m.telegraph.until + 0.32, direction: m.facing, kind: m.telegraph.kind };
    }
  }
  tick(dt) {
    dt = clamp(dt, 0, 0.1); this.time += dt;
    this.events = this.events.filter(e => this.time - e.at < 2);
    for (const p of this.players.values()) this.updatePlayer(p, dt);
    this.atualizarKamehamehas();
    for (const m of this.mobs.values()) this.updateMob(m, dt);
    this.separarMobs();
    this.atualizarGenkis(dt);
    for (const s of this.projectiles) {
      if (s.kind === 'genki') continue;
      if (s.kind === 'mobKiTarget') {
        const alvo=this.players.get(s.alvoId),dono=this.mobs.get(s.owner);
        if(!dono || !alvo?.connected || alvo.hp<=0 || !this.mesmoLugar(s,alvo) || !this.mesmoLugar(dono,alvo) || this.protegido(alvo)) {s.ttl=0;continue;}
        if(avancarVooTarget(s,alvo,this.time)) {
          s.ttl=0;
          this.hit(dono,alvo,s.damage,{ignorarEsquiva:true});
        }
        continue;
      }
      s.ttl -= dt; const oldX = s.x, oldY = s.y; s.x += s.dx * s.speed * dt; s.y += s.dy * s.speed * dt;
      if (s.ttl <= 0) continue;
      const owner = s.ownerType === 'player' ? this.players.get(s.owner) : this.mobs.get(s.owner);
      if (!owner) { s.ttl = 0; continue; }
      const targets = [...(s.ownerType === 'player' ? this.mobs.values() : []), ...this.players.values()]
        .filter(t => t.id !== owner.id && this.mesmoLugar(s, t) && (!this.players.has(t.id) || t.connected));
      for (const t of targets) {
        const hitRadius = 19;
        if (t.hp > 0 && segmentDistance(t.x, t.y, oldX, oldY, s.x, s.y) < hitRadius) {
          if (this.hit(owner, t, s.damage)) {
            s.ttl = 0; break;
          }
        }
      }
    }
    this.projectiles = this.projectiles.filter(s => s.ttl > 0);
    this.loot = this.loot.filter(l => !l.taken && this.time < l.until);
  }
  snapshot(id) {
    const self = this.players.get(id);
    // Cada jogador só recebe o lugar onde está (planeta + área): os outros lugares não existem para ele.
    const here = self || { planet: 'terra', area: null }, aqui = e => this.mesmoLugar(here, e);
    return { time: this.time, selfId: id, planet: here.planet, area: here.area || null,
      players: [...this.players.values()].filter(p => p.connected && aqui(p)).map(p => ({
        id: p.id, name: p.name, x: p.x, y: p.y, hp: p.hp, maxHp: p.stats.hp, ki: p.ki, maxKi: p.stats.ki,
        montaria:p.montaria,level: p.level, moving: p.moving, facing: p.facing, forma: p.forma, transformed: p.transformed,
        barrier: Number.isFinite(p.barrierStarted) ? { started: p.barrierStarted, until: p.barrierUntil } : null,
        heal: Number.isFinite(p.healStarted) ? { started: p.healStarted } : null,
        genkiLancado: Number.isFinite(p.genkiLancado) && p.hp > 0 && !naZonaSegura(p) && this.time-p.genkiLancado < .35 ? p.genkiLancado : null,
        genkiDirecao: p.genkiDirecao || null,
        charge: p.charge, dashing: this.time < p.dashUntil, dead: p.hp <= 0 })),
      self: self ? { name:self.name,character:self.character,vocacao:self.vocacao,montaria:self.montaria,huntAnalyzer:resumoHunt(self), perfil:perfilPersonagem(self,this.time),preferencias:self.preferencias,missoes:listarMissoes(self,this.agora()),missaoAcompanhada:self.missoes.acompanhada,guildasRevisao:this.guildas.revisao,guildasPendentes:[...this.guildas.lista.values()].reduce((n,g)=>n+(g.convites.includes(self.mercadoId)?1:0)+(g.membros.some(m=>m.id===self.mercadoId&&m.cargo!=='membro')?g.solicitacoes.length:0),0),
        naZonaSegura: naZonaSegura(self), planet: self.planet, area: self.area || null, seguroRemaining: Math.max(0, self.seguroAte - this.time), level: self.level, xp: self.xp, xpNext: xpForLevel(self.level), stats: self.stats,
        hotkeysConsumiveis:{...self.hotkeysConsumiveis},hp: self.hp, ki: self.ki, zeni: self.zeni, inventory: self.inventory, weight: bagWeight(self.inventory),
        autoAttack: self.autoAttack, autoSkills: self.autoSkills, autoHunt: self.autoHunt,
        autoHeal: self.autoHeal, healThreshold: self.healThreshold,
        kiThreshold: self.kiThreshold, seedThreshold: self.seedThreshold,
        cura: { ...curaPorNivel(self.level), cooldown: CURA.cooldown, remaining: Math.max(0, self.healReady - this.time) },
        autoFood: self.autoFood, autoKi: self.autoKi, autoSeed: self.autoSeed, targetId: self.targetId,
        foodRemaining: Math.max(0, self.foodUntil - this.time), seedRemaining: Math.max(0, self.seedReady - this.time),
        kiRemaining: Math.max(0, self.kiReady - this.time), seedSelected: self.seedSelected,
        kameRemaining: Math.max(0, self.kameReady - this.time), dashRemaining: Math.max(0, self.dashReady - this.time),
        kaiokenRemaining: 0, kaiokenActive: self.forma === 'kaioken', forma: self.forma,
        barrierRemaining: Math.max(0, self.barrierReady - this.time), barrierActive: this.time < self.barrierUntil,
        genkiRemaining: Math.max(0, self.genkiReady - this.time), transformRemaining: 0,
        novidades: self.novidades.map(n => ({...n})), mercado:this.mercado.resumo(self),
        transformed: self.transformed, kills: self.kills, bossKills: self.bossKills, godmode: !!self.godmode,
        respawnRemaining: Math.max(0, self.respawnAt - this.time) } : null,
      mobs: [...this.mobs.values()].filter(m => m.hp > 0 && aqui(m)).map(m => ({ id: m.id, type: m.type, area: m.area, name: m.name, x: m.x, y: m.y, hp: m.hp, maxHp: m.maxHp, moving: m.moving, facing: m.facing, telegraph: m.telegraph, strike: m.strike && this.time < m.strike.until ? m.strike : null, forma: m.forma, transicao: m.transicao })),
      kamehamehas: this.kamehamehas.filter(aqui).map(({ atingidos, damage, ...k }) => k),
      genkiCharges: this.genkiCharges.filter(aqui).map(({ damage, ...g }) => g),
      genkiExplosions: this.genkiExplosions.filter(aqui),
      projectiles: this.projectiles.filter(aqui), loot: this.loot.filter(aqui), events: this.events.filter(e => (!e.playerId || e.playerId === id || e.type !== 'message') && (!e.planet || aqui(e))) };
  }
}
