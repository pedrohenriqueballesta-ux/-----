import { KAME } from './kamehameha.mjs';
import { CLONES_BOO as CLONES, SUPERNOVA_BOO as NOVA, ANGRY_BOO as ANGRY, TECNICAS_BOO, custoTecnicaBoo, estagioTecnicasBoo } from './majin-boo.mjs';
import { MULT_NIMBUS_DEV, naZonaSegura } from '../nucleo/config.mjs';
import { distance, norm } from '../nucleo/math.mjs';
import { caminhoPorTerra, pesLivres } from '../mundo/passagem.mjs';
import { TIPOS_CHEFE } from '../nucleo/enemies.mjs';

const EPSILON = 1e-6;
const lugarDe = ({ planet, area, x, y }) => ({ planet, area, x, y });

export class CombateBoo {
  constructor(game) {
    this.game = game;
    this.clones = new Map();
    this.efeitos = new Map();
    this.controle = new Map();
  }

  donoValido(dono, local) {
    return dono?.connected && dono.hp > 0 && this.game.mesmoLugar(dono, local) && !naZonaSegura(dono);
  }

  mobValido(local, mob) {
    return mob?.hp > 0 && this.game.mesmoLugar(local, mob) && this.game.podeEnfrentarMob(local, mob) && !naZonaSegura(mob);
  }

  mobsNaArea(local, raio) {
    return [...this.game.mobs.values()].filter(m => this.mobValido(local, m) && distance(local, m) <= raio + EPSILON);
  }

  alvoSupernova(p, id) {
    const m = this.game.mobs.get(id);
    return this.mobValido(p, m) && this.game.distanciaAoCorpo(p, m) <= NOVA.alcance ? m : null;
  }

  pontosDosClones(p, direcao, quantidade) {
    const raioCorpo = 15, candidatos = [], pontos = [];
    const angulo = Math.atan2(direcao.y, direcao.x);
    for (const deslocamento of [Math.PI, 2 * Math.PI / 3, -2 * Math.PI / 3, Math.PI / 2, -Math.PI / 2, Math.PI / 4, -Math.PI / 4, 0]) {
      for (const raio of [1.4 * KAME.tile, 2 * KAME.tile]) {
        candidatos.push({ ...lugarDe(p), x: p.x + raio * Math.cos(angulo + deslocamento), y: p.y + raio * Math.sin(angulo + deslocamento) });
      }
    }
    const mobs = this.mobsNaArea(p, 2 * KAME.tile + 140);
    const jogadores = [...this.game.players.values()].filter(j => j.connected && j.hp > 0 && this.game.mesmoLugar(p, j));
    for (const ponto of candidatos) {
      if (naZonaSegura(ponto) || !pesLivres(ponto.planet, ponto.x, ponto.y, raioCorpo, ponto.area)
        || pontos.some(outro => distance(outro, ponto) < raioCorpo * 2)
        || mobs.some(m => distance(m, ponto) < this.game.raioMob(m) + raioCorpo)
        || jogadores.some(j => distance(ponto, j) < 2 * raioCorpo)
        || [...this.clones.values()].some(c => this.game.mesmoLugar(ponto, c) && distance(ponto, c) < 2 * raioCorpo)
        || !caminhoPorTerra(p.planet, p, ponto, p.area, 0, true)) continue;
      pontos.push(ponto);
      if (pontos.length === quantidade) return pontos;
    }
    return null;
  }

  iniciar(p, tecnica, automated) {
    const g = this.game;
    const falha = mensagem => automated ? { ok: false } : g.reject(p, mensagem);
    if (p.vocacao !== 'boo') return falha('Técnica exclusiva do Majin Boo.');
    if (p.level < tecnica.nivel) return falha(tecnica.nome + ' libera no nível ' + tecnica.nivel + '.');
    if (naZonaSegura(p)) return falha('Saia da safe zone para usar esta técnica.');
    if (p.charge || p.dashUntil > g.time || p.ki < custoTecnicaBoo(tecnica, p.stats.ki)
      || p[tecnica.id + 'Ready'] > g.time) return falha(tecnica.nome + ' indisponível: verifique Ki, recarga e conjuração.');
    const alvo = tecnica === NOVA ? this.alvoSupernova(p, p.targetId) : null;
    if (tecnica === NOVA && !alvo) return falha('Marque um inimigo dentro do alcance da Supernova.');
    if (tecnica === CLONES && [...this.clones.values()].some(c => c.ownerId === p.id && c.hp > 0 && c.expiresAt > g.time))
      return falha('Já existem clones ativos.');
    if (tecnica === NOVA && [...this.efeitos.values()].some(e => e.tipo === NOVA.id && e.ownerId === p.id && e.expiresAt > g.time))
      return falha('Já existe uma Supernova ativa.');
    const estagio = estagioTecnicasBoo(p.forma);
    const raio = tecnica === NOVA ? estagio.raioNova : tecnica === ANGRY ? estagio.raioAngry : 0;
    if (automated && tecnica.minimoCombo && this.mobsNaArea(alvo ? { ...lugarDe(alvo), ownerId: p.id } : p, raio).length < tecnica.minimoCombo) return { ok: false };
    const direction = alvo ? g.aimDirection(p, alvo) : p.facing;
    if (tecnica === CLONES) {
      if (automated && p.tentarClonesEm > g.time) return { ok: false };
      if (!this.pontosDosClones(p, direction, estagio.clones)) {
        p.tentarClonesEm = g.time + .5;
        return falha('Não há espaço para a invocação.');
      }
    }
    p.facing = direction;
    p.charge = { id: g.uid('b'), booTecnica: tecnica.id, automated, direction, targetId: alvo?.id,
      started: g.time, until: g.time + tecnica.carga, origem: lugarDe(p), forma: p.forma, raio };
    return { ok: true };
  }

