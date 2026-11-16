import {desenharNimbus} from './nimbus.mjs';

import {el,botao,numero,barra} from './hud-elementos.mjs';
import {MAGIAS_PERSONAGEM,barraValida,tecnicaDisponivel} from '../shared/barra-tecnicas.mjs';
import {dadosTecnica} from './barra-tecnicas-hud.mjs';
export function montarPerfil(container,{acao}={}){
 let montaria=null;
 const montar=botao('Montar Nimbus',()=>acao?.({type:'montaria',valor:montaria==='nimbus'?null:'nimbus'})),preview=el('a','Testar oito direções da Nimbus');preview.href='/nimbus.html';preview.target='_blank';preview.rel='noopener';
 const montarias=el('section',null,'perfil-montaria');montarias.append(el('h3','Montaria'),el('p','Nimbus disponível gratuitamente. Apenas visual, sem bônus de velocidade.'),montar,preview);
 let drawGoku=null;import('../art/goku.mjs').then(m=>{drawGoku=m.drawGoku;});
 const coluna=el('div',null,'perfil-visual'),canvas=el('canvas');canvas.width=240;canvas.height=220;canvas.setAttribute('aria-label','Sprite atual do personagem');canvas.setAttribute('role','img');
 const nome=el('h3'),forma=el('p'),xp=barra(0,1),xpTexto=el('p'),attrs=el('dl',null,'perfil-atributos'),buffs=el('p'),nota=el('p','Atributos crescem automaticamente com o nível. Equipamentos ainda não estão implementados.','hud-nota');
 coluna.append(canvas,nome,forma,xp,xpTexto);const dados=el('div');dados.append(attrs,buffs,nota);const grid=el('div',null,'perfil-grid');grid.append(coluna,dados);
 const abas=el('nav',null,'perfil-abas'),abaDados=botao('Personagem',()=>mostrar('personagem')),abaTecnicas=botao('Técnicas',()=>mostrar('tecnicas'));
 abas.setAttribute('aria-label','Abas do personagem');abas.append(abaDados,abaTecnicas);
 const painelDados=el('div',null,'perfil-painel'),painelTecnicas=el('div',null,'perfil-painel perfil-tecnicas');painelDados.append(grid,montarias);
 const mostrar=qual=>{const tecnicas=qual==='tecnicas';painelDados.hidden=tecnicas;painelTecnicas.hidden=!tecnicas;abaDados.setAttribute('aria-pressed',String(!tecnicas));abaTecnicas.setAttribute('aria-pressed',String(tecnicas));};
 const aviso=el('p','Arraste uma magia ou transformação para qualquer slot de 1 a 8. Consumíveis podem ser colocados na barra pela mochila. Técnicas bloqueadas ficam visíveis.','hud-nota');painelTecnicas.append(aviso);
 const lista=el('div',null,'perfil-tecnicas-lista');painelTecnicas.append(lista);container.append(abas,painelDados,painelTecnicas);mostrar('personagem');
 let ultimo=null;
 const cards=[...MAGIAS_PERSONAGEM].sort((a,b)=>a.nivel-b.nivel).map(t=>{
  const card=el('article',null,'perfil-tecnica'),img=t.imagem?el('img',null,'perfil-tecnica-icone'):el('span',null,'tecnica-icone '+t.icone);
  if(t.imagem){img.src=t.imagem;img.alt='';img.draggable=false;}
  const texto=el('div'),titulo=el('strong',t.nome),detalhes=el('small'),estado=el('small'),seletor=el('select');seletor.setAttribute('aria-label','Colocar '+t.nome+' no slot');
  seletor.append(new Option('Colocar no slot…',''));for(let i=1;i<=8;i++)seletor.append(new Option('Tecla '+i,String(i)));
  card.addEventListener('dragstart',e=>{if(!card.draggable){e.preventDefault();return;}e.dataTransfer.effectAllowed='copy';e.dataTransfer.setData('application/x-dbi-tecnica',t.id);});
  seletor.onchange=()=>{const slot=Number(seletor.value)-1;seletor.value='';if(!ultimo||slot<0)return;const novos=barraValida(ultimo.barraTecnicas,ultimo.hotkeysConsumiveis,ultimo.seedSelected),anterior=novos.indexOf(t.id);if(anterior>=0)novos[anterior]=novos[slot];novos[slot]=t.id;acao?.({type:'configurarBarra',slots:novos});};
  texto.append(titulo,detalhes,estado);card.append(img,texto,seletor);lista.append(card);return {t,card,detalhes,estado,seletor};
 });
 const linhas=[['HP','Vida atual e máxima.'],['Ki','Energia atual e máxima.'],['Ataque físico','Valor base e bônus de transformação/Kaioken usados pelo soco.'],['Ataques de Ki','As técnicas usam multiplicadores próprios do ataque base; não existe atributo de ataque de Ki separado.'],['Defesa','Reduz o dano por 100 / (100 + defesa × 3).'],['Movimento','Velocidade real de deslocamento por segundo.'],['Regeneração','HP por segundo da comida ativa. Sem comida não há regeneração passiva de HP.'],['Poder de combate','Indicador derivado: HP/10 + Ki/10 + ataque×5 + defesa×3. Não altera o dano.'],['Capacidade','Peso máximo da mochila.'],['Chance de drop','Chance de gerar o drop principal; algumas recompensas possuem chance própria.'],['Vitórias','Total de mobs e chefes raros derrotados.']].map(([n,t])=>{const dt=el('dt',n),dd=el('dd');dt.title=t;dt.tabIndex=0;attrs.append(dt,dd);return dd;});
 return s=>{const p=s?.self?.perfil;if(!p)return;ultimo=s.self;const equipadas=barraValida(s.self.barraTecnicas,s.self.hotkeysConsumiveis,s.self.seedSelected);
 for(const {t,card,detalhes,estado,seletor} of cards){
  const d=dadosTecnica(t,s.self),liberada=s.self.level>=t.nivel,slot=equipadas.indexOf(t.id);
  const requerForma=liberada&&!tecnicaDisponivel(t.id,s.self)
   ? t.id==='skill:superKamehameha'?' · requer SSJ4':t.id==='skill:ryuken'?' · requer SSJ3 ou SSJ4':''
   : '';
  card.draggable=liberada;card.classList.toggle('bloqueada',!liberada);
  detalhes.textContent=`Nv. ${t.nivel} · ${d.custo} · recarga ${d.recarga}${t.duracao?' · duração '+Math.round(t.duracao/60)+' min':''}`;
  estado.textContent=(slot>=0?'Na barra: tecla '+(slot+1):liberada?'Disponível':'Libera no nível '+t.nivel)+requerForma;
  seletor.disabled=!liberada;
 }
 montaria=s.self.montaria;montar.textContent=montaria==='nimbus'?'Desmontar Nimbus':'Montar Nimbus';nome.textContent=p.nome+' · Nv. '+p.nivel;forma.textContent=p.personagem+' · '+p.forma+(p.godmode?' · God Mode':'');xp.max=p.xpNext;xp.value=Math.min(p.xp,p.xpNext);xpTexto.textContent=numero(p.xp)+' / '+numero(p.xpNext)+' XP';
 const valores=[numero(p.hp)+' / '+numero(p.stats.hp),numero(p.ki)+' / '+numero(p.stats.ki),numero(p.ataqueAtual)+' (base '+numero(p.base.attack)+' + bônus '+numero(p.bonusAtaque)+')','Multiplicadores por técnica',numero(p.stats.defense),numero(p.stats.mobility),numero(p.regeneracao)+' HP/s',numero(p.poder),numero(p.stats.capacity)+' kg',numero(p.stats.lootChance*100)+'%',numero(p.kills)+' mobs · '+numero(p.bossKills)+' chefes raros'];linhas.forEach((e,i)=>e.textContent=valores[i]);buffs.textContent=p.buffs.length?p.buffs.join(' '):'Nenhum buff ativo.';
 const c=canvas.getContext('2d');c.clearRect(0,0,240,220);c.save();c.imageSmoothingEnabled=false;const montado=montaria==='nimbus';c.translate(120,montado?170:186);c.scale(montado?1.8:2.2,montado?1.8:2.2);const jogador={...s.players.find(v=>v.id===s.selfId),moving:false,charge:null,facing:{x:0,y:1}},g=desenharNimbus(c,jogador,{x:0,y:0},s.time,{flutuar:!s.self.preferencias.reduzirAnimacoes});drawGoku?.(c,jogador,g?.personagem||{x:0,y:0},s.time);c.restore();};
}
