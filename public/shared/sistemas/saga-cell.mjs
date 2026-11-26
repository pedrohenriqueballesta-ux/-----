// Saga do Cell (história e progressão do Pedro, 25/11/2026). Cadeia de tasks por personagem, na Terra Selvagem:
//   0. O bilhete: o C20 (chefe raro do Deserto das Mesas) derruba o Bilhete de Ouro do Dr. Gero (50%). Com ele na mochila,
//      a task é entregue (o bilhete é consumido) e a cadeia começa.
//   1. Os filhos do Cell: derrotar Cell Jr. e Cell Imperfeito no Deserto.
//   2. O Cell Semiperfeito aparece no Deserto, só para este personagem; vencê-lo libera a Ilha da Arena.
//   3. Ilha da Arena (trancada até aqui): derrotar C17, C18 (pós-batalha) e Cell Imperfeito; ao completar, o Cell
//      Semiperfeito reaparece na Ilha (evento único, só para este personagem); vencê-lo encerra a etapa.
//   4. O Cell Perfeito espera no Deserto (a arena do laboratório), só para este personagem. A vitória fecha a saga.
// Os chefes da cadeia são pessoais: só o dono vê, ataca e é atacado por eles (Game.mesmoLugar, campo `dono`).
// Por ora as tasks ficam no painel de Missões; depois passam para o Mestre Kame, na Kame House.
// QUANTIDADES, RECOMPENSAS E PONTOS SÃO PROVISÓRIOS (Pedro: "as quantidades ficam em aberto para o balanceamento").
export const BILHETE_LABORATORIO = 'bilhete-laboratorio';   // "Bilhete de Ouro do Dr. Gero" (nome no catálogo de itens)
// Absorção de energia do C20: alcance da mão, aviso antes de sugar, recarga, fração do ataque como dano, fração do Ki
// máximo do jogador sugada e quanto do dano vira cura. PROVISÓRIO.
export const ABSORCAO_C20 = Object.freeze({ alcance: 110, aviso: 0.9, recarga: 8, dano: 0.9, ki: 0.15, cura: 2 });
// Bola de energia da cauda do Cell Semiperfeito: alcance, carga antes de lançar, tempo de voo, raio da explosão,
// recarga e multiplicador do ataque. PROVISÓRIO.
// Cell Perfeito: Kamehameha (alcance, aviso, recarga, multiplicador) e auto-regeneração (uma vez, abaixo de 30%, recupera
// 35% da vida em 1,6 s parado). PROVISÓRIO.
export const CELL_PERFEITO = Object.freeze({ kameAlcance: 560, kameAviso: 0.8, kameRecarga: 9, kameDano: 2.2, kameVelocidade: 520, regeneraAbaixo: 0.3, regeneraFracao: 0.35, regeneraTempo: 1.6 });
export const BOLA_CAUDA = Object.freeze({ alcance: 560, carga: 1.0, voo: 0.5, raio: 70, recarga: 7, dano: 1.6 });
export const AREA_DESERTO = 'terra-deserto', AREA_ILHA = 'terra-ilha';
export const METAS_SAGA_CELL = Object.freeze({
  filhos: Object.freeze({ cellJr: 20, cellImperfeito: 10 }),
  ilha: Object.freeze({ androide17Pos: 10, androide18Pos: 10, cellImperfeito: 10 })
});
const NOMES = { cellJr: 'Cell Jr.', cellImperfeito: 'Cell Imperfeito', androide17Pos: 'C17', androide18Pos: 'C18' };
// Distância da chegada da hunt onde cada chefe pessoal nasce (o ponto exato é procurado em chão livre pelo Game).
export const CHEFES_DA_SAGA = Object.freeze({
  // Perto da chegada (logo fora da safe zone), para aparecer na tela mesmo em janela pequena (Pedro não achou a 420).
  semiDeserto: Object.freeze({ type: 'cellSemiperfeito', area: AREA_DESERTO, distancia: 220 }),
  semiIlha: Object.freeze({ type: 'cellSemiperfeito', area: AREA_ILHA, distancia: 220 }),
  perfeito: Object.freeze({ type: 'cellPerfeito', area: AREA_DESERTO, distancia: 240 })
});
const ETAPAS = [
  { id: 'saga-cell-1', nome: 'Saga do Cell · O bilhete do C20',
    descricao: 'O C20 aparece de vez em quando no Deserto das Mesas. Derrote-o e traga o Bilhete de Ouro do Dr. Gero.', recompensa: {} },
  { id: 'saga-cell-2', nome: 'Saga do Cell · Os filhos do Cell', descricao: 'Derrote os Cell Jr. e os Cell Imperfeitos do Deserto das Mesas.',
    recompensa: { zeni: 300, xp: 200 } },
  { id: 'saga-cell-3', nome: 'Saga do Cell · O Cell Semiperfeito',
    descricao: 'O Cell Semiperfeito apareceu no Deserto das Mesas. Derrote-o para liberar a Ilha da Arena.', recompensa: { zeni: 600, xp: 500 } },
  { id: 'saga-cell-4', nome: 'Saga do Cell · A Ilha da Arena',
    descricao: 'Na Ilha da Arena, derrote C17, C18 e Cell Imperfeito. Depois, enfrente o Cell Semiperfeito quando ele reaparecer.',
    recompensa: { zeni: 900, xp: 800 } },
  { id: 'saga-cell-5', nome: 'Saga do Cell · O Cell Perfeito',
    descricao: 'Volte ao Deserto das Mesas: o Cell Perfeito espera na arena do laboratório.', recompensa: { zeni: 2000, xp: 2000, itens: { seed30: 1 } } }
];
export const MISSOES_SAGA_CELL = Object.freeze(ETAPAS.map((e, i) => Object.freeze({ ...e, etapa: i, categoria: 'saga' })));

