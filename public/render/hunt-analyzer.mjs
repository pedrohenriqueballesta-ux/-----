import {retrato} from './bestiario.mjs';
import {instalarArrasto} from './painel-movel.mjs';
import {agruparLootPorRaridade} from '../shared/hunt-analyzer.mjs';
let instalado=false,visto=false,ultimo=-1,amostras=[],identidade=null,huntAtivo=false,aba='resumo',estadoAtual=null,lootFechadoManual=false,lootPosicaoPendente=false,lootPosicaoPersonalizada=false,lootAlturaPersonalizada=false,lootAbrirAoFecharAutoHunt=false,autoHuntPainelAberto=false;
const tempoHunt=seg=>[Math.floor(seg/3600),Math.floor(seg/60)%60,Math.floor(seg)%60].map(n=>String(n).padStart(2,'0')).join(':');
const textoElemento=(tag,s,classe)=>{const e=document.createElement(tag);e.textContent=s;if(classe)e.className=classe;return e;};
try{const pos=JSON.parse(localStorage.getItem('dbi-loot-tracker')),tam=JSON.parse(localStorage.getItem('dbi-loot-tracker-tamanho'));lootPosicaoPersonalizada=Boolean(Number.isFinite(pos?.x)&&Number.isFinite(pos?.y));lootAlturaPersonalizada=tam?.modo==='vertical';}catch{}
function posicionarLootAcima(){
 const mini=document.getElementById('huntAnalyzerMini'),janela=document.getElementById('lootTrackerWindow');
 if(!lootPosicaoPendente||!mini||mini.hidden||janela.hidden)return;
 const base=mini.getBoundingClientRect(),caixa=janela.getBoundingClientRect(),margem=8,folga=6;
 const alturaDisponivel=Math.max(160,Math.min(innerHeight-2*margem,base.top-margem-folga));
 const alturaDesejada=lootAlturaPersonalizada?caixa.height:Math.min(380,Math.max(200,innerHeight*.52));
 const altura=Math.min(alturaDesejada,alturaDisponivel);
 const esquerda=Math.max(margem,Math.min(base.left,innerWidth-caixa.width-margem));
 const topo=Math.max(margem,base.top-altura-folga);
 Object.assign(janela.style,{left:esquerda+'px',top:topo+'px',right:'auto',bottom:'auto',width:base.width+'px',height:altura+'px',transform:'none'});
 if(janela.classList.contains('hud-tamanho-manual'))janela.style.setProperty('--hud-altura',altura+'px');
 lootPosicaoPendente=false;
}
function atualizarLootTracker(a){
 const janela=document.getElementById('lootTrackerWindow');if(!janela)return;
 janela.querySelector('.hunt-loot-status').textContent=(a.ativo?'● Contando':'Ⅱ Pausado')+' · '+tempoHunt(a.segundos);
 const itens=a.drops||[],assinatura=JSON.stringify([a.ativo,Math.floor(a.segundos),itens]),corpo=janela.querySelector('.hunt-loot-dados');
 if(corpo.dataset.assinatura===assinatura)return;
 corpo.dataset.assinatura=assinatura;
 const total=itens.reduce((n,i)=>n+i.quantidade,0),fragment=document.createDocumentFragment();
 fragment.append(textoElemento('p',`${numero(total)} drop(s) · ${numero(itens.length)} tipo(s) nesta sessão`,'hunt-loot-total'));
 if(!itens.length)fragment.append(textoElemento('p','Nenhum drop registrado nesta sessão.'));
 const grupos=agruparLootPorRaridade(itens);
 for(const [raridade,lista] of Object.entries(grupos).sort(([a],[b])=>a.localeCompare(b))){
   const secao=textoElemento('section','','hunt-loot-grupo');secao.append(textoElemento('h4',raridade));
   const grade=textoElemento('div','','hunt-loot-grade');
   for(const i of [...lista].sort((a,b)=>a.nome.localeCompare(b.nome))){
     const card=textoElemento('article','','hunt-loot-item'),img=document.createElement('img');img.src=i.icone;img.alt='';img.width=36;img.height=36;
     card.append(img,textoElemento('strong',i.nome),textoElemento('b','× '+numero(i.quantidade),'hunt-loot-quantidade'),textoElemento('small',i.raridade||'Não definida','hunt-loot-raridade'));grade.append(card);
   }
   secao.append(grade);fragment.append(secao);
 }
 fragment.append(textoElemento('p','Conta cada item quando ele cai do inimigo, mesmo que ainda não tenha sido recolhido. A raridade vem do catálogo; itens sem classificação aparecem como “Não definida”.','hunt-loot-nota'));
 corpo.replaceChildren(fragment);
}
function visibilidade(){
 const mini=document.getElementById('huntAnalyzerMini'),root=document.getElementById('huntAnalyzer'),dialog=document.getElementById('autoHuntDialog'),loot=document.getElementById('lootTrackerWindow');
 const aberto=dialog.open;
 if(aberto&&!autoHuntPainelAberto&&!loot.hidden){loot.hidden=true;lootFechadoManual=true;lootPosicaoPendente=false;lootAbrirAoFecharAutoHunt=false;}
 if(!aberto&&autoHuntPainelAberto&&lootAbrirAoFecharAutoHunt&&!lootFechadoManual){loot.hidden=false;lootPosicaoPendente=!lootPosicaoPersonalizada;lootAbrirAoFecharAutoHunt=false;}
 autoHuntPainelAberto=aberto;
 if(root.open&&dialog.open)visto=true;
 mini.hidden=!huntAtivo||Boolean(document.getElementById('welcomeDialog')?.open)||dialog.open;
 if(!mini.hidden&&lootPosicaoPendente)requestAnimationFrame(posicionarLootAcima);
}
export function instalarHuntAnalyzer(expandir){
 if(instalado)return;instalado=true;
 const mini=document.getElementById('huntAnalyzerMini'),root=document.getElementById('huntAnalyzer'),dialog=document.getElementById('autoHuntDialog');
 instalarArrasto(mini,mini.querySelector('header'),'dbi-hunt-analyzer-mini');
 const loot=document.getElementById('lootTrackerWindow');instalarArrasto(loot,loot.querySelector('header'),'dbi-loot-tracker',{eixo:'vertical'});
 const alcaRedimensionarLoot=loot.querySelector('.hud-redimensionar-vertical');
 alcaRedimensionarLoot?.addEventListener('pointerdown',()=>{lootAlturaPersonalizada=true;},{capture:true});
 alcaRedimensionarLoot?.addEventListener('dblclick',()=>{lootAlturaPersonalizada=false;});
 alcaRedimensionarLoot?.addEventListener('keydown',e=>{if(e.key==='Home')lootAlturaPersonalizada=false;});
 loot.querySelector('header').addEventListener('pointerdown',e=>{if(!e.target.closest('button'))lootPosicaoPersonalizada=true;},{capture:true});
 document.getElementById('lootTrackerOpen').addEventListener('click',()=>{lootFechadoManual=false;lootAbrirAoFecharAutoHunt=false;loot.hidden=false;lootPosicaoPendente=!lootPosicaoPersonalizada;visibilidade();if(estadoAtual)atualizarLootTracker(estadoAtual);});
 document.getElementById('lootTrackerClose').addEventListener('click',()=>{loot.hidden=true;lootFechadoManual=true;lootPosicaoPendente=false;lootAbrirAoFecharAutoHunt=false;});
 root.addEventListener('toggle',visibilidade);
 root.querySelector('.hunt-analyzer-abas').addEventListener('click',e=>{
   const botao=e.target.closest('[data-hunt-aba]');if(!botao)return;aba=botao.dataset.huntAba;
   for(const b of root.querySelectorAll('[data-hunt-aba]'))b.setAttribute('aria-pressed',String(b===botao));
   if(estadoAtual)atualizarHuntAnalyzer(estadoAtual,identidade);
 });
 const observar=new MutationObserver(visibilidade);observar.observe(dialog,{attributes:true,attributeFilter:['open']});
 const login=document.getElementById('welcomeDialog');if(login)observar.observe(login,{attributes:true,attributeFilter:['open']});
 addEventListener('resize',()=>{if(!loot.hidden&&!lootPosicaoPersonalizada){lootPosicaoPendente=true;requestAnimationFrame(()=>{if(!mini.hidden)posicionarLootAcima();});}});
 document.getElementById('huntAnalyzerExpand').onclick=()=>{if(!dialog.open)expandir();root.open=true;dialog.querySelector('.auto-hunt-body').scrollTop=0;visibilidade();};
}
function atualizarMini(a,id){
 const ativo=Boolean(a.ativo),loot=document.getElementById('lootTrackerWindow');
 if(!ativo){lootFechadoManual=false;lootAbrirAoFecharAutoHunt=false;}
 if(ativo&&!huntAtivo){
   lootFechadoManual=false;
   loot.hidden=true;lootPosicaoPendente=false;lootAbrirAoFecharAutoHunt=false;
 }
 huntAtivo=ativo;
 if(identidade!==id||a.segundos<ultimo){amostras=[];ultimo=-1;visto=false;identidade=id;}
 if(a.segundos>0)visto=true;
 if(ultimo<0||a.segundos-ultimo>=5){amostras.push(a.xpHora);amostras=amostras.slice(-60);ultimo=a.segundos;}
 const mini=document.getElementById('huntAnalyzerMini');if(!mini)return;
 mini.querySelector('.hunt-mini-status').textContent=(a.ativo?'● Contando':'Ⅱ Pausado')+(a.teste?' · God Mode':'');
 mini.querySelector('[data-hunt=tempo]').textContent=tempoHunt(a.segundos);
 mini.querySelector('[data-hunt=xp]').textContent=numero(a.xpHora);
 const saldo=mini.querySelector('[data-hunt=saldo]');saldo.textContent=(a.saldo>0?'+':'')+numero(a.saldo)+' Z';saldo.className=a.saldo<0?'hunt-prejuizo':'hunt-lucro';
 const max=Math.max(1,...amostras);mini.querySelector('polyline').setAttribute('points',amostras.map((v,i)=>(i*240/Math.max(1,amostras.length-1))+','+(50-v/max*46)).join(' '));
 visibilidade();
}
const numero=n=>Math.round(n||0).toLocaleString('pt-BR');
export function atualizarHuntAnalyzer(a,id){
 estadoAtual=a;
 if(!a)return;
 atualizarMini(a,id);atualizarLootTracker(a);
 const root=document.getElementById('huntAnalyzer');if(!root||!root.open)return;
 const segundos=Math.floor(a.segundos),tempo=[Math.floor(segundos/3600),Math.floor(segundos/60)%60,segundos%60].map(n=>String(n).padStart(2,'0')).join(':');
 const dados=[['Tempo ativo',tempo],['XP / hora',numero(a.xpHora)],['XP ganho',numero(a.xp)],['Dano causado',numero(a.danoCausado)],['Dano recebido',numero(a.danoRecebido)],['Cura efetiva',numero(a.cura)],['Zeni coletado',numero(a.zeni)+' Z'],['Valor do loot',numero(a.valorLoot)+' Z'],['Gastos com supplies',numero(a.gastos)+' Z']];
 const fragment=document.createDocumentFragment();
 const texto=(tag,s,classe)=>{const e=document.createElement(tag);e.textContent=s;if(classe)e.className=classe;return e;};
 if(aba==='abates'||aba==='mortes'){
   const assinatura=JSON.stringify([aba,a[aba]||[]]);
   const corpo=root.querySelector('.hunt-analyzer-dados');
   if(corpo.dataset.encontros===assinatura)return;
   corpo.dataset.encontros=assinatura;
   const linhas=a[aba]||[],total=linhas.reduce((n,i)=>n+i.quantidade,0);
   fragment.append(texto('h4',(aba==='abates'?'Monstros derrotados: ':'Mortes do personagem: ')+numero(total)));
   if(!linhas.length)fragment.append(texto('p',aba==='abates'?'Nenhum monstro derrotado nesta sessão.':'Nenhuma morte nesta sessão.'));
   for(const i of [...linhas].sort((a,b)=>Number(b.chefe)-Number(a.chefe)||b.quantidade-a.quantidade||a.nome.localeCompare(b.nome))){
     const card=texto('article','',i.chefe?'hunt-encontro hunt-chefe':'hunt-encontro');
     const sprite=retrato(i.tipo);sprite.className='hunt-encontro-sprite';sprite.setAttribute('aria-label',i.nome);card.append(sprite);
     card.append(texto('strong',(i.chefe?'★ Chefe · ':'')+i.nome+' × '+numero(i.quantidade)));
     card.append(texto('small','Área: '+i.area+' · Tempo ativo no último registro: '+tempoHunt(i.ultimoSegundo)));
     if(aba==='mortes'&&i.foraAutoHunt)card.append(texto('small','Com Auto Hunt desligado: '+numero(i.foraAutoHunt)));
     fragment.append(card);
   }
   root.querySelector('.hunt-analyzer-dados').replaceChildren(fragment);return;
 }
 delete root.querySelector('.hunt-analyzer-dados').dataset.encontros;
 fragment.append(texto('p',(a.ativo?'● Contando':'Ⅱ Pausado')+(a.teste?' · Sessão com God Mode':'')));
 const dl=document.createElement('dl');for(const [k,v]of dados)dl.append(texto('dt',k),texto('dd',v));fragment.append(dl);
 fragment.append(texto('p','Saldo estimado: '+(a.saldo>0?'+':'')+numero(a.saldo)+' Z',a.saldo<0?'hunt-prejuizo':'hunt-lucro'));
 const itens=a.supplies;
 fragment.append(texto('h4','Supplies usados'));if(!itens.length)fragment.append(texto('p','Nenhum consumível usado nesta sessão.'));
 for(const i of itens){const linha=document.createElement('p'),img=document.createElement('img');img.src=i.icone;img.alt='';img.width=24;img.height=24;linha.append(img,document.createTextNode(i.nome+' × '+numero(i.quantidade)));fragment.append(linha);}
 root.querySelector('.hunt-analyzer-dados').replaceChildren(fragment);
}
