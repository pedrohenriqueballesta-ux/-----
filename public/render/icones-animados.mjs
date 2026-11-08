// Renderização dos GIFs originais com transparência; não recria nem altera as artes.
export function removerFundoEscuro(pixels,w,h,limite=12){
 const visitados=new Uint8Array(w*h),fila=new Uint32Array(w*h);let inicio=0,fim=0;
 const incluir=i=>{if(visitados[i])return;const p=i*4;if(pixels[p+3]!==0&&Math.max(pixels[p],pixels[p+1],pixels[p+2])>limite)return;visitados[i]=1;fila[fim++]=i;};
 for(let x=0;x<w;x++){incluir(x);incluir((h-1)*w+x);}for(let y=0;y<h;y++){incluir(y*w);incluir(y*w+w-1);}
 while(inicio<fim){const i=fila[inicio++],x=i%w,y=Math.floor(i/w);pixels[i*4+3]=0;if(x>0)incluir(i-1);if(x<w-1)incluir(i+1);if(y>0)incluir(i-w);if(y<h-1)incluir(i+w);}
 return pixels;
}
const fontes=new Map(),tratadas=new WeakSet(),instancias=new Set();let instalado=false,raf=0;
async function carregar(url){
 if(fontes.has(url))return fontes.get(url);
 const trabalho=(async()=>{
  if(typeof ImageDecoder==='undefined'||!await ImageDecoder.isTypeSupported('image/gif'))throw Error('Decodificador indisponível');
  const resposta=await fetch(url);if(!resposta.ok)throw Error('GIF indisponível');
  const decoder=new ImageDecoder({data:await resposta.arrayBuffer(),type:'image/gif',preferAnimation:true});
  const frames=[];try{
   await decoder.tracks.ready;const count=decoder.tracks.selectedTrack.frameCount;
   for(let i=0;i<count;i++){
    const {image}=await decoder.decode({frameIndex:i,completeFramesOnly:true});
    try{const canvas=new OffscreenCanvas(image.displayWidth,image.displayHeight),ctx=canvas.getContext('2d',{willReadFrequently:true});
     ctx.drawImage(image,0,0);const dados=ctx.getImageData(0,0,canvas.width,canvas.height);removerFundoEscuro(dados.data,canvas.width,canvas.height);ctx.putImageData(dados,0,0);
     frames.push({imagem:await createImageBitmap(canvas),duracao:Math.max(20,(image.duration||100000)/1000)});
    }finally{image.close();}
   }
   return {frames,total:frames.reduce((n,f)=>n+f.duracao,0)};
  }catch(e){for(const f of frames)f.imagem.close();throw e;}finally{decoder.close();}
 })();fontes.set(url,trabalho);return trabalho;
}
function animar(agora){
 raf=0;if(document.hidden)return;
 for(const item of instancias){
  if(!item.canvas.isConnected){instancias.delete(item);continue;}if(!item.canvas.getClientRects().length)continue;
  let t=agora%item.animacao.total,indice=0;while(indice<item.animacao.frames.length-1&&t>=item.animacao.frames[indice].duracao)t-=item.animacao.frames[indice++].duracao;
  if(indice===item.indice)continue;item.indice=indice;const ctx=item.canvas.getContext('2d');ctx.clearRect(0,0,item.canvas.width,item.canvas.height);ctx.drawImage(item.animacao.frames[indice].imagem,0,0);
 }
 if(instancias.size)raf=requestAnimationFrame(animar);
}
const recortes=new Map();
function prepararCatalogo(img){
 if(tratadas.has(img))return;tratadas.add(img);
 let trabalho=recortes.get(img.src);
 if(!trabalho){trabalho=(async()=>{
   const resposta=await fetch(img.src);if(!resposta.ok)throw Error('Ícone indisponível');const original=await createImageBitmap(await resposta.blob());
   try{const c=new OffscreenCanvas(original.width,original.height),ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(original,0,0);const rgba=ctx.getImageData(0,0,c.width,c.height),dados=rgba.data;
    // Remove resíduos quase invisíveis de alfa que ampliariam o recorte visual.
    for(let i=3;i<dados.length;i+=4)if(dados[i]<32)dados[i]=0;ctx.putImageData(rgba,0,0);
    // Desconsidera pontos soltos minúsculos fora da arte ao calcular seu tamanho.
    const vistos=new Uint8Array(c.width*c.height),fila=new Uint32Array(c.width*c.height),regioes=[];let x0=c.width,y0=c.height,x1=-1,y1=-1;
    for(let raiz=0;raiz<vistos.length;raiz++){
      if(vistos[raiz]||dados[raiz*4+3]<=8)continue;let ini=0,fim=1,minX=c.width,minY=c.height,maxX=-1,maxY=-1;fila[0]=raiz;vistos[raiz]=1;
      const incluir=i=>{if(!vistos[i]&&dados[i*4+3]>8){vistos[i]=1;fila[fim++]=i;}};
      while(ini<fim){const i=fila[ini++],x=i%c.width,y=Math.floor(i/c.width);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);if(x>0)incluir(i-1);if(x<c.width-1)incluir(i+1);if(y>0)incluir(i-c.width);if(y<c.height-1)incluir(i+c.width);}
      if(fim>=16)regioes.push({area:fim,minX,minY,maxX,maxY});
    }
    const principal=regioes.reduce((maior,r)=>!maior||r.area>maior.area?r:maior,null);
    if(principal){const margem=Math.max(principal.maxX-principal.minX,principal.maxY-principal.minY)*.35;for(const r of regioes)if(r.maxX>=principal.minX-margem&&r.minX<=principal.maxX+margem&&r.maxY>=principal.minY-margem&&r.minY<=principal.maxY+margem){x0=Math.min(x0,r.minX);y0=Math.min(y0,r.minY);x1=Math.max(x1,r.maxX);y1=Math.max(y1,r.maxY);}}
    if(x1<0)throw Error('Ícone vazio');return await createImageBitmap(c,x0,y0,x1-x0+1,y1-y0+1);
   }finally{original.close();}
  })();recortes.set(img.src,trabalho);}
 trabalho.then(bitmap=>{
  if(!img.isConnected)return;const canvas=document.createElement('canvas');canvas.width=bitmap.width+16;canvas.height=bitmap.height+16;canvas.className=img.className+' icone-catalogo';canvas.dataset.iconeCatalogo=new URL(img.src).pathname.split('/').pop();
  if(img.alt){canvas.setAttribute('role','img');canvas.setAttribute('aria-label',img.alt);}else canvas.setAttribute('aria-hidden','true');
  canvas.getContext('2d').drawImage(bitmap,8,8);img.replaceWith(canvas);
 }).catch(()=>{});
}
function preparar(img){
 if(/^\/assets\/premium\/catalogo\/.*\.png$/.test(new URL(img.src,location.href).pathname)){prepararCatalogo(img);return;}
 if(tratadas.has(img)||!/^\/assets\/premium\/(store|battle-pass)\.gif$/.test(new URL(img.src,location.href).pathname))return;tratadas.add(img);
 // Fallback mantém o GIF animado em navegadores sem ImageDecoder.
 img.classList.add('premium-gif-fallback');
 carregar(img.src).then(animacao=>{
  if(!img.isConnected)return;const canvas=document.createElement('canvas');canvas.width=animacao.frames[0].imagem.width;canvas.height=animacao.frames[0].imagem.height;
  canvas.className=img.className.replace('premium-gif-fallback','')+' icone-premium-transparente';canvas.dataset.iconeAnimado=new URL(img.src).pathname.split('/').pop();
  if(img.alt){canvas.setAttribute('role','img');canvas.setAttribute('aria-label',img.alt);}else canvas.setAttribute('aria-hidden','true');
  canvas.getContext('2d').drawImage(animacao.frames[0].imagem,0,0);img.replaceWith(canvas);instancias.add({canvas,animacao,indice:-1});if(!raf)raf=requestAnimationFrame(animar);
 }).catch(()=>{});
}
export function instalarIconesAnimados(){
 if(instalado)return;instalado=true;document.querySelectorAll('img').forEach(preparar);
 new MutationObserver(mudancas=>{for(const m of mudancas)for(const n of m.addedNodes)if(n.nodeType===1){if(n.tagName==='IMG')preparar(n);n.querySelectorAll('img').forEach(preparar);}}).observe(document.body,{childList:true,subtree:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else if(instancias.size&&!raf)raf=requestAnimationFrame(animar);});
}
