import {CONFIG} from './config.mjs';

export function avaliarResgateLote(recompensas,pesoAtual,capacidade){
 const itens={};
 for(const r of recompensas||[])for(const [id,q]of Object.entries(r?.itens||{}))itens[id]=(itens[id]||0)+q;
 const pesoRecompensas=Object.entries(itens).reduce((total,[id,q])=>total+(CONFIG.itemWeights[id]||0)*q,0);
 const livre=Math.max(0,capacidade-pesoAtual),faltamBruto=Math.max(0,pesoAtual+pesoRecompensas-capacidade),faltam=faltamBruto<.0001?0:faltamBruto;
 return {itens,pesoRecompensas,livre,faltam,lotara:faltam===0&&pesoRecompensas>0&&pesoAtual+pesoRecompensas>=capacidade-.0001};
}
