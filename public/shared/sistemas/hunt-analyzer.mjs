import {CONFIG,areaPorId} from '../nucleo/config.mjs';
import {ITENS_NEGOCIAVEIS} from './itens-negociaveis.mjs';
import {itemElegivelVendaNpc} from './venda-npc.mjs';
// Sessão de execução: não conta tempo offline nem altera o save do personagem.
export const ativo = p => Boolean(p?.connected && p.autoHunt && p.hp>0 && areaPorId(p.area) && !areaPorId(p.area).segura);
export const novaSessao = () => ({segundos:0,xp:0,danoCausado:0,danoRecebido:0,cura:0,zeni:0,loot:{},drops:{},supplies:{},abates:{},mortes:{},teste:false});
export const agruparLootPorRaridade = itens => Object.groupBy(itens||[],i=>i.raridade||'Não definida');
export function registrar(p,campo,valor=1,item=null){
 if(!ativo(p)||!Number.isFinite(valor)||valor<=0)return;
 const a=p.huntAnalyzer ||= novaSessao();a.teste ||= Boolean(p.godmode);
 if(campo==='loot'||campo==='drops'||campo==='supplies'){if(!Object.hasOwn(ITENS_NEGOCIAVEIS,item))return;a[campo] ||= {};a[campo][item]=(a[campo][item]||0)+valor;}
 else if(['segundos','xp','danoCausado','danoRecebido','cura','zeni'].includes(campo))a[campo]+=valor;
}
// Raridade de catálogo ainda não definida pelo balanceamento: não inventar raridades.
export function resumo(p){
 const a=p.huntAnalyzer||novaSessao();
 const itens=campo=>Object.entries(a[campo]||{}).map(([id,quantidade])=>({id,nome:ITENS_NEGOCIAVEIS[id].nome,icone:ITENS_NEGOCIAVEIS[id].icone,raridade:ITENS_NEGOCIAVEIS[id].raridade||'Não definida',quantidade}));
 const loot=itens('loot'),drops=itens('drops'),supplies=itens('supplies');
 let valorMateriais = 0, valorEquipamentos = 0, valorVendaNpc = 0;
 for (const { id, quantidade } of loot) {
   const item = ITENS_NEGOCIAVEIS[id];
   const valor = (item.precoNpc ?? item.precoReferencia ?? 0) * quantidade;
   if (itemElegivelVendaNpc(id)) valorVendaNpc += item.precoNpc * quantidade;
   if (item.slot) valorEquipamentos += valor;
   else valorMateriais += valor;
 }
 const valorLoot = valorMateriais + valorEquipamentos;
 const gastos=supplies.reduce((n,i)=>n+i.quantidade*(CONFIG.prices[i.id] ?? ITENS_NEGOCIAVEIS[i.id].precoNpc),0);
 const saldoSemEquipamentos = a.zeni + valorMateriais - gastos;
 return {...a,abates:Object.values(a.abates||{}),mortes:Object.values(a.mortes||{}),totalAbates:Object.values(a.abates||{}).reduce((n,i)=>n+i.quantidade,0),totalMortes:Object.values(a.mortes||{}).reduce((n,i)=>n+i.quantidade,0),loot,drops,supplies,ativo:ativo(p),xpHora:a.segundos>0?a.xp*3600/a.segundos:0,valorLoot,valorMateriais,valorEquipamentos,valorVendaNpc,saldoNpc:a.zeni+valorVendaNpc-gastos,gastos,receita:a.zeni+valorLoot,saldoSemEquipamentos,saldo:saldoSemEquipamentos+valorEquipamentos};
}

// Executado antes do golpe fatal reduzir HP ou desligar o Auto Hunt.
export function registrarEncontro(p,campo,mob,chefe=false){
 if(!['abates','mortes'].includes(campo))return;
 if(campo==='mortes' ? !p?.connected||p.hp<=0 : !ativo(p))return;
 const a=p.huntAnalyzer ||= novaSessao();a.teste ||= Boolean(p.godmode);
 const tipo=mob?.type||'desconhecido',area=mob?.area||p.area;
 const chave=JSON.stringify([tipo,area,chefe]);
 const linha=a[campo][chave] ||= {tipo,nome:mob?.name||'Causa desconhecida',area,chefe,quantidade:0,foraAutoHunt:0,ultimoSegundo:0};
 linha.quantidade++;if(!p.autoHunt)linha.foraAutoHunt++;linha.ultimoSegundo=a.segundos;
}
