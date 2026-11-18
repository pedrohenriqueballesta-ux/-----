const falha=reason=>({ok:false,reason});
export const CARGOS=Object.freeze({membro:0,oficial:1,vice:2,lider:3});
const texto=(v,max)=>typeof v==='string'?v.trim().slice(0,max):'';
const normal=v=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
const idValido=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(v);
export class Guildas{
 constructor(){this.lista=new Map();this.serial=0;this.revisao=0;}
 doJogador(id){return[...this.lista.values()].find(g=>g.membros.some(m=>m.id===id));}
 resumo(p,contas){
  const eu=p.mercadoId,atual=this.doJogador(eu),nome=id=>contas.find(c=>c.id===id)?.nome||'Guerreiro';
  const ficha=g=>({id:g.id,nome:g.nome,sigla:g.sigla,descricao:g.descricao,emblema:g.emblema,requisito:g.requisito,aviso:g.aviso,membros:g.membros.map(m=>({...m,nome:nome(m.id),nivel:contas.find(c=>c.id===m.id)?.nivel||1,contribuicao:contas.find(c=>c.id===m.id)?.kills||0})),pontuacao:g.membros.reduce((n,m)=>n+(contas.find(c=>c.id===m.id)?.kills||0),0)});
  const cargo=atual?.membros.find(m=>m.id===eu)?.cargo;
  return{revisao:this.revisao,conta:eu,atual:atual?{...ficha(atual),cargo,solicitacoes:CARGOS[cargo]>=1?atual.solicitacoes.map(id=>({id,nome:nome(id)})):[]}:null,
   guildas:[...this.lista.values()].map(g=>({...ficha(g),solicitada:g.solicitacoes.includes(eu)})),convites:[...this.lista.values()].filter(g=>g.convites.includes(eu)).map(g=>({id:g.id,nome:g.nome})),
   jogadores:contas.filter(c=>c.id!==eu&&!this.doJogador(c.id)).map(c=>({id:c.id,nome:c.nome,nivel:c.nivel}))};
 }
 processar(p,d,contas){
  const eu=p.mercadoId,atual=this.doJogador(eu),g=this.lista.get(d.guilda)||atual,cargo=atual?.membros.find(m=>m.id===eu)?.cargo,autor=CARGOS[cargo]??-1;
  const pessoa=id=>contas.find(c=>c.id===id),membro=g?.membros.find(m=>m.id===d.alvo),podeEntrar=id=>!this.doJogador(id)&&pessoa(id)&&pessoa(id).nivel>=g.requisito&&g.membros.length<50;
  if(d.operacao==='criar'){
   if(atual)return falha('Você já pertence a uma guilda.');
   const nome=texto(d.nome,40),sigla=texto(d.sigla,5).toUpperCase(),descricao=texto(d.descricao,300),emblema=d.emblema,requisito=d.requisito;
   if(!/^[\p{L}\p{N}][\p{L}\p{N} ]{2,39}$/u.test(nome)||!/^[A-Z0-9]{2,5}$/.test(sigla)||!['★','龍','☀','⚡'].includes(emblema)||!Number.isInteger(requisito)||requisito<1||requisito>100)return falha('Nome (3–40), sigla (2–5) ou requisitos inválidos.');
   if(this.lista.size>=200)return falha('Limite de guildas atingido.');
   if([...this.lista.values()].some(g=>normal(g.nome)===normal(nome)||g.sigla===sigla))return falha('Nome ou sigla já utilizados.');
   const id='guilda-'+(++this.serial);this.lista.set(id,{id,nome,sigla,descricao,emblema,requisito,aviso:'',membros:[{id:eu,cargo:'lider'}],solicitacoes:[],convites:[]});
  }else if(!g)return falha('Guilda não encontrada.');
  else if(d.operacao==='solicitar'){
   if(!podeEntrar(eu))return falha('Você não atende aos requisitos ou a guilda está cheia.');
   if(g.solicitacoes.length>=30||g.solicitacoes.includes(eu)||[...this.lista.values()].filter(g=>g.solicitacoes.includes(eu)).length>=10)return falha('Solicitação já enviada ou limite atingido.');g.solicitacoes.push(eu);
  }else if(d.operacao==='responderConvite'){
   if(!g.convites.includes(eu)||typeof d.aceitar!=='boolean')return falha('Convite inválido.');
   if(d.aceitar&&!podeEntrar(eu))return falha('Você não pode entrar nesta guilda.');
   g.convites=g.convites.filter(id=>id!==eu);if(d.aceitar){g.membros.push({id:eu,cargo:'membro'});this.limparPendencias(eu);}
  }else{
   if(g!==atual)return falha('Você não pertence a esta guilda.');
   if(d.operacao==='sair'){
    if(cargo==='lider'&&g.membros.length>1)return falha('Transfira a liderança antes de sair.');
    g.membros=g.membros.filter(m=>m.id!==eu);if(!g.membros.length)this.lista.delete(g.id);
   }else if(d.operacao==='convidar'){
    if(autor<1||!idValido(d.alvo)||!podeEntrar(d.alvo)||g.convites.length>=30||g.convites.includes(d.alvo))return falha('Sem permissão, convite existente ou jogador indisponível.');g.convites.push(d.alvo);
   }else if(d.operacao==='responderSolicitacao'){
    if(autor<1||!g.solicitacoes.includes(d.alvo)||typeof d.aceitar!=='boolean')return falha('Sem permissão ou solicitação inválida.');
    if(d.aceitar&&!podeEntrar(d.alvo))return falha('Jogador não pode entrar.');
    g.solicitacoes=g.solicitacoes.filter(id=>id!==d.alvo);if(d.aceitar){g.membros.push({id:d.alvo,cargo:'membro'});this.limparPendencias(d.alvo);}
   }else if(d.operacao==='transferir'){
    if(cargo!=='lider'||!membro||membro.id===eu)return falha('Somente o líder pode transferir a liderança a outro membro.');
    g.membros.find(m=>m.id===eu).cargo='vice';membro.cargo='lider';
   }else if(d.operacao==='cargo'||d.operacao==='expulsar'){
    if(!membro||membro.id===eu||autor<2||CARGOS[membro.cargo]>=autor)return falha('Sem permissão para alterar este membro.');
    if(d.operacao==='expulsar')g.membros=g.membros.filter(m=>m!==membro);
    else{if(!Object.hasOwn(CARGOS,d.cargo)||CARGOS[d.cargo]>=autor)return falha('Cargo não permitido.');membro.cargo=d.cargo;}
   }else if(d.operacao==='editar'){
    if(autor<2)return falha('Somente líder e vice podem editar a guilda.');
    g.descricao=texto(d.descricao,300);g.aviso=texto(d.aviso,500);
   }else return falha('Operação de guilda inválida.');
  }
  this.revisao++;return{ok:true};
 }
 limparPendencias(id){for(const g of this.lista.values()){g.convites=g.convites.filter(v=>v!==id);g.solicitacoes=g.solicitacoes.filter(v=>v!==id);}}
 exportar(){return{serial:this.serial,revisao:this.revisao,guildas:structuredClone([...this.lista.values()])};}
 restaurar(s){
  this.lista.clear();this.serial=0;this.revisao=Number.isSafeInteger(s?.revisao)?s.revisao:0;const membros=new Set();
  for(const g of(Array.isArray(s?.guildas)?s.guildas:[]).slice(0,200)){
   if(!g||!/^guilda-\d+$/.test(g.id)||!Number.isSafeInteger(Number(g.id.slice(7)))||this.lista.has(g.id))continue;
   const liderSalvo=g.membros?.find(m=>m.cargo==='lider')?.id;
   const grupo=(Array.isArray(g.membros)?g.membros:[]).map(m=>({...m})).filter(m=>idValido(m.id)&&Object.hasOwn(CARGOS,m.cargo)&&!membros.has(m.id)&&membros.add(m.id)).slice(0,50);
   if(!grupo.length)continue;const liderId=grupo.some(m=>m.id===liderSalvo)?liderSalvo:grupo[0].id;grupo.forEach(m=>{if(m.id===liderId)m.cargo='lider';else if(m.cargo==='lider')m.cargo='vice';});
   // Preservar o líder salvo, inclusive após uma transferência.
   
   this.lista.set(g.id,{id:g.id,nome:texto(g.nome,40),sigla:texto(g.sigla,5),descricao:texto(g.descricao,300),emblema:['★','龍','☀','⚡'].includes(g.emblema)?g.emblema:'★',requisito:Number.isInteger(g.requisito)?Math.max(1,Math.min(100,g.requisito)):1,aviso:texto(g.aviso,500),membros:grupo.map(m=>({id:m.id,cargo:m.cargo})),solicitacoes:(Array.isArray(g.solicitacoes)?g.solicitacoes:[]).filter(idValido).slice(0,30),convites:(Array.isArray(g.convites)?g.convites:[]).filter(idValido).slice(0,30)});this.serial=Math.max(this.serial,Number(g.id.slice(7)));
  }
 }
}