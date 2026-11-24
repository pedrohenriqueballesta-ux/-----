import {CONFIG} from '../../shared/nucleo/config.mjs';
import {ITENS_NEGOCIAVEIS,MAX_ZENI_NORMAL} from '../../shared/sistemas/itens-negociaveis.mjs';
import {itemElegivelVendaNpc,itensVendaNpc,avaliarVendaNpc} from '../../shared/sistemas/venda-npc.mjs';
import {marcarItemInspecionavel,nomeComRaridade} from './hud-elementos.mjs';
import {descricaoItem} from '../../shared/sistemas/catalogo-itens.mjs';
import {limiteOferta} from '../../shared/sistemas/mercado.mjs';
const criar=(tag,texto,classe)=>{const e=document.createElement(tag);if(texto!=null)e.textContent=texto;if(classe)e.className=classe;return e;};
const numero=n=>Number(n||0).toLocaleString('pt-BR');
const itens=Object.values(ITENS_NEGOCIAVEIS);
const rotulo=(texto,input)=>{const l=criar('label',texto);l.append(input);return l;};
const campo=(tipo,nome,min='0',max='99999')=>{const i=criar('input');i.type=tipo;i.min=min;i.max=max;i.step='1';i.value=min;i.setAttribute('aria-label',nome);return i;};
function figura(item){const d=ITENS_NEGOCIAVEIS[item],img=criar('img',null,'venda-icone');img.src=d.icone;img.alt='';return img;}
export function instalarVendas({janela,obterEstado,acao,avisar}){
 const painel=janela.querySelector('#shopVender'),npc=criar('section'),market=criar('section');market.hidden=true;
 const navegacao=criar('div',null,'venda-modos'),btnNpc=criar('button','Vender ao NPC'),btnMarket=criar('button','Mercado dos jogadores');
 for(const b of [btnNpc,btnMarket])b.type='button';navegacao.append(btnNpc,btnMarket);
 const texto=criar('p','A venda em lote inclui itens comuns, incomuns e raros da mochila. Consumíveis ficam de fora.','venda-nota');
 const status=criar('p','', 'venda-status');status.setAttribute('role','status');
 const avulsa=criar('details'),gradeNpc=criar('div',null,'venda-grade');
 avulsa.append(criar('summary','Venda avulsa de consumíveis e peças especiais'),gradeNpc);
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
 painel.append(navegacao,texto,status,npc,market);
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
 for(const d of itens.filter(i=>!itemElegivelVendaNpc(i.id))){
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
 const formulario=criar('form',null,'mercado-anunciar'),selecionar=criar('select');selecionar.setAttribute('aria-label','Item para anunciar');
 const quantidade=campo('number','Quantidade para anunciar'),preco=campo('number','Preço por unidade','1',String(MAX_ZENI_NORMAL)),anunciar=criar('button','Anunciar itens');anunciar.type='submit';
 formulario.append(criar('h3','Criar anúncio'),rotulo('Item',selecionar),rotulo('Quantidade',quantidade),rotulo('Preço por unidade (Z)',preco),anunciar);
 const nota=criar('p','Sem taxa. Itens anunciados ficam reservados. Para cancelar, deixe espaço na mochila para recebê-los. As vendas continuam mesmo desconectado.','venda-nota');
 const barra=criar('div',null,'mercado-filtros'),busca=criar('input');busca.type='search';busca.placeholder='Buscar item ou vendedor';busca.setAttribute('aria-label','Buscar anúncios');
 const filtro=criar('select');filtro.setAttribute('aria-label','Filtrar anúncios');for(const[v,t]of [['todos','Todos os anúncios'],['meus','Meus anúncios']]){const o=criar('option',t);o.value=v;filtro.append(o);}
 const recarregar=criar('button','Atualizar');recarregar.type='button';barra.append(busca,filtro,recarregar);
 const lista=criar('div',null,'mercado-lista'),avisoLista=criar('p','Carregando mercado…','venda-nota');avisoLista.setAttribute('role','status');market.append(saldoBox,formulario,nota,barra,avisoLista,lista);
 const validarAnuncio=()=>{
  const s=obterEstado(),q=Number(quantidade.value),p=Number(preco.value),max=s?.inventory?.[selecionar.value]||0;
  quantidade.max=String(Math.max(0,max));
  if(document.activeElement!==quantidade&&q>max&&max)quantidade.value=String(max);
  anunciar.disabled=pendenteAnuncio||!max||!Number.isSafeInteger(Number(quantidade.value))||Number(quantidade.value)<1||Number(quantidade.value)>max||!Number.isSafeInteger(p)||p<1||p>MAX_ZENI_NORMAL;
 };
 selecionar.onchange=()=>{preco.value=String(CONFIG.prices[selecionar.value]||ITENS_NEGOCIAVEIS[selecionar.value]?.precoReferencia||ITENS_NEGOCIAVEIS[selecionar.value]?.precoNpc*2||0);quantidade.value='0';validarAnuncio();};
 quantidade.oninput=preco.oninput=validarAnuncio;
 formulario.onsubmit=async e=>{e.preventDefault();validarAnuncio();if(anunciar.disabled)return;pendenteAnuncio=true;const r=await executar(anunciar,{type:'mercadoAnunciar',item:selecionar.value,quantidade:Number(quantidade.value),preco:Number(preco.value)});pendenteAnuncio=false;if(r.ok)await carregar(true);atualizar();};
 const atualizarNpc=l=>{
  const s=obterEstado();if(!s)return;const estoque=s.inventory[l.d.id]||0;l.row.hidden=!estoque;
  l.qtd.max=l.slider.max=String(Math.max(0,estoque));
  if(document.activeElement!==l.qtd&&(!Number.isSafeInteger(Number(l.qtd.value))||Number(l.qtd.value)<1||Number(l.qtd.value)>estoque))l.qtd.value=String(Math.max(0,Math.min(estoque,Math.floor(Number(l.qtd.value))||0)));
  const q=Number(l.qtd.value),total=q*l.d.precoNpc;l.slider.value=String(Math.max(0,q||0));l.saldo.textContent='Você possui '+numero(estoque);
  l.botao.textContent='Vender · '+numero(total)+' Z';l.botao.disabled=Boolean(l.botao.dataset.pendente)||!Number.isSafeInteger(q)||q<1||q>estoque||(s.mercado?.carteiraReal??s.zeni)+total>MAX_ZENI_NORMAL;
 };
 const atualizarCard=c=>{
  const s=obterEstado();if(!s||c.meu)return;
  const max=limiteOferta(s,c.oferta);c.qtd.max=String(Math.max(0,max));
  if(document.activeElement!==c.qtd&&(!Number.isSafeInteger(Number(c.qtd.value))||Number(c.qtd.value)<1||Number(c.qtd.value)>max))c.qtd.value=String(Math.max(0,Math.min(max,Number(c.qtd.value)||0)));
  const q=Number(c.qtd.value);c.botao.disabled=Boolean(c.botao.dataset.pendente)||!Number.isSafeInteger(q)||q<1||q>max;c.botao.textContent='Comprar · '+numero(q*c.oferta.preco)+' Z';
 };
 const desenharLista=()=>{
  const s=obterEstado(),termo=busca.value.trim().toLocaleLowerCase('pt-BR'),minhaConta=s?.mercado?.conta;
  const filtradas=ofertas.filter(o=>ITENS_NEGOCIAVEIS[o.item]&&(filtro.value!=='meus'||o.vendedorId===minhaConta)&&(ITENS_NEGOCIAVEIS[o.item].nome+' '+o.vendedor).toLocaleLowerCase('pt-BR').includes(termo));
  const focado=document.activeElement?.closest('[data-oferta]')?.dataset.oferta;cards.clear();
  lista.replaceChildren(...filtradas.map(o=>{
   const row=criar('div',null,'mercado-oferta');row.dataset.oferta=o.id;row.title=descricaoItem(ITENS_NEGOCIAVEIS[o.item]);const meu=o.vendedorId===minhaConta,nome=criar('div'),botao=criar('button',meu?'Cancelar anúncio':'Comprar');botao.type='button';
   nome.append(nomeComRaridade(criar('strong',ITENS_NEGOCIAVEIS[o.item].nome),o.item),criar('small',(meu?'Seu anúncio':o.vendedor)+' · '+numero(o.quantidade)+' disponíveis'),criar('small',numero(o.preco)+' Z por unidade'));
   row.append(figura(o.item),nome);const c={oferta:o,row,botao,meu};cards.set(o.id,c);
   if(meu){botao.onclick=async()=>{const r=await executar(botao,{type:'mercadoCancelar',id:o.id});if(r.ok)await carregar(true);};row.append(botao);}
   else{const qtd=campo('number','Quantidade de '+ITENS_NEGOCIAVEIS[o.item].nome+' no anúncio');qtd.value=quantidades.get(o.id)||'0';c.qtd=qtd;qtd.oninput=()=>{quantidades.set(o.id,qtd.value);atualizarCard(c);};botao.onclick=async()=>{const r=await executar(botao,{type:'mercadoComprar',id:o.id,quantidade:Number(qtd.value)});if(r.ok)await carregar(true);};const controles=criar('div',null,'mercado-comprar');controles.append(qtd,botao);row.append(controles);atualizarCard(c);}
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
 let assinaturaItens='';
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
   const disponiveis=itens.filter(i=>s.inventory[i.id]>0),assinatura=disponiveis.map(i=>i.id).join(',');
   if(assinatura!==assinaturaItens){const anterior=selecionar.value;selecionar.replaceChildren(...disponiveis.map(d=>{const o=criar('option',d.nome);o.value=d.id;return o;}));if(disponiveis.some(d=>d.id===anterior))selecionar.value=anterior;else selecionar.onchange();assinaturaItens=assinatura;}
   validarAnuncio();const saldo=s.mercado?.saldo||0,livre=MAX_ZENI_NORMAL-(s.mercado?.carteiraReal??s.zeni);
   saldoTexto.textContent='Saldo das suas vendas: '+numero(saldo)+' Z';receber.textContent='Receber '+numero(Math.max(0,Math.min(saldo,livre)))+' Z';receber.disabled=pendenteSaldo||!saldo||livre<=0;
   if((s.mercado?.revisao??0)!==revisao)carregar(false);
   for(const c of cards.values())atualizarCard(c);
  }
 };
 avulsa.addEventListener('toggle',atualizar);
 const modo=tipo=>{if(inventario.open)inventario.close();npc.hidden=tipo!=='npc';market.hidden=tipo!=='market';texto.hidden=tipo!=='npc';btnNpc.classList.toggle('ativa',tipo==='npc');btnMarket.classList.toggle('ativa',tipo==='market');atualizar();};
 btnNpc.onclick=()=>modo('npc');btnMarket.onclick=()=>modo('market');modo('npc');
 return{atualizar};
}
