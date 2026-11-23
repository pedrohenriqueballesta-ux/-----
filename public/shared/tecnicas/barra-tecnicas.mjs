import {CONFIG} from '../nucleo/config.mjs';
import {FORMAS,formasDaVocacao} from './formas.mjs';
import {consumivelValido,acaoConsumivel} from './consumiveis-hotkeys.mjs';
import {RYUKEN} from './ryuken.mjs';
import {SUPER_KAME} from './kamehameha.mjs';
import {GALICK} from './galick-gun.mjs';
import {FINAL_FLASH,formaFinalFlash} from './final-flash.mjs';

export const TECNICAS=Object.freeze([
 {id:'skill:heal',nome:'Cura de Vida',nivel:1,icone:'sprite-cura',custo:'Conforme o nível',recarga:'0,7 s'},
 {id:'skill:basic',nome:'Ataque básico',nivel:1,icone:'sprite-kaioken',custo:'0 Ki',recarga:'0,45 s'},
 {id:'skill:dash',nome:'Imagem Residual',nivel:CONFIG.skills.dash,icone:'sprite-barrier',custo:'0 Ki',recarga:'4 s'},
 {id:'skill:kame',nome:'Kamehameha',nivel:CONFIG.skills.kame,icone:'sprite-kame',custo:`${CONFIG.skillCosts.kame} Ki`,recarga:`${CONFIG.skillCooldowns.kame} s`},
 {id:'skill:galick',nome:'Galick Gun',nivel:CONFIG.skills.galick,icone:'sprite-galick',custo:`${GALICK.custo} Ki`,recarga:`${GALICK.recarga} s`},
 {id:'skill:finalFlash',nome:'Final Flash',nivel:FINAL_FLASH.nivel,imagem:FINAL_FLASH.icone,custo:`${FINAL_FLASH.custo} Ki`,recarga:`${FINAL_FLASH.recarga} s`},
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
export const MAGIAS_PERSONAGEM=Object.freeze(TECNICAS.filter(t=>['skill:heal','skill:kame','skill:galick','skill:finalFlash','skill:barrier','skill:genki','skill:ryuken','skill:superKamehameha'].includes(t.id)||(t.id.startsWith('form:')&&t.id!=='form:auto')));
export const NOMES_TECNICAS_VEGETA=Object.freeze({'skill:heal':'Cura de Vida','skill:kame':'Kamehameha','skill:barrier':'Barreira de Ki','skill:ryuken':'Golpe do Orgulho','skill:superKamehameha':'Big Bang Attack'});
export const tecnicaPorId=id=>TECNICAS.find(t=>t.id===id)||null;
export function tecnicaDaVocacao(id, vocacao = 'goku') {
 if(id==='skill:galick'||id==='skill:finalFlash')return vocacao==='vegeta';
 if(!id?.startsWith('form:')||id==='form:auto')return true;
 return formasDaVocacao(vocacao).some(f=>f.forma===id.slice(5));
}

export function tecnicasDoPerfil(vocacao) {
 return MAGIAS_PERSONAGEM.filter(({id})=>tecnicaDaVocacao(id,vocacao)
  &&(vocacao!=='vegeta'||id.startsWith('form:')||id==='skill:heal'||id==='skill:galick'||id==='skill:finalFlash'));
}

export const acaoDaTecnica=id=>id?.startsWith('skill:')?{type:'skill',skill:id.slice(6)}:id==='form:auto'?{type:'transform'}:id?.startsWith('form:')?{type:'transform',forma:id.slice(5)}:id?.startsWith('item:')?acaoConsumivel(id.slice(5)):null;
export function barraPadrao(hotkeys={},semente=15,nivel=1,forma='base',vocacao='goku'){
 if(vocacao==='vegeta')return ['skill:heal','skill:galick',null,null,'form:auto','skill:finalFlash','item:food','item:ki'];
 const item=n=>consumivelValido(hotkeys[n])?'item:'+hotkeys[n]:hotkeys[n]===null?null:n===7?'item:seed'+(CONFIG.seedPotencies.includes(semente)?semente:15):'item:ki';
 return ['skill:heal',nivel>=CONFIG.skills.superKamehameha&&forma==='ssj4'?'skill:superKamehameha':'skill:kame','skill:ryuken','skill:barrier','form:auto','skill:genki',item(7),item(8)];
}
export function atualizarBarraPadrao(p){
 if(p.barraKameManual||!['skill:kame','skill:superKamehameha'].includes(p.barraTecnicas?.[1]))return;
 const proxima=barraPadrao(p.hotkeysConsumiveis,p.seedSelected,p.level,p.forma)[1];
 if(!p.barraTecnicas.includes(proxima))p.barraTecnicas[1]=proxima;
}
export function nivelDaTecnica(tecnica, vocacao) {
 if (!tecnica.id.startsWith('form:')) return tecnica.nivel;
 const formas = formasDaVocacao(vocacao);
 const forma = tecnica.id==='form:auto' ? formas[0] : formas.find(f => f.forma === tecnica.id.slice(5));
 return forma?.nivel ?? tecnica.nivel;
}

export function tecnicaDisponivel(id,estado){
 const tecnica=tecnicaPorId(id);
 return Boolean(tecnica&&estado&&estado.level>=nivelDaTecnica(tecnica,estado.vocacao)&&tecnicaDaVocacao(id,estado.vocacao)&&
   (id!=='skill:galick'||(estado.ki>=GALICK.custo&&!(estado.galickRemaining>0)))&&
   (id!=='skill:finalFlash'||(formaFinalFlash(estado.forma)&&estado.ki>=FINAL_FLASH.custo&&!(estado.finalFlashRemaining>0)))&&
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
