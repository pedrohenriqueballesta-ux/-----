import { el, botao } from '../render/hud/hud-elementos.mjs';
import { requisitarAuth } from './entrada.mjs';
import { MERCADORES, PORTAIS } from '../shared/nucleo/config.mjs';
import { itemElegivelVendaNpc } from '../shared/sistemas/venda-npc.mjs';

const HUNT = 'terra-montanhas';
const mercador = MERCADORES.find(m => m.planet === 'terra' && !m.area);
const textos = {
 'pt-BR': [
  ['Explore a Cidade do Oeste', 'Ande com WASD, as setas ou clique no chão.'],
  ['Ajuste a interface', 'Abra Configurações, escolha uma preferência e altere seu valor.'],
  ['Compre suprimentos', 'Vá até o mercador indicado, abra a Loja (L) e compre uma Poção de Ki ou de Energia.'],
  ['Viaje para a Terra Selvagem', 'Siga a seta até a nave e selecione a Clareira do Centro.'],
  ['Entre na primeira hunt', 'Na Clareira do Centro, siga a seta até o portal do Vale da Cachoeira.'],
  ['Ataque um inimigo', 'Saia da área segura. Aproxime-se de um inimigo e use Espaço para socar ou uma técnica na sua barra.'],
  ['Recupere a vida', 'Quando perder HP, use Cura de Vida no slot 1 ou tome uma Poção de Energia pela mochila (I).'],
  ['Ative a caça automática', 'Pressione H para ligar o Auto Hunt. Abra o painel para ajustar combo, buff e recuperação.'],
  ['Recolha um drop para vender', 'Elimine inimigos e passe perto do loot. O Hunt Analyzer mostra o saldo da sessão.'],
  ['Volte à Cidade do Oeste', 'Desligue o Auto Hunt com H. Siga a seta até a saída e volte pela Clareira do Centro.'],
  ['Venda o loot no NPC', 'Vá ao mercador indicado, abra a Loja e use Vender Tudo ou selecione os itens.'],
  ['Abra Missões e veja as Tasks', 'Abra Missões (J). Entre na aba Tasks para ver os monstros, metas e recompensas.']
 ],
 en: [
  ['Explore West City','Move with WASD, the arrow keys or by clicking the ground.'],
  ['Adjust the interface','Open Settings and change a preference.'],
  ['Buy supplies','Go to the marked merchant, open the shop (L) and buy a Ki or Energy Potion.'],
  ['Travel to the Wilds','Follow the arrow to the ship and select the Central Clearing.'],
  ['Enter your first hunt','Follow the arrow from the clearing to the Waterfall Valley portal.'],
  ['Attack an enemy','Leave the safe area. Approach an enemy and press Space to punch or use a skill.'],
  ['Recover HP','After taking damage, use Heal in slot 1 or use an Energy Potion from your bag (I).'],
  ['Start Auto Hunt','Press H to start Auto Hunt. Its panel lets you set your combo, buff and recovery.'],
  ['Pick up loot to sell','Defeat enemies and walk near loot. The Hunt Analyzer shows your session balance.'],
  ['Return to West City','Press H to stop Auto Hunt. Follow the arrow back via the Central Clearing.'],
  ['Sell loot to a merchant','Go to the marked merchant, open the shop and sell all or select items.'],
  ['Open Missions and check Tasks','Open Missions (J), then open Tasks to see enemies, targets and rewards.']
 ],
 es: [
  ['Explora la Ciudad del Oeste','Muévete con WASD, las flechas o haz clic en el suelo.'],
  ['Ajusta la interfaz','Abre Configuración y cambia una preferencia.'],
  ['Compra suministros','Ve al mercader indicado, abre la tienda (L) y compra una poción de Ki o Energía.'],
  ['Viaja a la Tierra Salvaje','Sigue la flecha a la nave y elige el Claro Central.'],
  ['Entra en tu primera cacería','En el Claro Central, sigue la flecha al Valle de la Cascada.'],
  ['Ataca a un enemigo','Sal de la zona segura. Acércate al enemigo y pulsa Espacio para golpear o usa una técnica.'],
  ['Recupera vida','Después de recibir daño, usa Cura de Vida en la ranura 1 o una poción desde la mochila (I).'],
  ['Activa Auto Hunt','Pulsa H. En el panel puedes ajustar el combo, la transformación y la recuperación.'],
  ['Recoge botín para vender','Vence enemigos y acércate al botín. Hunt Analyzer muestra el saldo de la sesión.'],
  ['Regresa a la Ciudad del Oeste','Pulsa H para detener Auto Hunt. Sigue la flecha de vuelta por el Claro Central.'],
  ['Vende el botín al mercader','Ve al mercader indicado, abre la tienda y vende todo o selecciona artículos.'],
  ['Abre Misiones y consulta Tasks','Abre Misiones (J) y entra en Tasks para ver enemigos, objetivos y recompensas.']
 ]
};

const lugarAtual = s => s.area ?? s.planet;
const aviso = (p, texto) => p && { ...p, texto };

export function portalGuia(snapshot, destino) {
 const origem = lugarAtual(snapshot);
 if (origem === destino) return null;
 const vistos = new Set([origem]), fila = [{ lugar: origem, primeiro: null }];
 for (const { lugar, primeiro } of fila) {
  for (const portal of PORTAIS) {
   if ((portal.area ?? portal.planet) !== lugar) continue;
   for (const proximo of portal.destinos) {
    if (vistos.has(proximo)) continue;
    if (proximo === destino) return primeiro ?? portal;
    vistos.add(proximo);
    fila.push({ lugar: proximo, primeiro: primeiro ?? portal });
   }
  }
 }
 return null;
}

