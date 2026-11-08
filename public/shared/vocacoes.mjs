// Catálogo de personagens/vocações: registrar futuras opções aqui e seu desenhista na apresentação.
export const VOCACOES=Object.freeze({goku:Object.freeze({id:'goku',nome:'Goku',personagem:'Goku',sprite:'goku'})});
export function vocacaoDoPersonagem(valor){
 const chave=String(typeof valor==='object'&&valor?valor.vocacao||valor.character||'goku':valor||'goku').toLocaleLowerCase('pt-BR');
 return Object.hasOwn(VOCACOES,chave)?VOCACOES[chave]:VOCACOES.goku;
}