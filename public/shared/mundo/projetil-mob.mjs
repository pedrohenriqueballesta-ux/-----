// Mesmos inimigos que já combinavam soco e rajada; chefes especiais ficam fora.
export const TIPOS_SOCA_E_ATIRA = Object.freeze(['nail','piccoloDaimaoh','neva','veterano','tsufuruGuerreiro','tsufuruGeneral','hatchiyack','nappa','raditz','bardock','oozaru','oozaruGuerreiro','oozaruSuper','reiVegeta','broly','zarbon','dodoria']);
export const ARTE_PROJETIL_MOB = Object.freeze({ arquivo:'/assets/mobs/projetil-ki/spritesheet.png',quadros:8,largura:288,altura:256,fps:12,tonalidadeOriginal:270,ancoraX:224,ancoraY:128 });
// Tonalidades extraídas das cores saturadas das artes atuais (graus no círculo de cor).
// Cada espécie pode sobrescrever qualquer campo; a ficha individual também aceita `projetil`.
export const PROJETEIS_POR_MOB = Object.freeze({
  // Tonalidades medidas nos clarões de Ki das folhas do Pedro (09/11/2026).
  nail:{cor:196,tamanho:58},piccoloDaimaoh:{cor:197,tamanho:58},neva:{cor:202,tamanho:72,cooldown:1.5},
  ranged:{cor:285},veterano:{cor:105},tsufuruGuerreiro:{cor:285},tsufuruGeneral:{cor:45},hatchiyack:{cor:345},
  nappa:{cor:45},raditz:{cor:45},bardock:{cor:345},oozaru:{cor:15},oozaruGuerreiro:{cor:45},
  oozaruSuper:{cor:45,cooldown:1.5},reiVegeta:{cor:345},broly:{cor:75},zarbon:{cor:225},dodoria:{cor:345}
});
export function configurarProjetilMob(tipo, atributos) {
  const perfil=PROJETEIS_POR_MOB[tipo];if(!perfil)return null;
  return { dano:atributos.attack,velocidade:250,tamanho:48,cor:270,cooldown:.95,alcance:235+(atributos.corpo||0),fps:12,...perfil,...atributos.projetil };
}
export function quadroProjetilMob(idade,fps=12) {
  return Math.floor(Math.max(0,idade)*fps+1e-8)%ARTE_PROJETIL_MOB.quadros;
}
export function iniciarVooTarget(origem,alvo,config,tempo) {
  const dx=alvo.x-origem.x,dy=alvo.y-origem.y,distancia=Math.hypot(dx,dy),comprimento=distancia||1;
  return { x:origem.x,y:origem.y,dx:dx/comprimento,dy:dy/comprimento,speed:config.velocidade,
    started:tempo,atualizadoEm:tempo,chegaEm:tempo+Math.max(1/60,distancia/config.velocidade),ttl:1,
    damage:config.dano,cor:config.cor,tamanho:config.tamanho,fps:config.fps };
}
export function avancarVooTarget(projetil,alvo,tempo) {
  const dt=Math.max(0,tempo-projetil.atualizadoEm);if(!dt)return false;
  const restante=Math.max(0,projetil.chegaEm-projetil.atualizadoEm);
  const dx=alvo.x-projetil.x,dy=alvo.y-projetil.y,distancia=Math.hypot(dx,dy);
  const fracao=restante<=dt+1e-9?1:dt/restante;
  const comprimento=distancia||1;
  projetil.dx=dx/comprimento;projetil.dy=dy/comprimento;
  // O tempo de voo depende da velocidade configurada. A correção de percurso converge
  // ao alvo vivo no fim desse tempo, mesmo quando sua mobilidade supera a velocidade inicial.
  projetil.speed=distancia/Math.max(dt,restante);
  projetil.x+=dx*fracao;projetil.y+=dy*fracao;projetil.atualizadoEm=tempo;
  return fracao===1 || distancia<.001;
}
