import { ARTE_PROJETIL_MOB, quadroProjetilMob } from '../shared/projetil-mob.mjs';
let imagem=null;
const tonalidades=new Map();
export function carregarProjetilMob() {
  if(!imagem){imagem=new Image();imagem.src=ARTE_PROJETIL_MOB.arquivo;}
  return imagem;
}
export function desenharProjetilMob(ctx,projetil,pos,tempo,escalaTela=1) {
  const original=carregarProjetilMob();if(!original.complete||!original.naturalWidth)return false;
  const cor=Number.isFinite(projetil.cor)?((projetil.cor%360)+360)%360:270;
  const corHex=typeof projetil.corHex==='string'&&/^#[\da-f]{6}$/i.test(projetil.corHex)?projetil.corHex.toUpperCase():null;
  const tamanho=Number.isFinite(projetil.tamanho)&&projetil.tamanho>0?projetil.tamanho:48;
  const densidade=Math.max(1,Math.min(4,Math.ceil(escalaTela)));
  const largura=Math.min(ARTE_PROJETIL_MOB.largura,Math.ceil(tamanho*densidade));
  const altura=Math.ceil(largura*ARTE_PROJETIL_MOB.altura/ARTE_PROJETIL_MOB.largura),chave=(corHex||cor)+':'+largura;
  if(!tonalidades.has(chave)){
    // A folha colorida é preparada uma vez por tonalidade, fora do caminho de cada frame.
    const folha=document.createElement('canvas');folha.width=largura*ARTE_PROJETIL_MOB.quadros;folha.height=altura;
    const c=folha.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
    if(corHex){
      // O violeta dominante medido na arte (#6509CB) é remapeado para a cor pedida;
      // os brilhos claros continuam claros e a silhueta/alpha da animação é preservada.
      const base=[0x65,0x09,0xCB],alvo=[parseInt(corHex.slice(1,3),16),parseInt(corHex.slice(3,5),16),parseInt(corHex.slice(5,7),16)];
      const fonte=document.createElement('canvas');fonte.width=ARTE_PROJETIL_MOB.largura*ARTE_PROJETIL_MOB.quadros;fonte.height=ARTE_PROJETIL_MOB.altura;
      const fc=fonte.getContext('2d',{willReadFrequently:true});fc.drawImage(original,0,0);
      const pixels=fc.getImageData(0,0,fonte.width,fonte.height),d=pixels.data;
      for(let p=0;p<d.length;p+=4)for(let k=0;k<3;k++){const v=d[p+k],b=base[k],t=alvo[k];d[p+k]=v<=b?Math.round(t*v/b):Math.round(t+(255-t)*(v-b)/(255-b));}
      fc.putImageData(pixels,0,0);
      for(let i=0;i<ARTE_PROJETIL_MOB.quadros;i++)c.drawImage(fonte,i*ARTE_PROJETIL_MOB.largura,0,ARTE_PROJETIL_MOB.largura,ARTE_PROJETIL_MOB.altura,i*largura,0,largura,altura);
    }else{c.filter=`hue-rotate(${cor-ARTE_PROJETIL_MOB.tonalidadeOriginal}deg)`;for(let i=0;i<ARTE_PROJETIL_MOB.quadros;i++)c.drawImage(original,i*ARTE_PROJETIL_MOB.largura,0,ARTE_PROJETIL_MOB.largura,ARTE_PROJETIL_MOB.altura,i*largura,0,largura,altura);}
    if(tonalidades.size>=32)tonalidades.delete(tonalidades.keys().next().value);
    tonalidades.set(chave,folha);
  }
  const arte=ARTE_PROJETIL_MOB,quadro=quadroProjetilMob(tempo-projetil.started,projetil.fps||arte.fps);
  const escala=tamanho/arte.largura;
  ctx.save();ctx.translate(pos.x,pos.y-28);ctx.rotate(Math.atan2(projetil.dy,projetil.dx));
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.drawImage(tonalidades.get(chave),quadro*largura,0,largura,altura,
    -arte.ancoraX*escala,-arte.ancoraY*escala,arte.largura*escala,arte.altura*escala);
  ctx.restore();return true;
}
