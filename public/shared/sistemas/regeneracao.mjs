import { CONFIG } from '../nucleo/config.mjs';
import { efeitoComida } from '../tecnicas/consumiveis-hotkeys.mjs';

export function taxasRegeneracao(p, tempo) {
  const ativo = p.connected && p.hp > 0;
  const comida = ativo && tempo < p.foodUntil ? efeitoComida(p) : null;
  // A regeneração natural depende de repouso de combate e da forma base.
  const repouso = ativo && p.forma === 'base' && !p.autoHunt && !p.charge
    && tempo - p.shotReady > 1.5 && tempo - p.basicReady > 1.5;
  return {
    hpComida: comida?.hpPorSegundo ?? 0,
    kiComida: comida?.kiPorSegundo ?? 0,
    kiEquipamento: ativo ? p.stats.kiEquipamento ?? 0 : 0,
    kiNatural: repouso ? 4 : 0,
    drenoForma: ativo && p.forma !== 'base' && !p.godmode ? CONFIG.transformacao.drenoKi : 0
  };
}
