import {CONFIG} from '../shared/config.mjs';
import {ITENS_NEGOCIAVEIS,MAX_ZENI_NORMAL} from '../shared/itens-negociaveis.mjs';
import {limiteOferta} from '../shared/mercado.mjs';
const criar=(tag,texto,classe)=>{const e=document.createElement(tag);if(texto!=null)e.textContent=texto;if(classe)e.className=classe;return e;};
const numero=n=>Number(n||0).toLocaleString('pt-BR');
const itens=Object.values(ITENS_NEGOCIAVEIS);
const rotulo=(texto,input)=>{const l=criar('label',texto);l.append(input);return l;};
const campo=(tipo,nome,min='1',max='99999')=>{const i=criar('input');i.type=tipo;i.min=min;i.max=max;i.step='1';i.value='1';i.setAttribute('aria-label',nome);return i;};
function figura(item){const d=ITENS_NEGOCIAVEIS[item],img=criar('img',null,'venda-icone');img.src=d.icone;img.alt='';return img;}
export function instalarVendas({janela,obterEstado,acao,avisar}){
 const painel=janela.querySelector('#shopVender'),npc=criar('section'),market=criar('section');market.hidden=true;
 const navegacao=criar('div',null,'venda-modos'),btnNpc=criar('button','Vender ao NPC'),btnMarket=criar('button','Mercado dos jogadores');
 for(const b of [btnNpc,btnMarket])b.type='button';navegacao.append(btnNpc,btnMarket);
 const texto=criar('p','NPC paga 50% do preço de compra dos consumíveis. Materiais mantêm os valores fixos.','venda-nota');
 const status=criar('p','', 'venda-status');status.setAttribute('role','status');
 const gradeNpc=criar('div',null,'venda-grade');npc.append(gradeNpc);
 const venderMateriais=janela.querySelector('#sellButton');npc.append(venderMateriais);
 painel.append(navegacao,texto,status,npc,market);
 const linhasNpc=[],cards=new Map(),quantidades=new Map();let ofertas=[],revisao=-1,carregando=false,repetirApos=0,pendenteAnuncio=false,pendenteSaldo=false;
 const executar=async(botao,dados)=>{
  if(botao.dataset.pendente)return{ok:false};botao.dataset.pendente='true';botao.disabled=true;
  try{const r=await acao(dados);status.textContent=r.ok?'Operação concluída.':r.reason||'Não foi possível concluir.';return r;}
  catch(e){status.textContent=e.message||'Falha de conexão.';avisar(status.textContent);return{ok:false};}
  finally{delete botao.dataset.pendente;atualizar();}
 };
 for(const d of itens){
  const row=criar('div',null,'venda-item');row.dataset.vendaItem=d.id;
  const nome=criar('div'),qtd=campo('number','Quantidade de '+d.nome),slider=campo('range','Selecionar quantidade de '+d.nome),botao=criar('button','Vender');botao.type='button';
  const saldo=criar('small'),valor=criar('small',numero(d.precoNpc)+' Z por unidade');nome.append(criar('strong',d.nome),valor,saldo);
  const controle=criar('div',null,'venda-quantidade');controle.append(slider,qtd);
  row.append(figura(d.id),nome,botao,controle);gradeNpc.append(row);
  const linha={d,row,qtd,slider,botao,saldo};linhasNpc.push(linha);
  slider.oninput=()=>{qtd.value=slider.value;atualizarNpc(linha);};
  qtd.oninput=()=>{if(Number(qtd.value)>=1)slider.value=qtd.value;atualizarNpc(linha);};
  qtd.onchange=()=>{qtd.value=String(Math.max(1,Math.min(Number(qtd.max),Math.floor(Number(qtd.value))||1)));atualizarNpc(linha);};
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
  quantidade.max=String(Math.max(1,max));
  if(document.activeElement!==quantidade&&q>max&&max)quantidade.value=String(max);
  anunciar.disabled=pendenteAnuncio||!max||!Number.isSafeInteger(Number(quantidade.value))||Number(quantidade.value)<1||Number(quantidade.value)>max||!Number.isSafeInteger(p)||p<1||p>MAX_ZENI_NORMAL;
 };
 selecionar.onchange=()=>{preco.value=String(CONFIG.prices[selecionar.value]||ITENS_NEGOCIAVEIS[selecionar.value]?.precoNpc*2||1);quantidade.value='1';validarAnuncio();};
 quantidade.oninput=preco.oninput=validarAnuncio;
 formulario.onsubmit=async e=>{e.preventDefault();validarAnuncio();if(anunciar.disabled)return;pendenteAnuncio=true;const r=await executar(anunciar,{type:'mercadoAnunciar',item:selecionar.value,quantidade:Number(quantidade.value),preco:Number(preco.value)});pendenteAnuncio=false;if(r.ok)await carregar(true);atualizar();};
 const atualizarNpc=l=>{
  const s=obterEstado();if(!s)return;const estoque=s.inventory[l.d.id]||0;l.row.hidden=!estoque;
  l.qtd.max=l.slider.max=String(Math.max(1,estoque));
  if(document.activeElement!==l.qtd&&(!Number.isSafeInteger(Number(l.qtd.value))||Number(l.qtd.value)<1||Number(l.qtd.value)>estoque))l.qtd.value=String(Math.max(1,Math.min(estoque,Math.floor(Number(l.qtd.value))||1)));
  const q=Number(l.qtd.value),total=q*l.d.precoNpc;l.slider.value=String(Math.max(1,q||1));l.saldo.textContent='Você possui '+numero(estoque);
  l.botao.textContent='Vender · '+numero(total)+' Z';l.botao.disabled=Boolean(l.botao.dataset.pendente)||!Number.isSafeInteger(q)||q<1||q>estoque||(s.mercado?.carteiraReal??s.zeni)+total>MAX_ZENI_NORMAL;
 };
 const atualizarCard=c=>{
  const s=obterEstado();if(!s||c.meu)return;
  const max=limiteOferta(s,c.oferta);c.qtd.max=String(Math.max(1,max));
  if(document.activeElement!==c.qtd&&(!Number.isSafeInteger(Number(c.qtd.value))||Number(c.qtd.value)<1||Number(c.qtd.value)>max))c.qtd.value=String(Math.max(1,Math.min(max,Number(c.qtd.value)||1)));
  const q=Number(c.qtd.value);c.botao.disabled=Boolean(c.botao.dataset.pendente)||!Number.isSafeInteger(q)||q<1||q>max;c.botao.textContent='Comprar · '+numero(q*c.oferta.preco)+' Z';
 };
 const desenharLista=()=>{
  const s=obterEstado(),termo=busca.value.trim().toLocaleLowerCase('pt-BR'),minhaConta=s?.mercado?.conta;
  const filtradas=ofertas.filter(o=>ITENS_NEGOCIAVEIS[o.item]&&(filtro.value!=='meus'||o.vendedorId===minhaConta)&&(ITENS_NEGOCIAVEIS[o.item].nome+' '+o.vendedor).toLocaleLowerCase('pt-BR').includes(termo));
  const focado=document.activeElement?.closest('[data-oferta]')?.dataset.oferta;cards.clear();
  lista.replaceChildren(...filtradas.map(o=>{
   const row=criar('div',null,'mercado-oferta');row.dataset.oferta=o.id;const meu=o.vendedorId===minhaConta,nome=criar('div'),botao=criar('button',meu?'Cancelar anúncio':'Comprar');botao.type='button';
   nome.append(criar('strong',ITENS_NEGOCIAVEIS[o.item].nome),criar('small',(meu?'Seu anúncio':o.vendedor)+' · '+numero(o.quantidade)+' disponíveis'),criar('small',numero(o.preco)+' Z por unidade'));
   row.append(figura(o.item),nome);const c={oferta:o,row,botao,meu};cards.set(o.id,c);
   if(meu){botao.onclick=async()=>{const r=await executar(botao,{type:'mercadoCancelar',id:o.id});if(r.ok)await carregar(true);};row.append(botao);}
   else{const qtd=campo('number','Quantidade de '+ITENS_NEGOCIAVEIS[o.item].nome+' no anúncio');qtd.value=quantidades.get(o.id)||'1';c.qtd=qtd;qtd.oninput=()=>{quantidades.set(o.id,qtd.value);atualizarCard(c);};botao.onclick=async()=>{const r=await executar(botao,{type:'mercadoComprar',id:o.id,quantidade:Number(qtd.value)});if(r.ok)await carregar(true);};const controles=criar('div',null,'mercado-comprar');controles.append(qtd,botao);row.append(controles);atualizarCard(c);}
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
  for(const l of linhasNpc)atualizarNpc(l);
  venderMateriais.disabled=!(s.inventory.scrap||s.inventory.crystal);
  if(!market.hidden){
   const disponiveis=itens.filter(i=>s.inventory[i.id]>0),assinatura=disponiveis.map(i=>i.id).join(',');
   if(assinatura!==assinaturaItens){const anterior=selecionar.value;selecionar.replaceChildren(...disponiveis.map(d=>{const o=criar('option',d.nome);o.value=d.id;return o;}));if(disponiveis.some(d=>d.id===anterior))selecionar.value=anterior;else selecionar.onchange();assinaturaItens=assinatura;}
   validarAnuncio();const saldo=s.mercado?.saldo||0,livre=MAX_ZENI_NORMAL-(s.mercado?.carteiraReal??s.zeni);
   saldoTexto.textContent='Saldo das suas vendas: '+numero(saldo)+' Z';receber.textContent='Receber '+numero(Math.max(0,Math.min(saldo,livre)))+' Z';receber.disabled=pendenteSaldo||!saldo||livre<=0;
   if((s.mercado?.revisao??0)!==revisao)carregar(false);
   for(const c of cards.values())atualizarCard(c);
  }
 };
 const modo=tipo=>{npc.hidden=tipo!=='npc';market.hidden=tipo!=='market';texto.hidden=tipo!=='npc';btnNpc.classList.toggle('ativa',tipo==='npc');btnMarket.classList.toggle('ativa',tipo==='market');atualizar();};
 btnNpc.onclick=()=>modo('npc');btnMarket.onclick=()=>modo('market');modo('npc');
 return{atualizar};
}
