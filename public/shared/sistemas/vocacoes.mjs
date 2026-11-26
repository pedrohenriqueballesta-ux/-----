const ganhoMobilidade = n => Math.round(200 * n / (n + 100));
// Catálogo de personagens/vocações implementados. Novas entradas são adicionadas quando
// houver uma vocação jogável completa; não criar placeholders para personagens planejados.
const atributosGoku = level => {
  const n = Math.max(0, level - 1);
  return { hp: 120 + n * 22, ki: 80 + n * 10, attack: 12 + n * 2.8,
    defense: 2 + n * 0.65, healing: 1 + n * 0.08, capacity: 20 + n * 1.3,
    lootChance: Math.min(0.8, 0.35 + n * 0.008), mobility: 175 + ganhoMobilidade(n) };
};
const atributosVegeta = level => {
  const n = Math.max(0, level - 1);
  return { hp: 112 + n * 21, ki: 88 + n * 11, attack: 14 + n * 3, defense: 2 + n * 0.6, healing: 1 + n * 0.08,
    capacity: 20 + n * 1.3, lootChance: Math.min(0.8, 0.33 + n * 0.008), mobility: 175 + ganhoMobilidade(n) };
};

// Valores iniciais de teste para a vocação voltada à sobrevivência.
const atributosBoo = level => {
  const n = Math.max(0, level - 1);
  return { hp: 135 + n * 25, ki: 85 + n * 10, attack: 11 + n * 2.65,
    defense: 3 + n * 0.7, healing: 1.1 + n * 0.085, capacity: 20 + n * 1.3,
    lootChance: Math.min(0.8, 0.34 + n * 0.008), mobility: 170 + ganhoMobilidade(n) };
};

export const VOCACOES = Object.freeze({
  goku: Object.freeze({ id: 'goku', nome: 'Goku', personagem: 'Goku', sprite: 'goku', atributos: atributosGoku }),
  vegeta: Object.freeze({ id: 'vegeta', nome: 'Vegeta', personagem: 'Vegeta', sprite: 'vegeta', atributos: atributosVegeta }),
  boo: Object.freeze({ id: 'boo', nome: 'Majin Boo', personagem: 'Majin Boo', sprite: 'boo', atributos: atributosBoo })
});

export function vocacaoDoPersonagem(valor) {
  const chave = String(typeof valor === 'object' && valor ? valor.vocacao || valor.character || 'goku' : valor || 'goku')
    .toLocaleLowerCase('pt-BR');
  return Object.hasOwn(VOCACOES, chave) ? VOCACOES[chave] : VOCACOES.goku;
}
