import { instalarCatalogoItens } from './catalogo-itens-hud.mjs';
import { COLECIONAVEIS } from '../../shared/sistemas/premium-config.mjs';
import { marcarItemInspecionavel, nomeComRaridade } from './hud-elementos.mjs';
import { ITENS_NEGOCIAVEIS } from '../../shared/sistemas/itens-negociaveis.mjs';

const criar = (tag,texto,classe) => { const el=document.createElement(tag); if(texto!=null)el.textContent=texto;if(classe)el.className=classe;return el; };
const numero = n => Number(n).toLocaleString('pt-BR',{maximumFractionDigits:2});
const tempo = segundos => segundos>=3600 ? numero(segundos/3600)+' h' : segundos>=60 ? numero(segundos/60)+' min' : numero(segundos)+' s';
const intervalo = (valores,formatar=numero) => valores[0]===valores[1] ? formatar(valores[0]) : formatar(valores[0])+'–'+formatar(valores[1]);
const limpar = texto => texto.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const retratos=new Map();
export function retrato(tipo) {
  if(retratos.has(tipo)){
    const original=retratos.get(tipo),copia=original.cloneNode();
    const copiar=()=>{copia.getContext('2d').drawImage(original,0,0);copia.dataset.carregado=original.dataset.carregado||'false';};
    if(original.dataset.carregado==='true')copiar();else original.addEventListener('retrato-pronto',copiar,{once:true});
    return copia;
  }
  const canvas=criar('canvas',null,'bestiario-retrato');canvas.width=150;canvas.height=150;retratos.set(tipo,canvas);
  canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Retrato do inimigo');
  const desenhar=async()=>{
    // A arte só é carregada ao abrir uma ficha, sem prender a inicialização da HUD.
    const [{GOLPE},{PARADO},{PASSARO_VOO},{INSETO_VOO},{PORUNGA_VOO},{PORUNGA_BOSS_VOO},{SENTINELA_PASSO}]=await Promise.all([
      import('../../art/atlas.mjs'),import('../../art/parado.mjs'),import('../../art/fauna/passaro-voo.mjs'),import('../../art/fauna/inseto-voo.mjs'),
      import('../../art/personagens/porunga/porunga-voo.mjs'),import('../../art/personagens/porunga/porunga-boss-voo.mjs'),import('../../art/personagens/sentinela/sentinela-passo.mjs')]);
    const arte = tipo === 'freezaBoss' ? 'freezaPe' : tipo;
    const folha=({passaro:PASSARO_VOO,inseto:INSETO_VOO,porunga:PORUNGA_VOO,boss:PORUNGA_BOSS_VOO})[tipo] ||
      PARADO[arte]?.[0] || (tipo === 'subboss' ? SENTINELA_PASSO : null) || GOLPE[arte]?.[0];
    if(!folha)return;
    const img=new Image();img.src=folha.file;await img.decode();
    const [x,y,w,h]=folha.frames[0][0],escala=Math.min(134/w,134/h);
    const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
    c.drawImage(img,x,y,w,h,(150-w*escala)/2,(150-h*escala)/2,w*escala,h*escala);canvas.dataset.carregado='true';canvas.dispatchEvent(new Event('retrato-pronto'));
  };
  desenhar().catch(()=>canvas.setAttribute('aria-label','Retrato indisponível'));
  return canvas;
}

