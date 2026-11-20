// Protótipo Vegeta: folhas 4x5, preservando as fontes do pacote de teste.
const folha=(file,key)=>[{file,width:1024,height:1536,rows:5,columns:4,referenceHeight:307.2,idleColumn:0,frames:Array.from({length:5},(_,r)=>Array.from({length:4},(_,c)=>{const x0=c*256,x1=(c+1)*256,y0=Math.round(r*1536/5),y1=Math.round((r+1)*1536/5);return [x0,y0,256,y1-y0,128,y1] })),},key];
const base='/assets/vegeta/base/',ssj='/assets/vegeta/ssj1/';
const majin='/assets/vegeta/majin/';
const ssj4='/assets/vegeta/ssj4/';
const criar=(dir,prefix,galickProprio=false)=>Object.freeze({
 parado:folha(dir+'01_PARADO.png',prefix+'Parado'),andar:folha(dir+'02_ANDAR.png',prefix+'Andar'),soco:folha(dir+'03_SOCO.png',prefix+'Soco'),rajada:folha(dir+'04_RAJADA_KI.png',prefix+'Rajada'),
 // A forma base tem folha própria; SSJ1 ainda usa a pose de disparo disponível na folha 04.
 galick:galickProprio?folha(dir+'05_GALICK_GUN.png',prefix+'Galick'):folha(dir+'04_RAJADA_KI.png',prefix+'Rajada'),finalFlash:folha(dir+'06_FINAL_FLASH.png',prefix+'FinalFlash')
});
export const FOLHAS_VEGETA_BASE=criar(base,'vegeta',true);
export const FOLHAS_VEGETA_SSJ1=Object.freeze({...criar(ssj,'vegetaSsj1'),bigBang:folha(ssj+'07_BIG_BANG_ATTACK.png','vegetaSsj1BigBang')});
// SSJ2 reutiliza exatamente as referências do SSJ1; a diferença é apenas o
// overlay elétrico compartilhado com o Goku SSJ2.
export const VEGETA_SSJ2=FOLHAS_VEGETA_SSJ1;
export const FOLHAS_VEGETA_MAJIN=Object.freeze({...criar(majin,'vegetaMajin',true),bigBang:folha(majin+'07_BIG_BANG_ATTACK.png','vegetaMajinBigBang')});
// SSJ4 usa as sete folhas próprias do pacote aprovado, mantendo a mesma grade,
// âncoras e escala das demais formas do Vegeta.
export const FOLHAS_VEGETA_SSJ4=Object.freeze({
  parado:folha(ssj4+'01_PARADO_IDLE.png','vegetaSsj4Parado'),
  andar:folha(ssj4+'02_ANDAR.png','vegetaSsj4Andar'),
  soco:folha(ssj4+'03_SOCO.png','vegetaSsj4Soco'),
  rajada:folha(ssj4+'04_RAJADA_DE_KI.png','vegetaSsj4Rajada'),
  galick:folha(ssj4+'05_GALICK_GUN.png','vegetaSsj4Galick'),
  finalFlash:folha(ssj4+'06_FINAL_FLASH.png','vegetaSsj4FinalFlash'),
  bigBang:folha(ssj4+'07_BIG_BANG_ATTACK.png','vegetaSsj4BigBang')
});
