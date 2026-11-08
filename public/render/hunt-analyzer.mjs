import {retrato} from './bestiario.mjs';
import {instalarArrasto} from './painel-movel.mjs';
let instalado=false,visto=false,ultimo=-1,amostras=[],identidade=null,huntAtivo=false,aba='resumo',estadoAtual=null;
const tempoHunt=seg=>[Math.floor(seg/3600),Math.floor(seg/60)%60,Math.floor(seg)%60].map(n=>String(n).padStart(2,'0')).join(':');
function visibilidade(){
 const mini=document.getElementById('huntAnalyzerMini'),root=document.getElementById('huntAnalyzer'),dialog=document.getElementById('autoHuntDialog');
 if(root.open&&dialog.open)visto=true;
 mini.hidden=!huntAtivo||!visto||Boolean(document.getElementById('welcomeDialog')?.open)||dialog.open;
}
export function instalarHuntAnalyzer(expandir){
 if(instalado)return;instalado=true;
 const mini=document.getElementById('huntAnalyzerMini'),root=document.getElementById('huntAnalyzer'),dialog=document.getElementById('autoHuntDialog');
 instalarArrasto(mini,mini.querySelector('header'),'dbi-hunt-analyzer-mini');
 root.addEventListener('toggle',visibilidade);
 root.querySelector('.hunt-analyzer-abas').addEventListener('click',e=>{
   const botao=e.target.closest('[data-hunt-aba]');if(!botao)return;aba=botao.dataset.huntAba;
   for(const b of root.querySelectorAll('[data-hunt-aba]'))b.setAttribute('aria-pressed',String(b===botao));
   if(estadoAtual)atualizarHuntAnalyzer(estadoAtual,identidade);
 });
 const observar=new MutationObserver(visibilidade);observar.observe(dialog,{attributes:true,attributeFilter:['open']});
 const login=document.getElementById('welcomeDialog');if(login)observar.observe(login,{attributes:true,attributeFilter:['open']});
 document.getElementById('huntAnalyzerExpand').onclick=()=>{if(!dialog.open)expandir();root.open=true;dialog.querySelector('.auto-hunt-body').scrollTop=0;visibilidade();};
}
function atualizarMini(a,id){
 huntAtivo=Boolean(a.ativo);
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
 if(a)atualizarMini(a,id);
 const root=document.getElementById('huntAnalyzer');if(!root||!a||!root.open)return;
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
 for(const [titulo,itens]of [['Loot recolhido por raridade',a.loot],['Supplies usados',a.supplies]]){
 fragment.append(texto('h4',titulo));if(!itens.length)fragment.append(texto('p','Nenhum item nesta sessão.'));
 const grupos=Object.groupBy(itens,i=>titulo.startsWith('Loot')?i.raridade:'Consumíveis');
 for(const [grupo,lista]of Object.entries(grupos)){fragment.append(texto('small',grupo));for(const i of lista){const linha=document.createElement('p'),img=document.createElement('img');img.src=i.icone;img.alt='';img.width=24;img.height=24;linha.append(img,document.createTextNode(i.nome+' × '+numero(i.quantidade)));fragment.append(linha);}}
 }
 root.querySelector('.hunt-analyzer-dados').replaceChildren(fragment);
}
