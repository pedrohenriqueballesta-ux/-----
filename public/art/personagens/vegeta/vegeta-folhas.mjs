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


// Coordenadas do chão medidas nas folhas God após remover o chroma.
// O x continua no centro de cada célula, na escala das outras formas do Vegeta.
function folhaGod(arquivo, chave, pes) {
  const [dados, id] = folha('/assets/vegeta/god/' + arquivo, 'vegetaGod' + chave);
  dados.frames = dados.frames.map((linha, r) => linha.map(([x, y, w, h, ax], c) =>
    [x, y, w, h, x + ax, y + pes[r][c] + 1]));
  return [dados, id];
}

export const FOLHAS_VEGETA_GOD = Object.freeze({
  parado: folhaGod('01_PARADO_IDLE.png', 'Parado', [[288,288,288,288],[287,287,287,287],[285,285,285,285],[283,283,283,283],[283,283,283,283]]),
  andar: folhaGod('02_ANDAR.png', 'Andar', [[289,289,290,289],[286,287,286,288],[282,282,278,282],[282,282,282,281],[282,282,282,280]]),
  soco: folhaGod('03_SOCO.png', 'Soco', [[288,290,290,288],[286,285,285,287],[284,284,284,284],[280,281,281,281],[283,283,284,283]]),
  rajada: folhaGod('04_RAJADA_DE_KI.png', 'Rajada', [[294,294,294,294],[292,292,292,292],[286,286,286,286],[284,284,284,284],[286,286,286,286]]),
  galick: folhaGod('05_GALICK_GUN.png', 'Galick', [[294,294,294,294],[292,292,292,292],[287,287,287,287],[285,285,285,285],[286,286,286,286]]),
  finalFlash: folhaGod('06_FINAL_FLASH.png', 'FinalFlash', [[294,294,294,294],[292,292,292,292],[287,287,287,288],[285,285,285,285],[286,286,286,286]]),
  bigBang: folhaGod('07_BIG_BANG_ATTACK.png', 'BigBang', [[293,293,293,293],[291,291,291,291],[287,287,287,287],[284,284,284,284],[287,287,287,287]])
});