const inteiro = n => Number.isSafeInteger(n) && n >= 0 ? Math.min(n, 1e6) : 0;
export function restaurarSagaCell(v) {
  const etapa = Math.min(inteiro(v?.etapa), ETAPAS.length);
  const contagens = {}; for (const k of new Set([...Object.keys(METAS_SAGA_CELL.filhos), ...Object.keys(METAS_SAGA_CELL.ilha)])) contagens[k] = inteiro(v?.contagens?.[k]);
  return { etapa, contagens, venceu: v?.venceu === true };
}
const metasDa = etapa => etapa === 1 ? METAS_SAGA_CELL.filhos : etapa === 3 ? METAS_SAGA_CELL.ilha : null;
const areaDasContagens = etapa => etapa === 1 ? AREA_DESERTO : etapa === 3 ? AREA_ILHA : null;
const metasCumpridas = s => { const m = metasDa(s.etapa); return Boolean(m) && Object.entries(m).every(([k, q]) => s.contagens[k] >= q); };
export const ilhaLiberada = p => (p.sagaCell?.etapa ?? 0) >= 3;

// Chefe pessoal que o personagem deve encontrar agora (ou null).
export function chefePendente(p) {
  const s = p.sagaCell; if (!s || s.venceu) return null;
  if (s.etapa === 2) return CHEFES_DA_SAGA.semiDeserto;
  if (s.etapa === 3 && metasCumpridas(s)) return CHEFES_DA_SAGA.semiIlha;
  if (s.etapa === 4) return CHEFES_DA_SAGA.perfeito;
  return null;
}
// Abate feito pelo personagem. Devolve um texto de aviso quando algo da saga mudou.
export function registrarAbateSaga(p, mob) {
  const s = p.sagaCell; if (!s || p.godmode) return null;
  if (mob.dono === p.id) {
    const pendente = chefePendente(p);
    if (pendente && pendente.type === mob.type && pendente.area === mob.area) { s.venceu = true; return mob.name + ' derrotado! Fale com a missão da Saga do Cell para continuar.'; }
    return null;
  }
  const metas = metasDa(s.etapa), chave = mob.area === AREA_ILHA && mob.type === 'cellImperfeito' ? 'cellImperfeito' : mob.type;
  if (!metas || mob.area !== areaDasContagens(s.etapa) || !(chave in metas) || s.contagens[chave] >= metas[chave]) return null;
  const antes = metasCumpridas(s); s.contagens[chave]++;
  if (!antes && metasCumpridas(s)) return s.etapa === 3 ? 'O Cell Semiperfeito reapareceu na Ilha da Arena!' : 'Objetivos cumpridos! Resgate a missão da Saga do Cell.';
  return null;
}
function progresso(s, etapa, p) {
  if (etapa === 0) return { atual: Math.min(1, p.inventory?.[BILHETE_LABORATORIO] || 0), meta: 1, texto: 'Bilhete de Ouro: ' + Math.min(1, p.inventory?.[BILHETE_LABORATORIO] || 0) + '/1' };
  const metas = metasDa(etapa);
  if (metas) {
    const partes = Object.entries(metas).map(([k, q]) => NOMES[k] + ' ' + Math.min(q, s.contagens[k]) + '/' + q);
    const atual = Object.entries(metas).reduce((n, [k, q]) => n + Math.min(q, s.contagens[k]), 0) + (etapa === 3 && s.venceu ? 1 : 0);
    const meta = Object.values(metas).reduce((a, b) => a + b, 0) + (etapa === 3 ? 1 : 0);
    if (etapa === 3) partes.push('Cell Semiperfeito ' + (s.venceu ? 1 : 0) + '/1');
    return { atual, meta, texto: partes.join(' · ') };
  }
  return { atual: s.venceu ? 1 : 0, meta: 1, texto: (etapa === 2 ? 'Cell Semiperfeito' : 'Cell Perfeito') + ' ' + (s.venceu ? 1 : 0) + '/1' };
}
const concluida = (s, p) => s.etapa === 0 ? (p.inventory?.[BILHETE_LABORATORIO] || 0) >= 1
  : s.etapa === 1 ? metasCumpridas(s) : s.venceu;

