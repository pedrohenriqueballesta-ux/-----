import {ITENS_NEGOCIAVEIS,MAX_ZENI_NORMAL} from '../../shared/sistemas/itens-negociaveis.mjs';
import {itemElegivelVendaNpc,itensVendaNpc,avaliarVendaNpc} from '../../shared/sistemas/venda-npc.mjs';
import {marcarItemInspecionavel,nomeComRaridade} from './hud-elementos.mjs';
import {descricaoItem} from '../../shared/sistemas/catalogo-itens.mjs';
import {limiteOferta,quantidadeAnunciavel,produtoMarket,ZENI_DOURADO_MARKET} from '../../shared/sistemas/mercado.mjs';
const criar=(tag,texto,classe)=>{const e=document.createElement(tag);if(texto!=null)e.textContent=texto;if(classe)e.className=classe;return e;};
const numero=n=>Number(n||0).toLocaleString('pt-BR');
const itens=Object.values(ITENS_NEGOCIAVEIS);
const rotulo=(texto,input)=>{const l=criar('label',texto);l.append(input);return l;};
const campo=(tipo,nome,min='0',max='99999')=>{const i=criar('input');i.type=tipo;i.min=min;i.max=max;i.step='1';i.value=min;i.setAttribute('aria-label',nome);return i;};
function figura(item){const d=produtoMarket(item),img=criar('img',null,'venda-icone');img.src=d.icone;img.alt='';return img;}
export function instalarVendas({janela,obterEstado,acao,avisar}){
 const painel=janela.querySelector('#shopVender'),npc=criar('section'),market=criar('section');market.hidden=true;
 const texto=criar('p','A venda em lote inclui itens comuns, incomuns e raros da mochila. Consumíveis são vendidos separadamente. Itens épicos ou superiores podem ser anunciados no Mercado dos jogadores.','venda-nota');
 const status=criar('p','', 'venda-status');status.setAttribute('role','status');
 const avulsa=criar('details'),gradeNpc=criar('div',null,'venda-grade');
 avulsa.append(criar('summary','Vender consumíveis'),gradeNpc);
 const venderTudo=janela.querySelector('#sellButton');
 const selecionarItens=criar('button','Selecionar itens');selecionarItens.type='button';
 const acoesNpc=criar('div',null,'venda-acoes-npc'),estimativa=criar('p','','venda-nota');
 acoesNpc.append(venderTudo,selecionarItens);npc.append(acoesNpc,estimativa,avulsa);
 const inventario=criar('dialog',null,'venda-selecao');
 inventario.id='vendaSelecaoDialog';inventario.dataset.janelaPai=janela.id;inventario.setAttribute('aria-labelledby','vendaSelecaoTitulo');
 const cabecalho=criar('header'),titulo=criar('h2','Inventário de venda');
 titulo.id='vendaSelecaoTitulo';
 const fechar=criar('button','×');fechar.type='button';fechar.setAttribute('aria-label','Fechar inventário de venda');
 fechar.onclick=()=>inventario.close();
 cabecalho.append(titulo,fechar);
 const gradeSelecao=criar('div',null,'venda-selecao-grade'),rodape=criar('footer');
 const totalSelecao=criar('strong'),statusSelecao=criar('p','','venda-status');
 statusSelecao.setAttribute('role','status');totalSelecao.setAttribute('aria-live','polite');
 const confirmar=criar('button','Vender apenas selecionados','primary');confirmar.type='button';
 rodape.append(totalSelecao,confirmar,statusSelecao);
 inventario.append(cabecalho,gradeSelecao,rodape);document.body.append(inventario);
 painel.append(texto,status,npc,market);
 const linhasNpc=[],cards=new Map(),quantidades=new Map();let ofertas=[],revisao=-1,carregando=false,repetirApos=0,pendenteAnuncio=false,pendenteSaldo=false;
 const executar=async(botao,dados,mensagem=status)=>{
  if(botao.dataset.pendente)return{ok:false};botao.dataset.pendente='true';botao.disabled=true;
  try{const r=await acao(dados);mensagem.textContent=r.ok?(dados.type==='sell'||dados.type==='venderSelecionados'?'Venda concluída · +'+numero(r.total)+' Z':'Operação concluída.'):r.reason||'Não foi possível concluir.';return r;}
  catch(e){mensagem.textContent=e.message||'Falha de conexão.';avisar(mensagem.textContent);return{ok:false};}
  finally{delete botao.dataset.pendente;atualizar();}
 };
 let vendaEmCurso=false;
 const linhasSelecao=new Map();
 const loteSelecionado=()=>Object.fromEntries([...linhasSelecao]
   .filter(([,linha])=>linha.marcado.checked).map(([id,linha])=>[id,Number(linha.qtd.value)]));
 const carteiraCheia=(s,total)=>(s.mercado?.carteiraReal??s.zeni)+total>MAX_ZENI_NORMAL;
 function sincronizarSelecao(s, lote) {
  if (!inventario.open) return;
  for (const [id,linha] of linhasSelecao) {
   if (lote[id]) continue;
   linha.row.remove();linhasSelecao.delete(id);
  }
  for (const [id,estoque] of Object.entries(lote)) {
   let linha=linhasSelecao.get(id);
   const d=ITENS_NEGOCIAVEIS[id];
   if (!linha) {
    const row=criar('article',null,'venda-selecao-item');row.dataset.vendaSelecaoItem=id;
    const marcado=criar('input');marcado.type='checkbox';
    const icone=figura(id);icone.dataset.ancoraInspecao='';
    const nome=nomeComRaridade(criar('strong',d.nome),id);
    const info=marcarItemInspecionavel(criar('span',null,'venda-selecao-info'),id);
    const preco=criar('small',numero(d.precoNpc)+' Z por unidade');
    const disponivel=criar('small');
    const qtd=campo('number','Quantidade de '+d.nome,'1',String(estoque));
    marcado.setAttribute('aria-label','Selecionar '+d.nome);
    info.append(icone,nome,preco,disponivel);row.append(marcado,info,qtd);
    linha={row,marcado,disponivel,qtd};linhasSelecao.set(id,linha);gradeSelecao.append(row);
    marcado.onchange=()=>{qtd.value=qtd.max;atualizar();};
    qtd.oninput=atualizar;
   }
   const {row,marcado,disponivel,qtd}=linha;
   if(Number(qtd.max)!==estoque){
    qtd.max=String(estoque);
    if(Number(qtd.value)>estoque)qtd.value=qtd.max;
   }
   marcado.disabled=vendaEmCurso;qtd.disabled=vendaEmCurso||!marcado.checked;
   disponivel.textContent=numero(estoque)+' na mochila';
   row.classList.toggle('selecionado',marcado.checked);
  }
  const proposta=avaliarVendaNpc(s.inventory,loteSelecionado());
  const limite=proposta.ok&&carteiraCheia(s,proposta.total);
  const vazio=linhasSelecao.size===0;
  totalSelecao.textContent=vazio?'Nenhum item elegível na mochila.':limite?'Saldo de Zeni no limite.':proposta.ok?numero(proposta.quantidade)+' itens · '+numero(proposta.total)+' Z':proposta.reason;
  confirmar.disabled=vendaEmCurso||!proposta.ok||limite;
 }
 venderTudo.onclick=async()=>{
  if(vendaEmCurso)return;
  vendaEmCurso=true;atualizar();
  try{await executar(venderTudo,{type:'sell'});}finally{vendaEmCurso=false;atualizar();}
 };
 selecionarItens.onclick=()=>{
  gradeSelecao.replaceChildren();linhasSelecao.clear();statusSelecao.textContent='';
  inventario.showModal();atualizar();
 };
 confirmar.onclick=async()=>{
  if(vendaEmCurso||confirmar.disabled)return;
  const itens=loteSelecionado();
  vendaEmCurso=true;atualizar();
  try{
   const r=await executar(confirmar,{type:'venderSelecionados',itens},statusSelecao);
   if(r.ok){
    status.textContent=statusSelecao.textContent;
    inventario.close();
   }
  }finally{vendaEmCurso=false;atualizar();}
 };
 janela.addEventListener('close',()=>{if(inventario.open)inventario.close();});
 for(const d of itens.filter(i=>Number.isFinite(i.precoNpc)&&!itemElegivelVendaNpc(i.id))){
  const row=criar('div',null,'venda-item');row.dataset.vendaItem=d.id;row.title=descricaoItem(d);
  const nome=criar('div'),qtd=campo('number','Quantidade de '+d.nome),slider=campo('range','Selecionar quantidade de '+d.nome),botao=criar('button','Vender');botao.type='button';
  const saldo=criar('small'),valor=criar('small',numero(d.precoNpc)+' Z por unidade');nome.append(nomeComRaridade(criar('strong',d.nome),d.id),valor,saldo);
  const controle=criar('div',null,'venda-quantidade');controle.append(slider,qtd);
  row.append(figura(d.id),nome,botao,controle);gradeNpc.append(row);
  const linha={d,row,qtd,slider,botao,saldo};linhasNpc.push(linha);
  slider.oninput=()=>{qtd.value=slider.value;atualizarNpc(linha);};
  qtd.oninput=()=>{if(Number(qtd.value)>=0)slider.value=qtd.value;atualizarNpc(linha);};
  qtd.onchange=()=>{qtd.value=String(Math.max(0,Math.min(Number(qtd.max),Math.floor(Number(qtd.value))||0)));atualizarNpc(linha);};
  botao.onclick=()=>executar(botao,{type:'venderItem',item:d.id,quantidade:Number(qtd.value)});
 }
 const saldoBox=criar('div',null,'mercado-saldo'),saldoTexto=criar('span'),receber=criar('button','Receber saldo');receber.type='button';saldoBox.append(saldoTexto,receber);
 receber.onclick=async()=>{if(pendenteSaldo)return;pendenteSaldo=true;await executar(receber,{type:'mercadoReceber'});pendenteSaldo=false;atualizar();};
 const abrirAnuncio=criar('button','Selecionar item para anunciar','primary');abrirAnuncio.type='button';
 const inventarioMarket=criar('dialog',null,'venda-selecao');
 inventarioMarket.id='mercadoSelecaoDialog';inventarioMarket.dataset.janelaPai=janela.id;
 inventarioMarket.setAttribute('aria-label','Inventário do Market');
 const cabecalhoMarket=criar('header'), fecharMarket=criar('button','×');
 fecharMarket.type='button';fecharMarket.setAttribute('aria-label','Fechar inventário do Market');fecharMarket.onclick=()=>inventarioMarket.close();
 cabecalhoMarket.append(criar('h2','Inventário do Market'),fecharMarket);
 const gradeMarket=criar('div',null,'venda-selecao-grade'), rodapeMarket=criar('footer');
 const formulario=criar('form',null,'mercado-anunciar');
 const quantidade=campo('number','Quantidade para anunciar','1'),controle=campo('range','Ajustar quantidade para anunciar','1');
 const preco=campo('number','Preço por unidade','1',String(MAX_ZENI_NORMAL)),anunciar=criar('button','Anunciar');
 anunciar.type='submit';
 const escolhido=criar('h3','Escolha um item'), resumoAnuncio=criar('p','','venda-nota'),statusMarket=criar('p','','venda-status');
 statusMarket.setAttribute('role','status');
 formulario.append(escolhido,rotulo('Quantidade',quantidade),controle,rotulo('Preço por unidade (Z)',preco),resumoAnuncio,anunciar);
 rodapeMarket.append(formulario,statusMarket);inventarioMarket.append(cabecalhoMarket,gradeMarket,rodapeMarket);document.body.append(inventarioMarket);
 janela.addEventListener('close',()=>{if(inventarioMarket.open)inventarioMarket.close();});
 const nota=criar('p','Anuncie da mochila ou das entregas da Store de qualquer lugar. Para comprar, cancelar ou receber Zeni, aproxime-se do mercador.','venda-nota');
 const barra=criar('div',null,'mercado-filtros'),busca=criar('input');busca.type='search';busca.placeholder='Buscar item ou vendedor';busca.setAttribute('aria-label','Buscar anúncios');
 const filtro=criar('select');filtro.setAttribute('aria-label','Filtrar anúncios');for(const[v,t]of [['todos','Todos os anúncios'],['meus','Meus anúncios']]){const o=criar('option',t);o.value=v;filtro.append(o);}
 const recarregar=criar('button','Atualizar');recarregar.type='button';barra.append(busca,filtro,recarregar);
 const lista=criar('div',null,'mercado-lista'),avisoLista=criar('p','Carregando mercado…','venda-nota');avisoLista.setAttribute('role','status');market.append(saldoBox,abrirAnuncio,nota,barra,avisoLista,lista);
 let selecionado=null, assinaturaMarket='';
 const selecaoMarket=s=>{
  const inventario={...s, entregasPremium:s.mercado?.entregasPremium, bonusPremium:{extensores:s.mercado?.extensores}};
  const entradas=[{id:ZENI_DOURADO_MARKET, origem:'carteira', estoque:s.mercado?.saldoPremium ?? 0}];
  for (const origem of ['mochila','entrega']) {
   for (const meta of itens) {
    const estoque=quantidadeAnunciavel(inventario,meta.id,origem);
    if (estoque) entradas.push({id:meta.id,origem,estoque});
   }
  }
  return entradas;
 };
 const chaveMarket=d=>d.origem+':'+d.id;
 const validarAnuncio=()=>{
  const max=selecionado?.estoque ?? 0, q=Number(quantidade.value), valor=Number(preco.value);
  quantidade.max=controle.max=String(Math.max(max,1));
  const valido=Number.isSafeInteger(q)&&q>=1&&q<=max&&Number.isSafeInteger(valor)&&valor>=1&&valor<=MAX_ZENI_NORMAL;
  controle.disabled=quantidade.disabled=preco.disabled=!max||pendenteAnuncio;
  anunciar.disabled=!valido||pendenteAnuncio;
  controle.value=String(Math.max(1, Math.min(max, q||1)));
  resumoAnuncio.textContent=valido?'Valor total · '+numero(q*valor)+' Z':'';
 };
 const atualizarInventarioMarket=s=>{
  if(!inventarioMarket.open)return;
  const entradas=selecaoMarket(s), assinatura=JSON.stringify([entradas,selecionado&&chaveMarket(selecionado)]);
  if(assinatura!==assinaturaMarket){
   assinaturaMarket=assinatura;
   selecionado=selecionado ? entradas.find(d=>chaveMarket(d)===chaveMarket(selecionado)) ?? null : null;
   escolhido.textContent=selecionado ? produtoMarket(selecionado.id).nome : 'Escolha um item';
   gradeMarket.replaceChildren(...entradas.map(d=>{
    const ativo=selecionado&&chaveMarket(d)===chaveMarket(selecionado);
    const card=criar('button',null,'venda-selecao-info mercado-inventario-item');
    card.type='button';card.dataset.marketItem=d.id;card.dataset.marketOrigem=d.origem;
    card.setAttribute('aria-pressed',String(Boolean(ativo)));card.disabled=pendenteAnuncio||!d.estoque;
    const nome=nomeComRaridade(criar('strong',produtoMarket(d.id).nome),d.id);
    const icone=figura(d.id);icone.dataset.ancoraInspecao='';
    card.append(icone,nome,criar('small',numero(d.estoque)+' disponíveis · '+({carteira:'Carteira',mochila:'Mochila',entrega:'Entrega da Store'})[d.origem]));
    marcarItemInspecionavel(card,d.id);
    card.onclick=()=>{
     selecionado=d;quantidade.value='1';
     const meta=produtoMarket(d.id);
     preco.value=String(meta.precoReferencia||1);
     statusMarket.textContent='';atualizarInventarioMarket(s);preco.focus();
    };
    return card;
   }));
  }
  validarAnuncio();
 };
 abrirAnuncio.onclick=()=>{selecionado=null;assinaturaMarket='';statusMarket.textContent='';inventarioMarket.showModal();atualizarInventarioMarket(obterEstado());};
 quantidade.oninput=preco.oninput=validarAnuncio;
 controle.oninput=()=>{quantidade.value=controle.value;validarAnuncio();};
 formulario.onsubmit=async e=>{
  e.preventDefault();validarAnuncio();if(anunciar.disabled)return;
  pendenteAnuncio=true;validarAnuncio();
  const r=await executar(anunciar,{type:'mercadoAnunciar',item:selecionado.id,origem:selecionado.origem,quantidade:Number(quantidade.value),preco:Number(preco.value)},statusMarket);
  pendenteAnuncio=false;
  if(r.ok){inventarioMarket.close();status.textContent='Anúncio publicado.';await carregar(true);}
  atualizar();
 };
 const atualizarNpc=l=>{
  const s=obterEstado();if(!s)return;const estoque=s.inventory[l.d.id]||0;l.row.hidden=!estoque;
  l.qtd.max=l.slider.max=String(Math.max(0,estoque));
  if(document.activeElement!==l.qtd&&(!Number.isSafeInteger(Number(l.qtd.value))||Number(l.qtd.value)<1||Number(l.qtd.value)>estoque))l.qtd.value=String(Math.max(0,Math.min(estoque,Math.floor(Number(l.qtd.value))||0)));
  const q=Number(l.qtd.value),total=q*l.d.precoNpc;l.slider.value=String(Math.max(0,q||0));l.saldo.textContent='Você possui '+numero(estoque);
  l.botao.textContent='Vender · '+numero(total)+' Z';l.botao.disabled=Boolean(l.botao.dataset.pendente)||!Number.isSafeInteger(q)||q<1||q>estoque||(s.mercado?.carteiraReal??s.zeni)+total>MAX_ZENI_NORMAL;
 };
 const atualizarCard=c=>{
  const s=obterEstado();if(!s||c.meu)return;
  const max=s.mercado?.pertoDoMercador ? limiteOferta(s,c.oferta) : 0;c.qtd.max=String(Math.max(0,max));
  if(document.activeElement!==c.qtd&&(!Number.isSafeInteger(Number(c.qtd.value))||Number(c.qtd.value)<1||Number(c.qtd.value)>max))c.qtd.value=String(Math.max(0,Math.min(max,Number(c.qtd.value)||0)));
  const q=Number(c.qtd.value);c.botao.disabled=Boolean(c.botao.dataset.pendente)||!Number.isSafeInteger(q)||q<1||q>max;c.botao.textContent='Comprar · '+numero(q*c.oferta.preco)+' Z';
 };
 const desenharLista=()=>{
  const s=obterEstado(),termo=busca.value.trim().toLocaleLowerCase('pt-BR'),minhaConta=s?.mercado?.conta;
  const filtradas=ofertas.filter(o=>produtoMarket(o.item)&&(filtro.value!=='meus'||o.vendedorId===minhaConta)&&(produtoMarket(o.item).nome+' '+o.vendedor).toLocaleLowerCase('pt-BR').includes(termo));
  const focado=document.activeElement?.closest('[data-oferta]')?.dataset.oferta;cards.clear();
  lista.replaceChildren(...filtradas.map(o=>{
   const row=criar('div',null,'mercado-oferta');row.dataset.oferta=o.id;row.title=o.item===ZENI_DOURADO_MARKET?'Moeda premium · recebida na carteira':descricaoItem(produtoMarket(o.item));const meu=o.vendedorId===minhaConta,nome=criar('div'),botao=criar('button',meu?'Cancelar anúncio':'Comprar');botao.type='button';
   nome.append(nomeComRaridade(criar('strong',produtoMarket(o.item).nome),o.item),criar('small',(meu?'Seu anúncio':o.vendedor)+' · '+numero(o.quantidade)+' disponíveis'),criar('small',numero(o.preco)+' Z por unidade'));
   row.append(figura(o.item),nome);const c={oferta:o,row,botao,meu};cards.set(o.id,c);
   if(meu){botao.onclick=async()=>{const r=await executar(botao,{type:'mercadoCancelar',id:o.id});if(r.ok)await carregar(true);};row.append(botao);}
   else{const qtd=campo('number','Quantidade de '+produtoMarket(o.item).nome+' no anúncio');qtd.value=quantidades.get(o.id)||'0';c.qtd=qtd;qtd.oninput=()=>{quantidades.set(o.id,qtd.value);atualizarCard(c);};botao.onclick=async()=>{const r=await executar(botao,{type:'mercadoComprar',id:o.id,quantidade:Number(qtd.value)});if(r.ok)await carregar(true);};const controles=criar('div',null,'mercado-comprar');controles.append(qtd,botao);row.append(controles);atualizarCard(c);}
   return row;
  }));
  avisoLista.textContent=filtradas.length?filtradas.length+' anúncios · atualização em tempo real':'Nenhum anúncio encontrado.';
  if(focado)cards.get(focado)?.qtd?.focus({preventScroll:true});
 };
 const carregar=async forcar=>{
  if(carregando||(!forcar&&Date.now()<repetirApos))return;carregando=true;recarregar.disabled=true;
  try{const r=await fetch('/api/mercado');if(!r.ok)throw new Error();const dados=await r.json();ofertas=dados.ofertas;revisao=dados.revisao;desenharLista();}
  catch{avisoLista.textContent='Não foi possível atualizar o mercado. Tente novamente.';repetirApos=Date.now()+3000;}
  finally{carregando=false;recarregar.disabled=false;}
 };
 busca.oninput=filtro.onchange=desenharLista;recarregar.onclick=()=>carregar(true);
 const atualizar=()=>{
  const s=obterEstado();if(!s||painel.hidden||!janela.open)return;
  if(!npc.hidden){
   const lote=itensVendaNpc(s.inventory),proposta=avaliarVendaNpc(s.inventory,lote);
   const limite=proposta.ok&&carteiraCheia(s,proposta.total);
   venderTudo.disabled=vendaEmCurso||!proposta.ok||limite;
   selecionarItens.disabled=vendaEmCurso||!proposta.ok;
   estimativa.textContent=limite?'Saldo de Zeni no limite. Selecione uma quantidade menor.':proposta.ok?numero(proposta.quantidade)+' itens elegíveis · '+numero(proposta.total)+' Z':proposta.reason;
   if(avulsa.open)for(const l of linhasNpc)atualizarNpc(l);
   sincronizarSelecao(s,lote);
  }
  if(!market.hidden){
   atualizarInventarioMarket(s);const saldo=s.mercado?.saldo||0,livre=MAX_ZENI_NORMAL-(s.mercado?.carteiraReal??s.zeni);
   saldoTexto.textContent='Saldo das suas vendas: '+numero(saldo)+' Z';receber.textContent='Receber '+numero(Math.max(0,Math.min(saldo,livre)))+' Z';receber.disabled=pendenteSaldo||!saldo||livre<=0||!s.mercado?.pertoDoMercador;
   if((s.mercado?.revisao??0)!==revisao)carregar(false);
   for(const c of cards.values()){if(c.meu)c.botao.disabled=Boolean(c.botao.dataset.pendente)||!s.mercado?.pertoDoMercador;else atualizarCard(c);}
  }
 };
 avulsa.addEventListener('toggle',atualizar);
 const modo=tipo=>{if(inventario.open)inventario.close();if(inventarioMarket.open)inventarioMarket.close();npc.hidden=tipo!=='npc';market.hidden=tipo!=='market';texto.hidden=tipo!=='npc';atualizar();};
 modo('comprar');
 return{atualizar,modo};
}
