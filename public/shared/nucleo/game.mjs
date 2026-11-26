import {registrarAtividadePasse} from '../sistemas/battle-pass.mjs';
import { CONSUMIVEIS_LOOT } from '../tecnicas/consumiveis-loot.mjs';
import {consumivelValido,acaoConsumivel} from '../tecnicas/consumiveis-hotkeys.mjs';
import {registrar as analisar, resumo as resumoHunt, novaSessao, registrarEncontro} from '../sistemas/hunt-analyzer.mjs';
import {preferenciasValidas} from '../sistemas/preferencias.mjs';
import {perfilPersonagem} from '../sistemas/perfil.mjs';
import {registrarMissao,listarMissoes,resgatarMissao} from '../sistemas/missoes.mjs';
import {registrarAbateSaga,chefePendente,ilhaLiberada,AREA_ILHA,ABSORCAO_C20,BOLA_CAUDA,CELL_PERFEITO} from '../sistemas/saga-cell.mjs';
import {acaoCorreio} from '../sistemas/correio.mjs';
import {restaurarNovidades} from '../sistemas/novidades.mjs';
import {Guildas} from '../sistemas/guildas.mjs';
// Regras autoritativas do jogo: combate, movimento, inventário e mundo.
// Rodam no servidor; o navegador apenas apresenta o estado que chega daqui.
import { CONFIG, MULT_NIMBUS_DEV, OBSTACLES, PLANETS, PORTAIS, RAIO_PORTAL, areaPorId, lugar, mercadorPerto, naZonaSegura, zonaSeguraDaHunt } from './config.mjs';
import { clamp, distance, norm, segmentDistance } from './math.mjs';
import { statsFor, xpForLevel, bagWeight, createPlayer, exportPlayer as serializePlayer, aplicarGodmode, configurarGodmode, opcoesGodmodeValidas, mochilaComporta, atualizarAtributosEquipamento, atualizarCapacidade, reterCapacidadeDoExtensor, encerrarExtensor, reconciliarSlots, moverSlotMochila, dividirSlotMochila, descartarSlotMochila } from './characters.mjs';
import { FORMAS, formaDisponivel, formasDaVocacao, multiplicadorDaForma } from '../tecnicas/formas.mjs';
import { kiPermiteCombo, validarCombo } from '../tecnicas/combo-auto-hunt.mjs';
import {barraPadrao,barraValida,atualizarBarraPadrao,tecnicaDaVocacao} from '../tecnicas/barra-tecnicas.mjs';
import { mobStats, renasceEm, spawnPoints, pontoNoCirculo, CHEFES_RAROS, CHEFES_TESTE, pontoDeSpawnForaDaSafeZone, TIPOS_CHEFE } from './enemies.mjs';
import { deslocar, caminhoPorTerra, temMascara, pesLivres, planejarClique } from '../mundo/passagem.mjs';
import { KAME, ESTAGIOS_KAME, SUPER_KAME, usaSuperKame, estagioKame, geometriaKame, origemKame, atingidoPeloKame, IMPACTO_KAME, distanciaContatoKame, atingidoPeloImpactoKame } from '../tecnicas/kamehameha.mjs';
import { TECNICAS_BOO, estagioTecnicasBoo } from '../tecnicas/majin-boo.mjs';
import { CombateBoo } from '../tecnicas/combate-boo.mjs';
import { CHOCOLATE_BEAM } from '../tecnicas/chocolate-beam.mjs';
import { GALICK, estagioGalick, origemGalick } from '../tecnicas/galick-gun.mjs';
import { FINAL_FLASH, formaFinalFlash, origemFinalFlash, contatoFinalFlash } from '../tecnicas/final-flash.mjs';
import { BIG_BANG_ATTACK, formaBigBangAttack, maoBigBang } from '../tecnicas/big-bang-attack.mjs';
import { TIPOS_SOCA_E_ATIRA, iniciarVooTarget, avancarVooTarget } from '../mundo/projetil-mob.mjs';
import { Mercado } from '../sistemas/mercado.mjs';
import { avaliarVendaNpc, itensVendaNpc } from '../sistemas/venda-npc.mjs';
import { ITENS_NEGOCIAVEIS, creditarZeni } from '../sistemas/itens-negociaveis.mjs';
import { LIMITE_ESTOQUE_LOJA, avaliarCarrinho } from '../sistemas/loja.mjs';
import { CURA, curaPorNivel } from '../tecnicas/cura.mjs';
import { NOVOS_ITENS, dropsEspecificos } from '../sistemas/catalogo-itens.mjs';
import { RECOMPENSAS_MOBS, faixaZeniMob, fracaoCristalAzul } from '../sistemas/recompensas-mobs.mjs';
import { validarNovidade } from '../sistemas/novidades.mjs';
import { GENKI } from '../tecnicas/genki.mjs';
import { RYUKEN, usaRyuken, danoRyuken } from '../tecnicas/ryuken.mjs';
import { fatorCombateAleatorio, variarExperiencia } from '../tecnicas/variacao-combate.mjs';
import { DURACAO_EXTENSOR, ITENS_PREMIUM } from '../sistemas/itens-premium.mjs';
import { avancarPocaoXp, bonusXpPremium, DURACAO_POCAO_XP } from '../sistemas/bonus-premium.mjs';
import { progressoAposMorte, xpAjustadoPorNivel } from '../sistemas/progressao.mjs';
import { taxasRegeneracao } from '../sistemas/regeneracao.mjs';

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
  constructor({ now = Date.now() / 1000, random = Math.random, randomCombat = () => 0.5, populate = true, chefeJa = false, beneficiosDeTeste = false } = {}) {
    this.time = now; this.random = random; this.chefeJa = chefeJa; this.players = new Map(); this.mobs = new Map();
    this.randomCombat = randomCombat;
    this.beneficiosDeTeste = beneficiosDeTeste;
    this.combateBoo = new CombateBoo(this);
    this.projectiles = []; this.kamehamehas = []; this.loot = []; this.events = []; this.serial = 0;
    this.genkiCharges = []; this.genkiExplosions = []; this.ryukenExplosoes = []; this.mercado = new Mercado();this.guildas=new Guildas();this.agora=()=>Date.now();
    if (populate) this.populate();
  }
  recarga(p, segundos) { return p.godmode && !p.godmodeOptions?.cooldownNormal ? 1 : segundos; }
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
  mesmoLugar(a, b) {
    if (!(a && b) || a.planet !== b.planet || (a.area || null) !== (b.area || null)) return false;
    // Chefe pessoal da Saga do Cell (`dono`): só existe para o dono — o que ele vê, ataca e o que o atinge.
    const privado = x => x.dono || (x.owner && this.mobs.get(x.owner)?.dono) || null;
    const pessoa = x => this.players.has(x.id) ? x.id : x.owner && this.players.has(x.owner) ? x.owner : null;
    const pa = privado(a), pb = privado(b);
    if (pa && pessoa(b) && pa !== pessoa(b)) return false;
    if (pb && pessoa(a) && pb !== pessoa(a)) return false;
    return true;
  }
  // Proteção permanente na Terra, Vila e quadrado da hunt, além da proteção breve de chegada.
  protegido(p) { return !p.area || Boolean(areaPorId(p.area)?.segura) || naZonaSegura(p) || this.time < p.seguroAte; }
  // Avisa quem está na hunt que o chefe raro apareceu.
  anunciarChefe(m) {
    for (const p of this.players.values()) if (p.connected && this.mesmoLugar(p, m)) this.notify(p, m.name + ' ' + (CHEFES_RAROS[m.area]?.aviso || 'apareceu!'));
  }
  // Portais preservam a forma; renascimento e deslocamentos internos a encerram.
  levar(p, destino, {preservarForma = false} = {}) {
    if (!preservarForma) { p.forma = 'base'; p.formaAte = 0; }
    atualizarBarraPadrao(p);
    p.genkiLancado = null; p.genkiDirecao = null; p.ryuken = null; p.finalFlashAtivo = null; p.bigBangLancado = null;
    this.projectiles = this.projectiles.filter(s => !['ryuken', 'bigBangAttack'].includes(s.kind) || s.owner !== p.id);
    this.genkiCharges = this.genkiCharges.filter(g => g.owner !== p.id);
    this.projectiles = this.projectiles.filter(s => s.kind !== 'genki' || s.owner !== p.id);
    this.kamehamehas = this.kamehamehas.filter(k => k.owner !== p.id);
    p.planet = destino.planet; p.area = destino.area; p.x = destino.chegada.x; p.y = destino.chegada.y;
    p.saidaSegura = null; p.autoHunt = false; p.moveTo = null; p.targetId = null; p.charge = null; p.chocolateLancado = null; p.booLancado = null; p.rota = null; p.input = { x: 0, y: 0 };
    p.seguroAte = this.time + CONFIG.chegadaSegura;
  }
  usePortal(p, destinoId) {
    const portal = PORTAIS.find(o => o.planet === p.planet && o.area === (p.area || null) && o.destinos.includes(destinoId) && distance(p, o) <= RAIO_PORTAL + 45);
    const destino = lugar(destinoId);
    if (!portal || !destino) return this.reject(p, 'Chegue perto de um portal para viajar.');
    if (destino.area === AREA_ILHA && !ilhaLiberada(p)) return this.reject(p, 'A Ilha da Arena abre durante a Saga do Cell: vença o Cell Semiperfeito no Deserto das Mesas.');
    this.levar(p, destino, {preservarForma:true});
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
  podeEnfrentarMob(p, mob) { return !mob?.dono || mob.dono === (p?.ownerId ?? p?.id); }
  targetOf(p) {
    const mob = this.mobs.get(p.targetId);
    if (mob && mob.hp > 0 && this.mesmoLugar(p, mob) && this.podeEnfrentarMob(p, mob)) return mob;
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
      if (m.hp <= 0 || !this.mesmoLugar(p, m) || !this.podeEnfrentarMob(p, m) || (aceita && !aceita(m))) continue;
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
  action(id, data, carteiraPremium) {
    const resultado = this.processarAcao(id, data, carteiraPremium);
    const p = this.players.get(id);
    if (resultado.ok && p?.bonusPremium.capacidadeRetida) atualizarCapacidade(p);
    if (resultado.ok && data.type === 'descartarSlot') {
      for (const item of Object.keys(p.bonusPremium.extensores)) {
        if (p.equipamentos.mochila !== item && !p.inventory[item]) delete p.bonusPremium.extensores[item];
      }
    }
    return resultado;
  }
  processarAcao(id, data, carteiraPremium) {
    const p = this.players.get(id); if (!p || !p.connected || p.hp <= 0) return { ok: false, reason: 'Personagem indisponível.' };
    const kind = data.type;
    if (kind === 'restaurarBarraPadrao') {
      p.barraTecnicas = barraPadrao({}, p.seedSelected, p.level, p.forma, p.vocacao);
      p.barraPersonalizada = false;
      p.barraKameManual = false;
      return { ok: true };
    }
    if(kind==='configurarBarra'){
      if(!Array.isArray(data.slots)||data.slots.length!==8||data.slots.some(v=>v!==null&&typeof v!=='string'))return {ok:false,reason:'Barra inválida.'};
      const validada=barraValida(data.slots);
      if(validada.some((v,i)=>v!==data.slots[i]))return {ok:false,reason:'Técnica inválida ou repetida.'};
      if (p.vocacao !== 'vegeta' && validada.includes('skill:galick')) return this.reject(p, 'O Galick Gun é exclusivo do Vegeta.');
      if (p.vocacao !== 'vegeta' && validada.includes('skill:finalFlash')) return this.reject(p, 'O Final Flash é exclusivo do Vegeta.');
      if (p.vocacao !== 'vegeta' && validada.includes('skill:bigBangAttack')) return this.reject(p, 'O Big Bang Attack é exclusivo do Vegeta.');
      if (validada.some(id => id?.startsWith('skill:') && !tecnicaDaVocacao(id, p.vocacao))) return this.reject(p, 'Técnica indisponível para esta vocação.');
      if (validada.some(id => id?.startsWith('form:') && !tecnicaDaVocacao(id, p.vocacao))) return this.reject(p, 'Transformação indisponível para esta vocação.');
      if(validada[1]!==p.barraTecnicas[1])p.barraKameManual=true;
      p.barraTecnicas=validada;p.barraPersonalizada=true;return {ok:true};
    }
    if(kind==='montaria'){if(data.valor!==null&&data.valor!=='nimbus')return{ok:false,reason:'Montaria inválida.'};if(data.valor!==null)p.montariaPreferida=data.valor;p.montaria=data.valor;return{ok:true};}
    if(kind==='skin'){
      const skin=String(data.skin||'');
      if (p.vocacao !== 'goku' && skin !== 'base') return this.reject(p, 'Skin indisponível para esta vocação.');
      const forma=skin==='base'?{nivel:1}:FORMAS.find(f=>f.forma===skin&&(!f.vocacoes||f.vocacoes.includes(p.vocacao)));
      if(skin!=='natalino'&&!forma)return this.reject(p,'Skin inválida.');
      p.skin=skin;return{ok:true};
    }
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
    // Reorganizar/dividir/descartar pilhas na mochila: o cliente manda só a OPERAÇÃO (por índice de espaço) e o
    // servidor aplica sobre os slots atuais dele. Operação (não layout inteiro) evita corrida com loot/uso que
    // mudam os totais enquanto se arrasta. Mover/dividir não mexem nos totais; descartar reduz o total da pilha.
    if (kind === 'equiparItem') return this.equiparItem(p, data.item, { slot: data.slot, de: data.de });
    if (kind === 'desequiparItem') return this.equiparItem(p, null, { slot: data.slot, esperado: data.item, para: data.para });
    if(kind==='moverSlot') return moverSlotMochila(p,Math.floor(Number(data.de)),Math.floor(Number(data.para)))?{ok:true}:{ok:false};
    if(kind==='dividirSlot') return dividirSlotMochila(p,Math.floor(Number(data.de)),data.quantidade)?{ok:true}:{ok:false};
    if(kind==='descartarSlot') return descartarSlotMochila(p,Math.floor(Number(data.de)))?{ok:true}:{ok:false};
    if(kind === 'huntAnalyzerReset'){p.huntAnalyzer=novaSessao();return {ok:true};}
    if (kind === 'target') {
      const candidate = this.mobs.get(data.id) || this.players.get(data.id);
      if (candidate && candidate.id !== p.id && this.podeEnfrentarMob(p, candidate)) p.targetId = candidate.id;
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
    if (kind === 'configurarComboAutoHunt') {
      const combo = validarCombo(data.combo, p.vocacao);
      if (!combo) return this.reject(p, 'Configuração de combo inválida.');
      p.comboAutoHunt = combo;
      const buffAplicado = this.aplicarBuffDoCombo(p);
      return { ok: true, combo, buffAplicado };
    }
    if (kind === 'toggle') {
      if (!['autoAttack', 'autoSkills', 'autoFood', 'autoKi', 'autoEnergyPotion', 'autoSeed', 'autoHeal'].includes(data.key)) return { ok: false };
      p[data.key] = Boolean(data.value); return { ok: true };
    }
    if (kind === 'godmode') {
      aplicarGodmode(p, !p.godmode);
      this.revalidarFormaAposGodmode(p);
      this.notify(p, p.godmode ? 'God Mode de teste ligado no nível ' + p.level + '.' : 'God Mode desligado: status reais restaurados.');
      return { ok: true };
    }
    if (kind === 'godmodeConfig') {
      const options = data.options;
      if (!options || !Number.isSafeInteger(options.level) || options.level < 1 || options.level > CONFIG.progression.nivelMaximo ||
        ['hpInfinite','kiInfinite','zeniInfinite','capacityInfinite'].some(key => typeof options[key] !== 'boolean') ||
        (options.cooldownNormal !== undefined && typeof options.cooldownNormal !== 'boolean'))
        return { ok: false, reason: 'Configuração de God Mode inválida.' };
      configurarGodmode(p, opcoesGodmodeValidas({ cooldownNormal: p.godmodeOptions?.cooldownNormal, ...options }));
      if (p.godmode) this.revalidarFormaAposGodmode(p);
      return { ok: true };
    }
    if (kind === 'godmodeGrantItem') {
      const item = Object.hasOwn(ITENS_NEGOCIAVEIS, data.item) ? ITENS_NEGOCIAVEIS[data.item] : null, quantidade = data.quantidade;
      if (!p.godmode) return { ok: false, reason: 'Ative o God Mode para pegar itens de teste.' };
      if (Object.hasOwn(ITENS_PREMIUM, data.item) && !this.beneficiosDeTeste)
        return this.reject(p, 'Itens premium de teste estão disponíveis somente em desenvolvimento.');
      if (!item || !Number.isSafeInteger(quantidade) || quantidade < 1 || quantidade > 9999 || (p.inventory[item.id] || 0) + quantidade > 99999)
        return { ok: false, reason: 'Item ou quantidade inválidos.' };
      if (!this.addItem(p, item.id, quantidade)) return this.reject(p, 'Libere espaço ou capacidade na mochila de teste.');
      this.notify(p, '+' + quantidade + ' × ' + item.nome + ' adicionado à mochila de teste.');
      return { ok: true };
    }
    if (kind === 'godmodeSpawnBoss') {
      if (!p.godmode) return { ok:false, reason:'Ative o God Mode para invocar chefes de teste.' };
      const escolha = CHEFES_TESTE.find(b => b.type === data.boss);
      if (!escolha) return { ok:false, reason:'Chefe inválido.' };
      const chefe = [...this.mobs.values()].find(m => m.type === escolha.type && m.area === escolha.area);
      if (!chefe) return { ok:false, reason:'Este chefe não está disponível neste mundo.' };
      if (chefe.hp > 0) return { ok:false, reason:chefe.name + ' já está vivo em ' + areaPorId(chefe.area).name + '.' };
      // O mesmo ciclo de renascimento reposiciona o chefe no local próprio e limpa o estado de combate.
      chefe.deadUntil = this.time;
      this.updateMob(chefe, 0);
      this.notify(p, chefe.name + ' invocado em ' + areaPorId(chefe.area).name + '.');
      return { ok:true };
    }
    if (kind === 'healThreshold' || kind === 'automationThreshold') {
      const key = kind === 'healThreshold' ? 'healThreshold' : data.key;
      if (!['healThreshold', 'kiThreshold', 'energyPotionThreshold', 'seedThreshold'].includes(key)) return { ok: false };
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
    if (kind === 'usarConsumivel') {
      if (Object.hasOwn(ITENS_PREMIUM, data.item) && ITENS_PREMIUM[data.item].bonusXp) return this.usarItemPremium(p, ITENS_PREMIUM[data.item]);
      const item = Object.hasOwn(CONSUMIVEIS_LOOT, data.item) ? CONSUMIVEIS_LOOT[data.item] : null;
      if (!item) return this.reject(p, 'Consumível inválido.');
      return item.tipo === 'comida' ? this.useFood(p, data.item) : this.usePotion(p, data.item);
    }
    if (kind === 'food') return this.useFood(p);
    if (kind === 'seed') return this.useSeed(p, Number(data.potency) || p.seedSelected);
    if (kind === 'potion') return this.usePotion(p);
    if (kind === 'buyAll') return this.buyAll(p,data.itens);
    if (kind === 'buy') return this.buy(p, data.item, data.quantidade);
    if (kind === 'sell') return this.sell(p);
    if (kind === 'venderSelecionados') return this.venderLoteNpc(p, data.itens);
    if (kind === 'venderItem') return this.venderItem(p,data.item,data.quantidade);
    if (['mercadoAnunciar','mercadoComprar','mercadoCancelar','mercadoReceber'].includes(kind)) {
      const metodo={mercadoAnunciar:'anunciar',mercadoComprar:'comprar',mercadoCancelar:'cancelar',mercadoReceber:'receber'}[kind];
      const resultado=metodo === 'anunciar' ? this.mercado.anunciar(p, data, this.time, carteiraPremium)
        : this.mercado[metodo](p, data, carteiraPremium);
      if(!resultado.ok)return this.reject(p,resultado.reason);
      this.notify(p,({mercadoAnunciar:'Anúncio publicado. Os itens estão reservados no mercado.',mercadoComprar:'Compra no mercado concluída.',mercadoCancelar:'Anúncio cancelado. Itens devolvidos.',mercadoReceber:'Saldo de vendas recebido.'})[kind]);
      return resultado;
    }
    if (kind === 'transform') {
      return this.cast(p, 'transform', false, data.forma ?? null);
    }
    if (kind === 'portal') return this.usePortal(p, data.destino);
    if (kind === 'skill') return this.cast(p, data.skill);
    return { ok: false, reason: 'Ação inválida.' };
  }
  reject(p, reason) { this.notify(p, reason); return { ok: false, reason }; }
  addItem(p, key, count = 1) {
    if (!Object.hasOwn(CONFIG.itemWeights, key) || !Number.isSafeInteger(count) || count < 1) return false;
    if (!mochilaComporta(p, { [key]: count })) return false;
    p.inventory[key] = (p.inventory[key] || 0) + count; return true;
  }
  equiparItem(p, id, { slot, esperado, de, para }) {
    if (p.hp <= 0 || !p.connected) return this.reject(p, 'Personagem indisponível.');
    if (id !== null) {
      const item = Object.hasOwn(ITENS_NEGOCIAVEIS, id) ? ITENS_NEGOCIAVEIS[id] : null;
      if (!item?.slot || !(p.inventory[id] > 0)) return this.reject(p, 'Equipamento indisponível na mochila.');
      if (p.level < item.nivel)
        return this.reject(p, 'Este equipamento exige nível ' + item.nivel + '.');
      if (slot !== undefined && slot !== item.slot) return this.reject(p, 'Use o encaixe correspondente à peça.');
      slot = item.slot;
    }
    const anterior = Object.hasOwn(p.equipamentos, slot) ? p.equipamentos[slot] : null;
    if (id === null && (!anterior || anterior !== esperado)) return this.reject(p, 'O equipamento desse espaço mudou.');
    const slots = reconciliarSlots({ inventory: p.inventory, slots: p.slots });
    const indiceValido = n => Number.isInteger(n) && n >= 0 && n < slots.length;
    if (de !== undefined && (!indiceValido(de) || slots[de]?.item !== id))
      return this.reject(p, 'O item desse espaço da mochila mudou.');
    if (para !== undefined && (!indiceValido(para) || (slots[para] && slots[para].item !== anterior)))
      return this.reject(p, 'Solte a peça em um espaço livre ou sobre outra cópia dela.');
    if (id === anterior) return { ok: true };

    const inventory = { ...p.inventory };
    if (id) {
      inventory[id]--;
      if (de !== undefined && --slots[de].qty === 0) slots[de] = null;
    }
    if (anterior) {
      inventory[anterior] = (inventory[anterior] || 0) + 1;
      const destino = para ?? (de !== undefined && !slots[de] ? de : null);
      if (destino !== null) slots[destino] = { item: anterior, qty: (slots[destino]?.qty || 0) + 1 };
    }
    const novoLayout = reconciliarSlots({ inventory, slots });
    if (anterior && (inventory[anterior] > 99999 || bagWeight(inventory) > p.stats.capacity + 0.0001 ||
      !novoLayout.some(pilha => pilha?.item === anterior)))
      return this.reject(p, 'Libere espaço na mochila para retirar o equipamento.');
    if (slot === 'mochila' && anterior) reterCapacidadeDoExtensor(p);
    Object.assign(p.inventory, inventory);
    p.slots = novoLayout;
    if (id) p.equipamentos[slot] = id;
    else delete p.equipamentos[slot];
    atualizarAtributosEquipamento(p);
    if (slot === 'mochila') {
      if (id) p.bonusPremium.extensores[id] ??= DURACAO_EXTENSOR;
      atualizarCapacidade(p);
      return { ok: true, itemPremium: true };
    }
    return { ok: true };
  }
  usarItemPremium(p, item) {
    if (!(p.inventory[item.id] > 0)) return this.reject(p, 'Você não tem este item na mochila.');
    if (item.bonusXp && p.bonusPremium.xp) return this.reject(p, 'Aguarde a poção de XP atual terminar.');
    p.inventory[item.id]--;
    reconciliarSlots(p);
    p.bonusPremium.xp = { percentual: item.bonusXp, segundos: DURACAO_POCAO_XP };
    this.notify(p, item.nome + ' ativado.');
    return { ok: true, itemPremium: true };
  }
  useFood(p, id = 'food') {
    const duracao = id === 'food' ? CONFIG.foodDuration : CONSUMIVEIS_LOOT[id].duracao;
    const nome = ITENS_NEGOCIAVEIS[id].nome;
    if (!p.inventory[id]) return this.reject(p, 'Sem ' + nome + ' na mochila.');
    if (p.foodUntil > this.time + 1) return this.reject(p, 'A comida ainda está ativa.');
    analisar(p, 'supplies', 1, id);
    p.inventory[id]--; p.foodId = id; p.foodUntil = this.time + duracao;
    this.notify(p, nome + ': efeito ativo por ' + duracao + ' s.');
    return { ok: true };
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
  usePotion(p, id = 'ki') {
    const recuperaKi = id === 'ki';
    const recurso = recuperaKi ? 'ki' : 'hp';
    const fracao = recuperaKi ? .45 : CONSUMIVEIS_LOOT[id].fracaoHp;
    if (this.time < p.kiReady) return this.reject(p, 'Poções em recarga.');
    if (!p.inventory[id]) return this.reject(p, 'Sem ' + ITENS_NEGOCIAVEIS[id].nome + ' na mochila.');
    if (p[recurso] >= p.stats[recurso]) return this.reject(p, recuperaKi ? 'Seu Ki já está cheio.' : 'Sua vida já está cheia.');
    analisar(p, 'supplies', 1, id);
    p.inventory[id]--;
    const antes = p[recurso];
    p[recurso] = Math.min(p.stats[recurso], antes + p.stats[recurso] * fracao);
    p.kiReady = this.time + CONFIG.kiCooldown;
    if (recuperaKi) this.emit('ki', { x: p.x, y: p.y, playerId: p.id });
    else {
      const amount = p.hp - antes;
      analisar(p, 'cura', amount);
      this.emit('heal', { x: p.x, y: p.y, playerId: p.id, planet: p.planet, area: p.area,
        amount, text: '+' + amount.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' HP' });
    }
    return { ok: true };
  }
  buy(p, item, quantidade = 1) {
    if (!mercadorPerto(p)) return this.reject(p, 'Aproxime-se do mercado na Vila.');
    if (!Object.hasOwn(CONFIG.prices,item)) return { ok:false };
    if (!Number.isSafeInteger(quantidade) || quantidade < 1 || quantidade > LIMITE_ESTOQUE_LOJA)
      return this.reject(p, 'Escolha uma quantidade inteira entre 1 e ' + LIMITE_ESTOQUE_LOJA + '.');
    const total = CONFIG.prices[item] * quantidade;
    const saldoDisponivel = p.godmode && p.zeniReal != null && !p.godmodeOptions?.zeniInfinite ? p.zeniReal : p.zeni;
    if (saldoDisponivel < total) return this.reject(p, 'Zeni insuficiente para essa quantidade.');
    if ((p.inventory[item] || 0) + quantidade > LIMITE_ESTOQUE_LOJA) return this.reject(p, 'Limite de estoque desse item atingido.');
    // A compra inteira é validada antes de descontar Zeni; nunca entrega um lote parcial.
    if (!this.addItem(p, item, quantidade)) return this.reject(p, 'A mochila está sem capacidade para essa quantidade.');
    if (p.godmode && p.zeniReal != null && !p.godmodeOptions?.zeniInfinite) { p.zeniReal -= total; p.zeni = p.zeniReal; }
    else p.zeni -= total;
    this.notify(p, 'Compra concluída: ' + quantidade + (quantidade === 1 ? ' item.' : ' itens.'));
    return { ok:true, item, quantidade, total };
  }
  buyAll(p,itens) {
    if(!mercadorPerto(p))return this.reject(p,'Aproxime-se do mercado na Vila.');
    const resultado=avaliarCarrinho(p,itens);if(!resultado.ok)return this.reject(p,resultado.reason);
    for(const[item,q]of Object.entries(itens))if(q)p.inventory[item]=(p.inventory[item]||0)+q;
    p.zeni-=resultado.total;this.notify(p,'Compra conjunta concluída: '+resultado.quantidade+' itens por '+resultado.total+' Z.');return resultado;
  }
  venderItem(p, item, quantidade) {
    if (typeof item !== 'string') return this.reject(p, 'Item inválido.');
    const resultado = this.venderLoteNpc(p, { [item]: quantidade }, false);
    return resultado.ok ? { ...resultado, item } : resultado;
  }
  sell(p) {
    const resultado = this.venderLoteNpc(p, itensVendaNpc(p.inventory));
    return resultado.ok ? { ...resultado, value: resultado.total } : resultado;
  }
  venderLoteNpc(p, itens, somenteElegiveis = true) {
    if (!mercadorPerto(p)) return this.reject(p, 'Aproxime-se do mercador para vender.');
    const resultado = avaliarVendaNpc(p.inventory, itens, somenteElegiveis);
    if (!resultado.ok) return this.reject(p, resultado.reason);
    if (!creditarZeni(p, resultado.total))
      return this.reject(p, 'Seu saldo de Zeni está no limite. Venda uma quantidade menor.');
    for (const [id, qtd] of Object.entries(itens)) p.inventory[id] -= qtd;
    reconciliarSlots(p);
    this.notify(p, 'Venda ao NPC concluída: ' + resultado.quantidade + ' por ' + resultado.total + ' Z.');
    return resultado;
  }
  cast(p,skill,automated=false,formaSolicitada=null){
    const r=this.executarTecnica(p,skill,automated,formaSolicitada);
    this.verificarKiDaForma(p);
    if(r.ok&&skill!=='basic'&&skill!=='ki'&&skill!=='heal')registrarMissao(p,'skills',1,this.agora());return r;
  }
  executarTecnica(p, skill, automated = false, formaSolicitada = null) {
    if (!p.connected || p.hp <= 0) return { ok: false };
    if (Object.hasOwn(TECNICAS_BOO, skill)) return this.combateBoo.iniciar(p, TECNICAS_BOO[skill], automated);
    if (skill === CHOCOLATE_BEAM.id) return this.iniciarRaioChocolate(p, automated);
    if (p.vocacao === 'boo' && !['heal','basic','ki','transform','kaioken'].includes(skill))
      return automated ? {ok:false} : this.reject(p, 'Técnica indisponível para o Majin Boo.');
    if (p.vocacao === 'boo' && p.charge && skill !== 'heal') return {ok:false};
    if (p.vocacao === 'vegeta' && !['heal','basic','ki','galick','finalFlash','bigBangAttack'].includes(skill) && !skill.startsWith('item:') && !['kaioken','transform'].includes(skill)) return automated ? { ok: false } : this.reject(p, 'Esta técnica ainda não foi implementada para o Vegeta.');
    if (skill === 'kaioken' || skill === 'transform') return this.alternarForma(p, skill, automated, formaSolicitada);
    if (skill === 'heal') return this.curarVida(p, automated);
    if (naZonaSegura(p) && ['basic', 'ki', 'kame', 'superKamehameha', 'ryuken', 'genki', 'galick', 'finalFlash', 'bigBangAttack'].includes(skill)) return automated ? { ok: false } : this.reject(p, 'Saia da safe zone para atacar.');
    if (p.bigBangLancado && this.time - p.bigBangLancado.started < BIG_BANG_ATTACK.poseDisparo &&
      ['basic', 'ki', 'galick', 'finalFlash', 'bigBangAttack'].includes(skill)) return { ok: false };
    if (skill === 'finalFlash') return this.iniciarFinalFlash(p, automated);
    if (skill === 'bigBangAttack') return this.iniciarBigBangAttack(p, automated);
    if ((p.finalFlashAtivo && ['basic', 'ki', 'galick'].includes(skill)) || ((p.charge?.finalFlash || p.charge?.bigBangAttack) && skill === 'basic'))
      return { ok: false };
    const target = this.targetOf(p) || this.nearestMob(p, skill === 'basic' ? 70 : 430);
    if (skill === 'basic') {
      if (this.time < p.basicReady) return { ok: false };
      p.basicReady = this.time + 0.45;
      const dir = this.aimDirection(p, target); if (p.autoHunt) p.facing = dir;
      this.emit('punch', { x: p.x, y: p.y, dx: dir.x, dy: dir.y, playerId: p.id });
      if (p.vocacao === 'boo') {
        p.facing = dir;
        p.charge = { booSoco: true, direction: dir, targetId: target?.id, automated, until: this.time + .18 };
        return {ok:true};
      }
      if (target && this.distanciaAoCorpo(p, target) <= 70) this.hit(p, target, p.stats.attack * multiplicadorDaForma(p.forma, 'soco'));
      return { ok: true };
    }
    if (skill === 'dash') {
      if (p.level < CONFIG.skills.dash || this.time < p.dashReady) return automated ? { ok: false } : this.reject(p, 'Imagem Residual: nível ' + CONFIG.skills.dash + ' e recarga de 4s.');
      const dir = Math.hypot(p.input.x, p.input.y) > 0.1 ? norm(p.input.x, p.input.y) : this.aimDirection(p, null);
      p.dashDirection = dir; p.dashUntil = this.time + 0.18; p.dashReady = this.time + this.recarga(p, 4); p.charge = null;
      this.emit('dash', { x: p.x, y: p.y, playerId: p.id }); return { ok: true };
    }
    if (skill === 'ki') {
      // A Rajada de Ki é o ataque à distância básico de todas as vocações.
      const nivelRajada = p.vocacao !== 'goku' ? 1 : CONFIG.skills.ki;
      if (p.level < nivelRajada) return automated ? { ok: false } : this.reject(p, 'Rajada de Ki libera no nível ' + nivelRajada + '.');
      if (this.time < p.shotReady || p.ki < CONFIG.skillCosts.ki || p.charge) return { ok: false };
      p.ki -= CONFIG.skillCosts.ki; p.shotReady = this.time + CONFIG.skillCooldowns.ki;
      const dir = this.aimDirection(p, target); if (p.autoHunt) p.facing = dir;
      this.emit('kiShot', {x:p.x,y:p.y,playerId:p.id});
      if (p.vocacao === 'boo') {
        p.facing = dir;
        const norte = dir.y < 0 && Math.abs(dir.x) < -dir.y * (Math.SQRT2 - 1);
        p.charge = { booKi: true, direction: dir, automated, until: this.time + (norte ? 0.27 : 0.18) };
      } else this.dispararRajada(p, dir);
      return { ok: true };
    }
    // Ryuken (Pedro, 16/11/2026): técnica própria do Super Saiyajin 3 e 4; o Kamehameha continua disponível.
    if (skill === 'ryuken') {
      if (p.level < CONFIG.skills.ryuken) return automated ? { ok: false } : this.reject(p, 'Ryuken libera no nível ' + CONFIG.skills.ryuken + '.');
      if (!usaRyuken(p)) return automated ? { ok: false } : this.reject(p, 'O Ryuken só sai no Super Saiyajin 3 ou 4.');
      return this.lancarRyuken(p, automated);
    }
    // Super Kamehameha (Pedro, 16/11/2026): técnica própria do SSJ4, atribuível à barra, mesma mecânica do Kamehameha,
    // vermelho-carmesim e no último nível; recarga e custo próprios.
    if (skill === 'galick') {
      if (p.vocacao !== 'vegeta') return automated ? { ok:false } : this.reject(p, 'O Galick Gun é exclusivo do Vegeta.');
      const estagio = estagioGalick(p.level);
      if (!estagio) return automated ? { ok: false } : this.reject(p, 'Galick Gun libera no nível ' + CONFIG.skills.galick + '.');
      if (p.charge || this.time < p.galickReady || p.ki < GALICK.custo)
        return automated ? { ok: false } : this.reject(p, 'Galick Gun em recarga ou Ki insuficiente.');
      const alvo = this.mobs.get(p.targetId);
      const antecipacao = automated && p.autoHunt && p.moving ? p.stats.mobility * GALICK.carga : 0;
      if (!this.alvoValidoGalick(p, alvo) || this.distanciaAoCorpo(p, alvo) > estagio.alcance + GALICK.mao + antecipacao)
        return automated ? { ok: false } : this.reject(p, 'Selecione um mob vivo dentro do alcance do Galick Gun.');
      p.facing = norm(alvo.x - p.x, alvo.y - p.y);
      p.ki -= GALICK.custo;
      p.galickReady = this.time + this.recarga(p, GALICK.recarga);
      p.charge = { targetId: alvo.id, automated, until: this.time + GALICK.carga, started: this.time,
        direction: p.facing, galick: true, versao: estagio.versao, alcance: estagio.alcance };
      return { ok: true };
    }
    if (skill === 'kame' || skill === 'superKamehameha') {
      const superKame = skill === 'superKamehameha', nome = superKame ? 'Super Kamehameha' : 'Kamehameha';
      if (p.level < CONFIG.skills[skill]) return automated ? { ok: false } : this.reject(p, nome + ' libera no nível ' + CONFIG.skills[skill] + '.');
      if (superKame && !usaSuperKame(p)) return automated ? { ok: false } : this.reject(p, 'O Super Kamehameha só sai no Super Saiyajin 4.');
      const custo = superKame ? SUPER_KAME.custo : CONFIG.skillCosts.kame, pronto = superKame ? p.superKameReady || 0 : p.kameReady;
      if (p.charge || p.ryuken || this.time < pronto || p.ki < custo) return automated ? { ok: false } : this.reject(p, nome + ' em recarga ou Ki insuficiente.');
      const alvoKame = this.mobs.get(p.targetId);
      const nivel = superKame ? ESTAGIOS_KAME.at(-1).nivel : estagioKame(p.level).nivel, alcance = estagioKame(nivel).alcance + KAME.mao;
      const antecipacao = automated && p.autoHunt && p.moving ? p.stats.mobility * KAME.carga : 0;
      if (!alvoKame || alvoKame.hp <= 0 || !this.mesmoLugar(p, alvoKame) || naZonaSegura(alvoKame) || this.distanciaAoCorpo(p, alvoKame) > alcance + antecipacao)
        return automated ? { ok: false } : this.reject(p, 'Selecione um mob vivo dentro do alcance do ' + nome + '.');
      const dir = norm(alvoKame.x - p.x, alvoKame.y - p.y);p.facing = dir;
      p.ki -= custo;
      if (superKame) p.superKameReady = this.time + this.recarga(p, SUPER_KAME.recarga);
      else p.kameReady = this.time + this.recarga(p, CONFIG.skillCooldowns.kame);
      p.charge = { targetId: alvoKame.id, automated, until: this.time + KAME.carga, started: this.time + KAME.carga - KAME.primeiroFeixe * KAME.quadro, direction: dir, nivel,
        ...(superKame ? { cor: SUPER_KAME.cor, superKame: true } : {}) };
      return { ok: true };
    }
    if (skill === 'barrier') {
      if (p.level < CONFIG.skills.barrier) return automated ? { ok: false } : this.reject(p, 'Barreira de Ki libera no nível ' + CONFIG.skills.barrier + '.');
      if (this.time < p.barrierReady || p.ki < CONFIG.skillCosts.barrier) return automated ? { ok: false } : this.reject(p, 'Barreira em recarga ou Ki insuficiente.');
      p.ki -= CONFIG.skillCosts.barrier; p.barrierUntil = this.time + 2.5; p.barrierReady = this.time + this.recarga(p, CONFIG.skillCooldowns.barrier);
      p.barrierStarted = this.time; // Só sincroniza a animação nos clientes.
      this.emit('barrier', { x: p.x, y: p.y, playerId: p.id }); this.notify(p, 'Barreira de Ki ativada!'); return { ok: true };
    }
    if (skill === 'genki') {
      if (p.level < CONFIG.skills.genki) return automated ? { ok: false } : this.reject(p, 'Genki Dama libera no nível ' + CONFIG.skills.genki + '.');
      if (this.time < p.genkiReady || p.ki < CONFIG.skillCosts.genki || p.charge || this.genkiCharges.some(g => g.owner === p.id)) return automated ? { ok: false } : this.reject(p, 'Genki Dama em recarga ou Ki insuficiente.');
      const dir = this.aimDirection(p, target); if (p.autoHunt) p.facing = dir; p.ki -= CONFIG.skillCosts.genki; p.genkiReady = this.time + this.recarga(p, CONFIG.skillCooldowns.genki);
      p.genkiLancado = null;p.genkiDirecao = null;
      this.genkiCharges.push({ id: this.uid('g'), x: p.x, y: p.y, planet: p.planet, area: p.area,
        owner: p.id, automated, targetId: target?.id || null, direction: dir,
        aim: p.aim ? { x: p.aim.x, y: p.aim.y - GENKI.alturaAlvo } : null, started: this.time, until: this.time + GENKI.carga,
        damage: p.stats.attack * multiplicadorDaForma(p.forma, 'genki') });
      this.emit('genki', { x: p.x, y: p.y, dx: dir.x, dy: dir.y, playerId: p.id }); return { ok: true };
    }
    return { ok: false };
  }
  // Um botão só (decisão do Pedro, 11/11/2026): transformado → volta à base; na base → ativa a forma mais forte
  // que o nível liberou (shared/formas.mjs). 'kaioken' e 'transform' são o mesmo comando, por compatibilidade.
  dispararRajada(p, dir) {
    const cores = { goku: '#0072FB', vegeta: '#B52CFF', boo: '#FF62BA' };
    this.projectiles.push({ id: this.uid('s'), x: p.x, y: p.y, planet: p.planet, area: p.area, dx: dir.x, dy: dir.y, speed: 470,
      owner: p.id, ownerType: 'player', damage: p.stats.attack * multiplicadorDaForma(p.forma, 'rajada'),
      ttl: 0.95, kind: 'ki', started: this.time,
      ...(p.vocacao === 'boo' ? { emissorBoo: { forma: p.forma, x: p.x, y: p.y } } : {}), cor: 285, corHex: cores[p.vocacao], tamanho: 48, fps: 12 });
  }

  alvoValidoChocolate(p, alvo) {
    return p?.connected && p.hp > 0 && alvo?.hp > 0 && this.mesmoLugar(p, alvo) && this.podeEnfrentarMob(p, alvo) &&
      !naZonaSegura(p) && !naZonaSegura(alvo) && !(alvo.chocolate?.until > this.time);
  }

  iniciarRaioChocolate(p, automated) {
    const falha = motivo => automated ? {ok:false} : this.reject(p, motivo);
    const skill = CHOCOLATE_BEAM;
    if (p.vocacao !== 'boo') return falha('Raio de Chocolate é exclusivo do Majin Boo.');
    if (p.level < skill.nivel) return falha('Raio de Chocolate libera no nível ' + skill.nivel + '.');
    if (p.charge || p.ki < skill.custo || p.chocolateBeamReady > this.time) return falha('Raio de Chocolate em recarga ou Ki insuficiente.');
    const alvo = this.mobs.get(p.targetId);
    if (!this.alvoValidoChocolate(p, alvo) || this.distanciaAoCorpo(p, alvo) > skill.alcance)
      return falha('Selecione um inimigo disponível no alcance e fora da zona segura.');
    p.ki -= skill.custo;
    p.chocolateBeamReady = this.time + this.recarga(p, skill.recarga);
    p.facing = norm(alvo.x - p.x, alvo.y - p.y);
    p.charge = { chocolateBeam: true, targetId: alvo.id, automated, direction: p.facing, forma: p.forma,
      started: this.time, until: this.time + skill.carga };
    return {ok:true};
  }

  atualizarCargaChocolate(p) {
    const carga = p.charge;
    const alvo = this.mobs.get(carga.targetId);
    if (!this.alvoValidoChocolate(p, alvo) || this.distanciaAoCorpo(p, alvo) > CHOCOLATE_BEAM.alcance) {
      p.charge = null;
      return;
    }
    p.facing = carga.direction = norm(alvo.x - p.x, alvo.y - p.y);
    if (this.time + 1e-9 < carga.until) return;
    p.charge = null;
    p.chocolateLancado = { started: this.time, direction: carga.direction };
    this.projectiles.push({id:this.uid('s'),kind:'chocolateBeam',owner:p.id,targetId:alvo.id,
      damage: p.stats.attack * estagioTecnicasBoo(carga.forma).danoChocolate,
      planet:p.planet,area:p.area,x:p.x,y:p.y,origem:{x:p.x,y:p.y},direction:carga.direction,
      forma:carga.forma,started:this.time,ttl:CHOCOLATE_BEAM.alcance/CHOCOLATE_BEAM.velocidade+.1,percorrido:0});
  }

  atualizarRaioChocolate(s, dt) {
    const p = this.players.get(s.owner), alvo = this.mobs.get(s.targetId);
    if (!this.alvoValidoChocolate(p, alvo) || !this.mesmoLugar(s, p) || !this.mesmoLugar(s, alvo)) {
      s.ttl = 0;
      return;
    }
    const raio = Math.max(19, this.raioMob(alvo));
    const falta = Math.max(0, distance(s, alvo) - raio);
    const avancar = Math.min(CHOCOLATE_BEAM.velocidade * dt, CHOCOLATE_BEAM.alcance - s.percorrido);
    if (falta <= avancar) {
      s.ttl = 0;
      if (!this.hit(p, alvo, s.damage) || alvo.hp <= 0) return;
      const until = this.time + estagioTecnicasBoo(s.forma).stun;
      alvo.chocolate = { started: this.time, until };
      alvo.telegraph = null;
      alvo.strike = null;
      alvo.moving = false;
      alvo.attackReady = Math.max(alvo.attackReady, until);
      return;
    }
    const direcao = norm(alvo.x - s.x, alvo.y - s.y);
    s.x += direcao.x * avancar;
    s.y += direcao.y * avancar;
    s.percorrido += avancar;
    s.ttl = s.percorrido >= CHOCOLATE_BEAM.alcance ? 0 : s.ttl - dt;
  }

  alternarForma(p, tecnica, automatica = false, formaSolicitada = null) {
    const disponivel = formaSolicitada===null?formaDisponivel(p.level,p.vocacao):formasDaVocacao(p.vocacao).find(f=>f.forma===formaSolicitada);
    if (formaSolicitada !== null && (!disponivel || p.level < disponivel.nivel))
      return automatica ? { ok: false } : this.reject(p, 'Transformação indisponível para esta vocação ou nível.');
    // A automação mantém uma forma já ativa e espera o Ki se recuperar antes de reativar.
    if (automatica && (p.forma === disponivel?.forma || (formaSolicitada === null && p.forma !== 'base') ||
      p.ki <= p.stats.ki * CONFIG.transformacao.limiteAutomatico)) return { ok: false };
    if (p.forma !== 'base' && (formaSolicitada===null||p.forma===formaSolicitada)) { const formaAnterior=p.forma; p.forma = 'base'; p.formaAte = 0; if (p.skin===formaAnterior) p.skin='base'; atualizarBarraPadrao(p); this.notify(p, 'Forma base.'); return { ok: true }; }
    if (!disponivel) return automatica ? { ok: false } : this.reject(p, 'Transformação libera no nível ' + formasDaVocacao(p.vocacao)[0].nivel + '.');
    p.forma = disponivel.forma;
    atualizarBarraPadrao(p);
    p.formaAte = disponivel.duracao ? this.time + disponivel.duracao : 0;
    if (p.forma === 'kaioken') this.emit('kaioken', { x: p.x, y: p.y, playerId: p.id });
    this.notify(p, disponivel.nome + ' ativado!' + (disponivel.duracao ? ' Duração: ' + Math.round(disponivel.duracao / 60) + ' min.' : ''));
    return { ok: true };
  }
  revalidarFormaAposGodmode(p) {
    const forma = formasDaVocacao(p.vocacao).find(f => f.forma === p.forma);
    if (p.forma === 'base' || (forma && p.level >= forma.nivel)) return;
    this.alternarForma(p, 'transform');
    if (p.charge?.superKame) p.charge = null;
    if (p.autoHunt) this.aplicarBuffDoCombo(p);
  }
  aplicarBuffDoCombo(p) {
    const combo = p.comboAutoHunt;
    if (!combo) return false;
    const buff = combo.buffMaisAlto ? formaDisponivel(p.level, p.vocacao)?.forma : combo.buff;
    if (!buff || p.forma === buff || p.charge || p.finalFlashAtivo || p.ryuken ||
      this.genkiCharges.some(g => g.owner === p.id) || !kiPermiteCombo(p, 'transform')) return false;
    return this.cast(p, 'transform', true, buff).ok;
  }
  verificarKiDaForma(p) {
    if (p.forma !== 'base' && p.ki <= 0 && !p.godmode) {
      p.forma = 'base'; p.formaAte = 0; atualizarBarraPadrao(p); this.notify(p, 'Ki esgotado. Forma base.');
    }
  }
  lancarRyuken(p, automated = false) {
    if (p.charge || p.ryuken || this.time < p.ryukenReady || p.ki < RYUKEN.custo)
      return automated ? { ok: false } : this.reject(p, 'Ryuken em recarga ou Ki insuficiente.');
    const alvo = this.mobs.get(p.targetId);
    const alcance = estagioKame(p.level).alcance + KAME.mao;
    const antecipacao = automated && p.autoHunt && p.moving ? p.stats.mobility * RYUKEN.lancamento : 0;
    if (!alvo || alvo.hp <= 0 || !this.mesmoLugar(p, alvo) || naZonaSegura(alvo) || this.distanciaAoCorpo(p, alvo) > alcance + antecipacao)
      return automated ? { ok: false } : this.reject(p, 'Selecione um mob vivo dentro do alcance do Ryuken.');
    const dir = norm(alvo.x - p.x, alvo.y - p.y); p.facing = dir;
    p.ki -= RYUKEN.custo; p.ryukenReady = this.time + this.recarga(p, RYUKEN.recarga);
    p.ryuken = { automated, targetId: alvo.id, started: this.time, until: this.time + RYUKEN.lancamento, direction: dir, damage: p.stats.attack * danoRyuken(p.forma) };
    this.emit('ryuken', { x: p.x, y: p.y, playerId: p.id });
    this.verificarKiDaForma(p);
    return { ok: true };
  }
  // Ryuken: lançamento (pose + energia no punho), depois o dragão persegue o alvo e explode só nele.
  atualizarRyukens(dt) {
    this.ryukenExplosoes = this.ryukenExplosoes.filter(e => this.time - e.started < RYUKEN.impacto);
    const ativo = p => p && p.connected && p.hp > 0 && !naZonaSegura(p);
    const alvoValido = (alvo, ref) => alvo && alvo.hp > 0 && this.mesmoLugar(alvo, ref) && !naZonaSegura(alvo);
    for (const p of this.players.values()) {
      if (!p.ryuken) { if (p.ryukenLancado && this.time - p.ryukenLancado > RYUKEN.sustentacao) p.ryukenLancado = null; continue; }
      const alvo = this.mobs.get(p.ryuken.targetId);
      if (!ativo(p) || (p.ryuken.automated && !p.autoHunt) || !usaRyuken(p) || !alvoValido(alvo, p)) { p.ryuken = null; continue; }
      p.ryuken.direction = norm(alvo.x - p.x, alvo.y - p.y); p.facing = p.ryuken.direction;
      if (this.time + 1e-9 < p.ryuken.until) continue;
      const d = p.ryuken.direction, origem = { ...origemKame(p, d) };
      origem.y -= KAME.alturaMao;
      // Continua de onde o lançamento terminou (sem passar do alvo, se ele estiver mais perto que isso).
      const avanco = Math.min(RYUKEN.cabecaAFrente, Math.max(0, Math.hypot(alvo.x - origem.x, alvo.y - RYUKEN.alturaAlvo - origem.y) - RYUKEN.colisao));
      origem.x += d.x * avanco; origem.y += d.y * avanco;
      this.projectiles.push({ id: this.uid('s'), kind: 'ryuken', owner: p.id, ownerType: 'player', ...origem, planet: p.planet, area: p.area,
        dx: d.x, dy: d.y, speed: RYUKEN.velocidade, targetId: alvo.id, damage: p.ryuken.damage, started: this.time, ttl: 1 });
      p.ryukenLancado = this.time; p.ryuken = null;
    }
    for (const s of this.projectiles) {
      if (s.kind !== 'ryuken' || s.ttl <= 0) continue;
      const p = this.players.get(s.owner), alvo = this.mobs.get(s.targetId);
      if (!ativo(p) || !alvoValido(alvo, s)) { s.ttl = 0; continue; }
      const ax = alvo.x, ay = alvo.y - RYUKEN.alturaAlvo, falta = Math.hypot(ax - s.x, ay - s.y);
      const d = norm(ax - s.x, ay - s.y); s.dx = d.x; s.dy = d.y;
      const passo = s.speed * dt;
      // Só o alvo: o dragão atravessa os outros mobs (decisão do Pedro: sem dano em área).
      if (falta <= passo + RYUKEN.colisao + (alvo.corpo || 0)) {
        s.x = ax - d.x * Math.min(falta, RYUKEN.colisao); s.y = ay - d.y * Math.min(falta, RYUKEN.colisao);
        this.hit(p, alvo, s.damage);
        this.ryukenExplosoes.push({ id: this.uid('rx'), x: ax, y: ay, dx: d.x, dy: d.y, planet: s.planet, area: s.area, started: this.time });
        s.ttl = 0;
      } else { s.x += d.x * passo; s.y += d.y * passo; }
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
      if (!ativo(p, g) || (g.automated && !p.autoHunt)) return false;
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
    p.healReady = this.time + this.recarga(p, CURA.cooldown); p.ki -= cura.custo;
    registrarMissao(p,'skills',1,this.agora());
    p.healStarted = this.time; // Um único efeito por ativação confirmada, inclusive na autocura.
    const antes = p.hp;
    p.hp = Math.min(p.stats.hp, p.hp + p.stats.hp * cura.percentual * fatorCombateAleatorio(this.randomCombat));
    analisar(p,'cura',p.hp-antes);
    this.emit('heal', { x: p.x, y: p.y, playerId: p.id, planet: p.planet, area: p.area,
      amount: p.hp - antes, text: '+' + (p.hp - antes).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' HP' });
    return { ok: true };
  }
  hit(attacker, target, raw, { ignorarEsquiva = false, credito = attacker } = {}) {
    if (target.hp <= 0 || (attacker && !this.mesmoLugar(attacker, target))) return false;
    if (!this.podeEnfrentarMob(credito, target) || !this.podeEnfrentarMob(target, attacker)) return false;
    if (attacker && this.players.has(attacker.id) && naZonaSegura(attacker)) return false;
    const playerTarget = this.players.has(target.id);
    const cloneTarget = this.combateBoo.clones.has(target.id);
    if (cloneTarget && (!this.combateBoo.cloneAtivo(target) || !attacker || attacker.hp <= 0 || !this.mobs.has(attacker.id))) return false;
    if (playerTarget) {
      if (attacker && this.players.has(attacker.id) && !this.canPvp(attacker, target)) return false;
      if ((!ignorarEsquiva && this.time < target.dashUntil) || this.protegido(target)) return false;
    }
    const defense = playerTarget ? target.stats.defense : target.defesa ?? 1;
    const guardedRaw = playerTarget && this.time < target.barrierUntil ? raw * 0.28 : raw;
    const damage = Math.max(1, Math.round(guardedRaw * fatorCombateAleatorio(this.randomCombat) * 100 / (100 + defense * 3)));
    const hpAntes=target.hp;
    if(playerTarget) analisar(target,'danoRecebido',Math.min(hpAntes,damage));
    if(credito && this.players.has(credito.id)) analisar(credito,'danoCausado',Math.min(hpAntes,damage));
    if(damage>=hpAntes){
      if(playerTarget) registrarEncontro(target,'mortes',attacker,Boolean(attacker && (attacker.raro||CHEFES.has(attacker.type))));
      else if(!cloneTarget && credito && this.players.has(credito.id)) registrarEncontro(credito,'abates',target,Boolean(target.raro||CHEFES.has(target.type)));
    }
    target.hp = Math.max(0, target.hp - damage);
    // Ameaça: quem bate num mob vira (ou reforça) o alvo dele, mesmo de longe e mesmo sendo mob neutro.
    if (!playerTarget && !cloneTarget && attacker && (this.players.has(attacker.id) || this.combateBoo.clones.has(attacker.id))) this.somarAmeaca(target, attacker, damage);
    this.emit('damage', { x: target.x, y: target.y - 20, amount: damage, targetId: target.id });
    if (target.hp <= 0 && !cloneTarget) {
      if (playerTarget) this.derrotarJogador(target);
      else {
        target.chocolate = null;
        target.deadUntil = this.time + (target.raro && this.chefeJa ? 60 : renasceEm(target.type, this.random)); target.telegraph = null; target.ameaca = null; target.voltando = false;
        if (credito && this.players.has(credito.id)) {
          const attacker = credito;
          const xpBase=variarExperiencia(target.xp,this.randomCombat),nivelMob=Number.isInteger(target.level)?target.level:attacker.level;
          const experiencia=attacker.level>=CONFIG.progression.nivelMaximo?0:xpAjustadoPorNivel(xpBase,attacker.level,nivelMob);
          this.awardXp(attacker, experiencia, true); attacker.kills++; registrarMissao(attacker,'kills',1,this.agora());
          const zeniAntes = attacker.zeni;
          const [zeniMin, zeniMax] = faixaZeniMob(target.level, target.raro);
          attacker.zeni += target.raro ? zeniMin : zeniMin + Math.floor(this.random() * (zeniMax - zeniMin + 1));
          analisar(attacker,'zeni',attacker.zeni-zeniAntes);
          if(!target.raro&&CHEFES.has(target.type))registrarAtividadePasse(attacker,'bosses',1,this.agora());
          if (target.raro) { attacker.bossKills++;registrarMissao(attacker,'bosses',1,this.agora()); this.notify(attacker, target.name + ' derrotado! +100 Zeni e experiência.'); }
          const avisoSaga = registrarAbateSaga(attacker, target); if (avisoSaga) this.notify(attacker, avisoSaga);
          const onde = { planet: target.planet, area: target.area };
          if (this.random() < attacker.stats.lootChance) {
            const item=this.random() < fracaoCristalAzul(target.type) ? 'cristal-azul' : 'scrap';
            this.loot.push({ id: this.uid('l'), x: target.x, y: target.y, ...onde, item, owner: attacker.id, until: this.time + 45 });
            analisar(attacker,'drops',1,item);
          }
          if (this.random() < RECOMPENSAS_MOBS.chanceSemente15) {
            this.loot.push({ id: this.uid('l'), x: target.x + 12, y: target.y, ...onde, item: 'seed15', owner: attacker.id, until: this.time + 45 });
            analisar(attacker,'drops',1,'seed15');
          }
          let posicaoDrop = 0;
          for (const { item, chance } of dropsEspecificos(target.type)) {
            if (this.random() >= chance) continue;
            const x = target.x - 14 - posicaoDrop++ * 9;
            this.loot.push({ id: this.uid('l'), x, y: target.y, ...onde, item, owner: attacker.id, until: this.time + 45 });
            analisar(attacker,'drops',1,item);
          }
        }
        if (target.dono) this.mobs.delete(target.id);   // chefe pessoal da saga: não renasce
      }
    }
    return true;
  }
  derrotarJogador(p) {
    p.respawnAt = this.time + CONFIG.respawnDelay;
    p.autoHunt = false;
    p.transformed = false;
    p.formaAte = 0;
    p.charge = null;

    p.penalidadeMorte = null;
    let aviso = 'Derrotado.';
    if (!p.godmode) {
      const { nivel, xp, perda } = progressoAposMorte(p.level, p.xp);
      p.xp = xp;
      if (perda > 0) p.penalidadeMorte = { xp: perda, nivelAnterior: p.level };
      if (perda > 0) aviso += ' Perdeu ' + perda.toLocaleString('pt-BR') + ' XP.';
      if (nivel < p.level) {
        aviso += ' Nível ' + p.level + ' → ' + nivel + '.';
        p.level = nivel;
        p.stats = statsFor(nivel, p.vocacao, p.equipamentos);
        atualizarCapacidade(p);
        p.ki = Math.min(p.ki, p.stats.ki);
      }
    }
    atualizarBarraPadrao(p);
    this.notify(p, aviso + ' Volta ao começo da área em ' + CONFIG.respawnDelay + ' segundos.');
  }
  awardXp(p, amount, deAbate = false) {
    // No God Mode, o Analyzer continua registrando XP de combate sem alterar o progresso real.
    if (p.godmode || p.level >= CONFIG.progression.nivelMaximo) {
      if (deAbate) analisar(p, 'xp', amount);
      return;
    }
    const bonus = bonusXpPremium(p, this.agora());
    // Acumula os centésimos para que abates que rendem pouco XP respeitem o percentual.
    const centesimos = amount * bonus + p.bonusPremium.restoXp;
    const xp = amount + Math.floor(centesimos / 100);
    p.bonusPremium.restoXp = centesimos % 100;
    if (deAbate) analisar(p, 'xp', xp);
    p.xp += xp;
    while (p.level < CONFIG.progression.nivelMaximo && p.xp >= xpForLevel(p.level)) {
      p.xp -= xpForLevel(p.level); p.level++; const old = p.stats; p.stats = statsFor(p.level, p.vocacao, p.equipamentos);
      atualizarCapacidade(p);
      if(p.level===CONFIG.skills.superKamehameha)atualizarBarraPadrao(p);
      p.hp = Math.min(p.stats.hp, p.hp + p.stats.hp - old.hp); p.ki = Math.min(p.stats.ki, p.ki + p.stats.ki - old.ki);
      this.emit('level', { playerId: p.id, x: p.x, y: p.y, level: p.level });
      const skillsUnlock = [
        ['ki', 'Rajada de Ki'], ['dash', 'Imagem Residual'], ['kame', 'Kamehameha'],
        ['barrier', 'Barreira de Ki'], ['genki', 'Genki Dama'], ['ryuken', 'Ryuken'], ['superKamehameha', 'Super Kamehameha']
      ].filter(([key]) => CONFIG.skills[key] === p.level).map(([, name]) => name);
      const formsUnlock = formasDaVocacao(p.vocacao).filter(forma => forma.nivel === p.level).map(forma => forma.nome);
      const booUnlock = p.vocacao === 'boo' ? [CHOCOLATE_BEAM, ...Object.values(TECNICAS_BOO)].filter(t => t.nivel === p.level).map(t => t.nome) : [];
      const desbloqueios = [...skillsUnlock, ...formsUnlock, ...booUnlock];
      const unlock = desbloqueios.length ? ' Desbloqueado: ' + desbloqueios.join(' e ') + '!' : '';
      this.notify(p, 'Nível ' + p.level + '! Todos os atributos aumentaram.' + unlock);
    }
  }
  move(entity, dx, dy, dt, speed, radius = 15) {
    // Só mobs bloqueiam outros mobs. Jogadores atravessam seus corpos para sair de cercos.
    if (this.mobs.get(entity.id) === entity) {
      const antes = { x: entity.x, y: entity.y };
      const fator = this.combateBoo.fatorMovimento(entity);
      this.moverMob(entity, dx * speed * dt * fator, dy * speed * dt * fator, true);
      entity.moving = distance(antes, entity) > 0.01;
      return;
    }
    const [x, y] = deslocar(entity.planet, entity.x, entity.y, dx, dy, speed * dt, radius, entity.area, Boolean(entity.autoHunt && !naZonaSegura(entity)));
    if (this.combateBoo.clones.has(entity.id) && !this.combateBoo.passoLivre(entity, { x, y })) {
      entity.moving = false;
      return;
    }
    entity.x = x; entity.y = y;
    entity.moving = Math.hypot(dx, dy) > 0.05;
  }
  // Raio no chão, incluindo a largura extra dos gigantes (pedido do Pedro, 07/11).
  raioMob(m) { return 22 + (m.corpo || 0); }
  moverMob(m, dx, dy, colidir = false, evitarZonaSegura = false) {
    const raio = this.raioMob(m), passos = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 4));
    const mundo = PLANETS[m.planet];
    const livre = (x, y) => x >= raio && y >= raio && x <= mundo.w - raio && y <= mundo.h - raio
      && (!evitarZonaSegura || !naZonaSegura({ planet: m.planet, area: m.area, x, y }))
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
        const aAtordoado = a.chocolate?.until > this.time, bAtordoado = b.chocolate?.until > this.time;
        if (aAtordoado && bAtordoado) continue;
        const antes = { x: a.x, y: a.y };
        const deslocamento = falta * (bAtordoado ? 1 : 0.5);
        if (!aAtordoado) this.moverMob(a, -nx * deslocamento, -ny * deslocamento);
        const afastou = Math.max(0, (antes.x - a.x) * nx + (antes.y - a.y) * ny);
        if (!bAtordoado) this.moverMob(b, nx * (falta - afastou), ny * (falta - afastou));
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
    if (!p.connected) { if (p.charge?.booTecnica || p.charge?.bigBangAttack || p.charge?.chocolateBeam || p.charge?.booKi || p.charge?.booSoco) p.charge = null; p.forma = 'base'; p.formaAte = 0; atualizarBarraPadrao(p); return; }
    const extensor = p.equipamentos.mochila;
    if (extensor && p.bonusPremium.extensores[extensor] !== undefined) {
      p.bonusPremium.extensores[extensor] -= dt;
      if (p.bonusPremium.extensores[extensor] <= 0) {
        encerrarExtensor(p);
        this.notify(p, 'O extensor da mochila expirou.');
      }
    }
    if (p.godmode) {
      if (p.godmodeOptions?.hpInfinite !== false) p.hp = p.stats.hp;
      if (p.godmodeOptions?.kiInfinite !== false) p.ki = p.stats.ki;
    }
    if (p.hp <= 0) {
      if (p.charge?.bigBangAttack || p.charge?.booTecnica) p.charge = null;
      p.forma = 'base'; p.formaAte = 0;
      atualizarBarraPadrao(p);
      // Renasce no começo da mesma área (decisão do Pedro; pode mudar), protegido por alguns segundos.
      if (this.time >= p.respawnAt) { this.levar(p, lugar(p.area || 'terra')); p.hp = p.stats.hp; p.ki = p.stats.ki; }
      return;
    }
    avancarPocaoXp(p, dt);
    if (p.forma === 'gogeta' && p.formaAte > 0 && this.time >= p.formaAte) {
      p.forma = 'base'; p.formaAte = 0; atualizarBarraPadrao(p); this.notify(p, 'A fusão de Gogeta terminou. Forma base.');
    }
    // O botão principal pausa toda a automação, sem apagar as preferências.
    if (!p.autoHunt && p.charge?.automated && !p.charge.liberada) p.charge = null;
    const taxas = taxasRegeneracao(p, this.time);
    if (taxas.hpComida) {
      const antes = p.hp;
      p.hp = Math.min(p.stats.hp, p.hp + taxas.hpComida * dt);
      analisar(p, 'cura', p.hp - antes);
    }
    if (p.autoHunt && p.autoHeal && p.hp / p.stats.hp < p.healThreshold / 100) this.cast(p, 'heal', true);
    if (taxas.kiNatural) p.ki = Math.min(p.stats.ki, p.ki + dt * taxas.kiNatural);
    p.ki = clamp(p.ki + dt * (taxas.kiEquipamento + taxas.kiComida - taxas.drenoForma), 0, p.stats.ki);
    this.verificarKiDaForma(p);
    if (p.charge?.booTecnica) { this.combateBoo.atualizarCarga(p); return; }
    if (p.charge?.chocolateBeam) {
      this.atualizarCargaChocolate(p);
      return;
    }
    if (p.charge?.booKi || p.charge?.booSoco) {
      if (naZonaSegura(p)) p.charge = null;
      else if (this.time + 1e-9 >= p.charge.until) {
        const ataque = p.charge;
        p.charge = null;
        if (ataque.booKi) this.dispararRajada(p, ataque.direction);
        else {
          const alvo = this.mobs.get(ataque.targetId) || this.players.get(ataque.targetId);
          if (alvo?.hp > 0 && this.mesmoLugar(p, alvo) && !naZonaSegura(alvo) && this.distanciaAoCorpo(p, alvo) <= 70)
            this.hit(p, alvo, p.stats.attack);
        }
      }
      return;
    }
    if (p.charge?.bigBangAttack) {
      this.atualizarCargaBigBangAttack(p);
      if (p.charge?.bigBangAttack) return;
    }
    if (p.charge?.finalFlash) {
      this.atualizarCargaFinalFlash(p);
      if (p.charge?.finalFlash) return;
    }
    if (p.finalFlashAtivo) {
      p.facing = p.finalFlashAtivo.direction;
      return;
    }
    const velocidade = p.stats.mobility * (p.montaria ? MULT_NIMBUS_DEV : 1);
    if (this.time - p.inputAt > 0.35) p.input = { x: 0, y: 0 };
    if (this.time < p.dashUntil) this.move(p, p.dashDirection.x, p.dashDirection.y, dt, 620);
    else if (p.input.x || p.input.y) this.move(p, p.input.x, p.input.y, dt, velocidade * (p.charge ? 0.35 : 1));
    else if (p.autoHunt && naZonaSegura(p)) {
      p.targetId = null; p.charge = null;
      p.saidaSegura ||= this.saidaDaZonaSegura(p);
      if (p.saidaSegura) this.steer(p, p.saidaSegura, dt, velocidade);
    }
    else if (p.autoHunt) {
      p.saidaSegura = null;
      // Reavalia a cada passo: sempre persegue o inimigo mais próximo, inclusive
      // quando outro se aproxima durante a perseguição atual.
      const alcanceKame = p.vocacao === 'goku' && p.level >= CONFIG.skills.kame ? estagioKame(p.level).alcance + KAME.mao : 0;
      const raioCaca = p.autoSkills && alcanceKame
        ? Math.max(CONFIG.autoHuntRaio, alcanceKame + velocidade * KAME.carga) : CONFIG.autoHuntRaio;
      const target = this.alvoMaisProximo(p, raioCaca);
      if (target) {
        if (target.id !== p.caca?.alvo) { p.caca = { alvo: target.id, melhor: Infinity, desde: this.time }; p.rota = null; }
        p.targetId = target.id;
        // A distância da técnica determina quando disparar, não onde a caça para.
        // Continua a aproximação para poder finalizar com ataque básico mesmo em recarga/sem Ki.
        if (distance(p, target) > 49) {
          const alcancavel = this.steer(p, target, dt, velocidade, 40);
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
          const alcancavel = this.steer(p, p.patrulha, dt, velocidade, 40);
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
          // Ponto intermediário vale como alcançado a 6 unidades: colado em árvore/pedra o corpo não encosta no ponto
          // exato e ficava escorregando de um lado para o outro (tremor ao andar na grama, relato do Pedro, 23/11/2026).
          while (destino.pontos.length > 1 && distance(p, destino.pontos[0]) < 6) destino.pontos.shift();
          const alvo = destino.pontos[0], d = distance(p, alvo), dir = norm(alvo.x - p.x, alvo.y - p.y);
          this.move(p, dir.x, dir.y, Math.min(dt, d / p.stats.mobility), p.stats.mobility); p.facing = dir;
        } else this.steer(p, destino, dt, p.stats.mobility);
        // Progresso medido em janelas de 1 s: quanto o corpo saiu do lugar desde o começo da janela. Antes a janela
        // recomeçava sempre que o corpo se afastava 4 unidades do ponto guardado, e o vaivém de ~7 unidades perto de
        // árvore/pedra contava como progresso: o tremor não acabava nunca (relato do Pedro, 23/11/2026). Um desvio de
        // verdade anda mais de 100 unidades por segundo (até no nível 1); o vaivém, menos de 30.
        if (!destino.progresso) destino.progresso = { x: p.x, y: p.y, em: this.time };
        else if (this.time - destino.progresso.em >= 1) {
          if (distance(p, destino.progresso) < 30) { p.moveTo = null; p.rota = null; p.moving = false; }
          else destino.progresso = { x: p.x, y: p.y, em: this.time };
        }
      }
    }
    if (naZonaSegura(p)) { p.charge = null; return; }
    if (p.autoFood && p.autoHunt && p.hp / p.stats.hp <= CONFIG.autoFoodLimiteHp && p.foodUntil <= this.time && p.inventory.food > 0) this.useFood(p);
    if (p.autoHunt && this.time >= p.kiReady) {
      const fracaoHp = p.hp / p.stats.hp;
      const fracaoKi = p.ki / p.stats.ki;
      const usarEnergia = p.autoEnergyPotion && fracaoHp < p.energyPotionThreshold / 100 && p.inventory['pocao-energia'] > 0;
      const usarKi = p.autoKi && fracaoKi < p.kiThreshold / 100 && p.inventory.ki > 0;
      if (usarEnergia && (!usarKi || fracaoHp <= fracaoKi)) this.usePotion(p, 'pocao-energia');
      else if (usarKi) this.usePotion(p);
    }
    if (p.autoHunt && p.autoSeed && p.hp / p.stats.hp < p.seedThreshold / 100 && p.inventory['seed' + p.seedSelected] > 0 && this.time >= p.seedReady) this.useSeed(p, p.seedSelected);
    if (p.bonusPremium.capacidadeRetida) atualizarCapacidade(p);
    const combo = p.comboAutoHunt;
    const conjurandoCombo = combo && (p.ryuken || this.genkiCharges.some(g => g.owner === p.id));
    if (p.autoHunt && !conjurandoCombo) this.aplicarBuffDoCombo(p);
    let target = this.targetOf(p) || (p.autoHunt ? this.alvoMaisProximo(p, CONFIG.autoHuntRaio) : this.nearestMob(p, 320));
    // O caminho pode apontar para um desvio: na hora de lutar, o corpo olha para o inimigo.
    if (p.autoHunt && target) p.facing = this.aimDirection(p, target);
    if (p.vocacao !== 'boo' && p.autoHunt && p.autoAttack && target && this.distanciaAoCorpo(p, target) < 70) this.cast(p, 'basic', true);
    // O golpe pode ter derrotado o alvo neste mesmo passo; nunca calcule uma skill
    // usando o HP antigo nem gaste Ki em um cadáver.
    if (target && target.hp <= 0 && p.autoHunt) {
      target = this.alvoMaisProximo(p, CONFIG.autoHuntRaio);
      p.targetId = target?.id || null;
    }
    if (p.autoHunt && (p.autoSkills || p.autoAttack) && target && !p.charge && !conjurandoCombo && !this.kamehamehas.some(k => k.owner === p.id && !k.impacto)) {
      const attackFactor = multiplicadorDaForma(p.forma, 'soco');
      const danoBasico = Math.max(1, Math.round(p.stats.attack * attackFactor * 100 / (100 + (target.defesa ?? 1) * 3)));
      const danoKi = Math.max(1, Math.round(p.stats.attack * multiplicadorDaForma(p.forma, 'rajada') * 100 / (100 + (target.defesa ?? 1) * 3)));
      const basicoPronto = this.time >= p.basicReady;
      const pertoParaBasico = this.distanciaAoCorpo(p, target) <= 70;
      const morreriaNoBasico = p.autoAttack && pertoParaBasico && basicoPronto && target.hp <= danoBasico;
      const prefereBasico = p.autoAttack && pertoParaBasico && (target.hp <= danoBasico || (basicoPronto && target.hp <= danoKi));
      const vegeta = p.vocacao === 'vegeta';
      const podeKame = p.vocacao === 'goku' && p.level >= 3
        && this.distanciaAoCorpo(p, target) <= estagioKame(p.level).alcance + KAME.mao + (p.moving ? velocidade * KAME.carga : 0);
      const podeRajada = p.autoAttack && !pertoParaBasico && p.ki > p.stats.ki * 0.15 && distance(p, target) < 390;
      const tentar = skill => this.cast(p, skill, true).ok;
      let usouTecnica = false;
      if (p.autoSkills && combo) {
        // Uma técnica indisponível deixa a próxima prioridade disputar o mesmo turno.
        usouTecnica = combo.ordem.some(({ id, ki }) => kiPermiteCombo(p, id, ki) && tentar(id));
      } else if (p.autoSkills && p.vocacao === 'boo' && !morreriaNoBasico) {
        usouTecnica = [...Object.keys(TECNICAS_BOO).reverse(), CHOCOLATE_BEAM.id].some(tentar);
      } else if (p.autoSkills && vegeta) {
        usouTecnica = (!morreriaNoBasico && !prefereBasico && (tentar('finalFlash') || tentar('bigBangAttack'))) || tentar('galick');
      } else if (p.autoSkills && !morreriaNoBasico && !prefereBasico && podeKame && p.ki > p.stats.ki * 0.35 && target.hp > danoKi) {
        usouTecnica = (usaSuperKame(p) && tentar('superKamehameha'))
          || (usaRyuken(p) && tentar('ryuken')) || tentar('kame');
      }
      if (!usouTecnica && podeRajada && (!combo || kiPermiteCombo(p, 'ki'))) tentar('ki');
    }
    if (p.vocacao === 'boo' && p.autoHunt && p.autoAttack && !p.charge && target && this.distanciaAoCorpo(p, target) < 70)
      this.cast(p, 'basic', true);
    if (p.charge?.galick) this.atualizarCargaGalick(p);
    if (p.charge && p.vocacao !== 'boo' && !p.charge.galick && !p.charge.finalFlash && !p.charge.bigBangAttack) {
      let alvo = this.mobs.get(p.charge.targetId);
      if (p.charge.automated && (!alvo || alvo.hp <= 0 || !this.mesmoLugar(p, alvo) || naZonaSegura(alvo) || p.targetId !== alvo.id)) {
        alvo = this.alvoMaisProximo(p, CONFIG.autoHuntRaio);
        if (alvo) { p.charge.targetId = alvo.id; p.targetId = alvo.id; }
      }
      if (!alvo || alvo.hp <= 0 || !this.mesmoLugar(p, alvo) || naZonaSegura(alvo)) p.charge = null;
      else p.facing = p.charge.direction = norm(alvo.x - p.x, alvo.y - p.y);
    }
    // Auto Hunt prepara durante a aproximação, mas o feixe só sai no alcance real.
    const cargaKame = p.charge && p.vocacao !== 'boo' && !p.charge.galick && !p.charge.finalFlash && !p.charge.bigBangAttack ? p.charge : null;
    const alvoCarga = cargaKame && this.mobs.get(cargaKame.targetId);
    const cargaNoAlcance = cargaKame && (!cargaKame.automated || this.distanciaAoCorpo(p, alvoCarga) <= estagioKame(cargaKame.nivel).alcance + KAME.mao);
    if (cargaNoAlcance && this.time >= cargaKame.until) {
      this.kamehamehas.push({ id: this.uid('k'), owner: p.id, planet: p.planet, area: p.area, ...origemKame(p, cargaKame.direction),
        targetId: cargaKame.targetId, direction: cargaKame.direction, nivel: cargaKame.nivel, cor: cargaKame.cor,
        started: this.time - KAME.primeiroFeixe * KAME.quadro, galick: false, distancia: null,
        damage: p.stats.attack * (cargaKame.superKame ? SUPER_KAME.dano : multiplicadorDaForma(p.forma, 'kame')),
        automated: cargaKame.automated, atingidos: new Set() });
      p.charge = null;
    }
    for (const l of this.loot) if (!l.taken && this.mesmoLugar(p, l) && (l.owner === p.id || this.time > l.until - 30) && distance(p, l) < CONFIG.pickupRadius) {
      if (this.addItem(p, l.item)) { l.taken = true;analisar(p,'loot',1,l.item);registrarMissao(p,'coleta',1,this.agora()); this.emit('pickup', { x: l.x, y: l.y, playerId: p.id, item: l.item }); }
      else if (this.time - p.lastBagNotice > 8) { p.lastBagNotice = this.time; this.notify(p, 'Mochila cheia: XP continua, novos itens ficam no chão.'); }
    }
  }
  alvoValidoGalick(p, alvo) {
    return alvo?.hp > 0 && this.mesmoLugar(p, alvo) && !naZonaSegura(alvo);
  }
  atualizarCargaGalick(p) {
    const carga = p.charge, alvo = this.mobs.get(carga.targetId);
    if (!this.alvoValidoGalick(p, alvo)) { p.charge = null; return; }
    const foraDoAlcance = this.distanciaAoCorpo(p, alvo) > carga.alcance + GALICK.mao;
    if (foraDoAlcance && (!carga.automated || p.targetId !== alvo.id || this.time >= carga.until + GALICK.carga)) {
      p.charge = null;
      return;
    }
    p.facing = carga.direction = norm(alvo.x - p.x, alvo.y - p.y);
    if (this.time < carga.until || foraDoAlcance) return;
    this.kamehamehas.push({ id: this.uid('k'), owner: p.id, planet: p.planet, area: p.area,
      galick: true, versao: carga.versao, alcance: carga.alcance, targetId: alvo.id, castStarted: carga.started, started: this.time,
      direction: carga.direction, distancia: 0, damage: p.stats.attack * GALICK.dano });
    p.charge = null;
  }
  atualizarGalick(k, p) {
    if (!p?.connected || p.hp <= 0 || !this.mesmoLugar(p, k)) return false;
    if (k.impacto) return this.time - k.impacto.started < GALICK.impactoQuadros * GALICK.impactoQuadro;
    if (naZonaSegura(p) || this.time - k.started >= GALICK.duracao) return false;
    const alvo = this.mobs.get(k.targetId);
    if (!this.alvoValidoGalick(p, alvo)) return false;
    const contato = this.distanciaAoCorpo(p, alvo);
    if (contato > k.alcance + GALICK.mao) return false;
    k.direction = p.facing = norm(alvo.x - p.x, alvo.y - p.y);
    Object.assign(k, origemGalick(p, k.direction, contato));
    const distancia = Math.max(0, contato - GALICK.mao);
    k.pesAlvoPrevisto = { x: alvo.x, y: alvo.y };
    k.distanciaContato = distancia;
    k.tempoVoo = Math.max(GALICK.vooMinimo, distancia / GALICK.velocidade);
    const progresso = Math.min(1, (this.time - k.started) / k.tempoVoo);
    k.distancia = distancia * progresso;
    if (progresso < 1) return true;
    if (!this.hit(p, alvo, k.damage)) return false;
    k.impacto = { x: k.x + k.direction.x * distancia, y: k.y + k.direction.y * distancia, pesAlvo: k.pesAlvoPrevisto, started: this.time };
    return true;
  }
  alvoValidoBigBangAttack(ref, alvo) {
    return alvo?.hp > 0 && this.mesmoLugar(ref, alvo) && !naZonaSegura(alvo);
  }
  origemBigBangAttack(p, alvo) {
    const direcao = norm(alvo.x - p.x, alvo.y - p.y);
    const direction = direcao.x || direcao.y ? direcao : p.facing;
    return { direction, ...maoBigBang(p, direction) };
  }
  iniciarBigBangAttack(p, automated) {
    const falha = motivo => automated ? { ok: false } : this.reject(p, motivo);
    if (p.vocacao !== 'vegeta') return falha('O Big Bang Attack é exclusivo do Vegeta.');
    if (p.level < BIG_BANG_ATTACK.nivel) return falha('Big Bang Attack libera no nível ' + BIG_BANG_ATTACK.nivel + '.');
    if (!formaBigBangAttack(p.forma)) return falha('Big Bang Attack requer Super Saiyajin ou superior.');
    if (p.charge || p.finalFlashAtivo || this.time < p.bigBangAttackReady || p.ki < BIG_BANG_ATTACK.custo)
      return falha('Big Bang Attack em recarga, outra conjuração ativa ou Ki insuficiente.');
    const alvo = this.mobs.get(p.targetId);
    if (!this.alvoValidoBigBangAttack(p, alvo)) return falha('Selecione um mob vivo para o Big Bang Attack.');
    const origem = this.origemBigBangAttack(p, alvo);
    if (distance(origem, alvo) - this.raioMob(alvo) > BIG_BANG_ATTACK.alcance)
      return falha('Alvo fora do alcance do Big Bang Attack.');
    p.facing = origem.direction;
    p.ki -= BIG_BANG_ATTACK.custo;
    p.bigBangAttackReady = this.time + this.recarga(p, BIG_BANG_ATTACK.recarga);
    p.charge = { bigBangAttack: true, targetId: alvo.id, direction: p.facing, started: this.time,
      until: this.time + BIG_BANG_ATTACK.carga, automated };
    return { ok: true };
  }
  atualizarCargaBigBangAttack(p) {
    const carga = p.charge, alvo = this.mobs.get(carga.targetId);
    if (!formaBigBangAttack(p.forma) || naZonaSegura(p) || !this.alvoValidoBigBangAttack(p, alvo)) {
      p.charge = null;
      return;
    }
    const { direction, ...origem } = this.origemBigBangAttack(p, alvo);
    if (distance(origem, alvo) - this.raioMob(alvo) > BIG_BANG_ATTACK.alcance) {
      p.charge = null;
      return;
    }
    p.facing = carga.direction = direction;
    if (this.time + 1e-9 < carga.until) return;
    p.bigBangLancado = { started: this.time, direction };
    this.projectiles.push({ id: this.uid('s'), kind: 'bigBangAttack', ownerType: 'player', owner: p.id,
      planet: p.planet, area: p.area, targetId: alvo.id, ...origem, dx: direction.x, dy: direction.y, direcaoLancamento: direction,
      started: this.time, speed: BIG_BANG_ATTACK.velocidade, restante: BIG_BANG_ATTACK.alcance,
      damage: p.stats.attack * BIG_BANG_ATTACK.dano, ttl: 1 });
    p.charge = null;
  }
  atualizarBigBangAttack(s, dt) {
    const p = this.players.get(s.owner);
    if (!p?.connected || p.hp <= 0 || !this.mesmoLugar(p, s) || naZonaSegura(p)) {
      s.ttl = 0;
      return;
    }
    if (s.impactoEm !== undefined) {
      if (this.time - s.impactoEm >= BIG_BANG_ATTACK.impacto) s.ttl = 0;
      return;
    }
    const alvo = this.mobs.get(s.targetId);
    if (!formaBigBangAttack(p.forma) || !this.alvoValidoBigBangAttack(s, alvo)) {
      s.ttl = 0;
      return;
    }
    const direcao = norm(alvo.x - s.x, alvo.y - s.y);
    s.dx = direcao.x; s.dy = direcao.y;
    const contato = contatoFinalFlash(s, direcao, alvo, this.raioMob(alvo));
    s.pesAlvo = { x: alvo.x, y: alvo.y };
    const passo = Math.min(contato, s.restante, s.started === this.time ? 0 : s.speed * dt);
    s.x += s.dx * passo; s.y += s.dy * passo;
    s.restante -= passo;
    if (contato <= passo) {
      if (this.hit(p, alvo, s.damage)) {
        s.impactoEm = this.time;
      } else s.ttl = 0;
    } else if (s.restante <= 1e-9) s.ttl = 0;
    // Limite da previsão visual entre snapshots. O cliente só renderiza esse percurso.
    s.distanciaAteContato = Math.max(0, contato - passo);
    s.avancoVisual = Math.min(s.restante, s.distanciaAteContato);
  }
  alvoValidoFinalFlash(p, alvo) {
    return alvo?.hp > 0 && this.mesmoLugar(p, alvo) && !naZonaSegura(alvo)
      && distance(p, alvo) - this.raioMob(alvo) <= FINAL_FLASH.alcance + FINAL_FLASH.mao;
  }
  iniciarFinalFlash(p, automated) {
    const falha = motivo => automated ? { ok: false } : this.reject(p, motivo);
    if (p.vocacao !== 'vegeta') return falha('O Final Flash é exclusivo do Vegeta.');
    if (p.level < FINAL_FLASH.nivel) return falha('Final Flash libera no nível ' + FINAL_FLASH.nivel + '.');
    if (!formaFinalFlash(p.forma)) return falha('Final Flash requer Super Saiyajin ou superior.');
    if (p.charge || p.finalFlashAtivo || this.time < p.finalFlashReady || p.ki < FINAL_FLASH.custo)
      return falha('Final Flash em recarga, outra conjuração ativa ou Ki insuficiente.');
    const alvo = this.mobs.get(p.targetId);
    if (!this.alvoValidoFinalFlash(p, alvo)) return falha('Selecione um mob vivo dentro do alcance do Final Flash.');
    p.facing = this.direcaoFinalFlash(p, alvo);
    p.moving = false;
    p.ki -= FINAL_FLASH.custo;
    p.finalFlashReady = this.time + this.recarga(p, FINAL_FLASH.recarga);
    p.charge = { finalFlash: true, targetId: alvo.id, direction: p.facing,
      started: this.time, until: this.time + FINAL_FLASH.carga, automated };
    return { ok: true };
  }
  direcaoFinalFlash(p, alvo) {
    return p.x === alvo.x && p.y === alvo.y ? p.facing : norm(alvo.x - p.x, alvo.y - p.y);
  }
  atualizarCargaFinalFlash(p) {
    const carga = p.charge, alvo = this.mobs.get(carga.targetId);
    if (naZonaSegura(p) || !formaFinalFlash(p.forma) || !this.alvoValidoFinalFlash(p, alvo)) {
      p.charge = null;
      return;
    }
    p.facing = carga.direction = this.direcaoFinalFlash(p, alvo);
    if (this.time < carga.until) return;
    const ateContato = Math.max(0, distance(p, alvo) - this.raioMob(alvo));
    const origem = origemFinalFlash(p, carga.direction, ateContato);
    const efeito = { id: this.uid('k'), owner: p.id, planet: p.planet, area: p.area, ...origem,
      finalFlash: true, targetId: alvo.id, direction: carga.direction, started: this.time,
      emissor: { x: p.x, y: p.y },
      distanciaPrevista: FINAL_FLASH.alcance, damage: p.stats.attack * FINAL_FLASH.dano };
    this.kamehamehas.push(efeito);
    p.finalFlashAtivo = efeito;
    p.charge = null;
  }
  atualizarFinalFlash(efeito, p) {
    if (!p?.connected || p.hp <= 0 || !this.mesmoLugar(p, efeito) || naZonaSegura(p)) return false;
    if (efeito.impacto) return this.time - efeito.impacto.started < FINAL_FLASH.impactoQuadros * FINAL_FLASH.impactoQuadro;
    const alvo = this.mobs.get(efeito.targetId);
    if (!formaFinalFlash(p.forma) || !this.alvoValidoFinalFlash(p, alvo)) return false;
    const raio = this.raioMob(alvo);
    const ateContato = Math.max(0, distance(efeito.emissor, alvo) - raio);
    efeito.direction = p.facing = this.direcaoFinalFlash(p, alvo);
    Object.assign(efeito, origemFinalFlash(efeito.emissor, efeito.direction, ateContato));
    const distancia = contatoFinalFlash(efeito, efeito.direction, alvo, raio);
    const alcanceAtual = Math.max(0, this.time - efeito.started) * FINAL_FLASH.velocidade;
    efeito.distanciaPrevista = distancia;
    efeito.pesAlvoPrevisto = { x: alvo.x, y: alvo.y };
    if (alcanceAtual < distancia) return true;
    if (!this.hit(p, alvo, efeito.damage)) return false;
    efeito.impacto = {
      x: efeito.x + efeito.direction.x * distancia, y: efeito.y + efeito.direction.y * distancia,
      pesAlvo: efeito.pesAlvoPrevisto, distancia, started: this.time
    };
    return true;
  }
  atualizarKamehamehas() {
    this.kamehamehas = this.kamehamehas.filter(k => {
      const p = this.players.get(k.owner);
      if (k.galick) return this.atualizarGalick(k, p);
      if (k.finalFlash) {
        const manter = this.atualizarFinalFlash(k, p);
        if (p?.finalFlashAtivo === k && (!manter || k.impacto && this.time - k.impacto.started >= FINAL_FLASH.sustentacao))
          p.finalFlashAtivo = null;
        return manter;
      }
      const g = geometriaKame(k.nivel, this.time - k.started);
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
  alvoDoCombate(id) {
    const clone = this.combateBoo.clones.get(id);
    return this.players.get(id) || (this.combateBoo.cloneAtivo(clone) ? clone : null);
  }
  *alvosDosMobs() {
    yield* this.players.values();
    for (const c of this.combateBoo.clones.values()) if (this.combateBoo.cloneAtivo(c)) yield c;
  }
  alvoDoMob(m) {
    const valido = p => p && p.connected && p.hp > 0 && this.mesmoLugar(p, m) && this.podeEnfrentarMob(p, m) && !this.protegido(p);
    // Esquece quem não vale mais, ou quem está longe sem bater há 6 s.
    if (m.ameaca) for (const [id, a] of m.ameaca) {
      const p = this.alvoDoCombate(id);
      if (!valido(p) || (distance(p, m) > m.aggro * 2 && this.time - a.em > 6)) m.ameaca.delete(id);
    }
    // Agressivo: quem entra no raio ganha ameaça mínima (proximidade), para o mob notar e perseguir.
    if (m.agressivo) for (const p of this.alvosDosMobs()) {
      if (valido(p) && distance(p, m) < m.aggro && !m.ameaca?.has(p.id)) this.somarAmeaca(m, p, 1);
    }
    if (!m.ameaca?.size) return null;
    let melhor = null, maior = -1;
    for (const [id, a] of m.ameaca) if (a.valor > maior) { maior = a.valor; melhor = this.alvoDoCombate(id); }
    const atual = this.alvoDoCombate(m.alvoId), aAtual = m.ameaca.get(m.alvoId);
    if (atual && aAtual && melhor !== atual && maior < aAtual.valor * 1.2) melhor = atual;
    if (this.combateBoo.clones.size) melhor = this.combateBoo.preferirClone(m, melhor);
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
  dispararProjetilMob(m, alvoId, extra = null) {
    const alvo=this.alvoDoCombate(alvoId),config=m.projetil;
    if(!config || !alvo?.connected || alvo.hp<=0 || !this.mesmoLugar(m,alvo) || this.protegido(alvo))return false;
    if(!(config.velocidade>0) || !Number.isFinite(config.velocidade))return false;
    this.projectiles.push({id:this.uid('s'),kind:'mobKiTarget',owner:m.id,ownerType:'mob',alvoId:alvo.id,
      planet:m.planet,area:m.area,...iniciarVooTarget(m,alvo,extra?.speed?{...config,velocidade:extra.speed}:config,this.time),...(extra?{visual:extra.visual,damage:extra.damage}:{})});
    return true;
  }
  // Saga do Cell: cada personagem que está na etapa de um chefe e entra na área dele encontra o próprio chefe
  // (Cell Semiperfeito / Cell Perfeito), num ponto livre a uma distância fixa da chegada. Chefe pessoal de quem saiu,
  // desconectou ou mudou de etapa some. Roda uma vez por segundo.
  sincronizarChefesPessoais() {
    if (this.time < (this.proximaSincroniaSaga || 0)) return; this.proximaSincroniaSaga = this.time + 1;
    const pessoais = [...this.mobs.values()].filter(m => m.dono);
    for (const m of pessoais) {
      const p = this.players.get(m.dono), c = p && p.connected ? chefePendente(p) : null;
      if (!c || c.type !== m.type || c.area !== m.area) this.mobs.delete(m.id);
    }
    for (const p of this.players.values()) {
      const c = p.connected && p.hp > 0 ? chefePendente(p) : null;
      if (!c || p.area !== c.area || pessoais.some(m => m.dono === p.id && this.mobs.has(m.id))) continue;
      const pt = this.pontoDoChefeDaSaga(c);
      const m = this.addMob(c.type, pt.x, pt.y, c.area); m.dono = p.id; m.homeX = m.x; m.homeY = m.y;
      const lado = Math.abs(m.x - p.x) > Math.abs(m.y - p.y) ? (m.x > p.x ? 'à direita' : 'à esquerda') : (m.y > p.y ? 'abaixo' : 'acima');
      this.notify(p, m.name + (c.type === 'cellPerfeito' ? ' espera por você na arena do laboratório, ' : ' apareceu, ') + lado + ' de você! Só você pode enfrentá-lo.');
    }
  }
  // Ponto do chefe pessoal: chão livre e alcançável a `distancia` da chegada (o primeiro achado numa volta em espiral).
  pontoDoChefeDaSaga(c) {
    this.pontosSaga ||= new Map(); const chave = c.type + ':' + c.area;
    if (this.pontosSaga.has(chave)) return this.pontosSaga.get(chave);
    const z = areaPorId(c.area); let pt = null;
    for (let r = c.distancia; r <= c.distancia + 1200 && !pt; r += 60) for (let i = 0; i < 36 && !pt; i++) {
      const a = i * Math.PI / 18, x = z.chegada.x + Math.cos(a) * r, y = z.chegada.y + Math.sin(a) * r;
      if (pesLivres(z.planet, x, y, 40, c.area) && !naZonaSegura({ planet: z.planet, area: c.area, x, y })) {
        const caminho = caminhoPorTerra(z.planet, z.chegada, { x, y }, c.area); if (caminho) pt = { x, y };
      }
    }
    pt ||= pontoDeSpawnForaDaSafeZone(c.area, z.chegada); this.pontosSaga.set(chave, pt); return pt;
  }
  updateMob(m, dt) {
    m.moving = false;
    if (m.hp <= 0) { if (this.time >= m.deadUntil) { m.hp = m.maxHp; if (m.raro) { const pt = pontoNoCirculo(this.random, m.area); m.homeX = pt.x; m.homeY = pt.y; this.anunciarChefe(m); } const nascimento = pontoDeSpawnForaDaSafeZone(m.area, { x: m.homeX, y: m.homeY }); m.homeX = nascimento.x; m.homeY = nascimento.y; m.x = m.homeX; m.y = m.homeY; m.attackReady = this.time + 1; if (m.type === 'freezaBoss') this.formaFreeza(m, 'pe'); m.strike = null; } return; }
    if (m.chocolate?.until > this.time) return;
    if (m.chocolate) m.chocolate = null;
    // Chefe e subchefe: golpe de área maior, aviso mais longo e alcance maior.
    const grande = CHEFES.has(m.type);
    const casa = { x: m.homeX, y: m.homeY }, longeDeCasa = distance(m, casa);
    // Passou do limite de perseguição: larga o alvo e volta para casa; ao chegar, recupera a vida.
    if (!m.voltando && longeDeCasa > m.perseguicao) { m.voltando = true; m.ameaca = null; m.alvoId = null; }
    if (m.voltando && longeDeCasa < 40) { m.voltando = false; m.hp = m.maxHp; }
    const target = m.voltando ? null : this.alvoDoMob(m), closest = target ? distance(target, m) : Infinity;
    // Freeza: a Supernova segue o alvo durante a carga e o voo (o turno dele roda depois do telegrafo).
    // Oozaru Dourado: a bola acompanha o alvo na carga e no voo (mira o personagem); na carga ele gira junto.
    if (m.type === 'oozaruDourado' && m.telegraph?.kind === 'bolaNegra') { const a = this.alvoDoCombate(m.telegraph.alvoId); if (a && a.hp > 0 && a.connected && this.mesmoLugar(a, m)) { m.telegraph.tx = a.x; m.telegraph.ty = a.y; m.facing = norm(a.x - m.x, a.y - m.y); if (m.strike) m.strike.direction = m.facing; } }
    if (m.type === 'freezaBoss' && m.telegraph?.kind === 'supernova') { const a = this.alvoDoCombate(m.telegraph.alvoId); if (a && a.hp > 0 && a.connected && this.mesmoLugar(a, m)) { m.telegraph.x = a.x; m.telegraph.y = a.y; } }
    if (m.telegraph) {
      if (this.time >= m.telegraph.until) {
        const t = m.telegraph;
        if (t.kind === 'shot' && t.kame) this.dispararProjetilMob(m, t.alvoId, { visual: 'kameCell', damage: m.attack * CELL_PERFEITO.kameDano, speed: CELL_PERFEITO.kameVelocidade });
        else if (t.kind === 'shot' && !t.beam) this.dispararProjetilMob(m,t.alvoId);
        else if (t.kind === 'shot') this.projectiles.push({ id: this.uid('s'), x: m.x, y: m.y, planet: m.planet, area: m.area, dx: t.dx, dy: t.dy, speed: t.beam ? FREEZA.beamVelocidade : 250, owner: m.id, ownerType: 'mob', damage: m.attack * (t.dano || 1), ttl: t.beam ? 0.75 : 2, kind: t.kame ? 'kameCell' : t.beam ? 'deathbeam' : undefined });
        else if (t.kind === 'bolaNegra') {   // a bola chega no alvo e explode em área pequena
          for (const p of this.alvosDosMobs()) if (p.connected && p.hp > 0 && this.mesmoLugar(p, m) && Math.hypot(p.x - t.tx, p.y - t.ty) < t.radius) this.hit(m, p, m.attack * (t.dano || 1.4));
          this.emit('bolaNegra', { x: t.tx, y: t.ty, radius: t.radius, planet: m.planet, area: m.area });
        } else if (t.kind === 'pancada') {
          for (const p of this.alvosDosMobs()) if (p.connected && p.hp > 0 && this.mesmoLugar(p, m) && Math.hypot(p.x - t.x, p.y - t.y) < t.radius) this.hit(m, p, m.attack * 1.3);
          this.emit('pancada', { x: t.x, y: t.y, radius: t.radius, planet: m.planet, area: m.area });
        }
        else if (t.kind === 'absorcao') {   // C20: suga vida e Ki de quem ainda está ao alcance da mão e se cura com isso
          const a = this.players.get(t.alvoId);
          if (a && a.connected && a.hp > 0 && this.mesmoLugar(a, m) && distance(a, m) <= t.radius + (m.corpo || 0)) {
            const antes = a.hp; this.hit(m, a, m.attack * ABSORCAO_C20.dano);
            const ki = Math.min(a.ki, a.stats.ki * ABSORCAO_C20.ki); a.ki -= ki;
            const cura = Math.round((antes - a.hp) * ABSORCAO_C20.cura + ki);
            if (cura > 0) { m.hp = Math.min(m.maxHp, m.hp + cura); this.emit('heal', { x: m.x, y: m.y - 40, amount: cura, targetId: m.id }); }
            this.notify(a, 'O C20 absorveu sua energia!');
          }
        }
        else if (t.kind === 'supernova') {
          for (const p of this.alvosDosMobs()) if (p.connected && p.hp > 0 && this.mesmoLugar(p, m) && Math.hypot(p.x - t.x, p.y - t.y) < t.radius) this.hit(m, p, m.attack * 1.6);
          this.emit('supernova', { x: t.x, y: t.y, radius: t.radius, planet: m.planet, area: m.area });
        }
        else for (const p of this.alvosDosMobs()) if (p.connected && p.hp > 0 && this.mesmoLugar(p, m) && Math.hypot(p.x - t.x, p.y - t.y) < t.radius) this.hit(m, p, m.attack);
        m.telegraph = null; m.attackReady = this.time + (t.kind === 'shot' && !t.beam ? m.projetil?.cooldown ?? 0.95 : m.type === 'cellSemiperfeito' && t.kind === 'bolaNegra' ? 1.2 : m.type === 'oozaruDourado' ? OOZARU_DOURADO.bolaRecarga : m.type === 'freezaBoss' ? (m.forma === 'nave' ? FREEZA.novaRecarga : 1.6) : grande ? 1.5 : 0.95);
      }
      return;
    }
    if (m.type === 'freezaBoss' && this.turnoFreeza(m, target, closest, dt)) return;
    if (m.type === 'oozaruDourado' && this.turnoOozaruDourado(m, target, closest, dt)) return;
    if (!target) {
      if (longeDeCasa > 10) this.steer(m, casa, dt, m.voltando ? m.speed * 1.25 : m.speed);
      return;
    }
    // Cell Perfeito (Pedro, 26/11/2026): uma vez, abaixo de 30% da vida, para e se regenera (recupera parte da vida, como
    // no anime); de tempos em tempos dispara o Kamehameha, um raio forte na direção do alvo com aviso antes (como o
    // Death Beam do Freeza). Rajada Dourada é o tiro comum; soco de perto. Números PROVISÓRIOS em CELL_PERFEITO.
    if (m.type === 'cellPerfeito') {
      const C = CELL_PERFEITO;
      if (m.regenerando) { if (this.time >= m.regenerando) { m.regenerando = 0; m.hp = Math.min(m.maxHp, m.hp + m.maxHp * C.regeneraFracao); this.emit('heal', { x: m.x, y: m.y - 40, amount: Math.round(m.maxHp * C.regeneraFracao), targetId: m.id }); } return; }
      if (!m.regenerou && m.hp <= m.maxHp * C.regeneraAbaixo) {
        m.regenerou = true; m.regenerando = this.time + C.regeneraTempo; m.telegraph = null;
        m.strike = { started: this.time, release: m.regenerando, until: m.regenerando + 0.3, direction: m.facing, kind: 'regeneracao' };
        for (const p of this.players.values()) if (p.connected && this.mesmoLugar(p, m)) this.notify(p, 'O Cell Perfeito está se regenerando!');
        return;
      }
      if (closest > 120 && closest <= C.kameAlcance && this.time >= m.attackReady && this.time >= (m.kameReady || 0)) {
        m.facing = norm(target.x - m.x, target.y - m.y); m.kameReady = this.time + C.kameRecarga;
        // Skill TARGET (Pedro, 26/11): o Kamehameha persegue o alvo e acerta, como a rajada de ki dos mobs.
        m.telegraph = { kind: 'shot', kame: true, alvoId: target.id, x: m.x, y: m.y, dx: m.facing.x, dy: m.facing.y, until: this.time + C.kameAviso, started: this.time, radius: 30 };
        m.strike = { started: this.time, release: m.telegraph.until, until: m.telegraph.until + 0.4, direction: m.facing, kind: 'kameCell' };
        return;
      }
    }
    // Cell Semiperfeito (Pedro, 26/11/2026): carrega uma bola de energia na ponta da cauda e lança no alvo; ela voa até
    // onde ele está (a mira o acompanha) e explode numa área pequena. Mesmo mecanismo da bola negra do Oozaru Dourado.
    if (m.type === 'cellSemiperfeito' && closest <= BOLA_CAUDA.alcance && this.time >= m.attackReady && this.time >= (m.caudaReady || 0)) {
      m.facing = norm(target.x - m.x, target.y - m.y); m.caudaReady = this.time + BOLA_CAUDA.recarga;
      m.telegraph = { kind: 'bolaNegra', alvoId: target.id, x: m.x, y: m.y, tx: target.x, ty: target.y, radius: BOLA_CAUDA.raio,
        started: this.time, lanca: this.time + BOLA_CAUDA.carga, until: this.time + BOLA_CAUDA.carga + BOLA_CAUDA.voo, dano: BOLA_CAUDA.dano };
      m.strike = { started: this.time, release: m.telegraph.lanca, until: m.telegraph.lanca + 0.4, direction: m.facing, kind: 'cauda' };
      return;
    }
    // C20 (Saga do Cell): de tempos em tempos agarra quem está perto e suga a energia (folha de absorção, Pedro 25/11/2026).
    if (m.type === 'c20' && target && this.players.has(target.id) && closest <= ABSORCAO_C20.alcance + (m.corpo || 0) && this.time >= m.attackReady && this.time >= (m.absorcaoReady || 0)) {
      m.facing = norm(target.x - m.x, target.y - m.y); m.absorcaoReady = this.time + ABSORCAO_C20.recarga;
      m.telegraph = { kind: 'absorcao', alvoId: target.id, x: m.x, y: m.y, radius: ABSORCAO_C20.alcance, started: this.time, until: this.time + ABSORCAO_C20.aviso };
      m.strike = { started: this.time, release: m.telegraph.until, until: m.telegraph.until + 0.32, direction: m.facing, kind: 'absorcao' };
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
    this.sincronizarChefesPessoais();
    this.combateBoo.atualizarEfeitos(dt);
    this.combateBoo.atualizarClones(dt);
    for (const m of this.mobs.values()) this.updateMob(m, dt);
    this.separarMobs();
    this.atualizarGenkis(dt);
    this.atualizarRyukens(dt);
    for (const s of this.projectiles) {
      if (s.kind === 'genki' || s.kind === 'ryuken') continue;
      if (s.kind === 'chocolateBeam') { this.atualizarRaioChocolate(s, dt); continue; }
      if (s.kind === 'bigBangAttack') { this.atualizarBigBangAttack(s, dt); continue; }
      if (s.kind === 'mobKiTarget') {
        const alvo=this.alvoDoCombate(s.alvoId),dono=this.mobs.get(s.owner);
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
      const targets = s.ownerType === 'player' ? [...this.mobs.values(), ...this.players.values()] : [...this.alvosDosMobs()];
      const locais = targets
        .filter(t => t.id !== owner.id && this.mesmoLugar(s, t) && (!this.players.has(t.id) || t.connected));
      for (const t of locais) {
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
  snapshot(id, saldoPremium = 0) {
    const self = this.players.get(id);
    // Mantém o layout dos espaços da mochila coerente com os totais (loot/uso/compra mudam o estoque por fora).
    if (self) reconciliarSlots(self);
    // Cada jogador só recebe o lugar onde está (planeta + área): os outros lugares não existem para ele.
    const here = self || { planet: 'terra', area: null }, aqui = e => this.mesmoLugar(here, e);
    return { time: this.time, selfId: id, planet: here.planet, area: here.area || null,
      ...this.combateBoo.snapshot(here),
      players: [...this.players.values()].filter(p => p.connected && aqui(p)).map(p => ({
        id: p.id, name: p.name, character: p.character, vocacao: p.vocacao, x: p.x, y: p.y, hp: p.hp, maxHp: p.stats.hp, ki: p.ki, maxKi: p.stats.ki,
        montaria:p.montaria,montariaPreferida:p.montariaPreferida,skin:p.skin,level: p.level, moving: p.moving, facing: p.facing, forma: p.forma, transformed: p.transformed,
        barrier: Number.isFinite(p.barrierStarted) ? { started: p.barrierStarted, until: p.barrierUntil } : null,
        heal: Number.isFinite(p.healStarted) ? { started: p.healStarted } : null,
        genkiLancado: Number.isFinite(p.genkiLancado) && p.hp > 0 && !naZonaSegura(p) && this.time-p.genkiLancado < .35 ? p.genkiLancado : null,
        ryuken: p.ryuken ? { started: p.ryuken.started, until: p.ryuken.until, direction: p.ryuken.direction } : null,
        ryukenLancado: Number.isFinite(p.ryukenLancado) ? p.ryukenLancado : null,
        // Enquanto o dragão voa, o Goku segura o soco (a pose não volta antes do impacto).
        ryukenVoando: this.projectiles.some(s => s.kind === 'ryuken' && s.ttl > 0 && s.owner === p.id),
        genkiDirecao: p.genkiDirecao || null,
        bigBangLancado: p.bigBangLancado && this.time - p.bigBangLancado.started < BIG_BANG_ATTACK.poseDisparo ? p.bigBangLancado : null,
        chocolateLancado: p.hp > 0 && !naZonaSegura(p) && p.chocolateLancado && this.time - p.chocolateLancado.started < .24 ? p.chocolateLancado : null,
        booLancado: p.hp > 0 && p.booLancado && this.time - p.booLancado.started < .32 ? p.booLancado : null,
        charge: p.charge, dashing: this.time < p.dashUntil, dead: p.hp <= 0 })),
      self: self ? { name:self.name,character:self.character,vocacao:self.vocacao,montaria:self.montaria,montariaPreferida:self.montariaPreferida,huntAnalyzer:resumoHunt(self), perfil:perfilPersonagem(self,this.time,this.agora()),preferencias:self.preferencias,missoes:listarMissoes(self,this.agora()),missaoAcompanhada:self.missoes.acompanhada,guildasRevisao:this.guildas.revisao,guildasPendentes:[...this.guildas.lista.values()].reduce((n,g)=>n+(g.convites.includes(self.mercadoId)?1:0)+(g.membros.some(m=>m.id===self.mercadoId&&m.cargo!=='membro')?g.solicitacoes.length:0),0),
        naZonaSegura: naZonaSegura(self), planet: self.planet, area: self.area || null, seguroRemaining: Math.max(0, self.seguroAte - this.time), level: self.level,
        xp: self.level >= CONFIG.progression.nivelMaximo ? 0 : self.xp,
        xpNext: self.level >= CONFIG.progression.nivelMaximo ? 0 : xpForLevel(self.level), stats: self.stats,
        hotkeysConsumiveis:{...self.hotkeysConsumiveis},barraTecnicas:[...self.barraTecnicas],hp: self.hp, ki: self.ki, zeni: self.zeni, inventory: self.inventory, equipamentos: self.equipamentos, slots: self.slots, weight: bagWeight(self.inventory), extensorRestante: self.bonusPremium.extensores[self.equipamentos.mochila] ?? 0,
        autoAttack: self.autoAttack, autoSkills: self.autoSkills, autoHunt: self.autoHunt, comboAutoHunt: self.comboAutoHunt,
        autoHeal: self.autoHeal, healThreshold: self.healThreshold,
        kiThreshold: self.kiThreshold, energyPotionThreshold: self.energyPotionThreshold, seedThreshold: self.seedThreshold,
        cura: { ...curaPorNivel(self.level), cooldown: CURA.cooldown, remaining: Math.max(0, self.healReady - this.time) },
        autoFood: self.autoFood, autoKi: self.autoKi, autoEnergyPotion: self.autoEnergyPotion, autoSeed: self.autoSeed, targetId: self.targetId,
        foodId: self.foodId, foodRemaining: Math.max(0, self.foodUntil - this.time), seedRemaining: Math.max(0, self.seedReady - this.time),
        kiRemaining: Math.max(0, self.kiReady - this.time), shotRemaining: Math.max(0, self.shotReady - this.time), basicRemaining: Math.max(0, self.basicReady - this.time), seedSelected: self.seedSelected,
        ...Object.fromEntries(Object.keys(TECNICAS_BOO).map(id => [id + 'Remaining', Math.max(0, (self[id + 'Ready'] || 0) - this.time)])),
        chocolateBeamRemaining: Math.max(0, self.chocolateBeamReady - this.time),
        kameRemaining: Math.max(0, self.kameReady - this.time), galickRemaining: Math.max(0, (self.galickReady || 0) - this.time), finalFlashRemaining: Math.max(0, self.finalFlashReady - this.time), bigBangAttackRemaining: Math.max(0, self.bigBangAttackReady - this.time), galickVersao: self.vocacao === 'vegeta' ? estagioGalick(self.level)?.versao ?? null : null, superKameRemaining: Math.max(0, (self.superKameReady || 0) - this.time), dashRemaining: Math.max(0, self.dashReady - this.time),
        kaiokenRemaining: 0, kaiokenActive: self.forma === 'kaioken', forma: self.forma,
        barrierRemaining: Math.max(0, self.barrierReady - this.time), barrierActive: this.time < self.barrierUntil,
        genkiRemaining: Math.max(0, self.genkiReady - this.time), transformRemaining: self.forma === 'gogeta' ? Math.max(0, self.formaAte - this.time) : 0,
        ryukenRemaining: Math.max(0, (self.ryukenReady || 0) - this.time),
        novidades: self.novidades.map(n => ({...n})), mercado:{...this.mercado.resumo(self),saldoPremium,pertoDoMercador:Boolean(mercadorPerto(self)),entregasPremium:{...self.entregasPremium},extensores:{...self.bonusPremium.extensores}},
        transformed: self.transformed, kills: self.kills, bossKills: self.bossKills, godmode: !!self.godmode,
        beneficiosDeTeste:this.beneficiosDeTeste, godmodeOptions:{...self.godmodeOptions}, godmodeLevelMax:CONFIG.progression.nivelMaximo,
        penalidadeMorte: self.hp <= 0 ? self.penalidadeMorte ?? null : null,
        respawnRemaining: Math.max(0, self.respawnAt - this.time) } : null,
      mobs: [...this.mobs.values()].filter(m => m.hp > 0 && aqui(m) && this.podeEnfrentarMob(self, m)).map(m => ({ id: m.id, type: m.type, area: m.area, name: m.name, x: m.x, y: m.y, hp: m.hp, maxHp: m.maxHp, moving: m.moving, facing: m.facing, telegraph: m.telegraph, strike: m.strike && this.time < m.strike.until ? m.strike : null, forma: m.forma, transicao: m.transicao, chocolate: m.chocolate?.until > this.time ? m.chocolate : null, raioContato: Math.max(19, this.raioMob(m)) })),
      kamehamehas: this.kamehamehas.filter(aqui).map(({ atingidos, damage, ...k }) => k),
      genkiCharges: this.genkiCharges.filter(aqui).map(({ damage, ...g }) => g),
      genkiExplosions: this.genkiExplosions.filter(aqui),
      ryukenExplosoes: this.ryukenExplosoes.filter(aqui),
      projectiles: this.projectiles.filter(aqui), loot: this.loot.filter(aqui), events: this.events.filter(e => (!e.playerId || e.playerId === id || e.type !== 'message') && (!e.planet || aqui(e))) };
  }
}
