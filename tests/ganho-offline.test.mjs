// Confere o ganho offline: exportPlayer grava ultimoVisto + taxa da caça, e ao reentrar o
// jogador recebe uma fração da taxa pelo tempo ausente (com teto), deixando um resumo p/ a tela.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../public/shared/nucleo/game.mjs';
import { CONFIG } from '../public/shared/nucleo/config.mjs';

// Monta um save com taxa de caça conhecida e um "visto" no passado.
function saveComTaxa({ xpHora, receitaHora, haSegundos, level = 50 }) {
  // godmode:false explícito — offline é pulado em God Mode (e o ambiente pode ter DBI_GODMODE=1).
  return { name: 'Teste', vocacao: 'goku', character: 'Goku', level, mercadoId: 'cteste', godmode: false,
    taxaOffline: { xpHora, receitaHora }, ultimoVisto: Date.now() - haSegundos * 1000 };
}

test('credita fração da taxa da caça pelo tempo ausente', () => {
  const g = new Game({ populate: false });
  const p = g.addPlayer('a', 'Teste', saveComTaxa({ xpHora: 3600, receitaHora: 7200, haSegundos: 3600 })); // 1h fora
  // 1h × fração(0.5): XP = 3600*0.5=1800; Zeni = 7200*0.5=3600.
  assert.ok(p.offlineResumo, 'deixou resumo offline');
  assert.equal(p.offlineResumo.zeni, 3600);
  assert.equal(p.zeni >= 3600, true, 'creditou o zeni');
  // XP pode ter subido de nível; o resumo registra o total concedido.
  assert.equal(p.offlineResumo.xp, 1800);
});

test('respeita o teto de horas', () => {
  const g = new Game({ populate: false });
  const horasFora = CONFIG.offline.tetoHoras + 10;
  const p = g.addPlayer('b', 'Teste', saveComTaxa({ xpHora: 0, receitaHora: 3600, haSegundos: horasFora * 3600 }));
  // Zeni limitado ao teto: 3600/h × tetoHoras × fração.
  assert.equal(p.offlineResumo.zeni, Math.floor(3600 * CONFIG.offline.tetoHoras * CONFIG.offline.fracao));
  assert.equal(p.offlineResumo.teto, true);
});

test('sem taxa de caça (nunca caçou) não rende nada', () => {
  const g = new Game({ populate: false });
  const p = g.addPlayer('c', 'Teste', { name: 'Teste', vocacao: 'goku', character: 'Goku', level: 10, mercadoId: 'c', godmode: false, ultimoVisto: Date.now() - 7200 * 1000 });
  assert.equal(p.offlineResumo, undefined);
});

test('ausência curta (abaixo do mínimo) não rende', () => {
  const g = new Game({ populate: false });
  const p = g.addPlayer('d', 'Teste', saveComTaxa({ xpHora: 3600, receitaHora: 3600, haSegundos: CONFIG.offline.minimoSegundos - 5 }));
  assert.equal(p.offlineResumo, undefined);
});

test('exportPlayer grava ultimoVisto e mantém a taxa quando não houve caça nova', () => {
  const g = new Game({ populate: false });
  const taxa = { xpHora: 100, receitaHora: 200 };
  const p = g.addPlayer('e', 'Teste', { name: 'Teste', vocacao: 'goku', character: 'Goku', level: 5, mercadoId: 'c', godmode: false, taxaOffline: taxa });
  const s = g.exportPlayer(p);
  assert.equal(typeof s.ultimoVisto, 'number');
  assert.deepEqual(s.taxaOffline, taxa, 'sem caça nova, preserva a última taxa');
});