export function instalarBestiario(obterSnapshot) {
  let catalogo=null,selecionado=null,carregando=false;
  let abertura=0, personagem=null, revisao=-1;
  const localDaCriatura = m => m.nomePlaneta+' · '+m.local;
  const faixaDaHunt = m => 'Nv. '+intervalo(m.recomendado);
  function retratoDaFicha(m) {
    const imagem = retrato(m.tipo);
    imagem.classList.toggle('bestiario-silhueta', !m.abates);
    return imagem;
  }
  const janela=criar('dialog',null,'bestiario');janela.id='bestiarioDialog';janela.setAttribute('aria-labelledby','bestiarioTitulo');
  const header=criar('header'),titulo=criar('h2','Enciclopédia');titulo.id='bestiarioTitulo';
  const fechar=criar('button','✕');fechar.type='button';fechar.setAttribute('aria-label','Fechar Enciclopédia');fechar.onclick=()=>janela.close();header.append(titulo,fechar);
  const filtros=criar('div',null,'bestiario-filtros');
  const busca=criar('input');busca.type='search';busca.placeholder='Buscar inimigo ou hunt';busca.setAttribute('aria-label','Buscar inimigo ou hunt');
  const planeta=criar('select');planeta.setAttribute('aria-label','Filtrar por planeta');
  const categoria=criar('select');categoria.setAttribute('aria-label','Filtrar por categoria');
  for(const [valor,nome] of [['','Todas as categorias'],['Comum','Comuns'],['Subchefe','Subchefes'],['Chefe raro','Chefes raros']]){const o=criar('option',nome);o.value=valor;categoria.append(o);}
  filtros.append(busca,planeta,categoria);
  const corpo=criar('div',null,'bestiario-corpo'),lista=criar('nav',null,'bestiario-lista'),detalhe=criar('section',null,'bestiario-detalhe');lista.setAttribute('aria-label','Inimigos do bestiário');detalhe.setAttribute('aria-live','polite');corpo.append(lista,detalhe);
  const retratosVisiveis = new IntersectionObserver(entradas => {
    for (const { target, isIntersecting } of entradas) if (isIntersecting && lista.contains(target)) {
      retratosVisiveis.unobserve(target);
      const ficha = catalogo.find(m => m.id === target.dataset.inimigo);
      const imagem = retratoDaFicha(ficha);
      imagem.setAttribute('aria-hidden', 'true');
      target.prepend(imagem);
    }
  }, { root: lista });
  const resumo=criar('p','Carregando catálogo…','bestiario-resumo');resumo.setAttribute('role','status');
  const abas=criar('nav',null,'enciclopedia-abas');abas.setAttribute('aria-label','Seções da Enciclopédia');
  const painelBestiario=criar('section',null,'enciclopedia-painel');painelBestiario.id='enciclopediaBestiario';
  painelBestiario.append(filtros,resumo,corpo);
  const painelItens=criar('section',null,'enciclopedia-painel');painelItens.id='enciclopediaItens';painelItens.hidden=true;
  const grade=criar('div',null,'enciclopedia-grade-itens');painelItens.append(grade);
  const itens = [
    ...Object.values(ITENS_NEGOCIAVEIS),
    ...Object.entries(COLECIONAVEIS).map(([id, item]) => ({
      id, nome:item.nome, icone:item.imagem, tipo:'colecionavel', categoria:item.tipo
    }))
  ];
  const mostrarItens=instalarCatalogoItens({ grade, itens, criarCard(item) {
    const cartao=marcarItemInspecionavel(criar('article',null,'enciclopedia-item'),item.id);
    cartao.dataset.enciclopediaItem=item.id;
    const img=criar('img');img.src=item.icone;img.alt='';img.loading='lazy';img.dataset.ancoraInspecao='';
    const nome=nomeComRaridade(criar('strong',item.nome),item.id);
    const detalhe=criar('small',item.categoria ?? ('Peso unitário · '+numero(item.peso)+' kg'));
    cartao.append(img,nome,detalhe);
    return cartao;
  }});
  let itensMontados=false;
  function selecionarAba(nome) {
    painelBestiario.hidden=nome!=='bestiario';painelItens.hidden=nome!=='itens';
    for (const botao of abas.children) botao.setAttribute('aria-pressed',String(botao.dataset.enciclopediaAba===nome));
    if (nome==='itens' && !itensMontados) { mostrarItens();itensMontados=true; }
  }
  for (const [nome,rotulo,id] of [['bestiario','Bestiário',painelBestiario.id],['itens','Itens',painelItens.id]]) {
    const botao=criar('button',rotulo);botao.type='button';botao.dataset.enciclopediaAba=nome;
    botao.setAttribute('aria-controls',id);botao.onclick=()=>selecionarAba(nome);abas.append(botao);
  }
  janela.append(header,abas,painelBestiario,painelItens);document.body.append(janela);
  const tabela = pares => {const dl=criar('dl');for(const [k,v]of pares)dl.append(criar('dt',k),criar('dd',v));return dl;};
  const exibir = m => {
    selecionado=m.id;
    for(const botao of lista.children)botao.setAttribute('aria-pressed',String(botao.dataset.inimigo===m.id));
    const topo=criar('div',null,'bestiario-apresentacao'),nomes=criar('div');
    if (m.categoria) nomes.append(criar('p',m.categoria,'bestiario-categoria'));
    nomes.append(criar('h3',m.nome),criar('p',localDaCriatura(m)),criar('p',faixaDaHunt(m)));
    topo.append(retratoDaFicha(m),nomes);
    detalhe.replaceChildren(topo);
    if (!m.abates) {
      detalhe.append(criar('p','Derrote esta criatura nesta hunt para revelar a ficha.','bestiario-desbloqueio'));
      return;
    }
    const atributos=tabela([['Nível da criatura',numero(m.nivel)],['HP máximo',numero(m.hp)],['Ataque',numero(m.ataque)],['Defesa',numero(m.defesa)],['XP base por abate',numero(m.xp)+' XP'],['Zeni por abate',intervalo(m.zeni)+' Z'],['Renascimento',intervalo(m.renascimento,tempo)],['Velocidade',numero(m.velocidade)],['Comportamento',m.agressivo?'Agressivo':'Reage ao ser atacado'],['Ataques',m.ataques],['Raio de percepção',numero(m.aggro)+' unidades'],['Limite de perseguição',numero(m.perseguicao)+' unidades']]);
    detalhe.append(atributos, criar('h4','Drops possíveis'));
    if (!m.drops) {
      const progresso = numero(m.abates)+' / '+numero(m.abatesParaDrops);
      detalhe.append(criar('p','Derrote esta criatura mais vezes nesta hunt para revelar os drops e as chances. '+progresso+' abates.','bestiario-desbloqueio'));
    } else {
      const drops=criar('ul',null,'bestiario-drops');
      const sorte=obterSnapshot()?.self?.stats?.lootChance;
      for(const drop of m.drops){const chance=drop.chance ?? (sorte!=null?drop.fracaoLoot*sorte:null);const texto=chance!=null?numero(chance*100)+'% por abate':numero(drop.fracaoLoot*100)+'% da chance de loot do personagem';const li=marcarItemInspecionavel(criar('li'),drop.item);const img=criar('img');img.dataset.ancoraInspecao='';img.src=ITENS_NEGOCIAVEIS[drop.item].icone;img.alt='';li.append(img,nomeComRaridade(criar('span',drop.nome),drop.item),criar('b',texto));drops.append(li);}
      detalhe.append(drops,criar('p','O XP base é reduzido gradualmente quando a criatura está abaixo do seu nível. Sucata e Cristal Azul dependem da chance de loot do seu personagem e são alternativas do mesmo sorteio. A semente tem sorteio independente. O peso disponível limita a coleta.','bestiario-nota'));
    }
    for(const nota of m.observacoes)detalhe.append(criar('p',nota,'bestiario-aviso'));
  };
  const filtrar = () => {
    if(!catalogo)return;
    const termo=limpar(busca.value.trim());
    const itens=catalogo.filter(m=>(!planeta.value||m.planeta===planeta.value)&&(!categoria.value||m.categoria===categoria.value)&&limpar(m.nome+' '+m.local+' '+m.nomePlaneta).includes(termo));
    resumo.textContent=itens.length+' de '+catalogo.length+' inimigos';
    const posicao = lista.scrollTop;
    retratosVisiveis.disconnect();
    lista.replaceChildren(...itens.map(m => {
      const botao = criar('button');
      botao.type = 'button';
      botao.dataset.inimigo = m.id;
      const nomes = criar('span', null, 'bestiario-lista-nomes');
      nomes.append(criar('strong',m.nome),criar('small',localDaCriatura(m)),criar('small',faixaDaHunt(m)));
      if (m.categoria) nomes.append(criar('small',m.categoria));
      botao.append(nomes);
      botao.onclick = () => exibir(m);
      return botao;
    }));
    lista.scrollTop = posicao;
    for (const botao of lista.children) retratosVisiveis.observe(botao);
    if(!itens.length){detalhe.replaceChildren(criar('p','Nenhum inimigo encontrado.'));return;}
    exibir(itens.find(m=>m.id===selecionado)||itens[0]);
  };
  busca.oninput=filtrar;planeta.onchange=filtrar;categoria.onchange=filtrar;
  janela.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();janela.close();}});
  async function carregar() {
    if (carregando) return;
    const atual = abertura;
    carregando = true;
    if (!catalogo) resumo.textContent = 'Carregando catálogo…';
    try {
      const resposta = await fetch('/api/bestiario');
      if (!resposta.ok) throw new Error('Não foi possível carregar o bestiário.');
      const dados = await resposta.json();
      if (atual !== abertura || !janela.open || personagem !== obterSnapshot()?.selfId) return;
      if (!catalogo) {
        const todos = criar('option','Todos os planetas');
        todos.value = '';
        planeta.replaceChildren(todos);
        for (const [id,nome] of new Map(dados.inimigos.map(m => [m.planeta,m.nomePlaneta]))) {
          const opcao = criar('option',nome);
          opcao.value = id;
          planeta.append(opcao);
        }
      }
      catalogo = dados.inimigos;
      revisao = dados.revisao;
      const rolagem = detalhe.scrollTop;
      filtrar();
      detalhe.scrollTop = rolagem;
    } catch {
      if (atual !== abertura || !janela.open) return;
      revisao = obterSnapshot()?.self?.bestiarioRevisao ?? -1;
      resumo.textContent = 'Não foi possível atualizar o bestiário.';
      const tentar = criar('button','Tentar novamente');
      tentar.type = 'button';
      tentar.onclick = carregar;
      detalhe.replaceChildren(tentar);
    } finally {
      if (atual === abertura) carregando = false;
    }
  }
  return {
    alternar() {
      if (janela.open) { janela.close(); return; }
      abertura++;
      personagem = obterSnapshot()?.selfId;
      revisao = -1;
      catalogo = null;
      carregando = false;
      retratosVisiveis.disconnect();
      lista.replaceChildren();
      detalhe.replaceChildren();
      selecionarAba('bestiario');
      janela.show();
      carregar();
    },
    atualizar() {
      if (!janela.open || painelBestiario.hidden) return;
      const snapshot = obterSnapshot();
      if (snapshot?.selfId === personagem && snapshot.self?.bestiarioRevisao > revisao) carregar();
    }
  };
}
