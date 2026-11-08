// Catálogo inicial de protótipo: preços e datas são configuráveis, sem pagamentos reais.
export const MAX_PREMIUM=1000000000;
export const COLECIONAVEIS=Object.freeze({
 'titulo-guardiao':{nome:'Título: Guardião da Terra',tipo:'título',imagem:'/assets/hud/personagem.png'},
 'moldura-estelar':{nome:'Moldura Estelar',tipo:'moldura',imagem:'/assets/premium/battle-pass.gif'},
 'efeito-celeste':{nome:'Efeito Celeste de habilidade',tipo:'efeito cosmético',imagem:'/assets/hud/personagem.png'},
 'traje-escarlate':{nome:'Traje Escarlate',tipo:'skin',imagem:'/assets/goku-avatar.png'},
 'aura-azul':{nome:'Aura Azul',tipo:'cosmético',imagem:'/assets/hud/personagem.png'},
 'aura-vip':{nome:'Aura Dourada VIP',tipo:'cosmético',imagem:'/assets/hud/personagem/zeni.png'},
 'nimbus-dourada':{nome:'Nimbus Dourada',tipo:'montaria',imagem:'/assets/montarias/nimbus/sprites/nimbus_s_01.png'},
 'emblema-campeao':{nome:'Emblema do Campeão',tipo:'cosmético',imagem:'/assets/premium/battle-pass.gif'}
});
// Configure explicitamente a próxima temporada nesta lista. Sem configuração, o passe encerra.
export const TEMPORADA=Object.freeze({id:'s1',nome:'Temporada 1 · Ascensão Saiyajin',inicio:'2026-11-01T00:00:00Z',fim:'2026-12-01T00:00:00Z',niveis:50,xpPorNivel:1000,precoPremium:500});
export const TEMPORADAS=[TEMPORADA];
export const temporadaEm=(agora=Date.now())=>TEMPORADAS.find(t=>agora>=Date.parse(t.inicio)&&agora<Date.parse(t.fim))||[...TEMPORADAS].reverse().find(t=>agora>=Date.parse(t.inicio))||TEMPORADAS[0];
export const MISSOES_PASSE=Object.freeze([
 {id:'dia-caca',categoria:'diaria',nome:'Derrotar 100 inimigos',evento:'kills',meta:100,xp:100},
 {id:'dia-expedicao',categoria:'diaria',nome:'Derrotar 300 inimigos',evento:'kills',meta:300,xp:200},
 {id:'dia-treino',categoria:'diaria',nome:'Usar 20 habilidades',evento:'skills',meta:20,xp:100},
 {id:'semana-caca',categoria:'semanal',nome:'Derrotar 2.000 inimigos',evento:'kills',meta:2000,xp:800},
 {id:'semana-chefe',categoria:'semanal',nome:'Derrotar 3 chefes',evento:'bosses',meta:3,xp:600},
 {id:'semana-missoes',categoria:'semanal',nome:'Completar 10 missões do jogo',evento:'missoes',meta:10,xp:500}
]);
// Recompensas determinísticas: baús entregam o conteúdo na hora, sem sorteio.
export const RECOMPENSAS_PASSE=Object.fromEntries(['gratis','premium'].map(trilha=>[trilha,Array.from({length:50},(_,i)=>{
 const n=i+1,q=1+Math.floor(n/10),f=trilha==='premium'?2:1;
 const cosm={1:'traje-escarlate',10:'aura-azul',20:'titulo-guardiao',25:'moldura-estelar',35:'efeito-celeste',40:'nimbus-dourada',50:'emblema-campeao'};
 if(trilha==='premium'&&cosm[n])return {colecao:[cosm[n]]};
 if(n%10===0)return {bau:true,itens:{ki:3*q*f,crystal:q*f,scrap:2*q*f},zeni:100*q*f};
 if(n%5===0)return {moedas:10*f};
 return [{zeni:50*q*f},{itens:{ki:2*q*f}},{itens:{crystal:q*f}},{itens:{seed15:q*f}},{itens:{scrap:2*q*f}}][i%5];
})]));
export function recompensaPasse(nivel,trilha){return RECOMPENSAS_PASSE[trilha]?.[nivel-1];}
export const PRODUTOS_STORE=Object.freeze([
 ...[[50,249],[100,490],[250,990],[500,1990],[1000,3490],[2500,7990]].map(([moedas,precoCentavos])=>({id:'moedas-'+moedas,categoria:'moedas',nome:moedas.toLocaleString('pt-BR')+' moedas premium',descricao:'Recarga de teste, sem cobrança real.',precoCentavos,moedas,imagem:'/assets/premium/catalogo/moedas_'+moedas+'_limpo.png'})),
 ...[[15,150],[30,250],[90,650]].map(([dias,preco])=>({id:'vip-'+dias,categoria:'vip',nome:'VIP · '+dias+' dias',descricao:'Identificação VIP e acesso à compra de cosméticos exclusivos VIP. Sem bônus de combate. Duração acumulada ao renovar.',preco,dias,imagem:'/assets/premium/catalogo/vip_'+dias+'_dias_limpo.png'})),
 ...['traje-escarlate','aura-azul','aura-vip','nimbus-dourada'].map((id,i)=>({id,categoria:'itens',nome:COLECIONAVEIS[id].nome,descricao:id==='nimbus-dourada'?'Colecionável da conta. A montaria Nimbus está disponível gratuitamente para todos nesta versão.':'Colecionável da conta. Equipar e efeitos visuais serão disponibilizados em versão futura.',preco:[150,100,120,300][i],colecao:id,requerVip:id==='aura-vip',imagem:COLECIONAVEIS[id].imagem})),
 {id:'passe-'+TEMPORADA.id,categoria:'passe',nome:'Battle Pass Premium · '+TEMPORADA.nome,descricao:'Libera a trilha premium da conta, inclusive níveis já alcançados. Não compra níveis.',preco:TEMPORADA.precoPremium,temporada:TEMPORADA.id,imagem:'/assets/premium/battle-pass.gif'}
]);

// XP de atividades confirmadas, sem modificar o XP do personagem.
export const XP_ATIVIDADES_PASSE=Object.freeze({kills:1,bosses:50});
