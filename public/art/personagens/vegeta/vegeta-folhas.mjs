// Protótipo Vegeta: folhas 4x5, preservando as fontes do pacote de teste.
const folha=(file,key)=>[{file,width:1024,height:1536,rows:5,columns:4,referenceHeight:307.2,idleColumn:0,frames:Array.from({length:5},(_,r)=>Array.from({length:4},(_,c)=>{const x0=c*256,x1=(c+1)*256,y0=Math.round(r*1536/5),y1=Math.round((r+1)*1536/5);return [x0,y0,256,y1-y0,128,y1] })),},key];
const base='/assets/vegeta/base/',ssj='/assets/vegeta/ssj1/';
const majin='/assets/vegeta/majin/';
const ssj4='/assets/vegeta/ssj4/';
const god='/assets/vegeta/god/';
const blue='/assets/vegeta/blue/';
const ultraEgo='/assets/vegeta/ultra-ego/';
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
// A sola de referência é a do Vegeta Base parado na mesma direção.
// O ajuste é fixo por linha e ação para preservar a passada e as poses da folha.
const pesBaseParado = [288, 284, 282, 265, 265];
function alinharPes(folhas, pes, ancoraNoAtlas = false) {
  return Object.freeze(Object.fromEntries(Object.entries(folhas).map(([acao, [dados, chave]]) => {
    const frames = dados.frames.map((linha, r) => linha.map(([x, y, w, h, ax, ay]) =>
      [x, y, w, h, ancoraNoAtlas ? x + ax : ax, ay + pes[acao][r] - pesBaseParado[r]]));
    return [acao, [{ ...dados, frames }, chave]];
  })));
}
const majinFolhas = { ...criar(majin, 'vegetaMajin', true), bigBang: folha(majin + '07_BIG_BANG_ATTACK.png', 'vegetaMajinBigBang') };
export const FOLHAS_VEGETA_MAJIN = alinharPes(majinFolhas, {
  parado: [288, 285, 283, 266, 265],
  andar: [292, 291, 276, 267, 268],
  soco: [288, 287, 286, 267, 264],
  rajada: [291, 288, 286, 269, 265],
  galick: [289, 289, 284, 267, 264],
  finalFlash: [289, 288, 285, 268, 264],
  bigBang: [290, 288, 284, 269, 265]
}, true);
const blueFolhas = { ...criar(blue, 'vegetaBlue', true), bigBang: folha(blue + '07_BIG_BANG_ATTACK.png', 'vegetaBlueBigBang') };
// Os PNGs já têm alfa. A âncora absoluta em X é a convenção de drawSheet.
export const FOLHAS_VEGETA_BLUE = alinharPes(blueFolhas, {
  parado: [289, 286, 284, 268, 266],
  andar: [293, 292, 277, 267, 269],
  soco: [290, 289, 287, 268, 265],
  rajada: [292, 290, 284, 271, 267],
  galick: [291, 291, 287, 269, 266],
  finalFlash: [291, 289, 288, 269, 266],
  bigBang: [290, 287, 285, 268, 266]
}, true);
const ultraEgoFolhas = { ...criar(ultraEgo, 'vegetaUltraEgo', true),
  bigBang: folha(ultraEgo + '07_BIG_BANG_ATTACK.png', 'vegetaUltraEgoBigBang') };
export const FOLHAS_VEGETA_ULTRA_EGO = alinharPes(ultraEgoFolhas, {
  parado: [288, 285, 283, 266, 265],
  andar: [293, 292, 277, 267, 269],
  soco: [289, 288, 287, 267, 265],
  rajada: [292, 290, 283, 271, 266],
  galick: [291, 291, 287, 269, 266],
  finalFlash: [290, 291, 289, 269, 265],
  bigBang: [290, 290, 288, 268, 266]
}, true);
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
const godFolhas = { ...criar(god, 'vegetaGod', true),
  bigBang: folha(god + '07_BIG_BANG_ATTACK.png', 'vegetaGodBigBang') };
export const FOLHAS_VEGETA_GOD = alinharPes(godFolhas, {
  parado: [288, 285, 283, 266, 264],
  andar: [294, 291, 277, 266, 268],
  soco: [289, 287, 287, 267, 265],
  rajada: [291, 290, 284, 270, 266],
  galick: [291, 291, 287, 269, 266],
  finalFlash: [290, 290, 289, 269, 265],
  bigBang: [291, 289, 284, 271, 266]
}, true);
