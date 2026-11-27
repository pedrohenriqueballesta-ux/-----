// Consumíveis obtidos por loot. Comidas compartilham um efeito e poções compartilham a recarga.
export const CONSUMIVEIS_LOOT = Object.freeze({
  'fruta-namek': Object.freeze({ tipo: 'comida', duracao: 60, hpPorSegundo: 0, kiPorSegundo: 1 }),
  'carne-porunga': Object.freeze({ tipo: 'comida', duracao: 60, hpPorSegundo: 6, kiPorSegundo: 2 }),
  'carne-dinossauro': Object.freeze({ tipo: 'comida', duracao: 75, hpPorSegundo: 4, kiPorSegundo: 0 }),
  'carne-oozaru': Object.freeze({ tipo: 'comida', duracao: 90, hpPorSegundo: 5, kiPorSegundo: 3 }),
  'pocao-energia': Object.freeze({ tipo: 'pocao', fracaoHp: .15 })
});
