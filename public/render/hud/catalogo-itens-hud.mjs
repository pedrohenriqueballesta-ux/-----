import { consumivelValido } from '../../shared/tecnicas/consumiveis-hotkeys.mjs';
import { RARIDADES_ITENS } from '../../shared/sistemas/catalogo-itens.mjs';
import { el, selecionar } from './hud-elementos.mjs';

const TIPOS = {
  material: 'Materiais', consumivel: 'Consumíveis', arma: 'Armas', peito: 'Armaduras',
  cabeca: 'Capacetes e bandanas', calca: 'Calças', botas: 'Botas', braco: 'Luvas e braçadeiras',
  cinto: 'Cintos e faixas', colar: 'Colares e brincos', anel: 'Anéis', mochila: 'Mochilas',
  colecionavel: 'Colecionáveis da conta'
};
const ORDENS = [['az','Nome · A–Z'], ['za','Nome · Z–A'], ['raridade','Maior raridade primeiro']];
const normalizar = texto => texto.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('pt-BR');
const compararNomes = new Intl.Collator('pt-BR', { sensitivity:'base', numeric:true }).compare;
const ordemRaridade = new Map(Object.keys(RARIDADES_ITENS).map((raridade, posicao) => [raridade, posicao]));
const tipoItem = item => item.slot ?? item.tipo ?? (consumivelValido(item.id) ? 'consumivel' : 'material');

export function filtrarItensCatalogo(itens, { busca = '', raridade = '', tipo = '', ordem = 'az' } = {}) {
  const termos = normalizar(busca.trim()).split(/\s+/);
  return itens.filter(item => {
    const categoria = tipoItem(item);
    const texto = normalizar([item.nome, item.id, TIPOS[categoria], item.categoria, RARIDADES_ITENS[item.raridade]].filter(Boolean).join(' '));
    return (!raridade || (item.raridade ?? 'sem-raridade') === raridade) &&
      (!tipo || categoria === tipo) &&
      termos.every(termo => texto.includes(termo));
  }).sort((a,b) => {
    const nome = compararNomes(a.nome,b.nome);
    if (ordem === 'za') return -nome;
    if (ordem === 'raridade') return (ordemRaridade.get(b.raridade) ?? -1) - (ordemRaridade.get(a.raridade) ?? -1) || nome;
    return nome;
  });
}

export function instalarCatalogoItens({ grade, itens, criarCard }) {
  const filtros = el('div', null, 'catalogo-item-filtros');
  const busca = el('input');
  busca.type = 'search'; busca.placeholder = 'Pesquisar itens';
  busca.setAttribute('aria-label', 'Pesquisar itens');
  const raridade = selecionar([['','Todas as raridades'], ...Object.entries(RARIDADES_ITENS), ['sem-raridade','Sem raridade']], 'Raridade dos itens');
  const tiposDisponiveis = new Set(itens.map(tipoItem));
  const tipo = selecionar([['','Todos os tipos'], ...Object.entries(TIPOS).filter(([chave]) => tiposDisponiveis.has(chave))], 'Tipo de item');
  const ordem = selecionar(ORDENS, 'Ordenar itens');
  const resumo = el('p', null, 'catalogo-item-resumo'); resumo.setAttribute('role', 'status');
  filtros.append(busca, raridade, tipo, ordem); grade.before(filtros, resumo);
  const cards = new Map();
  const mostrar = () => {
    const filtrados = filtrarItensCatalogo(itens,{busca:busca.value,raridade:raridade.value,tipo:tipo.value,ordem:ordem.value});
    resumo.textContent = filtrados.length + ' de ' + itens.length + ' itens';
    grade.replaceChildren(...filtrados.map(item => {
      if (!cards.has(item.id)) cards.set(item.id, criarCard(item));
      return cards.get(item.id);
    }));
    if (!filtrados.length) grade.append(el('p', 'Nenhum item encontrado.', 'catalogo-item-vazio'));
  };
  busca.addEventListener('input', mostrar);
  for (const seletor of [raridade,tipo,ordem]) seletor.addEventListener('change', mostrar);
  return mostrar;
}
