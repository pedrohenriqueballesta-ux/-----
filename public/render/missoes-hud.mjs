import {el,botao,selecionar,barra,recompensa,artigo} from './hud-elementos.mjs';
import {avaliarResgateLote} from '../shared/resgate-lote.mjs';
const estados={disponivel:'Disponível',andamento:'Em andamento',concluida:'Concluída',resgatada:'Recompensa resgatada',bloqueada:'Bloqueada'};
export function montarMissoes(container,{acao,avisar}){
 const filtro=selecionar([['todas','Todas'],['principal','Principais'],['secundaria','Secundárias'],['diaria','Diárias'],['semanal','Semanais']],'Categoria de missão'),lista=el('div',null,'hud-lista'),resgatarTudo=botao('Resgatar tudo');container.append(filtro,resgatarTudo,el('p','Missões diárias renovam à meia-noite UTC; semanais na segunda-feira UTC. Progresso de teste em God Mode não conta.','hud-nota'),lista);let estado,assinatura='';
 resgatarTudo.onclick=async()=>{
  const prontas=(estado?.self.missoes||[]).filter(m=>m.estado==='concluida');if(!prontas.length)return;
  const p=estado.self,capacidade=avaliarResgateLote(prontas.map(m=>m.recompensa),p.weight,p.stats.capacity);
  if(capacidade.faltam>.0001){avisar?.(`Libere ${capacidade.faltam.toLocaleString('pt-BR',{maximumFractionDigits:2})} kg na mochila para resgatar todas as recompensas.`);return;}
  if(capacidade.lotara&&!confirm('As recompensas vão preencher toda a capacidade da mochila. Deseja continuar?'))return;
  resgatarTudo.disabled=true;try{for(const m of prontas){const r=await acao({type:'resgatarMissao',id:m.id});if(!r?.ok)break;}}finally{resgatarTudo.disabled=false;}
 };
 const render=()=>{const missoes=estado?.self.missoes||[],sig=JSON.stringify([filtro.value,missoes]);if(sig===assinatura)return;assinatura=sig;lista.replaceChildren(...missoes.filter(m=>filtro.value==='todas'||m.categoria===filtro.value).map(m=>{const a=artigo(m.nome,m.descricao),resgatar=botao('Resgatar recompensa',()=>acao({type:'resgatarMissao',id:m.id}));resgatar.disabled=m.estado!=='concluida';a.dataset.missao=m.id;a.append(el('small',estados[m.estado]+' · '+m.categoria),barra(m.progresso,m.meta),el('p',m.progresso+' / '+m.meta),el('p',recompensa(m.recompensa)),resgatar,botao(m.acompanhada?'Parar acompanhamento':'Acompanhar',()=>acao({type:'acompanharMissao',id:m.acompanhada?null:m.id})));return a;}));};filtro.onchange=()=>{assinatura='';render();};return s=>{estado=s;render();};
}
