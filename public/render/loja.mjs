import { instalarVendas } from './vendas.mjs';
import { CONFIG } from '../shared/config.mjs';
import { limiteCompra, avaliarCarrinho } from '../shared/loja.mjs';
const NOMES={food:'Presunto',ki:'Poção de Ki',...Object.fromEntries(CONFIG.seedPotencies.map(n=>['seed'+n,'Semente '+n+'%']))};
const criar=(tag,texto,classe)=>{const e=document.createElement(tag);if(texto!=null)e.textContent=texto;if(classe)e.className=classe;return e;};
const numero=n=>Number(n).toLocaleString('pt-BR',{maximumFractionDigits:2});
export function instalarLoja({janela,obterEstado,comprar,avisar}) {
  const grade=janela.querySelector('#shopItems'),recursos=janela.querySelector('#shopResources'),linhas=[];
  let comprando=false;
  const selecao=()=>Object.fromEntries(linhas.map(l=>[l.item,l.campo.value===''?NaN:Number(l.campo.value)]));
  const comprarTudo=criar('button','Comprar tudo','primary'),resumo=criar('p','','shop-resources');comprarTudo.id='shopBuyAll';comprarTudo.type='button';janela.querySelector('#shopComprar').append(resumo,comprarTudo);
  const atualizarLinha=linha=>{
    const s=obterEstado();if(!s)return;
    const maximo=limiteCompra(s,linha.item),limite=Math.max(0,maximo);
    linha.slider.max=linha.campo.max=String(limite);linha.slider.disabled=!maximo||comprando||linha.pendente;linha.campo.disabled=comprando||linha.pendente;
    let qtd=Number(linha.campo.value);
    if(document.activeElement!==linha.campo && (!Number.isSafeInteger(qtd)||qtd<0||qtd>limite)){qtd=Math.max(0,Math.min(Number.isFinite(qtd)?Math.floor(qtd):0,limite));linha.campo.value=String(qtd);}
    const valida=Number.isSafeInteger(qtd)&&qtd>=1&&qtd<=maximo;
    if(Number.isSafeInteger(qtd)&&qtd>=0)linha.slider.value=String(Math.min(qtd,limite));
    linha.botao.disabled=comprando||linha.pendente||!valida;
    linha.botao.textContent=linha.pendente?'Comprando…':'Comprar · '+(Number.isSafeInteger(qtd)&&qtd>0?numero(qtd*CONFIG.prices[linha.item]):'—')+' Z';
    linha.limite.textContent='Máximo agora: '+numero(maximo)+' · '+numero(CONFIG.itemWeights[linha.item]*(Number.isSafeInteger(qtd)&&qtd>0?qtd:0))+' kg';
    linha.campo.setAttribute('aria-invalid',String(!Number.isSafeInteger(qtd)||qtd<0||qtd>maximo));
    linha.slider.setAttribute('aria-valuetext',linha.slider.value+' unidades');
  };
  for(const[item,preco]of Object.entries(CONFIG.prices)){
    const row=criar('div',null,'shop-item');row.dataset.itemLoja=item;
    const figura=criar('div',null,'shop-item-figura'),img=criar('img');
    img.src='/assets/inventario/'+(item==='food'?'comida':item==='ki'?'pocao_ki':'semente_dos_deuses')+'.png';img.alt='';figura.append(img);
    if(item.startsWith('seed'))figura.append(criar('small',item.slice(4)+'%'));
    const nome=criar('div',null,'shop-item-nome');nome.append(criar('strong',NOMES[item]),criar('small',numero(preco)+' Z por unidade'));
    const botao=criar('button','Comprar');botao.type='button';botao.className='shop-comprar';
    const controles=criar('div',null,'shop-quantidade'),slider=criar('input'),campo=criar('input');
    slider.type='range';slider.min='0';slider.max='1';slider.step='1';slider.value='0';slider.setAttribute('aria-label','Quantidade de '+NOMES[item]);
    campo.type='number';campo.min='0';campo.max='1';campo.step='1';campo.value='0';campo.inputMode='numeric';campo.setAttribute('aria-label','Digitar quantidade de '+NOMES[item]);
    controles.append(slider,campo);
    const limite=criar('small',null,'shop-item-limite');
    const linha={item,row,slider,campo,botao,limite,pendente:false};linhas.push(linha);
    slider.oninput=()=>{campo.value=slider.value;atualizar();};
    campo.oninput=()=>{const qtd=Number(campo.value),max=Math.max(0,limiteCompra(obterEstado(),item));if(Number.isSafeInteger(qtd)&&qtd>=0){campo.value=String(Math.min(qtd,max));slider.value=campo.value;}atualizar();};
    campo.onchange=()=>{const max=Math.max(0,limiteCompra(obterEstado(),item));campo.value=String(Math.max(0,Math.min(Math.floor(Number(campo.value))||0,max)));atualizar();};
    botao.onclick=async()=>{
      if(comprando||linha.pendente||!campo.checkValidity())return;
      const quantidade=Number(campo.value);if(quantidade<1||quantidade>limiteCompra(obterEstado(),item))return;
      linha.pendente=true;comprando=true;atualizar();
      try{const r=await comprar({type:'buy',item,quantidade});if(!r.ok)janela.querySelector('#shopNotice').textContent=r.reason||'Não foi possível comprar.';}
      catch(e){avisar(e.message||'Não foi possível comprar.');}
      finally{linha.pendente=false;comprando=false;atualizar();}
    };
    row.append(figura,nome,botao,controles,limite);grade.append(row);
  }
  comprarTudo.onclick=async()=>{
    if(comprando)return;
    const itens=selecao();if(!avaliarCarrinho(obterEstado(),itens).ok)return;
    comprando=true;atualizar();
    try{const r=await comprar({type:'buyAll',itens});if(r.ok){for(const l of linhas)l.campo.value=l.slider.value='0';}else janela.querySelector('#shopNotice').textContent=r.reason;}
    catch(e){avisar(e.message||'Não foi possível comprar.');}
    finally{comprando=false;atualizar();}
  };
  const vendas=instalarVendas({janela,obterEstado,acao:comprar,avisar});
  for(const aba of janela.querySelectorAll('[data-shop-aba]'))aba.onclick=()=>{
    for(const b of janela.querySelectorAll('[data-shop-aba]')){b.classList.toggle('ativa',b===aba);b.setAttribute('aria-selected',String(b===aba));}
    janela.querySelector('#shopComprar').hidden=aba.dataset.shopAba!=='comprar';
    janela.querySelector('#shopVender').hidden=aba.dataset.shopAba!=='vender';
    atualizar();
  };
  const atualizar=()=>{
    const s=obterEstado();if(!s||!janela.open)return;
    recursos.textContent=numero(s.zeni)+' Z disponíveis · Peso '+numero(s.weight)+' / '+numero(s.stats.capacity)+' kg';
    for(const linha of linhas)atualizarLinha(linha);
    const carrinho=avaliarCarrinho(s,selecao());comprarTudo.disabled=comprando||!carrinho.ok;comprarTudo.textContent=comprando?'Comprando…':'Comprar tudo';
    resumo.textContent=carrinho.ok?'Total: '+numero(carrinho.total)+' Z · '+numero(carrinho.peso)+' kg':carrinho.reason;
    vendas.atualizar();
  };
  return {atualizar,abrir(){if(!janela.open)janela.show();atualizar();}};
}
