import {vocacaoDoPersonagem} from './vocacoes.mjs';
import {statsFor} from './characters.mjs';
import {poderCombate} from './perfil.mjs';
export function contasDoServidor(stored,sessions){
 const contas=new Map();
 const adicionar=p=>{
  if(!p?.mercadoId||typeof p.name!=='string')return;
  const nivel=p.levelReal??p.level,stats=statsFor(nivel);
  contas.set(p.mercadoId,{id:p.mercadoId,nome:p.name,vocacao:{...vocacaoDoPersonagem(p)},nivel,xp:Number(p.xp)||0,poder:poderCombate(stats),kills:Math.max(0,Number(p.kills)||0),bossKills:Math.max(0,Number(p.bossKills)||0),godmode:p.godmode===true});
 };
 for(const[k,p]of Object.entries(stored))if(!k.startsWith('__'))adicionar(p);
 for(const p of sessions.values())adicionar(p);
 return [...contas.values()];
}
export function rankingServidor(contas,eu,{categoria='nivel',pagina=1}={},guildas){
 const campos={nivel:'nivel',poder:'poder',mobs:'kills',chefes:'bossKills'};
 const deGuildas=categoria==='guildas';if(!deGuildas&&!Object.hasOwn(campos,categoria))categoria='nivel';
 const campo=campos[categoria];
 const fonte=deGuildas?[...guildas.lista.values()].map(g=>({id:g.id,nome:'['+g.sigla+'] '+g.nome,nivel:null,valor:g.membros.reduce((n,m)=>n+(contas.find(c=>c.id===m.id&&!c.godmode)?.kills||0),0),membros:g.membros.length})):contas.filter(c=>!c.godmode).map(c=>({...c,valor:c[campo]}));
 fonte.sort((a,b)=>b.valor-a.valor||(categoria==='nivel'?b.xp-a.xp:0)||a.id.localeCompare(b.id));
 let posicao=0;const linhas=fonte.map((c,i)=>{if(!i||c.valor!==fonte[i-1].valor||(categoria==='nivel'&&c.xp!==fonte[i-1].xp))posicao=i+1;return{...c,posicao};});
 const paginas=Math.max(1,Math.ceil(linhas.length/20)),pag=Number.isSafeInteger(pagina)?Math.max(1,Math.min(paginas,pagina)):1;
 const meuId=deGuildas?guildas.doJogador(eu)?.id:eu;
 return{escopo:'Jogadores reais deste servidor · contas em God Mode não participam',categoria,pagina:pag,paginas,total:linhas.length,linhas:linhas.slice((pag-1)*20,pag*20),eu:linhas.find(c=>c.id===meuId)||null};
}