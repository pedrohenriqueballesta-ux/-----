import {el,botao,numero} from './hud-elementos.mjs';
import {criarPainelPremium,precoReais} from './premium-comum.mjs';
export function instalarStore(ctx){
 const ui=criarPainelPremium('storeDialog','Store',ctx);let categoria='moedas';
 for(const [id,nome]of [['moedas','Moedas'],['vip','VIP'],['itens','Itens especiais'],['passe','Passes'],['colecao','Minha coleção'],['historico','Histórico']]){
  const b=botao(nome,()=>{categoria=id;if(ui.estado)desenhar(ui.estado);});b.dataset.categoria=id;ui.nav.append(b);
 }
 function desenhar(s){
  for(const b of ui.nav.children)b.setAttribute('aria-pressed',String(b.dataset.categoria===categoria));ui.corpo.replaceChildren();
  ui.corpo.append(el('p',s.simulacao?'Ambiente de desenvolvimento · recargas simuladas, sem cobrança real. Preços iniciais de protótipo.':'Pagamentos reais ainda não estão disponíveis. Recargas simuladas estão desativadas neste ambiente.','premium-nota'));
  if(categoria==='historico'){
   ui.corpo.append(el('h3','Últimas '+s.historico.length+' de '+s.totalTransacoes+' transações'));
   if(!s.historico.length)ui.corpo.append(el('p','Nenhuma transação realizada.'));
   for(const t of s.historico){const a=el('article',null,'premium-historico');a.append(el('strong',t.nome),el('p',(t.moedasDelta>0?'+':'')+numero(t.moedasDelta)+' moedas · '+t.personagem),el('small',new Date(t.quando).toLocaleString('pt-BR')+(t.simulada?' · SIMULADA · '+precoReais(t.precoCentavos):'')));ui.corpo.append(a);}return;
  }
  const grade=el('div',null,'premium-grade');ui.corpo.append(grade);
  if(categoria==='colecao'){
   ui.corpo.prepend(el('p','Itens pertencem à conta. Equipar skins, efeitos e montarias depende dos sistemas visuais futuros.','premium-nota'));
   if(!s.colecao.length)grade.append(el('p','Sua coleção está vazia.'));
   for(const item of s.colecao){const card=el('article',null,'premium-card'),img=el('img');img.src=item.imagem;img.alt='';card.append(img,el('h3',item.nome),el('p',item.tipo+' · adquirido'));grade.append(card);}return;
  }
  for(const p of s.produtos.filter(p=>p.categoria===categoria)){
   const card=el('article',null,'premium-card'),img=el('img');img.src=p.imagem;img.alt='';img.loading='lazy';
   const comprar=botao(p.moedas?'Simular recarga':'Comprar',()=>ui.comprar(p.id));comprar.disabled=Boolean(p.impedimento);comprar.dataset.produto=p.id;
   card.append(img,el('h3',p.nome),el('p',p.descricao),el('strong',p.moedas?precoReais(p.precoCentavos)+' · simulação':numero(p.preco)+' moedas premium'),comprar);
   if(p.requerVip)card.append(el('small','Exclusivo VIP'));
   if(p.impedimento)card.append(el('small',p.impedimento));grade.append(card);
  }
 }
 ui.setRender(desenhar);return ui.abrir;
}
