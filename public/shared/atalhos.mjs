// Fonte única da tabela de teclas. Combinações do navegador não são atalhos do jogo.
export const ATALHOS=Object.freeze([
 {id:'personagem',nome:'Perfil / atributos',teclas:['tab'],menu:'personagem'},
 {id:'mochila',nome:'Mochila',teclas:['i'],menu:'mochila'},
 {id:'missoes',nome:'Missões',teclas:['j'],menu:'missoes'},
 {id:'bestiario',nome:'Bestiário',teclas:['b'],menu:'bestiario'},
 {id:'mapa',nome:'Mapa',teclas:['m'],menu:'mapa'},
 {id:'store',nome:'Store',teclas:['o'],menu:'store'},
 {id:'battlepass',nome:'Battle Pass',teclas:['p'],menu:'battlepass'},
 {id:'loja',nome:'Loja / mercador',teclas:['l'],menu:'loja'},
 {id:'ranking',nome:'Ranking',teclas:['v'],menu:'ranking'},
 {id:'guilda',nome:'Guilda',teclas:['g'],menu:'guilda'},
 {id:'correio',nome:'Caixa de mensagens',teclas:['c'],menu:'correio'},
 {id:'ajustes',nome:'Fechar janela / abrir Configurações',teclas:['escape'],menu:'ajustes'},
 {id:'caca',nome:'Ligar / desligar Auto Hunt',teclas:['h'],comando:'caca'},
 {id:'painelCaca',nome:'Painel Auto Hunt e Hunt Analyzer',teclas:['y'],comando:'painelCaca'},
 {id:'montaria',nome:'Montar / desmontar Nimbus',teclas:['x'],comando:'montaria'},
 {id:'chat',nome:'Conversar / enviar mensagem',teclas:['enter'],comando:'chat'},
 {id:'movimento',nome:'Movimento',teclas:['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'],exibir:'WASD / ↑ ← ↓ →'},
 {id:'soco',nome:'Ataque básico',teclas:[' '],exibir:'Espaço'},
 {id:'dash',nome:'Imagem Residual',teclas:['shift'],exibir:'Shift'},
 {id:'cura',nome:'Cura de Vida',teclas:['1']},
 {id:'kame',nome:'Kamehameha',teclas:['2']},
 {id:'transformar',nome:'Transformação (Kaioken → Super Saiyajin → Super Saiyajin 2)',teclas:['3','t']},
 {id:'barreira',nome:'Barreira de Ki',teclas:['4']},
 {id:'genki',nome:'Genki-Dama',teclas:['5']},
 {id:'consumivel7',nome:'Consumível do slot 6',teclas:['6','r']},
 {id:'consumivel8',nome:'Consumível do slot 7',teclas:['7','q']},
 {id:'comida',nome:'Usar comida',teclas:['f']},
 {id:'zoom',nome:'Zoom do mapa sob o cursor / câmera',teclas:[],exibir:'Roda do mouse'},
 {id:'navegar',nome:'Navegar até um ponto pelo minimapa',teclas:[],exibir:'Clique no minimapa'}
]);
const nomes={tab:'Tab',escape:'Esc',enter:'Enter'};
export const teclasDoAtalho=a=>a.exibir||a.teclas.map(k=>nomes[k]||k.toUpperCase()).join(' / ');
export const alvoEditavel=t=>Boolean(t&&(t.isContentEditable||['INPUT','SELECT','TEXTAREA'].includes(t.tagName)||t.closest?.('[contenteditable="true"],[role="textbox"]')));
export function atalhoDeInterface(e){
 if(e.ctrlKey||e.altKey||e.metaKey||e.shiftKey||e.isComposing||e.repeat||alvoEditavel(e.target))return null;
 const key=String(e.key||'').toLowerCase();return ATALHOS.find(a=>(a.menu||a.comando)&&a.teclas.includes(key))||null;
}
