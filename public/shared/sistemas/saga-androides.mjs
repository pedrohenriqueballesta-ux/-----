// Saga dos Androides (Pedro, 26/11/2026). Primeira hunt dos androides, nas Montanhas Nevadas da Terra Selvagem:
//   1. O jogador ACEITA a task no painel de Missões; só depois disso os abates contam.
//   2. Meta de abates própria para cada androide: C16, C17 e C18 (mobs comuns da hunt).
//   3. Cumpridas as três metas, o C17 Infernal (chefe da task) aparece só para este personagem. Vencê-lo conclui a task
//      e registra o desbloqueio do Super C17 no personagem.
//   4. Super C17: chefe raro PESSOAL. Só existe para quem venceu o C17 Infernal; nasce num ponto sorteado da hunt, depois
//      de um tempo sorteado (o mesmo de chefe raro, 45–90 min), e só o dono vê e luta. Vencido, o relógio recomeça.
// Os chefes da saga são pessoais (campo `dono` do mob, Game.mesmoLugar), como os da Saga do Cell.
// QUANTIDADES, RECOMPENSAS E NÍVEIS SÃO PROVISÓRIOS (Pedro: "as quantidades ficam em aberto para o balanceamento").

export const AREA_NEVE = 'terra-neve';
export const ID_TASK_ANDROIDES = 'saga-androides-1';
export const METAS_ANDROIDES = Object.freeze({ androide18: 15, androide17: 12, androide16: 8 });
const NOMES = { androide18: 'C18', androide17: 'C17', androide16: 'C16' };
// C17 Infernal: a distância da chegada onde nasce (ponto exato em chão livre, procurado pelo Game), como o Semiperfeito.
export const CHEFE_INFERNAL = Object.freeze({ type: 'c17Infernal', area: AREA_NEVE, distancia: 240 });
// Super C17: o tempo até aparecer é o de chefe raro (o mesmo CHEFE_RARO de enemies.mjs, 45–90 min — repetido aqui
// porque importar enemies.mjs cria um ciclo de módulos; um teste garante que os dois continuam iguais);
// com o modo de teste (DBI_CHEFE_JA=1), 10 s.
export const SUPER_C17 = Object.freeze({ type: 'superC17', area: AREA_NEVE, tempo: Object.freeze({ minimo: 45 * 60, maximo: 90 * 60 }), tempoTeste: 10 });
export const MISSAO_ANDROIDES = Object.freeze({
  id: ID_TASK_ANDROIDES, categoria: 'saga', aceitar: true,
  nome: 'Os Androides · Caçada nas Montanhas Nevadas',
  descricao: 'Aceite a task e derrote C16, C17 e C18 nas Montanhas Nevadas. Depois, o C17 Infernal vem atrás de você.',
  recompensa: { zeni: 1500, xp: 1500 }
});

const inteiro = n => Number.isSafeInteger(n) && n >= 0 ? Math.min(n, 1e6) : 0;
export function restaurarSagaAndroides(v) {
  const contagens = {}; for (const k of Object.keys(METAS_ANDROIDES)) contagens[k] = inteiro(v?.contagens?.[k]);
  return { aceita: v?.aceita === true, contagens, venceuInfernal: v?.venceuInfernal === true, resgatada: v?.resgatada === true,
    superVencidos: inteiro(v?.superVencidos) };
}
const metasCumpridas = s => Object.entries(METAS_ANDROIDES).every(([k, q]) => s.contagens[k] >= q);
// O Super C17 fica liberado para o personagem que venceu o C17 Infernal.
export const superC17Liberado = p => p.sagaAndroides?.venceuInfernal === true;

