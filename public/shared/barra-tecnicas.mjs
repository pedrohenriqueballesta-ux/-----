import {CONFIG} from './config.mjs';
import {FORMAS} from './formas.mjs';
import {consumivelValido,acaoConsumivel} from './consumiveis-hotkeys.mjs';
import {RYUKEN} from './ryuken.mjs';
import {SUPER_KAME} from './kamehameha.mjs';

export const TECNICAS=Object.freeze([
 {id:'skill:heal',nome:'Cura de Vida',nivel:1,icone:'sprite-cura',custo:'Conforme o nível',recarga:'0,7 s'},
 {id:'skill:basic',nome:'Ataque básico',nivel:1,icone:'sprite-kaioken',custo:'0 Ki',recarga:'0,45 s'},
 {id:'skill:ki',nome:'Rajada de Ki',nivel:CONFIG.skills.ki,icone:'sprite-kame',custo:'7 Ki',recarga:'0,7 s'},
 {id:'skill:dash',nome:'Imagem Residual',nivel:CONFIG.skills.dash,icone:'sprite-barrier',custo:'0 Ki',recarga:'4 s'},
 {id:'skill:kame',nome:'Kamehameha',nivel:CONFIG.skills.kame,icone:'sprite-kame',custo:`${CONFIG.skillCosts.kame} Ki`,recarga:`${CONFIG.skillCooldowns.kame} s`},
 {id:'form:auto',nome:'Melhor transformação',nivel:FORMAS[0].nivel,icone:'sprite-kaioken',custo:`${CONFIG.transformacao.drenoKi} Ki/s`,recarga:'Sem recarga'},
 ...FORMAS.map(f=>({id:'form:'+f.forma,nome:f.nome,nivel:f.nivel,imagem:f.icone||null,icone:'sprite-kaioken',custo:`${CONFIG.transformacao.drenoKi} Ki/s`,recarga:'Sem recarga',duracao:f.duracao})),
 {id:'skill:barrier',nome:'Barreira de Ki',nivel:CONFIG.skills.barrier,icone:'sprite-barrier',custo:`${CONFIG.skillCosts.barrier} Ki`,recarga:`${CONFIG.skillCooldowns.barrier} s`},
 {id:'skill:genki',nome:'Genki Dama',nivel:CONFIG.skills.genki,icone:'sprite-genki',custo:`${CONFIG.skillCosts.genki} Ki`,recarga:`${CONFIG.skillCooldowns.genki} s`},
 {id:'skill:ryuken',nome:'Ryuken',nivel:CONFIG.skills.ryuken,icone:'sprite-ryuken',custo:`${RYUKEN.custo} Ki`,recarga:`${RYUKEN.recarga} s`},
 {id:'skill:superKamehameha',nome:'Super Kamehameha',nivel:CONFIG.skills.superKamehameha,icone:'sprite-super-kame',custo:`${SUPER_KAME.custo} Ki`,recarga:`${SUPER_KAME.recarga} s`},
 {id:'item:food',nome:'Presunto',nivel:1,imagem:'/assets/inventario/comida.png',custo:'1 item',recarga:'Durante o efeito'},
 {id:'item:ki',nome:'Poção de Ki',nivel:1,imagem:'/assets/inventario/pocao_ki.png',custo:'1 item',recarga:'0,7 s'},
 ...CONFIG.seedPotencies.map(n=>({id:'item:seed'+n,nome:'Semente '+n+'%',nivel:1,imagem:'/assets/inventario/semente_dos_deuses.png',custo:'1 item',recarga:'20 s'}))
]);
const ids=new Set(TECNICAS.map(t=>t.id));
// A lista do Profile mostra apenas magias e transformações do personagem.
// Ataques básicos, movimento e itens continuam utilizáveis por seus outros controles.
export const MAGIAS_PERSONAGEM=Object.freeze(TECNICAS.filter(t=>['skill:heal','skill:kame','skill:barrier','skill:genki','skill:ryuken','skill:superKamehameha'].includes(t.id)||(t.id.startsWith('form:')&&t.id!=='form:auto')));
export const tecnicaPorId=id=>TECNICAS.find(t=>t.id===id)||null;
export const acaoDaTecnica=id=>id?.startsWith('skill:')?{type:'skill',skill:id.slice(6)}:id==='form:auto'?{type:'transform'}:id?.startsWith('form:')?{type:'transform',forma:id.slice(5)}:id?.startsWith('item:')?acaoConsumivel(id.slice(5)):null;
export function barraPadrao(hotkeys={},semente=15,nivel=1,forma='base'){
 const item=n=>consumivelValido(hotkeys[n])?'item:'+hotkeys[n]:hotkeys[n]===null?null:n===7?'item:seed'+(CONFIG.seedPotencies.includes(semente)?semente:15):'item:ki';
 return ['skill:heal',nivel>=CONFIG.skills.superKamehameha&&forma==='ssj4'?'skill:superKamehameha':'skill:kame','form:auto','skill:barrier','skill:genki',item(7),item(8),'skill:ryuken'];
}
export function atualizarBarraPadrao(p){
 if(p.barraKameManual||!['skill:kame','skill:superKamehameha'].includes(p.barraTecnicas?.[1]))return;
 const proxima=barraPadrao(p.hotkeysConsumiveis,p.seedSelected,p.level,p.forma)[1];
 if(!p.barraTecnicas.includes(proxima))p.barraTecnicas[1]=proxima;
}
export function tecnicaDisponivel(id,estado){
 const tecnica=tecnicaPorId(id);
 return Boolean(tecnica&&estado?.level>=tecnica.nivel&&
   (id!=='skill:ryuken'||RYUKEN.formas.includes(estado.forma))&&
   (id!=='skill:superKamehameha'||estado.forma===SUPER_KAME.forma));
}
export function barraValida(valor,hotkeys={},semente=15){
 if(!Array.isArray(valor)||valor.length!==8)return barraPadrao(hotkeys,semente);
 const vistos=new Set();return valor.map(id=>{
  if(id===null||!ids.has(id)||vistos.has(id))return null;
  vistos.add(id);return id;
 });
}
