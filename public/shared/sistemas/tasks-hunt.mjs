import { areaPorId } from '../nucleo/config.mjs';
import { mobStats } from '../nucleo/enemies.mjs';
import { AREA_ILHA, ilhaLiberada } from './saga-cell.mjs';

const objetivos = [
  ['terra-montanhas', 'estegossauro', 100, 'botas-treino'],
  ['inicial', 'inseto', 150, 'botas-brancas'],
  ['terra-descampado', 'roboMai', 200, 'bastao-magico'],
  ['vegeta-planicies', 'tsufuruGuerreiro', 250, 'calca-saiyajin'],
  ['media', 'guerreiro', 300, 'armadura-saiyajin'],
  ['terra-deserto', 'cellJr', 400, 'armadura-bardock'],
  ['vegeta-canions', 'dodoria', 500, 'calca-vegeta'],
  ['terra-ilha', 'androide18Pos', 600, 'armadura-c17'],
  ['dificil', 'porunga', 700, 'espada-z'],
  ['vegeta-floresta', 'nappa', 800, 'manoplas-fronteira'],
  ['terra-floresta', 'zarbon', 900, 'botas-batedor'],
  ['vegeta-lava', 'oozaru', 1000, 'couraca-vulcanica'],
  ['norte', 'nail', 1150, 'calca-guardiao-cratera'],
  ['terra-neve', 'androide17', 1300, 'botas-montanhista'],
  ['vegeta-cratera', 'broly', 1500, 'lamina-grande-cratera']
];

let catalogo, porArea;
export function tasksHunt() {
  if (catalogo) return catalogo;
  catalogo = Object.freeze(objetivos.map(([area, tipo, meta, item]) => {
    const zona = areaPorId(area);
    const mob = mobStats(tipo, area);
    return Object.freeze({
      id: 'task-' + area, categoria: 'task', area, tipo, meta, nivel: zona.nivel[0], nome: zona.name,
      descricao: 'Derrote ' + meta + ' inimigos do tipo ' + mob.name + ' nesta hunt.',
      recompensa: Object.freeze({
        zeni: Math.round(meta * (5 + zona.nivel[0] * .045)),
        xp: Math.round(meta * mob.xp * .15),
        itens: Object.freeze({ [item]: 1 })
      })
    });
  }));
  porArea = new Map(catalogo.map(t => [t.area, t]));
  return catalogo;
}

export function registrarAbateTask(p, mob) {
  if (p.godmode) return;
  tasksHunt();
  const task = porArea.get(mob.area);
  if (task?.tipo !== mob.type) return;
  const contagens = p.missoes.tasksAtivas;
  if (Object.hasOwn(contagens, task.id) && contagens[task.id] < task.meta) contagens[task.id]++;
}

function bloqueioTask(p, task) {
  if ((p.levelReal ?? p.level) < task.nivel) return 'Disponível a partir do nível ' + task.nivel + '.';
  if (task.area === AREA_ILHA && !ilhaLiberada(p)) return 'Libere a Ilha da Arena na Saga do Cell.';
  return null;
}

export function listarTasks(p) {
  const { tasksAtivas, resgatadas, acompanhada } = p.missoes;
  return tasksHunt().map(task => {
    const resgatada = resgatadas.includes(task.id);
    const ativa = Object.hasOwn(tasksAtivas, task.id);
    const progresso = resgatada ? task.meta : (tasksAtivas[task.id] ?? 0);
    const bloqueio = ativa || resgatada ? null : bloqueioTask(p, task);
    const estado = resgatada ? 'resgatada' : progresso >= task.meta ? 'concluida' :
      ativa ? 'andamento' : bloqueio ? 'bloqueada' : 'disponivel';
    return { ...task, progresso, estado, bloqueio, acompanhada: ativa && acompanhada === task.id };
  });
}

export function aceitarTask(p, id) {
  const task = tasksHunt().find(t => t.id === id);
  if (!task) return { ok: false, reason: 'Task indisponível.' };
  if (p.godmode) return { ok: false, reason: 'Desative o God Mode para aceitar tasks.' };
  if (p.missoes.resgatadas.includes(id) || Object.hasOwn(p.missoes.tasksAtivas, id))
    return { ok: false, reason: 'Você já aceitou esta task.' };
  const bloqueio = bloqueioTask(p, task);
  if (bloqueio) return { ok: false, reason: bloqueio };
  p.missoes.tasksAtivas[id] = 0;
  return { ok: true };
}
