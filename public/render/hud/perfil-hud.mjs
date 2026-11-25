import {desenharNimbus} from '../vfx/nimbus.mjs';

import {el,botao,numero,barra} from './hud-elementos.mjs';
import {MAGIAS_PERSONAGEM,tecnicasDoPerfil,barraValida,tecnicaDisponivel,nivelDaTecnica,NOMES_TECNICAS_VEGETA} from '../../shared/tecnicas/barra-tecnicas.mjs';
import {drawVegeta} from '../../art/personagens/vegeta/vegeta.mjs';
import {dadosTecnica} from './barra-tecnicas-hud.mjs';
import {iconeDaForma} from '../../shared/tecnicas/formas.mjs';
import {formaBigBangAttack} from '../../shared/tecnicas/big-bang-attack.mjs';
import {formaFinalFlash} from '../../shared/tecnicas/final-flash.mjs';
const skinsGoku = [
 { forma: 'base', nome: 'Goku · Base', icone: '/assets/goku-portrait.png' },
 { forma: 'natalino', nome: 'Goku · Natalino', icone: '/assets/goku-portrait.png' }
];
const skinsVegeta = [{ forma: 'base', nome: 'Vegeta · Base' }];

export function montarPerfil(container,{acao}={}){
 let montaria=null;
 const montar=botao('Montar montaria',()=>acao?.({type:'montaria',valor:montaria?null:montariaOpcoes[montariaIndice].id}));
 let skinOpcoes = skinsGoku, vocacaoArmario = null, skinPreferida = 'base';
 const montariaOpcoes=[{id:'nimbus',nome:'Nimbus'}];
 let skinIndice=0,montariaIndice=0;
 const salvarPersonalizacao = (skin, montariaEscolhida) => {
  if (vocacaoArmario !== 'vegeta') skinPreferida = skin;
  try { localStorage.setItem('dbi-personalizacao', JSON.stringify({ skin: skinPreferida, montaria: montariaEscolhida })); } catch {}
 };
 const skinCanvas=el('canvas',null,'perfil-personalizacao-canvas');skinCanvas.width=200;skinCanvas.height=180;skinCanvas.setAttribute('aria-label','Preview da skin selecionada');skinCanvas.setAttribute('role','img');
 const montariaCanvas=el('canvas',null,'perfil-personalizacao-canvas perfil-montaria-canvas');montariaCanvas.width=200;montariaCanvas.height=130;montariaCanvas.setAttribute('aria-label','Preview da montaria selecionada');montariaCanvas.setAttribute('role','img');
 const skinNome=el('strong','perfil-personalizacao-nome'),montariaNome=el('strong','perfil-personalizacao-nome');
 const aplicar=botao('Aplicar',()=>{
  const skin = skinOpcoes[skinIndice].forma, montariaEscolhida = montariaOpcoes[montariaIndice].id;
  salvarPersonalizacao(skin, montariaEscolhida);
  acao?.({type:'skin',skin});
  acao?.({type:'montaria',valor:montariaEscolhida});
 });
 const resetar=botao('Resetar skin',()=>{
  skinIndice = 0;
  salvarPersonalizacao('base', montariaOpcoes[montariaIndice].id);
  atualizarPersonalizacao();
  acao?.({type:'skin',skin:'base'});
 });
 resetar.classList.add('perfil-resetar-skin');
 const skinAnterior=botao('‹',()=>{skinIndice=(skinIndice+skinOpcoes.length-1)%skinOpcoes.length;atualizarPersonalizacao();}),skinProxima=botao('›',()=>{skinIndice=(skinIndice+1)%skinOpcoes.length;atualizarPersonalizacao();});
 const montariaAnterior=botao('‹',()=>{montariaIndice=(montariaIndice+montariaOpcoes.length-1)%montariaOpcoes.length;atualizarPersonalizacao();}),montariaProxima=botao('›',()=>{montariaIndice=(montariaIndice+1)%montariaOpcoes.length;atualizarPersonalizacao();});
 const silhuetaSkinEsq=el('img',null,'perfil-silhueta'),silhuetaSkinDir=el('img',null,'perfil-silhueta'),silhuetaMontariaEsq=el('img',null,'perfil-silhueta perfil-silhueta-montaria'),silhuetaMontariaDir=el('img',null,'perfil-silhueta perfil-silhueta-montaria');
 const seletorSkin=el('div',null,'perfil-personalizacao-seletor'),seletorMontaria=el('div',null,'perfil-personalizacao-seletor');
 seletorSkin.append(skinAnterior,skinNome,skinProxima);seletorMontaria.append(montariaAnterior,montariaNome,montariaProxima);
 const montarias=el('section',null,'perfil-montaria');montarias.append(el('h3','Montaria'),silhuetaMontariaEsq,montariaCanvas,silhuetaMontariaDir,seletorMontaria,el('p','Montarias cosméticas. A Rena Natalina é a recompensa gratuita do Battle Pass.'),montar);
 const notaSkin=el('p','Use as setas para visualizar as skins disponíveis.','hud-nota');
 const personalizacao=el('section',null,'perfil-skin');
 personalizacao.append(el('h3','Skin do personagem'),silhuetaSkinEsq,skinCanvas,silhuetaSkinDir,seletorSkin,notaSkin,montarias);
 let drawGoku=null;import('../../art/personagens/goku/goku.mjs').then(m=>{drawGoku=m.drawGoku;atualizarPersonalizacao();});
 const coluna=el('div',null,'perfil-visual'),canvas=el('canvas');canvas.width=240;canvas.height=220;canvas.setAttribute('aria-label','Sprite atual do personagem');canvas.setAttribute('role','img');
 const nome=el('h3'),forma=el('p'),xp=barra(0,1),xpTexto=el('p');
 coluna.append(canvas,nome,forma,xp,xpTexto);

 const painel = (titulo, conteudo) => {
  const secao = el('section', null, 'perfil-secao');
  secao.append(el('h4', titulo), conteudo);
  return secao;
 };
 const atributos = (campos) => {
  const lista = el('dl', null, 'perfil-atributos');
  const valores = campos.map(([rotulo, dica]) => {
   const chave = el('dt', rotulo), valor = el('dd');
   if (dica) { chave.title = dica; chave.tabIndex = 0; }
   lista.append(chave, valor);
   return valor;
  });
  return { lista, valores };
 };
 const combate = atributos([
  ['Ataque físico', 'Inclui ataque dos equipamentos e multiplicador da forma.'],
  ['Defesa', 'Reduz o dano recebido por 100 / (100 + defesa × 3).'],
  ['Poder de combate', 'Indicador derivado dos atributos do personagem.']
 ]);
 const exploracao = atributos([
  ['Movimento base'], ['Capacidade da mochila'], ['Chance de drop', 'Chance de gerar o drop principal.'], ['Vitórias']
 ]);
 const recursos = el('div', null, 'perfil-recursos');
 const medidores = [
  ['hp', 'Vida', 'HP'],
  ['ki', 'Ki', 'Ki']
 ].map(([chave, titulo, unidade]) => {
  const card = el('article', null, 'perfil-recurso perfil-recurso-' + chave);
  const cabecalho = el('div', null, 'perfil-recurso-cabecalho');
  const atual = el('strong'), total = el('strong'), fontes = el('dl', null, 'perfil-atributos');
  const vazio = el('p', 'Sem fontes ativas', 'hud-nota');
  cabecalho.append(el('h5', titulo), atual);
  card.append(cabecalho, total, fontes, vazio);
  recursos.append(card);
  return { chave, unidade, atual, total, fontes, vazio, ultimaLista: null };
 });
 const buffs = el('ul', null, 'perfil-efeitos');
 const dados = el('div', null, 'perfil-secoes');
 dados.append(painel('Recuperação', recursos), painel('Combate', combate.lista),
  painel('Exploração', exploracao.lista), painel('Efeitos do personagem', buffs));
 const grid = el('div', null, 'perfil-grid'); grid.append(coluna, dados);
 const abas=el('nav',null,'perfil-abas'),abaDados=botao('Personagem',()=>mostrar('personagem')),abaTecnicas=botao('Técnicas',()=>mostrar('tecnicas'));
 abas.setAttribute('aria-label','Abas do personagem');abas.append(abaDados,abaTecnicas);
 const acoesPersonalizacao=el('div',null,'perfil-personalizacao-acoes');acoesPersonalizacao.append(aplicar,resetar);personalizacao.append(acoesPersonalizacao);const painelDados=el('div',null,'perfil-painel'),painelTecnicas=el('div',null,'perfil-painel perfil-tecnicas');painelDados.append(grid,personalizacao);
 const mostrar=qual=>{const tecnicas=qual==='tecnicas';painelDados.hidden=tecnicas;painelTecnicas.hidden=!tecnicas;abaDados.setAttribute('aria-pressed',String(!tecnicas));abaTecnicas.setAttribute('aria-pressed',String(tecnicas));};
 const acoesTecnicas = el('div', null, 'perfil-tecnicas-acoes');
 const aviso = el('p', 'Arraste técnicas para a barra. Para equipar consumíveis, use a mochila.', 'hud-nota');
 const restaurarBarra = botao('Voltar ao padrão', () => acao?.({ type: 'restaurarBarraPadrao' }));
 restaurarBarra.title = 'Restaurar os oito slots da barra de habilidades';
 acoesTecnicas.append(aviso, restaurarBarra);
 painelTecnicas.append(acoesTecnicas);
 const lista=el('div',null,'perfil-tecnicas-lista');painelTecnicas.append(lista);container.append(abas,painelDados,painelTecnicas);mostrar('personagem');
 let ultimo=null;
 const cards=[...MAGIAS_PERSONAGEM].sort((a,b)=>a.nivel-b.nivel).map(t=>{
  const formaId=t.id.startsWith('form:')?t.id.slice(5):null;
  const card=el('article',null,'perfil-tecnica'),img=t.imagem?el('img',null,'perfil-tecnica-icone'):el('span',null,'tecnica-icone '+t.icone);
  if(t.imagem){img.src=t.imagem;img.alt='';img.draggable=false;}
  const texto=el('div'),titulo=el('strong',t.nome),detalhes=el('small'),estado=el('small'),seletor=el('select');seletor.setAttribute('aria-label','Colocar '+t.nome+' no slot');
  seletor.append(new Option('Colocar no slot…',''));for(let i=1;i<=8;i++)seletor.append(new Option('Tecla '+i,String(i)));
  card.addEventListener('dragstart',e=>{if(!card.draggable){e.preventDefault();return;}e.dataTransfer.effectAllowed='copy';e.dataTransfer.setData('application/x-dbi-tecnica',t.id);});
  seletor.onchange=()=>{const slot=Number(seletor.value)-1;seletor.value='';if(!ultimo||slot<0)return;const novos=barraValida(ultimo.barraTecnicas,ultimo.hotkeysConsumiveis,ultimo.seedSelected),anterior=novos.indexOf(t.id);if(anterior>=0)novos[anterior]=novos[slot];novos[slot]=t.id;acao?.({type:'configurarBarra',slots:novos});};
  texto.append(titulo,detalhes,estado);card.append(img,texto,seletor);lista.append(card);return {t,card,detalhes,estado,seletor,formaId,img};
 });
 let ultimoEstado=null,selfId=null, textoEfeitos=null;
 try {
  const salvo = JSON.parse(localStorage.getItem('dbi-personalizacao') || 'null');
  if (skinsGoku.some(o => o.forma === salvo?.skin)) skinPreferida = salvo.skin;
  const indice = montariaOpcoes.findIndex(o => o.id === salvo?.montaria);
  if (indice >= 0) montariaIndice = indice;
 } catch {}
 const desenharPreview=()=>{
  if (!ultimoEstado) return;
  const desenhar = vocacaoArmario === 'vegeta' ? drawVegeta : drawGoku;
  if (!desenhar) return;
  const opcao = skinOpcoes[skinIndice], variadas = skinOpcoes.length > 1;
  const jogador = { ...ultimoEstado.players.find(v => v.id === selfId), moving: false, dead: false, charge: null,
    facing: { x: 0, y: 1 }, forma: opcao.forma, skin: opcao.forma, transformed: false, montaria: null };
  const c = skinCanvas.getContext('2d');
  c.clearRect(0, 0, 200, 180);
  c.save(); c.imageSmoothingEnabled = false; c.translate(100, 150); c.scale(1.8, 1.8);
  desenhar(c, jogador, { x: 0, y: 0 }, ultimoEstado.time);
  c.restore();
  const m = montariaOpcoes[montariaIndice], cm = montariaCanvas.getContext('2d');
  cm.clearRect(0, 0, 200, 130);
  cm.save(); cm.imageSmoothingEnabled = false; cm.translate(100, 100); cm.scale(1.25, 1.25);
  desenharNimbus(cm, { ...jogador, montaria: m.id }, { x: 0, y: 0 }, ultimoEstado.time, { flutuar: false });
  cm.restore();
  skinNome.textContent = opcao.nome;
  montariaNome.textContent = m.nome;
  for (const controle of [skinAnterior, skinProxima, silhuetaSkinEsq, silhuetaSkinDir, notaSkin, resetar]) controle.hidden = !variadas;
  if (variadas) {
   silhuetaSkinEsq.src = skinOpcoes[(skinIndice + skinOpcoes.length - 1) % skinOpcoes.length].icone;
   silhuetaSkinDir.src = skinOpcoes[(skinIndice + 1) % skinOpcoes.length].icone;
  }
  silhuetaMontariaEsq.src = silhuetaMontariaDir.src = '/assets/montarias/nimbus/sprites/nimbus_s_01.png';
 };
 let atualizarPersonalizacao=desenharPreview;
 return s=>{const p=s?.self?.perfil;if(!p)return;ultimoEstado=s;selfId=s.selfId;atualizarPersonalizacao=desenharPreview;ultimo=s.self;const equipadas=barraValida(s.self.barraTecnicas,s.self.hotkeysConsumiveis,s.self.seedSelected);
 const tecnicas = new Set(tecnicasDoPerfil(s.self.vocacao).map(t=>t.id));
 for(const {t,card,detalhes,estado,seletor,formaId,img} of cards){
  card.hidden = !tecnicas.has(t.id);
  card.querySelector('strong').textContent=s.self.vocacao==='vegeta'?(NOMES_TECNICAS_VEGETA[t.id]||t.nome):t.nome;
  const nivel = nivelDaTecnica(t, s.self.vocacao);
  const d=dadosTecnica(t,s.self),liberada=!card.hidden&&s.self.level>=nivel,slot=equipadas.indexOf(t.id);
  if(formaId&&t.imagem)img.src=iconeDaForma(formaId,s.self.vocacao||'goku');
  const requerForma = !liberada ? ''
    : (t.id==='skill:finalFlash' && !formaFinalFlash(s.self.forma)) || (t.id==='skill:bigBangAttack' && !formaBigBangAttack(s.self.forma)) ? ' · requer SSJ1 ou superior'
    : !tecnicaDisponivel(t.id,s.self) && t.id==='skill:superKamehameha' ? ' · requer SSJ4'
    : !tecnicaDisponivel(t.id,s.self) && t.id==='skill:ryuken' ? ' · requer SSJ3 ou SSJ4' : '';
  card.draggable=liberada;card.classList.toggle('bloqueada',!liberada);
  detalhes.textContent=`Nv. ${nivel} · ${d.custo} · recarga ${d.recarga}${t.duracao?' · duração '+Math.round(t.duracao/60)+' min':''}`;
  estado.textContent=(slot>=0?'Na barra: tecla '+(slot+1):liberada?'Disponível':'Libera no nível '+nivel)+requerForma;
  seletor.disabled=!liberada;
 }
 montaria=s.self.montaria;montar.textContent=montaria?'Desmontar '+(montariaOpcoes.find(m=>m.id===montaria)?.nome||'montaria'):'Montar '+(montariaOpcoes[montariaIndice]?.nome||'montaria');nome.textContent=p.nome+' · Nv. '+p.nivel;forma.textContent=p.personagem+' · '+p.forma+(p.godmode?' · God Mode':'');xp.max=p.xpNext;xp.value=Math.min(p.xp,p.xpNext);xpTexto.textContent=numero(p.xp)+' / '+numero(p.xpNext)+' XP';
 const vocacao = s.self.vocacao || 'goku';
 if (vocacao !== vocacaoArmario) {
  vocacaoArmario = vocacao;
  skinOpcoes = vocacao === 'vegeta' ? skinsVegeta : skinsGoku;
  skinIndice = Math.max(0, skinOpcoes.findIndex(o => o.forma === skinPreferida));
 }
 atualizarPersonalizacao();
 const dadosCombate = [numero(p.ataqueAtual), numero(p.stats.defense), numero(p.poder)];
 const dadosExploracao = [numero(p.stats.mobility), numero(p.stats.capacity) + ' kg',
  numero(p.stats.lootChance * 100) + '%', numero(p.kills) + ' mobs · ' + numero(p.bossKills) + ' chefes raros'];
 combate.valores.forEach((campo, i) => { campo.textContent = dadosCombate[i]; });
 exploracao.valores.forEach((campo, i) => { campo.textContent = dadosExploracao[i]; });
 for (const medidor of medidores) {
  const { chave, unidade, atual, total, fontes, vazio } = medidor;
  const taxa = p.regeneracao[chave];
  const formatar = valor => (valor > 0 ? '+' : '') + numero(valor) + ' ' + unidade + '/s';
  atual.textContent = numero(p[chave]) + ' / ' + numero(p.stats[chave]);
  total.textContent = taxa.ilimitada ? 'Ilimitado · God Mode' : formatar(taxa.total);
  total.classList.toggle('perfil-taxa-negativa', taxa.total < 0 && !taxa.ilimitada);
  const lista = JSON.stringify(taxa.fontes);
  if (medidor.ultimaLista !== lista) {
   medidor.ultimaLista = lista;
   fontes.replaceChildren(...taxa.fontes.flatMap(([fonte, valor]) => [el('dt', fonte), el('dd', formatar(valor))]));
  }
  vazio.hidden = taxa.fontes.length > 0 || taxa.ilimitada;
 }
 const efeitos=p.buffs.length?p.buffs:['Nenhum efeito ativo.'];
 if (textoEfeitos!==efeitos.join('\n')) {
  textoEfeitos=efeitos.join('\n');
  buffs.replaceChildren(...efeitos.map(efeito=>el('li',efeito)));
 }
 const c=canvas.getContext('2d');c.clearRect(0,0,240,220);c.save();c.imageSmoothingEnabled=false;const montado=montaria==='nimbus';c.translate(120,montado?170:186);c.scale(montado?1.8:2.2,montado?1.8:2.2);const jogador={...s.players.find(v=>v.id===s.selfId),moving:false,charge:null,facing:{x:0,y:1}},g=desenharNimbus(c,jogador,{x:0,y:0},s.time,{flutuar:!s.self.preferencias.reduzirAnimacoes});(s.self.vocacao==='vegeta'?drawVegeta:drawGoku)?.(c,jogador,g?.personagem||{x:0,y:0},s.time);c.restore();};
}
