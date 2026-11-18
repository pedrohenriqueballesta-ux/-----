// Skin alternativa de Natal: folhas 4x5 (20 quadros), cinco vistas por ação.
const DIMENSOES={
  '/assets/goku/natalino/04_RAJADA_KI.png':[970,1622],
  '/assets/goku/natalino/06_GENKI_DAMA.png':[977,1609],
  '/assets/goku/natalino/07_MONTADO.png':[977,1609]
};
const folha = (file, key) => {const [width,height]=DIMENSOES[file]||[1024,1536];return [
  { file, width, height, rows:5, columns:4, referenceHeight:height/5, idleColumn:0,
    frames:Array.from({length:5},(_,row)=>Array.from({length:4},(_,column)=>{const x0=Math.round(column*width/4),x1=Math.round((column+1)*width/4),y0=Math.round(row*height/5),y1=Math.round((row+1)*height/5);return [x0,y0,x1-x0,y1-y0,(x0+x1)/2,y1];})) }, key
];};
export const FOLHAS_GOKU_NATALINO = Object.freeze({
  parado: folha('/assets/goku/natalino/01_PARADO.png','gokuNatalinoParado'),
  andar: folha('/assets/goku/natalino/02_ANDAR.png','gokuNatalinoAndar'),
  soco: folha('/assets/goku/natalino/03_SOCO.png','gokuNatalinoSoco'),
  rajada: folha('/assets/goku/natalino/04_RAJADA_KI.png','gokuNatalinoRajada'),
  kamehameha: folha('/assets/goku/natalino/05_KAMEHAMEHA.png','gokuNatalinoKame'),
  genki: folha('/assets/goku/natalino/06_GENKI_DAMA.png','gokuNatalinoGenki'),
  montado: folha('/assets/goku/natalino/07_MONTADO.png','gokuNatalinoMontado')
});
