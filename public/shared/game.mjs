// Regras autoritativas do jogo: combate, movimento, inventário e mundo.
// Rodam no servidor; o navegador apenas apresenta o estado que chega daqui.
import { CONFIG, MERCHANT, OBSTACLES, PORTAIS, RAIO_PORTAL, areaPorId, lugar } from './config.mjs';
import { clamp, distance, norm, segmentDistance } from './math.mjs';
import { statsFor, xpForLevel, bagWeight, createPlayer, exportPlayer as serializePlayer } from './characters.mjs';
import { mobStats, renasceEm, spawnPoints } from './enemies.mjs';
import { deslocar, caminhoPorTerra } from './passagem.mjs';

export class Game {
  constructor({ now = Date.now() / 1000, random = Math.random, populate = true } = {}) {
    this.time = now; this.random = random; this.players = new Map(); this.mobs = new Map();
    this.projectiles = []; this.loot = []; this.events = []; this.serial = 0;
    if (populate) this.populate();
  }
  uid(prefix) { return prefix + (++this.serial); }
  emit(type, data = {}) { this.events.push({ id: this.uid('e'), type, at: this.time, ...data }); }
  notify(p, text) { this.emit('message', { playerId: p.id, text }); }
  addPlayer(id, name = 'Guerreiro', saved = null) {
    const p = createPlayer(id, name, saved, this.time);
    this.players.set(id, p); return p;
  }
  exportPlayer(p) { return serializePlayer(p); }
  addMob(type, x, y, area = 'inicial') {
    const info = mobStats(type, area);
    const m = { id: this.uid('m'), type, area, x, y, homeX: x, homeY: y, ...info, maxHp: info.hp,
      attackReady: this.time + 1, telegraph: null, deadUntil: 0, moving: false,
      facing: { x: 0, y: 1 }, strike: null, planet: 'namek' };
    this.mobs.set(m.id, m); return m;
  }
  populate() {
    for (const s of spawnPoints(this.random)) this.addMob(s.type, s.x, s.y, s.area);
  }
  // Mesmo lugar = mesmo planeta e mesma área fechada. Nada atravessa de um lugar para outro:
  // dano, alvo, aggro, projéteis, loot e o que cada jogador recebe no snapshot.
  mesmoLugar(a, b) { return Boolean(a && b) && a.planet === b.planet && (a.area || null) === (b.area || null); }
  // Jogador protegido: na Terra, na Vila (áreas seguras) ou nos segundos logo após chegar/renascer.
  protegido(p) { return !p.area || Boolean(areaPorId(p.area)?.segura) || this.time < p.seguroAte; }
  // Leva o jogador para a chegada de um lugar (portal ou renascimento).
  levar(p, destino) {
    p.planet = destino.planet; p.area = destino.area; p.x = destino.chegada.x; p.y = destino.chegada.y;
    p.autoHunt = false; p.moveTo = null; p.targetId = null; p.charge = null; p.rota = null; p.input = { x: 0, y: 0 };
    p.seguroAte = this.time + CONFIG.chegadaSegura;
  }
  usePortal(p, destinoId) {
    const portal = PORTAIS.find(o => o.planet === p.planet && o.area === (p.area || null) && o.destinos.includes(destinoId) && distance(p, o) <= RAIO_PORTAL + 45);
    const destino = lugar(destinoId);
    if (!portal || !destino) return this.reject(p, 'Chegue perto de um portal para viajar.');
    this.levar(p, destino); p.transformed = false;
    const aviso = destino.nivel && p.level < destino.nivel[0] ? ' Recomendado a partir do nível ' + destino.nivel[0] + ': cuidado!' : '';
    this.notify(p, 'Portal: ' + destino.name + '.' + aviso); return { ok: true };
  }
  setInput(id, data) {
    const p = this.players.get(id); if (!p || !p.connected) return;
    let x = clamp(Number(data.x) || 0, -1, 1), y = clamp(Number(data.y) || 0, -1, 1);
    if (Math.hypot(x, y) > 1) ({ x, y } = norm(x, y));
    p.input = { x, y }; p.inputAt = this.time;
    if (x || y) { p.autoHunt = false; p.moveTo = null; p.facing = norm(x, y); }
    if (Number.isFinite(data.aimX) && Number.isFinite(data.aimY)) p.aim = { x: clamp(data.aimX, 0, CONFIG.width), y: clamp(data.aimY, 0, CONFIG.height) };
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
  nearestMob(p, radius = 350) {
    let best = null, d = radius;
    for (const m of this.mobs.values()) {
      if (m.hp <= 0 || !this.mesmoLugar(p, m)) continue;
      const dd = distance(p, m); if (dd < d) { d = dd; best = m; }
    }
    return best;
  }
  aimDirection(p, target = null) {
    if (target) return norm(target.x - p.x, target.y - p.y);
    if (p.aim) return norm(p.aim.x - p.x, p.aim.y - p.y);
    return p.facing;
  }
  action(id, data) {
    const p = this.players.get(id); if (!p || !p.connected || p.hp <= 0) return { ok: false, reason: 'Personagem indisponível.' };
    const kind = data.type;
    if (kind === 'target') {
      const candidate = this.mobs.get(data.id) || this.players.get(data.id);
      if (candidate && candidate.id !== p.id) p.targetId = candidate.id;
      return { ok: true };
    }
    if (kind === 'toggle') {
      if (!['autoAttack', 'autoSkills', 'autoFood', 'autoKi', 'autoSeed'].includes(data.key)) return { ok: false };
      p[data.key] = Boolean(data.value); return { ok: true };
    }
    // Caça automática: roda a hunt inteira onde o jogador está (sem escolher região).
    if (kind === 'hunt') {
      const z = areaPorId(p.area);
      if (data.enabled !== false && (!z || z.segura)) return this.reject(p, 'A caça automática funciona dentro das hunts. Entre por um portal da Vila.');
      p.autoHunt = data.enabled !== false; p.moveTo = null;
      if (p.autoHunt) { p.autoAttack = true; p.autoSkills = true; p.aim = null; this.notify(p, 'Caça automática: ' + z.name); }
      return { ok: true };
    }
    if (kind === 'moveTo' && Number.isFinite(data.x) && Number.isFinite(data.y)) {
      p.autoHunt = false; p.moveTo = { x: clamp(data.x, 30, CONFIG.width - 30), y: clamp(data.y, 30, CONFIG.height - 30) }; return { ok: true };
    }
    if (kind === 'selectSeed' && CONFIG.seedPotencies.includes(Number(data.potency))) { p.seedSelected = Number(data.potency); return { ok: true }; }
    if (kind === 'food') return this.useFood(p);
    if (kind === 'seed') return this.useSeed(p, Number(data.potency) || p.seedSelected);
    if (kind === 'potion') return this.usePotion(p);
    if (kind === 'buy') return this.buy(p, data.item);
    if (kind === 'sell') return this.sell(p);
    if (kind === 'transform') {
      if (p.level < CONFIG.skills.transform) return this.reject(p, 'Super Saiyajin libera no nível ' + CONFIG.skills.transform + '.');
      if (p.transformed) { p.transformed = false; this.notify(p, 'Forma base.'); return { ok: true }; }
      if (this.time < p.transformReady) return this.reject(p, 'Super Saiyajin em recarga: ' + Math.ceil(p.transformReady - this.time) + 's.');
      if (p.ki < CONFIG.skillCosts.transform) return this.reject(p, 'Ki insuficiente para transformar.');
      p.transformed = true; p.ki -= CONFIG.skillCosts.transform; p.transformReady = this.time + CONFIG.skillCooldowns.transform;
      this.notify(p, 'Super Saiyajin ativado!'); return { ok: true };
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
    p.inventory.food--; p.foodUntil = this.time + CONFIG.foodDuration;
    this.notify(p, 'Presunto: regeneração por 5 minutos.'); return { ok: true };
  }
  useSeed(p, potency) {
    if (!CONFIG.seedPotencies.includes(potency)) return { ok: false, reason: 'Potência inválida.' };
    if (this.time < p.seedReady) return this.reject(p, 'Sementes em recarga: ' + Math.ceil(p.seedReady - this.time) + 's.');
    const key = 'seed' + potency;
    if (!p.inventory[key]) return this.reject(p, 'Sem semente de ' + potency + '%.');
    if (p.hp >= p.stats.hp) return this.reject(p, 'Sua vida já está cheia.');
    p.inventory[key]--; p.hp = Math.min(p.stats.hp, p.hp + p.stats.hp * potency / 100);
    p.seedReady = this.time + CONFIG.seedCooldown;
    this.emit('heal', { x: p.x, y: p.y, text: '+' + potency + '%', playerId: p.id });
    this.notify(p, 'Semente usada. Todas as potências em recarga por ' + CONFIG.seedCooldown + 's.'); return { ok: true };
  }
  usePotion(p) {
    if (this.time < p.kiReady) return this.reject(p, 'Poção de Ki em recarga.');
    if (!p.inventory.ki) return this.reject(p, 'Você está sem poções de Ki.');
    if (p.ki >= p.stats.ki) return this.reject(p, 'Seu Ki já está cheio.');
    p.inventory.ki--; p.ki = Math.min(p.stats.ki, p.ki + p.stats.ki * 0.45); p.kiReady = this.time + CONFIG.kiCooldown;
    this.emit('ki', { x: p.x, y: p.y, playerId: p.id }); return { ok: true };
  }
  buy(p, item) {
    if (distance(p, MERCHANT) > 180) return this.reject(p, 'Aproxime-se do mercado na Vila Namekiana.');
    const price = CONFIG.prices[item]; if (!price) return { ok: false };
    if (p.zeni < price) return this.reject(p, 'Zeni insuficiente.');
    if (!this.addItem(p, item)) return this.reject(p, 'A mochila está sem capacidade.');
    p.zeni -= price; this.notify(p, 'Compra concluída.'); return { ok: true };
  }
  sell(p) {
    if (distance(p, MERCHANT) > 180) return this.reject(p, 'Aproxime-se do mercado na vila.');
    const value = p.inventory.scrap * 8 + p.inventory.crystal * 15;
    if (!value) return this.reject(p, 'Sem materiais para vender.');
    p.inventory.scrap = 0; p.inventory.crystal = 0; p.zeni += value;
    this.notify(p, 'Materiais vendidos por ' + value + ' Zeni.'); return { ok: true, value };
  }
  cast(p, skill, automated = false) {
    const target = this.targetOf(p) || this.nearestMob(p, skill === 'basic' ? 70 : 430);
    if (skill === 'basic') {
      if (this.time < p.basicReady) return { ok: false };
      p.basicReady = this.time + 0.45;
      const dir = this.aimDirection(p, target); p.facing = dir;
      this.emit('punch', { x: p.x, y: p.y, dx: dir.x, dy: dir.y, playerId: p.id });
      if (target && distance(p, target) <= 70) this.hit(p, target, p.stats.attack * (p.transformed ? 1.5 : 1) * (this.time < p.kaiokenUntil ? 1.4 : 1));
      return { ok: true };
    }
    if (skill === 'dash') {
      if (p.level < CONFIG.skills.dash || this.time < p.dashReady) return automated ? { ok: false } : this.reject(p, 'Imagem Residual: nível 2 e recarga de 4s.');
      const dir = Math.hypot(p.input.x, p.input.y) > 0.1 ? norm(p.input.x, p.input.y) : this.aimDirection(p, null);
      p.dashDirection = dir; p.dashUntil = this.time + 0.18; p.dashReady = this.time + 4; p.charge = null;
      this.emit('dash', { x: p.x, y: p.y, playerId: p.id }); return { ok: true };
    }
    if (skill === 'ki') {
      if (p.level < CONFIG.skills.ki) return automated ? { ok: false } : this.reject(p, 'Rajada de Ki libera no nível 2.');
      if (this.time < p.shotReady || p.ki < 7 || p.charge) return { ok: false };
      p.ki -= 7; p.shotReady = this.time + 0.7;
      const dir = this.aimDirection(p, target); p.facing = dir;
      this.projectiles.push({ id: this.uid('s'), x: p.x, y: p.y, planet: p.planet, area: p.area, dx: dir.x, dy: dir.y, speed: 470,
        owner: p.id, ownerType: 'player', damage: p.stats.attack * (p.transformed ? 2.1 : 1.4) * (this.time < p.kaiokenUntil ? 1.4 : 1), ttl: 0.95, kind: 'ki' });
      return { ok: true };
    }
    if (skill === 'kame') {
      if (p.level < CONFIG.skills.kame) return automated ? { ok: false } : this.reject(p, 'Kamehameha libera no nível 3.');
      if (p.charge || this.time < p.kameReady || p.ki < CONFIG.skillCosts.kame) return automated ? { ok: false } : this.reject(p, 'Kamehameha em recarga ou Ki insuficiente.');
      const dir = this.aimDirection(p, target); p.facing = dir; p.ki -= CONFIG.skillCosts.kame; p.kameReady = this.time + CONFIG.skillCooldowns.kame;
      p.charge = { until: this.time + 0.65, direction: dir }; return { ok: true };
    }
    if (skill === 'kaioken') {
      if (p.level < CONFIG.skills.kaioken) return automated ? { ok: false } : this.reject(p, 'Kaioken libera no nível 2.');
      if (this.time < p.kaiokenReady || this.time < p.kaiokenUntil || p.ki < CONFIG.skillCosts.kaioken) return automated ? { ok: false } : this.reject(p, 'Kaioken em recarga ou Ki insuficiente.');
      p.ki -= CONFIG.skillCosts.kaioken; p.kaiokenUntil = this.time + 6; p.kaiokenReady = this.time + CONFIG.skillCooldowns.kaioken;
      this.emit('kaioken', { x: p.x, y: p.y, playerId: p.id }); this.notify(p, 'Kaioken ativado por 6 segundos!'); return { ok: true };
    }
    if (skill === 'barrier') {
      if (p.level < CONFIG.skills.barrier) return automated ? { ok: false } : this.reject(p, 'Barreira de Ki libera no nível 2.');
      if (this.time < p.barrierReady || p.ki < CONFIG.skillCosts.barrier) return automated ? { ok: false } : this.reject(p, 'Barreira em recarga ou Ki insuficiente.');
      p.ki -= CONFIG.skillCosts.barrier; p.barrierUntil = this.time + 2.5; p.barrierReady = this.time + CONFIG.skillCooldowns.barrier;
      this.emit('barrier', { x: p.x, y: p.y, playerId: p.id }); this.notify(p, 'Barreira de Ki ativada!'); return { ok: true };
    }
    if (skill === 'genki') {
      if (p.level < CONFIG.skills.genki) return automated ? { ok: false } : this.reject(p, 'Genki Dama libera no nível 10.');
      if (this.time < p.genkiReady || p.ki < CONFIG.skillCosts.genki || p.charge) return automated ? { ok: false } : this.reject(p, 'Genki Dama em recarga ou Ki insuficiente.');
      const dir = this.aimDirection(p, target); p.facing = dir; p.ki -= CONFIG.skillCosts.genki; p.genkiReady = this.time + CONFIG.skillCooldowns.genki;
      this.projectiles.push({ id: this.uid('s'), x: p.x, y: p.y - 22, planet: p.planet, area: p.area, dx: dir.x, dy: dir.y, speed: 265,
        owner: p.id, ownerType: 'player', damage: p.stats.attack * (p.transformed ? 14 : 10), ttl: 2.35, kind: 'genki', radius: 72 });
      this.emit('genki', { x: p.x, y: p.y, dx: dir.x, dy: dir.y, playerId: p.id }); return { ok: true };
    }
    return { ok: false };
  }
  hit(attacker, target, raw) {
    if (target.hp <= 0 || (attacker && !this.mesmoLugar(attacker, target))) return false;
    const playerTarget = this.players.has(target.id);
    if (playerTarget) {
      if (attacker && this.players.has(attacker.id) && !this.canPvp(attacker, target)) return false;
      if (this.time < target.dashUntil || this.protegido(target)) return false;
    }
    const defense = playerTarget ? target.stats.defense : target.defesa ?? 1;
    const guardedRaw = playerTarget && this.time < target.barrierUntil ? raw * 0.28 : raw;
    const damage = Math.max(1, Math.round(guardedRaw * 100 / (100 + defense * 3)));
    target.hp = Math.max(0, target.hp - damage);
    this.emit('damage', { x: target.x, y: target.y - 20, amount: damage, targetId: target.id });
    if (target.hp <= 0) {
      if (playerTarget) { target.respawnAt = this.time + CONFIG.respawnDelay; target.autoHunt = false; target.transformed = false; target.charge = null; this.notify(target, 'Derrotado. Volta ao começo da área em ' + CONFIG.respawnDelay + ' segundos.'); }
      else {
        target.deadUntil = this.time + renasceEm(target.type); target.telegraph = null;
        if (attacker && this.players.has(attacker.id)) {
          this.awardXp(attacker, target.xp); attacker.kills++; attacker.zeni += target.type === 'boss' ? 100 : 5 + Math.floor(this.random() * 5);
          if (target.type === 'boss') { attacker.bossKills++; this.notify(attacker, target.name + ' derrotado! +100 Zeni e experiência.'); }
          const onde = { planet: target.planet, area: target.area };
          if (this.random() < attacker.stats.lootChance) this.loot.push({ id: this.uid('l'), x: target.x, y: target.y, ...onde, item: this.random() < 0.3 ? 'crystal' : 'scrap', owner: attacker.id, until: this.time + 45 });
          if (this.random() < 0.008) this.loot.push({ id: this.uid('l'), x: target.x + 12, y: target.y, ...onde, item: 'seed15', owner: attacker.id, until: this.time + 45 });
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
    [entity.x, entity.y] = deslocar(entity.planet, entity.x, entity.y, dx, dy, speed * dt, radius, entity.area);
    entity.moving = Math.hypot(dx, dy) > 0.05;
  }
  // Em planetas com água, segue um caminho por terra até o alvo (recalculado quando o alvo
  // se move ou a cada 1,5 s); sem caminho, vai em linha reta como antes.
  steer(entity, target, dt, speed) {
    if (entity.planet === 'namek') {
      const rota = entity.rota;
      const velha = !rota || this.time - rota.em > 1.5 || Math.hypot(rota.alvo.x - target.x, rota.alvo.y - target.y) > 60;
      if (velha) entity.rota = { alvo: { x: target.x, y: target.y }, em: this.time, pontos: caminhoPorTerra(entity.planet, entity, target, entity.area) || [] };
      const pontos = entity.rota.pontos;
      while (pontos.length > 1 && Math.hypot(pontos[0].x - entity.x, pontos[0].y - entity.y) < 30) pontos.shift();
      if (pontos.length > 1) target = pontos[0];
    }
    let dir = norm(target.x - entity.x, target.y - entity.y);
    const obstacle = OBSTACLES.find(o => segmentDistance(o.x, o.y, entity.x, entity.y, entity.x + dir.x * 90, entity.y + dir.y * 90) < o.r + 22 && distance(entity, o) < o.r + 100);
    if (obstacle) {
      const cross = dir.x * (obstacle.y - entity.y) - dir.y * (obstacle.x - entity.x);
      const side = cross > 0 ? -1 : 1;
      dir = norm(dir.x - dir.y * side * 1.8, dir.y + dir.x * side * 1.8);
    }
    // Se o passo não sai do lugar (encostado num canto), tenta desviar em 45° e depois 90°, para os dois
    // lados, em vez de ficar empurrando a parede.
    const antes = { x: entity.x, y: entity.y };
    for (const giro of [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2]) {
      const c = Math.cos(giro), s = Math.sin(giro), d = { x: dir.x * c - dir.y * s, y: dir.x * s + dir.y * c };
      this.move(entity, d.x, d.y, dt, speed);
      if (Math.hypot(entity.x - antes.x, entity.y - antes.y) > speed * dt * 0.3) break;
      entity.x = antes.x; entity.y = antes.y;
    }
    entity.facing = dir;
  }
  updatePlayer(p, dt) {
    p.moving = false;
    if (!p.connected) return;
    if (p.hp <= 0) {
      // Renasce no começo da mesma área (decisão do Pedro; pode mudar), protegido por alguns segundos.
      if (this.time >= p.respawnAt) { this.levar(p, lugar(p.area || 'terra')); p.hp = p.stats.hp; p.ki = p.stats.ki; }
      return;
    }
    if (p.foodUntil > this.time) p.hp = Math.min(p.stats.hp, p.hp + CONFIG.foodHealPerSecond * p.stats.healing * dt);
    // Ki tem recuperação lenta apenas fora da caça/ataques; é um valor provisório de teste.
    if (!p.transformed && !p.autoHunt && !p.charge && this.time - p.shotReady > 1.5 && this.time - p.basicReady > 1.5) p.ki = Math.min(p.stats.ki, p.ki + dt * 4);
    if (p.transformed) { p.ki = Math.max(0, p.ki - dt * 3.5); if (p.ki <= 0) { p.transformed = false; this.notify(p, 'Ki esgotado. Forma base.'); } }
    if (this.time - p.inputAt > 0.35) p.input = { x: 0, y: 0 };
    if (this.time < p.dashUntil) this.move(p, p.dashDirection.x, p.dashDirection.y, dt, 620);
    else if (p.input.x || p.input.y) this.move(p, p.input.x, p.input.y, dt, p.stats.mobility * (p.charge ? 0.35 : 1));
    else if (p.autoHunt) {
      // A área inteira é a região de caça: segue o alvo vivo ou o mob mais próximo da hunt.
      let target = this.mobs.get(p.targetId);
      if (!target || target.hp <= 0 || !this.mesmoLugar(p, target)) target = this.nearestMob(p, Infinity);
      p.targetId = target?.id || null;
      if (target && distance(p, target) > 49) this.steer(p, target, dt, p.stats.mobility);
    } else if (p.moveTo) {
      if (distance(p, p.moveTo) < 16) p.moveTo = null;
      else this.steer(p, p.moveTo, dt, p.stats.mobility);
    }
    if (p.autoFood && p.autoHunt && p.foodUntil <= this.time && p.inventory.food > 0) this.useFood(p);
    if (p.autoKi && p.ki / p.stats.ki < 0.25 && p.inventory.ki > 0 && this.time >= p.kiReady) this.usePotion(p);
    if (p.autoSeed && p.hp / p.stats.hp < 0.3 && p.inventory['seed' + p.seedSelected] > 0 && this.time >= p.seedReady) this.useSeed(p, p.seedSelected);
    const target = this.targetOf(p) || this.nearestMob(p, 320);
    if (p.autoAttack && target && distance(p, target) < 70) this.cast(p, 'basic', true);
    if (p.autoSkills && target) {
      if (p.level >= 3 && p.ki > p.stats.ki * 0.35 && distance(p, target) < 400 && target.hp > p.stats.attack * 1.6) this.cast(p, 'kame', true);
      else if (p.ki > p.stats.ki * 0.15 && distance(p, target) < 390) this.cast(p, 'ki', true);
    }
    if (p.charge && this.time >= p.charge.until) {
      const dir = p.charge.direction, bx = p.x + dir.x * 440, by = p.y + dir.y * 440;
      this.emit('beam', { x: p.x, y: p.y, bx, by, playerId: p.id });
      for (const m of this.mobs.values()) if (m.hp > 0 && this.mesmoLugar(p, m) && segmentDistance(m.x, m.y, p.x, p.y, bx, by) < 35) this.hit(p, m, p.stats.attack * (p.transformed ? 6 : 4.2) * (this.time < p.kaiokenUntil ? 1.4 : 1));
      for (const other of this.players.values()) if (this.canPvp(p, other) && segmentDistance(other.x, other.y, p.x, p.y, bx, by) < 32) this.hit(p, other, p.stats.attack * (p.transformed ? 6 : 4.2) * (this.time < p.kaiokenUntil ? 1.4 : 1));
      p.charge = null;
    }
    for (const l of this.loot) if (!l.taken && this.mesmoLugar(p, l) && (l.owner === p.id || this.time > l.until - 30) && distance(p, l) < CONFIG.pickupRadius) {
      if (this.addItem(p, l.item)) { l.taken = true; this.emit('pickup', { x: l.x, y: l.y, playerId: p.id, item: l.item }); }
      else if (this.time - p.lastBagNotice > 8) { p.lastBagNotice = this.time; this.notify(p, 'Mochila cheia: XP continua, novos itens ficam no chão.'); }
    }
  }
  updateMob(m, dt) {
    m.moving = false;
    if (m.hp <= 0) { if (this.time >= m.deadUntil) { m.hp = m.maxHp; m.x = m.homeX; m.y = m.homeY; m.attackReady = this.time + 1; m.strike = null; } return; }
    // Chefe e subchefe: golpe de área maior, aviso mais longo e alcance maior.
    const grande = m.type === 'boss' || m.type === 'subboss';
    let target = null, closest = grande ? 460 : 300;
    for (const p of this.players.values()) {
      if (!p.connected || p.hp <= 0 || !this.mesmoLugar(p, m) || this.protegido(p)) continue;
      const d = distance(p, m); if (d < closest) { target = p; closest = d; }
    }
    if (m.telegraph) {
      if (this.time >= m.telegraph.until) {
        const t = m.telegraph;
        if (t.kind === 'shot') this.projectiles.push({ id: this.uid('s'), x: m.x, y: m.y, planet: m.planet, area: m.area, dx: t.dx, dy: t.dy, speed: 250, owner: m.id, ownerType: 'mob', damage: m.attack, ttl: 2 });
        else for (const p of this.players.values()) if (p.connected && p.hp > 0 && this.mesmoLugar(p, m) && Math.hypot(p.x - t.x, p.y - t.y) < t.radius) this.hit(m, p, m.attack);
        m.telegraph = null; m.attackReady = this.time + (grande ? 1.5 : 0.95);
      }
      return;
    }
    if (!target || distance(m, { x: m.homeX, y: m.homeY }) > 470) {
      if (distance(m, { x: m.homeX, y: m.homeY }) > 10) this.steer(m, { x: m.homeX, y: m.homeY }, dt, m.speed);
      return;
    }
    const range = m.type === 'ranged' ? 235 : grande ? 150 : 62;
    if (closest > range) this.steer(m, target, dt, m.speed);
    else if (this.time >= m.attackReady) {
      if (m.type === 'ranged') { const dir = norm(target.x - m.x, target.y - m.y); m.telegraph = { kind: 'shot', x: m.x, y: m.y, dx: dir.x, dy: dir.y, until: this.time + 0.8, started: this.time, radius: 25 }; }
      else m.telegraph = { kind: 'area', x: target.x, y: target.y, radius: m.type === 'boss' ? 125 : m.type === 'subboss' ? 95 : 43, until: this.time + (grande ? 1.15 : 0.65), started: this.time };
      m.facing = norm(target.x - m.x, target.y - m.y);
      // Presentation timestamps only: impact, warning duration and cooldown are unchanged.
      m.strike = { started: this.time, release: m.telegraph.until, until: m.telegraph.until + 0.32, direction: m.facing };
    }
  }
  tick(dt) {
    dt = clamp(dt, 0, 0.1); this.time += dt;
    this.events = this.events.filter(e => this.time - e.at < 2);
    for (const p of this.players.values()) this.updatePlayer(p, dt);
    for (const m of this.mobs.values()) this.updateMob(m, dt);
    for (const s of this.projectiles) {
      s.ttl -= dt; const oldX = s.x, oldY = s.y; s.x += s.dx * s.speed * dt; s.y += s.dy * s.speed * dt;
      if (s.ttl <= 0) continue;
      const owner = s.ownerType === 'player' ? this.players.get(s.owner) : this.mobs.get(s.owner);
      if (!owner) { s.ttl = 0; continue; }
      const targets = [...(s.ownerType === 'player' ? this.mobs.values() : []), ...this.players.values()]
        .filter(t => t.id !== owner.id && this.mesmoLugar(s, t) && (!this.players.has(t.id) || t.connected));
      for (const t of targets) {
        const hitRadius = s.kind === 'genki' ? 38 : 19;
        if (t.hp > 0 && segmentDistance(t.x, t.y, oldX, oldY, s.x, s.y) < hitRadius) {
          if (this.hit(owner, t, s.damage)) {
            if (s.kind === 'genki') {
              for (const splash of targets) {
                if (splash.id !== t.id && splash.hp > 0 && distance(splash, t) <= (s.radius || 72)) this.hit(owner, splash, s.damage * 0.45);
              }
            }
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
        level: p.level, moving: p.moving, facing: p.facing, transformed: p.transformed,
        charge: p.charge, dashing: this.time < p.dashUntil, dead: p.hp <= 0 })),
      self: self ? { planet: self.planet, area: self.area || null, seguroRemaining: Math.max(0, self.seguroAte - this.time), level: self.level, xp: self.xp, xpNext: xpForLevel(self.level), stats: self.stats,
        hp: self.hp, ki: self.ki, zeni: self.zeni, inventory: self.inventory, weight: bagWeight(self.inventory),
        autoAttack: self.autoAttack, autoSkills: self.autoSkills, autoHunt: self.autoHunt,
        autoFood: self.autoFood, autoKi: self.autoKi, autoSeed: self.autoSeed, targetId: self.targetId,
        foodRemaining: Math.max(0, self.foodUntil - this.time), seedRemaining: Math.max(0, self.seedReady - this.time),
        kiRemaining: Math.max(0, self.kiReady - this.time), seedSelected: self.seedSelected,
        kameRemaining: Math.max(0, self.kameReady - this.time), dashRemaining: Math.max(0, self.dashReady - this.time),
        kaiokenRemaining: Math.max(0, self.kaiokenReady - this.time), kaiokenActive: this.time < self.kaiokenUntil,
        barrierRemaining: Math.max(0, self.barrierReady - this.time), barrierActive: this.time < self.barrierUntil,
        genkiRemaining: Math.max(0, self.genkiReady - this.time), transformRemaining: Math.max(0, self.transformReady - this.time),
        transformed: self.transformed, kills: self.kills, bossKills: self.bossKills,
        respawnRemaining: Math.max(0, self.respawnAt - this.time) } : null,
      mobs: [...this.mobs.values()].filter(m => m.hp > 0 && aqui(m)).map(m => ({ id: m.id, type: m.type, area: m.area, name: m.name, x: m.x, y: m.y, hp: m.hp, maxHp: m.maxHp, moving: m.moving, facing: m.facing, telegraph: m.telegraph, strike: m.strike && this.time < m.strike.until ? m.strike : null })),
      projectiles: this.projectiles.filter(aqui), loot: this.loot.filter(aqui), events: this.events.filter(e => !e.playerId || e.playerId === id || e.type !== 'message') };
  }
}
