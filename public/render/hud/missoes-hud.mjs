import {el,botao,selecionar,barra,recompensa,artigo} from './hud-elementos.mjs';
import {avaliarResgateLote} from '../../shared/sistemas/resgate-lote.mjs';
const estados={disponivel:'Disponível',andamento:'Em andamento',concluida:'Concluída',resgatada:'Recompensa resgatada',bloqueada:'Bloqueada'};
export function montarMissoes(container,{acao,avisar}){
 const filtro=selecionar([['todas','Todas'],['saga','Sagas'],['principal','Principais'],['secundaria','Secundárias'],['diaria','Diárias'],['semanal','Semanais']],'Categoria de missão'),lista=el('div',null,'hud-lista'),resgatarTudo=botao('Resgatar tudo');const abas=el('nav',null,'missoes-abas shop-abas');
 const missoesAba=botao('Missões',()=>selecionarAba(false)),tasksAba=botao('Tasks',()=>selecionarAba(true));
 const filtroTasks=selecionar([['todas','Todas'],...Object.entries(estados)],'Estado das tasks');
 const nota=el('p',null,'hud-nota');
 abas.setAttribute('aria-label','Seções de missões');abas.append(missoesAba,tasksAba);
 container.append(abas,filtro,filtroTasks,resgatarTudo,nota,lista);
 let estado,assinatura='',tasks=false;
 const elegiveis=()=> (estado?.self.missoes||[]).filter(m=>tasks ? m.categoria==='task' : m.categoria!=='task');
 const selecionarAba=valor=>{
  tasks=valor;
  missoesAba.setAttribute('aria-pressed',String(!tasks));tasksAba.setAttribute('aria-pressed',String(tasks));
  filtro.hidden=tasks;filtroTasks.hidden=!tasks;
  nota.textContent=tasks?'Aceite uma task para começar a contar os abates. Cada recompensa pode ser resgatada uma vez por personagem.':'Missões diárias renovam à meia-noite UTC e as semanais na segunda-feira UTC. God Mode não conta para missões ou tasks.';
  assinatura='';render();
 };
 resgatarTudo.onclick=async()=>{
  const prontas=elegiveis().filter(m=>m.estado==='concluida');if(!prontas.length)return;
  const p=estado.self,capacidade=avaliarResgateLote(prontas.map(m=>m.recompensa),p.weight,p.stats.capacity);
  if(capacidade.faltam>.0001){avisar?.(`Libere ${capacidade.faltam.toLocaleString('pt-BR',{maximumFractionDigits:2})} kg na mochila para resgatar todas as recompensas.`);return;}
  if(capacidade.lotara&&!confirm('As recompensas vão preencher toda a capacidade da mochila. Deseja continuar?'))return;
  resgatarTudo.disabled=true;try{for(const m of prontas){const r=await acao({type:'resgatarMissao',id:m.id});if(!r?.ok)break;}}finally{resgatarTudo.disabled=false;}
 };
 function cartao(m) {
  const a=artigo(m.nome,m.descricao);
  a.dataset.missao=m.id;
  a.append(el('small',estados[m.estado]+(tasks?' · Nível '+m.nivel:' · '+m.categoria)));
  const podeAcompanhar=!tasks||['andamento','concluida'].includes(m.estado);
  if(podeAcompanhar) a.append(barra(m.progresso,m.meta),el('p',m.progresso+' / '+m.meta));
  if(m.bloqueio)a.append(el('p',m.bloqueio));
  a.append(recompensa(m.recompensa));
  const podeAceitar=m.estado==='disponivel'&&(tasks||m.aceitar&&!m.aceita);
  if(podeAceitar){
   a.append(botao('Aceitar task',()=>acao({type:tasks?'aceitarTask':'aceitarMissao',id:m.id})));
  }else if(!tasks||m.estado==='concluida'){
   const resgatar=botao('Resgatar recompensa',()=>acao({type:'resgatarMissao',id:m.id}));
   resgatar.disabled=m.estado!=='concluida';
   a.append(resgatar);
  }
  if(podeAcompanhar)a.append(botao(m.acompanhada?'Parar acompanhamento':'Acompanhar',()=>acao({type:'acompanharMissao',id:m.acompanhada?null:m.id})));
  return a;
 }
 function render(){
  const selecao=tasks?filtroTasks.value:filtro.value;
  const missoes=elegiveis();
  const sig=JSON.stringify([tasks,selecao,missoes]);
  if(sig===assinatura)return;
  assinatura=sig;
  const exibidas=missoes.filter(m=>selecao==='todas'||(tasks?m.estado:m.categoria)===selecao);
  lista.replaceChildren(...exibidas.map(cartao));
  if(!exibidas.length)lista.append(el('p',tasks?'Nenhuma task neste filtro.':'Nenhuma missão neste filtro.'));
 }
 filtro.onchange=filtroTasks.onchange=render;
 selecionarAba(false);
 return s=>{estado=s;render();};
}
