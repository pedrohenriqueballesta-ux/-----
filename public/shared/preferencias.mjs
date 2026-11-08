export const PADRAO_PREFERENCIAS=Object.freeze({musicaAtiva:true,volumeMusica:.4,qualidade:'alta',particulas:true,intensidade:1,numerosDano:true,barrasVida:true,fps:60,escalaHud:1,opacidade:0.94,reduzirAnimacoes:false,informacoesExtras:true,notificacoes:true});
export function preferenciasValidas(valor={}){
 const p={...PADRAO_PREFERENCIAS};
 if(!valor||typeof valor!=='object')return p;
 for(const k of ['musicaAtiva','particulas','numerosDano','barrasVida','reduzirAnimacoes','informacoesExtras','notificacoes'])if(typeof valor[k]==='boolean')p[k]=valor[k];
 for(const[k,min,max]of [['volumeMusica',0,1],['intensidade',.2,1],['escalaHud',.8,1.2],['opacidade',.65,1]])if(Number.isFinite(valor[k]))p[k]=Math.max(min,Math.min(max,valor[k]));
 if(['alta','economica'].includes(valor.qualidade))p.qualidade=valor.qualidade;
 if([30,60,120].includes(valor.fps))p.fps=valor.fps;
 return p;
}