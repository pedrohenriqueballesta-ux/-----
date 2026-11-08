import pt from './locales/pt-BR.mjs';import en from './locales/en.mjs';import es from './locales/es.mjs';
export const IDIOMAS=Object.freeze({'pt-BR':pt,en,es});
export function idiomaInicial(browser='pt-BR',salvo){if(Object.hasOwn(IDIOMAS,salvo))return salvo;if(String(browser).toLowerCase().startsWith('en'))return'en';if(String(browser).toLowerCase().startsWith('es'))return'es';return'pt-BR';}
export function tradutor(id='pt-BR'){const d=IDIOMAS[id]||pt;return(k,args={})=>{let v=d[k]??pt[k]??d.requisicaoInvalida;if(Array.isArray(v))return v;for(const[a,b]of Object.entries(args))v=v.replaceAll('{'+a+'}',String(b));return v;};}
export function textoLocal(v,id){return typeof v==='string'?v:v?.[id]||v?.['pt-BR']||v?.en||'';}