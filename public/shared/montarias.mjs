// Montaria cosmética: nenhuma configuração deste módulo altera colisão, velocidade ou combate.
export const DIRECOES_NIMBUS=Object.freeze(['n','ne','e','se','s','sw','w','nw']);
export const NIMBUS=Object.freeze({quadros:5,frameMs:130,tamanho:256,escala:.65,ancoraX:128,ancoraY:110,altura:12,amplitude:2,frequencia:1.6});
// Apoio no centro da massa espessa, sem considerar rabinho ou partículas.
// Coordenadas de cada um dos cinco frames no PNG 256×256. A nuvem é alinhada
// ao personagem, evitando que a variação do recorte faça o corpo oscilar.
export const APOIOS_NIMBUS=Object.freeze({
 n:[[130,112],[132,96],[130,104],[124,102],[118,98]],
 ne:[[137,108],[141,110],[143,106],[140,104],[140,100]],
 e:[[143,117],[147,114],[150,108],[152,116],[158,116]],
 se:[[139,118],[141,113],[149,110],[146,125],[147,117]],
 s:[[131,117],[134,120],[130,122],[130,118],[130,118]],
 sw:[[124,109],[119,99],[116,91],[115,107],[102,108]],
 w:[[125,105],[123,93],[121,104],[115,102],[112,101]],
 nw:[[129,100],[126,100],[122,96],[117,97],[113,98]]
});
export const AJUSTES_NIMBUS=Object.freeze({goku:{x:0,y:-6},'goku:ssj':{x:0,y:-6}});
export const montariaValida=v=>v==='nimbus'?'nimbus':null;
export function direcaoNimbus(f={x:0,y:1}){
 const x=Number.isFinite(f.x)?f.x:0,y=Number.isFinite(f.y)?f.y:1;
 if(!x&&!y)return 's';return DIRECOES_NIMBUS[((Math.round(Math.atan2(y,x)/(Math.PI/4))+2)%8+8)%8];
}
export const quadroNimbus=t=>Math.floor(Math.max(0,Number.isFinite(t)?t:0)*1000/NIMBUS.frameMs)%NIMBUS.quadros;
export function geometriaNimbus(p,pos,t,{escala=NIMBUS.escala,x,y,flutuar=true}={}){
 const direcao=direcaoNimbus(p.facing),quadro=quadroNimbus(t),ancora=APOIOS_NIMBUS[direcao][quadro];
 const skin=(p.vocacao||'goku')+(p.transformed?':ssj':''),offset=AJUSTES_NIMBUS[skin]||AJUSTES_NIMBUS.goku;
 const bob=flutuar?Math.sin(t*NIMBUS.frequencia)*NIMBUS.amplitude:0,apoio={x:pos.x,y:pos.y-NIMBUS.altura+bob};
 return {direcao,quadro,ancora,escala,apoio,personagem:{...pos,x:apoio.x+(x??offset.x),y:apoio.y+(y??offset.y)},nuvem:{x:apoio.x-ancora[0]*escala,y:apoio.y-ancora[1]*escala,tamanho:NIMBUS.tamanho*escala}};
}
