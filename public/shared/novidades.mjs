// Somente conteúdo publicado pelos sistemas do servidor gera alertas de abas.
export const ABAS_NOVIDADES = Object.freeze(['personagem','mochila','missoes','mapa','loja','ranking','guilda','correio','ajustes']);
export function validarNovidade(n) {
  return Boolean(n && typeof n.id === 'string' && n.id.length > 0 && n.id.length <= 120 &&
    ABAS_NOVIDADES.includes(n.aba) && typeof n.titulo === 'string' && n.titulo.trim().length > 0 && n.titulo.length <= 120 &&
    typeof n.texto === 'string' && n.texto.trim().length > 0 && n.texto.length <= 2000);
}
export function restaurarNovidades(lista) {
  const ids = new Set();
  return (Array.isArray(lista) ? lista : []).filter(n => validarNovidade(n) && !ids.has(n.id) && ids.add(n.id)).slice(-100)
    .map(n => ({id:n.id,aba:n.aba,titulo:n.titulo,texto:n.texto,lida:n.lida === true}));
}
export function novidadesDaAba(lista, aba) {
  return (Array.isArray(lista) ? lista : []).filter(n => validarNovidade(n) && n.aba === aba && !n.lida);
}
