import { FINAL_FLASH } from '../shared/tecnicas/final-flash.mjs';

export function poseCombate(jogador, snapshot, tempo, eventos = snapshot.events || []) {
  const inicio = tipo => eventos.find(e => e.playerId === jogador.id && e.type === tipo && tempo >= e.at && tempo - e.at < .36)?.at;
  const kamehamehas = snapshot.kamehamehas || [];
  const peloJogador = k => k.owner === jogador.id;
  const kame = kamehamehas.find(k => peloJogador(k) && !k.galick && !k.finalFlash && (!k.impacto || tempo - k.impacto.started < .25));
  const galick = jogador.charge?.galick ? jogador.charge : kamehamehas.find(k => peloJogador(k) && k.galick);
  const finalFlash = jogador.charge?.finalFlash ? { ...jogador.charge, carga: true }
    : kamehamehas.find(k => peloJogador(k) && k.finalFlash && (!k.impacto || tempo - k.impacto.started < FINAL_FLASH.sustentacao));
  const bigBang = jogador.charge?.bigBangAttack ? jogador.charge : jogador.bigBangLancado;
  return { rajadaStarted: inicio('kiShot'), socoStarted: inicio('punch'), kameStarted: kame?.started, galick, finalFlash, bigBang };
}

export function progressoDoSoco(inicio, tempo) {
  const decorrido = tempo - inicio;
  return decorrido >= 0 && decorrido < .36 ? decorrido / .36 : null;
}

// Os visuais do perfil partem de uma pose própria, sem estados de combate do mundo.
export function personagemParado({ vocacao, forma = 'base', skin = 'base', transformed = false, montaria = null }) {
  return { vocacao, forma, skin, transformed, montaria, moving: false, dead: false, facing: { x: 0, y: 1 } };
}