// Entradas no formato do painel de Missões (missoes.mjs).
export function listarSagaCell(p) {
  const s = p.sagaCell;
  return MISSOES_SAGA_CELL.map(m => {
    const pr = m.etapa === s.etapa ? progresso(s, m.etapa, p) : { atual: m.etapa < s.etapa ? 1 : 0, meta: 1, texto: '' };
    const estado = m.etapa < s.etapa ? 'resgatada' : m.etapa > s.etapa ? 'bloqueada' : concluida(s, p) ? 'concluida' : pr.atual ? 'andamento' : 'disponivel';
    return { ...m, descricao: m.descricao + (pr.texto ? ' (' + pr.texto + ')' : ''), progresso: Math.min(pr.atual, pr.meta), meta: pr.meta, estado };
  });
}
// Entrega a etapa atual: aplica o que ela pede e avança. Recompensas são pagas pelo chamador (missoes.mjs).
export function entregarEtapaSaga(p, id) {
  const s = p.sagaCell, m = MISSOES_SAGA_CELL.find(x => x.id === id);
  if (!m || m.etapa !== s.etapa || !concluida(s, p)) return { ok: false, reason: 'Missão indisponível para resgate.' };
  if (s.etapa === 0) { p.inventory[BILHETE_LABORATORIO]--; if (!p.inventory[BILHETE_LABORATORIO]) delete p.inventory[BILHETE_LABORATORIO]; }
  s.etapa++; s.venceu = false; for (const k of Object.keys(s.contagens)) s.contagens[k] = 0;
  const aviso = s.etapa === 2 ? 'O Cell Semiperfeito apareceu no Deserto das Mesas!' : s.etapa === 3 ? 'A Ilha da Arena está liberada!'
    : s.etapa === 4 ? 'O Cell Perfeito espera por você no Deserto das Mesas.' : s.etapa === ETAPAS.length ? 'Saga do Cell concluída!' : null;
  return { ok: true, missao: m, aviso };
}
