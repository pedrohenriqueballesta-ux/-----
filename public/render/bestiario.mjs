const criar = (tag,texto,classe) => { const el=document.createElement(tag); if(texto!=null)el.textContent=texto;if(classe)el.className=classe;return el; };
const numero = n => Number(n).toLocaleString('pt-BR',{maximumFractionDigits:2});
const tempo = segundos => segundos>=3600 ? numero(segundos/3600)+' h' : segundos>=60 ? numero(segundos/60)+' min' : numero(segundos)+' s';
const intervalo = (valores,formatar=numero) => valores[0]===valores[1] ? formatar(valores[0]) : formatar(valores[0])+'–'+formatar(valores[1]);
const limpar = texto => texto.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function retrato(tipo) {
  const canvas=criar('canvas',null,'bestiario-retrato');canvas.width=150;canvas.height=150;
  canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Retrato do inimigo');
  const desenhar=async()=>{
    // A arte só é carregada ao abrir uma ficha, sem prender a inicialização da HUD.
    const [{GOLPE},{PASSARO_VOO},{INSETO_VOO},{PORUNGA_VOO},{PORUNGA_BOSS_VOO},{SENTINELA_PASSO}]=await Promise.all([
      import('../art/atlas.mjs'),import('../art/passaro-voo.mjs'),import('../art/inseto-voo.mjs'),
      import('../art/porunga-voo.mjs'),import('../art/porunga-boss-voo.mjs'),import('../art/sentinela-passo.mjs')]);
    const folha=({passaro:PASSARO_VOO,inseto:INSETO_VOO,porunga:PORUNGA_VOO,boss:PORUNGA_BOSS_VOO,subboss:SENTINELA_PASSO})[tipo] || GOLPE[tipo==='freezaBoss'?'freezaPeBeam':tipo]?.[0];
    if(!folha)return;
    const img=new Image();img.src=folha.file;await img.decode();
    const [x,y,w,h]=folha.frames[0][0],escala=Math.min(134/w,134/h);
    const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
    c.drawImage(img,x,y,w,h,(150-w*escala)/2,(150-h*escala)/2,w*escala,h*escala);canvas.dataset.carregado='true';
  };
  desenhar().catch(()=>canvas.setAttribute('aria-label','Retrato indisponível'));
  return canvas;
}