export function instalarTutorial({ entrada, liberarTeclas }) {
 const painel = el('aside',null,'tutorial-guia'), titulo=el('h2'), progresso=el('small'), texto=el('p'), erro=el('p',null,'entrada-erro');
 const pular=botao('',()=>terminar('pular')), proximo=botao('',avancar);
 const botoes=el('div',null,'tutorial-acoes');botoes.append(pular,proximo);
 painel.id='tutorialDialog';painel.hidden=true;painel.setAttribute('aria-label','Tutorial');
 painel.append(progresso,titulo,texto,erro,botoes);document.body.append(painel);
 painel.addEventListener('keydown',e=>{if(botoes.contains(e.target))e.stopPropagation();});
 let etapa=0, revendo=false, pendente=false, snapshot=null, inicio=null, tempoEtapa=Infinity;

 function mostrar() {
  const [nome,instrucao]=(textos[entrada.idioma]??textos['pt-BR'])[etapa];
  progresso.textContent=entrada.t('tutorialProgresso',{n:etapa+1,total:12});
  titulo.textContent=nome;texto.textContent=instrucao;
  pular.textContent=entrada.t('pular');
  proximo.textContent=entrada.t(etapa===11?'concluirTutorial':'proximo');
  pular.disabled=proximo.disabled=pendente;
 }
 async function salvar(dados) {
  const r=await requisitarAuth('tutorial',dados);
  entrada.atualizarConta(r.conta);
 }
 async function terminar(operacao) {
  if (pendente||painel.hidden) return;
  pendente=true;erro.textContent='';mostrar();
  try { if(!revendo)await salvar({operacao}); painel.hidden=true;liberarTeclas(); }
  catch { erro.textContent=entrada.t('tutorialErro'); }
  finally { pendente=false;mostrar(); }
 }
 async function avancar() {
  if (pendente||painel.hidden) return;
  if (etapa===11) return terminar('concluir');
  const proxima=etapa+1;
  pendente=true;erro.textContent='';mostrar();
  try { if(!revendo)await salvar({operacao:'etapa',etapa:proxima}); etapa=proxima; inicio=null;tempoEtapa=snapshot?.time??Infinity; }
  catch { erro.textContent=entrada.t('tutorialErro'); }
  finally { pendente=false;mostrar(); }
 }
 return {
  iniciar(rever=false) {
   if(!entrada.conta||(!rever&&entrada.conta.tutorialCompleted))return;
   revendo=rever;etapa=rever?0:entrada.conta.tutorialStep||0;inicio=null;tempoEtapa=snapshot?.time??Infinity;
   erro.textContent='';painel.hidden=false;mostrar();
  },
  fechar(){painel.hidden=true;snapshot=null;},
  acao(dados) {
   if(painel.hidden||pendente)return;
   const {type,skill,item,slot}=dados;
   const equipado=snapshot?.self?.hotkeysConsumiveis?.[slot];
   const recuperacao=type==='seed'||type==='food'||(type==='usarConsumivel'&&item==='pocao-energia')
    ||(type==='usarConsumivelHotkey'&&(equipado==='pocao-energia'||equipado==='food'||equipado?.startsWith('seed')));
   if((etapa===1&&type==='preferencias')||(etapa===2&&['buy','buyAll'].includes(type))||
      (etapa===6&&((type==='skill'&&skill==='heal')||recuperacao))||
      (etapa===10&&['sell','venderSelecionados','venderItem'].includes(type))) avancar();
  },
  atualizar(s) {
   snapshot=s;
   if(painel.hidden||pendente||!s?.self)return;
   const p=s.players.find(p=>p.id===s.selfId);
   if(!p)return;
   inicio??={ x:p.x, y:p.y, lugar:lugarAtual(s) };
   if (tempoEtapa===Infinity) tempoEtapa=s.time;
   if((etapa===0&&(inicio.lugar!==lugarAtual(s)||Math.hypot(p.x-inicio.x,p.y-inicio.y)>60))||
      (etapa===3&&s.planet==='terra-hunts')||(etapa===4&&s.area===HUNT)||
      (etapa===5&&s.events.some(e=>e.type==='damage'&&e.autorId===s.selfId&&e.at>tempoEtapa))||(etapa===7&&s.self.autoHunt)||
      (etapa===8&&Object.keys(s.self.inventory).some(id=>s.self.inventory[id]>0&&itemElegivelVendaNpc(id)))||
      (etapa===9&&s.planet==='terra')||
      (etapa===11&&document.querySelector('#hudFuncionalDialog[open][data-hud-view="missoes"] .missoes-abas button:nth-child(2)[aria-pressed="true"]'))) avancar();
  },
  alvoMapa() {
   if(painel.hidden||!snapshot)return null;
   let destino;
   if ([2,9,10].includes(etapa)) destino='terra';
   else if(etapa===3) destino='terra-hub';
   else if(etapa===4||etapa>=5&&etapa<=8) destino=HUNT;
   if(destino&&lugarAtual(snapshot)!==destino)return aviso(portalGuia(snapshot,destino),'➤');
   if([2,10].includes(etapa))return aviso(mercador,'➤');
   return null;
  }
 };
}
