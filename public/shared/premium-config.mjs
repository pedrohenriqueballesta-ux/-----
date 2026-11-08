// Catálogo inicial de protótipo: preços e datas são configuráveis, sem pagamentos reais.
export const MAX_PREMIUM=1000000000;
export const COLECIONAVEIS=Object.freeze({
 'traje-escarlate':{nome:'Traje Escarlate',tipo:'skin',imagem:'/assets/goku-avatar.png'},
 'aura-azul':{nome:'Aura Azul',tipo:'cosmético',imagem:'/assets/hud/personagem.png'},
 'aura-vip':{nome:'Aura Dourada VIP',tipo:'cosmético',imagem:'/assets/hud/personagem/zeni.png'},
 'nimbus-dourada':{nome:'Nimbus Dourada',tipo:'montaria',imagem:'/assets/teleports/nuvem.png'},
 'emblema-campeao':{nome:'Emblema do Campeão',tipo:'cosmético',imagem:'/assets/premium/battle-pass.gif'}
});
export const TEMPORADA=Object.freeze({id:'s1',nome:'Temporada 1 · Ascensão Saiyajin',inicio:'2026-11-01T00:00:00Z',fim:'2027-02-01T00:00:00Z',niveis:50,xpPorNivel:100,precoPremium:500});
export const MISSOES_PASSE=Object.freeze([
 {id:'dia-caca',categoria:'diaria',nome:'Caçada do dia',evento:'kills',meta:30,xp:100},
 {id:'dia-coleta',categoria:'diaria',nome:'Recursos do dia',evento:'coleta',meta:8,xp:75},
 {id:'dia-treino',categoria:'diaria',nome:'Treino de técnicas',evento:'skills',meta:40,xp:75},
 {id:'semana-caca',categoria:'semanal',nome:'Expedição da semana',evento:'kills',meta:250,xp:500},
 {id:'semana-chefe',categoria:'semanal',nome:'Desafio dos chefes raros',evento:'bosses',meta:1,xp:400}
]);
export function recompensaPasse(nivel,trilha){
 if(trilha==='premium'){
  const colecao={1:'traje-escarlate',10:'aura-azul',25:'nimbus-dourada',50:'emblema-campeao'}[nivel];
  return colecao?{colecao:[colecao]}:nivel%5===0?{moedas:20}:nivel%2===0?{itens:{seed30:1}}:{zeni:150};
 }
 return nivel%5===0?{moedas:10}:nivel%4===0?{itens:{seed15:1}}:nivel%3===0?{itens:{food:3}}:nivel%2===0?{itens:{ki:2}}:{zeni:50};
}
export const PRODUTOS_STORE=Object.freeze([
 {id:'moedas-100',categoria:'moedas',nome:'100 moedas premium',descricao:'Recarga de teste; nenhum valor real é cobrado.',precoCentavos:490,moedas:100,imagem:'/assets/hud/personagem/zeni.png'},
 {id:'moedas-550',categoria:'moedas',nome:'550 moedas premium',descricao:'Pacote de desenvolvimento; pagamento futuro.',precoCentavos:1990,moedas:550,imagem:'/assets/hud/personagem/zeni.png'},
 {id:'moedas-1200',categoria:'moedas',nome:'1.200 moedas premium',descricao:'Recarga simulada disponível somente em desenvolvimento.',precoCentavos:3990,moedas:1200,imagem:'/assets/premium/store.gif'},
 {id:'vip-30',categoria:'vip',nome:'VIP · 30 dias',descricao:'Identificação VIP e acesso à compra de cosméticos exclusivos VIP. Sem bônus de combate.',preco:250,dias:30,imagem:'/assets/premium/store.gif'},
 {id:'vip-90',categoria:'vip',nome:'VIP · 90 dias',descricao:'Mesmos benefícios VIP por 90 dias. Duração acumulada ao renovar.',preco:650,dias:90,imagem:'/assets/premium/store.gif'},
 ...['traje-escarlate','aura-azul','aura-vip','nimbus-dourada'].map((id,i)=>({id,categoria:'itens',nome:COLECIONAVEIS[id].nome,descricao:'Colecionável da conta. Equipar e efeitos visuais serão disponibilizados em versão futura.',preco:[150,100,120,300][i],colecao:id,requerVip:id==='aura-vip',imagem:COLECIONAVEIS[id].imagem})),
 {id:'passe-s1',categoria:'passe',nome:'Battle Pass Premium · Temporada 1',descricao:'Libera a trilha premium deste personagem, inclusive níveis já alcançados. Não compra níveis.',preco:TEMPORADA.precoPremium,temporada:TEMPORADA.id,imagem:'/assets/premium/battle-pass.gif'}
]);
