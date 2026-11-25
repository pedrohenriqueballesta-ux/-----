import {el,botao,numero,marcarItemInspecionavel} from './hud-elementos.mjs';
import {criarPainelPremium,precoReais} from './premium-comum.mjs';
export function instalarStore(ctx){
 const ui=criarPainelPremium('storeDialog','Store',ctx);let categoria='moedas';
 const quantidades = new Map();
 for(const [id,nome]of [['moedas','Moedas'],['vip','VIP'],['itens','Itens especiais'],['beneficios','Bônus e extensores'],['passe','Passes'],['colecao','Minha coleção'],['historico','Histórico']]){
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
  if (categoria === 'beneficios') {
   ui.corpo.append(el('p', 'Os itens vão para a mochila. Use quando quiser ou anuncie no Market. Se a mochila estiver cheia, recolha a compra aqui quando tiver espaço.', 'premium-nota'));
  }
  const grade=el('div',null,'premium-grade');ui.corpo.append(grade);
  if(categoria==='colecao'){
   ui.corpo.prepend(el('p','Itens pertencem à conta. A Nimbus pode ser ativada gratuitamente na aba Personagem. Equipar os demais cosméticos depende dos sistemas visuais futuros.','premium-nota'));
   if(!s.colecao.length)grade.append(el('p','Sua coleção está vazia.'));
   for(const item of s.colecao){const card=el('article',null,'premium-card'),img=el('img');img.src=item.imagem;img.alt='';card.append(img,el('h3',item.nome),el('p',item.tipo+' · adquirido'));grade.append(card);}return;
  }
  for(const p of s.produtos.filter(p=>p.categoria===categoria)){
   const card=el('article',null,'premium-card'),img=el('img');img.src=p.imagem;img.alt='';img.loading='lazy';
   const quantidade = p.item ? el('input') : null;
   const max = Math.max(1, p.maxQuantidade ?? 1);
   const preco = el('strong');
   const comprar=botao(p.moedas?'Simular recarga':'Comprar',()=>ui.comprar(p.id, quantidade ? Number(quantidade.value) : 1));
   comprar.dataset.produto=p.id;
   function atualizarPreco() {
    const qtd = quantidade ? Number(quantidade.value) : 1;
    const valida = Number.isInteger(qtd) && qtd >= 1 && qtd <= max;
    comprar.disabled = Boolean(p.impedimento) || !valida;
    preco.textContent = p.moedas ? precoReais(p.precoCentavos)+' · simulação'
     : valida ? numero(qtd * p.preco)+' moedas premium' : 'Quantidade inválida';
   }
   card.append(img,el('h3',p.nome),el('p',p.descricao));
   if (quantidade) {
    quantidade.type='number'; quantidade.min='1'; quantidade.max=String(max); quantidade.step='1';
    quantidade.value=String(Math.min(quantidades.get(p.id) ?? 1,max));
    quantidade.disabled=Boolean(p.impedimento);
    quantidade.setAttribute('aria-label','Quantidade de '+p.nome);
    quantidade.oninput=()=>{quantidades.set(p.id,Number(quantidade.value)||1);atualizarPreco();};
    const rotulo=el('label','Quantidade','premium-quantidade');rotulo.append(quantidade);card.append(rotulo);
   }
   card.append(preco,comprar);
   atualizarPreco();
   if (p.item) {
    marcarItemInspecionavel(card, p.item);
    const pendentes = s.entregasPremium?.[p.item] || 0;
    if (pendentes) {
     const recolher = botao('Recolher da Store', () => ui.executar({ operacao: 'recolherEntrega', item: p.item }));
     recolher.dataset.recolherItem = p.item;
     card.append(el('small', 'Entrega pendente · ' + numero(pendentes)), recolher);
    }
   }
   if(p.requerVip)card.append(el('small','Exclusivo VIP'));
   if(p.impedimento)card.append(el('small',p.impedimento));grade.append(card);
  }
 }
 ui.setRender(desenhar);return ui.abrir;
}