// Chefe pessoal que o personagem deve encontrar agora nesta saga (ou null). O Super C17 depende do relógio, que é do Game.
export function chefeInfernalPendente(p) {
  const s = p.sagaAndroides;
  return s?.aceita && !s.venceuInfernal && metasCumpridas(s) ? CHEFE_INFERNAL : null;
}
// Abate feito pelo personagem. Devolve um texto de aviso quando algo da saga mudou.
export function registrarAbateAndroides(p, mob) {
  const s = p.sagaAndroides; if (!s || p.godmode) return null;
  if (mob.dono === p.id && mob.type === CHEFE_INFERNAL.type && chefeInfernalPendente(p)) {
    s.venceuInfernal = true;
    return 'C17 Infernal derrotado! Task concluída: resgate a recompensa. O Super C17 agora pode aparecer para você nas Montanhas Nevadas.';
  }
  if (mob.dono === p.id && mob.type === SUPER_C17.type) { s.superVencidos++; return null; }
  if (!s.aceita || s.venceuInfernal || mob.dono || mob.area !== AREA_NEVE || !(mob.type in METAS_ANDROIDES)) return null;
  if (s.contagens[mob.type] >= METAS_ANDROIDES[mob.type]) return null;
  s.contagens[mob.type]++;
  return metasCumpridas(s) ? 'Metas cumpridas! O C17 Infernal está vindo atrás de você nas Montanhas Nevadas.' : null;
}
function progresso(s) {
  const partes = Object.entries(METAS_ANDROIDES).map(([k, q]) => NOMES[k] + ' ' + Math.min(q, s.contagens[k]) + '/' + q);
  partes.push('C17 Infernal ' + (s.venceuInfernal ? 1 : 0) + '/1');
  const atual = Object.entries(METAS_ANDROIDES).reduce((n, [k, q]) => n + Math.min(q, s.contagens[k]), 0) + (s.venceuInfernal ? 1 : 0);
  return { atual, meta: Object.values(METAS_ANDROIDES).reduce((a, b) => a + b, 0) + 1, texto: partes.join(' · ') };
}
// Entrada no formato do painel de Missões (missoes.mjs).
export function listarSagaAndroides(p) {
  const s = p.sagaAndroides, pr = progresso(s);
  const estado = s.resgatada ? 'resgatada' : s.venceuInfernal ? 'concluida' : s.aceita ? 'andamento' : 'disponivel';
  const extra = s.resgatada ? ' Super C17 liberado: ele aparece de vez em quando nas Montanhas Nevadas, só para você.' : '';
  return [{ ...MISSAO_ANDROIDES, aceita: s.aceita, descricao: MISSAO_ANDROIDES.descricao + (s.aceita ? ' (' + pr.texto + ')' : '') + extra,
    progresso: Math.min(pr.atual, pr.meta), meta: pr.meta, estado }];
}
export function aceitarTaskAndroides(p) {
  const s = p.sagaAndroides; if (s.aceita) return { ok: false, reason: 'Task já aceita.' };
  s.aceita = true; return { ok: true, aviso: 'Task aceita: derrote C16, C17 e C18 nas Montanhas Nevadas.' };
}
export function entregarTaskAndroides(p) {
  const s = p.sagaAndroides;
  if (!s.venceuInfernal || s.resgatada) return { ok: false, reason: 'Missão indisponível para resgate.' };
  s.resgatada = true; return { ok: true };
}
// Segundos até o próximo Super C17 deste personagem.
export const tempoAteSuperC17 = (random, teste) => teste ? SUPER_C17.tempoTeste
  : SUPER_C17.tempo.minimo + random() * (SUPER_C17.tempo.maximo - SUPER_C17.tempo.minimo);
// Golpes especiais (Pedro, 26/11/2026, folhas enviadas): os dois são TARGET (perseguem o alvo e acertam), o padrão do jogo.
// C17 Infernal: rajadas brancas das mãos. Super C17: Shocking Death Ball, a bola vermelha carregada na mão.
// Alcance, aviso antes de soltar, recarga, multiplicador do ataque e velocidade do projétil. PROVISÓRIOS.
export const ESPECIAIS_ANDROIDES = Object.freeze({
  c17Infernal: Object.freeze({ golpe: 'rajadasBrancas', visual: 'rajadaBranca', alcance: 520, aviso: 0.6, recarga: 7, dano: 1.6, velocidade: 480 }),
  superC17: Object.freeze({ golpe: 'deathBall', visual: 'deathBall', alcance: 560, aviso: 1.0, recarga: 9, dano: 2.4, velocidade: 380 })
});
