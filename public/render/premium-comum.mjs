import {el,botao,numero} from './hud-elementos.mjs';
import {fecharOutrasJanelas} from './janelas-hud.mjs';
import {COLECIONAVEIS} from '../shared/premium-config.mjs';
export const precoReais=centavos=>(centavos/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
export function textoRecompensa(r){return [...(r.zeni?[numero(r.zeni)+' Zeni']:[]),...(r.moedas?[numero(r.moedas)+' moedas premium']:[]),...Object.entries(r.itens||{}).map(([id,q])=>q+' × '+({food:'Presunto',ki:'Poção de Ki',seed15:'Semente 15%',seed30:'Semente 30%'}[id]||id)),...(r.colecao||[]).map(id=>COLECIONAVEIS[id]?.nome||id)].join(' · ');}
export function criarPainelPremium(id,titulo,ctx){
 const janela=el('dialog',null,'hud-funcional premium-janela');janela.id=id;janela.setAttribute('aria-label',titulo);
 const header=el('header'),h=el('h2',titulo),fechar=botao('×',()=>janela.close());fechar.setAttribute('aria-label','Fechar '+titulo);header.append(h,fechar);
 const saldo=el('p','','premium-saldo'),status=el('p','','hud-status'),nav=el('nav',null,'premium-abas'),confirmacao=el('section',null,'premium-confirmacao'),corpo=el('div',null,'premium-corpo');status.setAttribute('role','status');confirmacao.hidden=true;janela.append(header,saldo,status,nav,confirmacao,corpo);document.body.append(janela);
 let render=()=>{},estado=null,timer=null,geracao=0,carregando=false,ocupado=false;
 const request=async dados=>{
  const r=await fetch('/api/premium',dados?{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(dados)}:{credentials:'same-origin'});
  const d=await r.json();if(!r.ok||d.ok===false)throw Error(d.reason||'Não foi possível acessar a conta. Entre novamente se necessário.');return d;
 };
 const atualizar=async()=>{if(carregando||!janela.open)return;carregando=true;const g=geracao;
  try{const d=await request();if(g!==geracao||!janela.open)return;estado=d;saldo.textContent='Saldo da conta: '+numero(d.saldo)+' moedas premium'+(d.vipAtivo?' · VIP até '+new Date(d.vipAte).toLocaleDateString('pt-BR'):'');const scroll=corpo.scrollTop;render(d);corpo.scrollTop=scroll;}catch(e){if(g===geracao)status.textContent=e.message;}finally{carregando=false;}
 };
 const executar=async dados=>{if(ocupado)return;ocupado=true;try{await request(dados);status.textContent='Concluído com sucesso.';await atualizar();}catch(e){status.textContent=e.message;}finally{ocupado=false;}};
 const comprar=async produto=>{if(ocupado)return;ocupado=true;try{
  const d=await request({operacao:'prepararCompra',produto}),c=d.cotacao;
  confirmacao.replaceChildren(el('strong','Confirmar '+c.nome+'?'),el('p',c.simulada?'Simulação de '+precoReais(c.precoCentavos)+'. Nenhum pagamento real será feito.':numero(c.preco)+' moedas premium da conta. A compra não pode ser desfeita.'));
  confirmacao.append(botao('Confirmar compra',async()=>{confirmacao.hidden=true;await executar({operacao:'confirmarCompra',cotacao:c.id});}),botao('Cancelar',async()=>{confirmacao.hidden=true;try{await request({operacao:'cancelarCompra',cotacao:c.id});}catch{}}));confirmacao.hidden=false;
 }catch(e){status.textContent=e.message;}finally{ocupado=false;}};
 janela.addEventListener('close',()=>{if(janela.open)return;geracao++;clearInterval(timer);timer=null;confirmacao.hidden=true;});
 const abrir=()=>{
  if(janela.open){janela.close();return;}if(!ctx.snapshot()?.self){status.textContent='Entre com um personagem para continuar.';return;}
  geracao++;estado=null;status.textContent='Carregando…';corpo.replaceChildren();confirmacao.hidden=true;fecharOutrasJanelas(janela);ctx.soltarTeclas();janela.show();atualizar().then(()=>{if(janela.open&&estado)status.textContent='';});timer=setInterval(atualizar,4000);
 };
 return {janela,corpo,nav,status,comprar,executar,atualizar,abrir,setRender:f=>{render=f;},get estado(){return estado;}};
}
