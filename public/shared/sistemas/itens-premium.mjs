export const DURACAO_EXTENSOR = 8 * 3600;

const itemPremium = (id, nome, preco, peso, descricao, efeito) => Object.freeze({
  id, nome, preco, peso, descricao, tipo: 'consumivel', raridade: 'store', negociavel: true,
  icone: '/assets/premium/catalogo/' + id + '.png', ...efeito
});

export const ITENS_PREMIUM = Object.freeze(Object.fromEntries([
  ...[[10, 80], [15, 120], [20, 160]].map(([percentual, preco]) => itemPremium(
    'pocao-xp-' + percentual, 'Poção de XP · +' + percentual + '%', preco, 0.2,
    'Use pela mochila para ganhar XP extra durante 8 horas dentro das hunts. Uma poção ativa por personagem. Soma com o VIP.',
    { bonusXp: percentual }
  )),
  ...[[10, 200], [20, 350]].map(([percentual, preco]) => itemPremium(
    'extensor-mochila-' + percentual, 'Extensor de mochila · +' + percentual + '%', preco, 0.3,
    'Equipe no encaixe de mochila para aumentar a capacidade de peso por 8 horas de uso.',
    { bonusCapacidade: percentual, tipo: 'equipamento', slot: 'mochila', nivel: 1 }
  ))
].map(item => [item.id, item])));