  atualizarCarga(p) {
    const g = this.game, carga = p.charge, tecnica = TECNICAS_BOO[carga.booTecnica];
    if (!this.donoValido(p, carga.origem)) { p.charge = null; return; }
    const estagio = estagioTecnicasBoo(carga.forma);
    const compromisso = carga.started + (tecnica === CLONES ? CLONES.materializa : tecnica.carga);
    if (!carga.liberada && g.time + EPSILON >= compromisso) {
      const falha = motivo => { p.charge = null; if (!carga.automated) g.notify(p, motivo); };
      const alvo = tecnica === NOVA ? this.alvoSupernova(p, carga.targetId) : null;
      const pontos = tecnica === CLONES ? this.pontosDosClones({ ...carga.origem, id: p.id }, carga.direction, estagio.clones) : null;
      const custo = custoTecnicaBoo(tecnica, p.stats.ki);
      if (p.ki < custo) return falha('Ki insuficiente ao concluir a conjuração.');
      if (tecnica === NOVA && !alvo) return falha('O alvo saiu do alcance da Supernova.');
      if (tecnica === CLONES && !pontos) return falha('Não há espaço para a invocação.');
      p.ki -= custo;
      p[tecnica.id + 'Ready'] = g.time + g.recarga(p, tecnica.recarga);
      carga.liberada = true;
      if (tecnica === CLONES) this.materializar(p, carga, pontos);
      else {
        const efeito = { ...lugarDe(alvo || p), id: carga.id, tipo: tecnica.id, ownerId: p.id,
          raio: carga.raio, started: g.time, expiresAt: g.time + tecnica.duracao };
        if (tecnica === NOVA) { efeito.pulsos = 0; efeito.dano = p.stats.attack * estagio.danoNova; efeito.atracao = estagio.atracao; }
        else for (const m of this.mobsNaArea(efeito, efeito.raio)) g.hit(p, m, p.stats.attack * estagio.danoAngry);
        this.efeitos.set(efeito.id, efeito);
        p.booLancado = { tipo: tecnica.id, started: g.time, direction: carga.direction };
      }
    }
    if (g.time + EPSILON >= carga.until) p.charge = null;
  }

  materializar(p, carga, pontos) {
    const maxHp = Math.max(1, Math.round(p.stats.hp * CLONES.vida));
    pontos.forEach((ponto, i) => {
      const id = this.game.uid('c');
      this.clones.set(id, { ...ponto, id, ownerId: p.id, grupo: carga.id,
        connected: true, autoHunt: true, forma: carga.forma, facing: carga.direction, moving: false,
        hp: maxHp, maxHp, defesa: Math.min(CLONES.defesaMaxima, p.stats.defense * CLONES.defesa), ataque: p.stats.attack * CLONES.dano,
        ready: carga.until, ordem: i, quantidade: pontos.length,
        revealAt: carga.started + CLONES.revela, activeAt: carga.until, expiresAt: carga.until + CLONES.duracao });
    });
  }

  cloneAtivo(c) {
    return c?.hp > 0 && this.game.time + EPSILON >= c.activeAt && this.game.time < c.expiresAt
      && this.donoValido(this.game.players.get(c.ownerId), c) && !naZonaSegura(c);
  }

  passoLivre(clone, ponto) {
    for (const outro of this.clones.values()) {
      if (outro === clone || !this.game.mesmoLugar(clone, outro) || !this.cloneAtivo(outro)) continue;
      const distancia = distance(outro, ponto);
      if (distancia < 27 && distancia < distance(outro, clone)) return false;
    }
    return true;
  }

  preferirClone(mob, alvo) {
    const donoId = this.clones.get(alvo.id)?.ownerId || alvo.id;
    let preferido = null, menorDistancia = CLONES.raioProtecao;
    for (const clone of this.clones.values()) {
      if (clone.ownerId !== donoId || !this.cloneAtivo(clone) || !this.game.mesmoLugar(clone, mob)) continue;
      const d = distance(mob, clone);
      if (d < menorDistancia) { preferido = clone; menorDistancia = d; }
    }
    // Mantém o clone já escolhido enquanto estiver perto, para o mob concluir o ataque.
    const atual = this.clones.get(mob.alvoId);
    if (atual?.ownerId === donoId && this.cloneAtivo(atual) && this.game.mesmoLugar(atual, mob)
      && distance(mob, atual) <= CLONES.raioProtecao) return atual;
    return preferido || alvo;
  }