export function instalarBestiario(obterEstado) {
  let catalogo=null,selecionado=null,carregando=false;
  const janela=criar('dialog',null,'bestiario');janela.id='bestiarioDialog';janela.setAttribute('aria-labelledby','bestiarioTitulo');
  const header=criar('header'),titulo=criar('h2','Bestiário');titulo.id='bestiarioTitulo';
  const fechar=criar('button','✕');fechar.type='button';fechar.setAttribute('aria-label','Fechar bestiário');fechar.onclick=()=>janela.close();header.append(titulo,fechar);
  const filtros=criar('div',null,'bestiario-filtros');
  const busca=criar('input');busca.type='search';busca.placeholder='Buscar inimigo ou hunt';busca.setAttribute('aria-label','Buscar inimigo ou hunt');
  const planeta=criar('select');planeta.setAttribute('aria-label','Filtrar por planeta');
  const categoria=criar('select');categoria.setAttribute('aria-label','Filtrar por categoria');
  for(const [valor,nome] of [['','Todas as categorias'],['Comum','Comuns'],['Subchefe','Subchefes'],['Chefe raro','Chefes raros']]){const o=criar('option',nome);o.value=valor;categoria.append(o);}
  filtros.append(busca,planeta,categoria);
  const corpo=criar('div',null,'bestiario-corpo'),lista=criar('nav',null,'bestiario-lista'),detalhe=criar('section',null,'bestiario-detalhe');lista.setAttribute('aria-label','Inimigos do bestiário');detalhe.setAttribute('aria-live','polite');corpo.append(lista,detalhe);
  const resumo=criar('p','Carregando catálogo…','bestiario-resumo');resumo.setAttribute('role','status');
  janela.append(header,filtros,resumo,corpo);document.body.append(janela);
  const tabela = pares => {const dl=criar('dl');for(const [k,v]of pares)dl.append(criar('dt',k),criar('dd',v));return dl;};
  const exibir = m => {
    selecionado=m.id;
    for(const botao of lista.children)botao.setAttribute('aria-pressed',String(botao.dataset.inimigo===m.id));
    const topo=criar('div',null,'bestiario-apresentacao'),nomes=criar('div');nomes.append(criar('p',m.categoria,'bestiario-categoria'),criar('h3',m.nome),criar('p',m.nomePlaneta+' · '+m.local));topo.append(retrato(m.tipo),nomes);
    const atributos=tabela([['Nível recomendado da hunt',intervalo(m.recomendado)],['HP máximo',numero(m.hp)],['Ataque',numero(m.ataque)],['Defesa',numero(m.defesa)],['Experiência por abate',numero(m.xp)+' XP'],['Zeni por abate',intervalo(m.zeni)+' Z'],['Renascimento',intervalo(m.renascimento,tempo)],['Velocidade',numero(m.velocidade)],['Comportamento',m.agressivo?'Agressivo':'Reage ao ser atacado'],['Ataques',m.ataques],['Raio de percepção',numero(m.aggro)+' unidades'],['Limite de perseguição',numero(m.perseguicao)+' unidades']]);
    const drops=criar('ul',null,'bestiario-drops');
    const sorte=obterEstado()?.stats?.lootChance;
    for(const drop of m.drops){const chance=drop.chance ?? (sorte!=null?drop.fracaoLoot*sorte:null);const texto=chance!=null?numero(chance*100)+'% por abate':numero(drop.fracaoLoot*100)+'% da chance de loot do personagem';const li=criar('li');const img=criar('img');img.src='/assets/inventario/'+({scrap:'sucata',crystal:'cristal',seed15:'semente_dos_deuses'}[drop.item])+'.png';img.alt='';li.append(img,criar('span',drop.nome),criar('b',texto));drops.append(li);}
    detalhe.replaceChildren(topo,atributos,criar('h4','Drops possíveis'),drops,criar('p','Sucata e cristal dependem da chance de loot do seu personagem e são alternativas do mesmo sorteio. A semente tem sorteio independente. O peso disponível limita a coleta.','bestiario-nota'));
    for(const nota of m.observacoes)detalhe.append(criar('p',nota,'bestiario-aviso'));
  };
  const filtrar = () => {
    if(!catalogo)return;
    const termo=limpar(busca.value.trim());
    const itens=catalogo.filter(m=>(!planeta.value||m.planeta===planeta.value)&&(!categoria.value||m.categoria===categoria.value)&&limpar(m.nome+' '+m.local+' '+m.nomePlaneta).includes(termo));
    resumo.textContent=itens.length+' de '+catalogo.length+' inimigos';
    lista.replaceChildren(...itens.map(m=>{const b=criar('button');b.type='button';b.dataset.inimigo=m.id;b.append(criar('strong',m.nome),criar('small',m.nomePlaneta+' · Nv. '+intervalo(m.recomendado)),criar('small',m.categoria));b.onclick=()=>exibir(m);return b;}));
    if(!itens.length){detalhe.replaceChildren(criar('p','Nenhum inimigo encontrado.'));return;}
    exibir(itens.find(m=>m.id===selecionado)||itens[0]);
  };
  busca.oninput=filtrar;planeta.onchange=filtrar;categoria.onchange=filtrar;
  janela.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();janela.close();}});
  const carregar = async () => {
    if(carregando)return;carregando=true;resumo.textContent='Carregando catálogo…';
    try{
      const resposta=await fetch('/api/bestiario');if(!resposta.ok)throw new Error('Não foi possível carregar o bestiário.');
      catalogo=(await resposta.json()).inimigos;
      const todos=criar('option','Todos os planetas');todos.value='';planeta.replaceChildren(todos);
      for(const [id,nome]of new Map(catalogo.map(m=>[m.planeta,m.nomePlaneta]))){const o=criar('option',nome);o.value=id;planeta.append(o);}
      filtrar();
    }catch{resumo.textContent='Não foi possível carregar o bestiário.';const tentar=criar('button','Tentar novamente');tentar.type='button';tentar.onclick=carregar;detalhe.replaceChildren(tentar);}
    finally{carregando=false;}
  };
  return () => {if(janela.open){janela.close();return;}janela.show();if(catalogo)filtrar();else carregar();};
}
