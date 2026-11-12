export const VARIACAO_COMBATE=Object.freeze({min:0.9,max:1.1});

export function fatorCombateAleatorio(random=Math.random){
 const sorteio=random();
 const normalizado=Number.isFinite(sorteio)?Math.max(0,Math.min(1,sorteio)):0.5;
 return VARIACAO_COMBATE.min+(VARIACAO_COMBATE.max-VARIACAO_COMBATE.min)*normalizado;
}

export function variarExperiencia(base,random=Math.random){
 return Math.max(1,Math.round(base*fatorCombateAleatorio(random)));
}