  atualizarClones(dt) {
    const g = this.game;
    for (const [id, c] of this.clones) {
      const p = g.players.get(c.ownerId);
      if (c.hp <= 0 || g.time >= c.expiresAt || !this.donoValido(p, c)) {
        this.clones.delete(id);
        for (const m of g.mobs.values()) {
          m.ameaca?.delete(id);
          if (m.alvoId === id) m.alvoId = null;
        }
        continue;
      }
      if (!this.cloneAtivo(c)) continue;
      c.moving = false;
      const marcado = g.mobs.get(p.targetId);
      const pertoDoBoo = distance(c, p) <= CLONES.distanciaMaxima;
      const semRota = c.semRota?.id === marcado?.id && c.semRota?.until > g.time;
      const alvo = pertoDoBoo && this.mobValido(c, marcado) && !marcado.voltando
        && distance(p, marcado) <= CLONES.distanciaMaxima && !semRota ? marcado : null;
      const velocidade = p.stats.mobility * (p.montaria ? MULT_NIMBUS_DEV : 1) * 1.2;
      if (!alvo) {
        const angulo = Math.atan2(p.facing.y, p.facing.x) + Math.PI + (c.ordem - (c.quantidade - 1) / 2) * .72;
        const ponto = { x: p.x + 48 * Math.cos(angulo), y: p.y + 48 * Math.sin(angulo) };
        if (distance(c, ponto) <= 18) continue;
        if (!(c.reagruparAte > g.time)) {
          if (!naZonaSegura({ ...c, ...ponto }) && g.steer(c, ponto, dt, velocidade, 15)) continue;
          c.reagruparAte = g.time + .5;
        }
        if (distance(c, p) > 58) g.steer(c, p, dt, velocidade, 52);
        continue;
      }
      c.facing = norm(alvo.x - c.x, alvo.y - c.y);
      if (g.distanciaAoCorpo(c, alvo) > CLONES.alcanceSoco) {
        if (!g.steer(c, alvo, dt, velocidade, CLONES.alcanceSoco - 8)) {
          c.semRota = { id: alvo.id, until: g.time + 1.5 };
        }
        continue;
      }
      if (g.time + EPSILON < c.ready) continue;
      c.ready = g.time + CLONES.cadencia;
      c.strikeStarted = g.time;
      g.hit(c, alvo, c.ataque, { credito: p });
    }
  }

  atualizarEfeitos(dt) {
    const g = this.game;
    this.controle.clear();
    for (const [id, e] of this.efeitos) {
      const dono = g.players.get(e.ownerId);
      if (g.time + EPSILON >= e.expiresAt || !this.donoValido(dono, e)) {
        this.efeitos.delete(id);
        continue;
      }
      if (e.tipo !== NOVA.id) continue;
      const mobs = this.mobsNaArea(e, e.raio);
      while (e.pulsos < NOVA.pulsos && g.time + EPSILON >= e.started + NOVA.pulsoInicial + e.pulsos * NOVA.intervalo) {
        e.pulsos++;
        for (const m of mobs) g.hit(dono, m, e.dano);
      }
      for (const m of mobs) {
        if (m.hp <= 0 || m.voltando || m.raro || TIPOS_CHEFE.has(m.type)) continue;
        const anterior = this.controle.get(m.id);
        if (!anterior || distance(e, m) < distance(anterior, m)) this.controle.set(m.id, e);
      }
    }
    for (const [id, e] of this.controle) {
      const m = g.mobs.get(id), falta = distance(m, e) - NOVA.parada;
      if (falta <= 0) continue;
      const direcao = norm(e.x - m.x, e.y - m.y);
      const passo = Math.min(falta, e.atracao * dt * Math.min(1, falta / (KAME.tile / 2)));
      g.moverMob(m, direcao.x * passo, direcao.y * passo, true, true);
    }
  }

  fatorMovimento(m) { return this.controle.has(m.id) ? 1 - NOVA.lentidao : 1; }

  snapshot(local) {
    const aqui = e => this.game.mesmoLugar(e, local);
    return {
      clonesBoo: [...this.clones.values()].filter(c => c.hp > 0 && aqui(c) && this.donoValido(this.game.players.get(c.ownerId), c)).map(
        ({ id, ownerId, x, y, hp, maxHp, forma, facing, moving, revealAt, activeAt, strikeStarted }) =>
          ({ id, ownerId, x, y, hp, maxHp, forma, facing, moving, revealAt, activeAt, strikeStarted })),
      efeitosBoo: [...this.efeitos.values()].filter(e => aqui(e) && this.donoValido(this.game.players.get(e.ownerId), e)).map(({ pulsos, dano, atracao, ...efeito }) => efeito)
    };
  }
}
