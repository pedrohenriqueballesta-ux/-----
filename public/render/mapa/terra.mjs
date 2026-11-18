// Desenho da Cidade do Oeste (Terra): chão da equipe e prédios separados (regras em shared/mundo/terra.mjs).
import { CHAO_TERRA, PREDIOS_TERRA } from '../../shared/mundo/terra.mjs';
import { NPC_CHEF_SAIKAN } from '../../art/personagens/chef-saikan/npc-chef-saikan.mjs';
import { drawSheet } from '../../art/atlas.mjs';

const imagens = new Map();
const carregar = url => {
  if (!imagens.has(url)) { const img = new Image(); img.src = url; imagens.set(url, img); }
  return imagens.get(url);
};
const pronta = img => img.complete && img.naturalWidth > 0;
export const chaoTerra = () => carregar(CHAO_TERRA.url);
export function carregarTerra() { chaoTerra(); for (const p of PREDIOS_TERRA) { carregar(p.imagem); for (const e of p.estaticos || []) carregar(e.imagem); } carregar(NPC_CHEF_SAIKAN.file); }

// Chão inteiro esticado no mundo (sem suavizar: pixel art). Devolve false enquanto carrega.
export function desenharChaoTerra(ctx, mundo) {
  const chao = chaoTerra(); if (!pronta(chao)) return false;
  ctx.drawImage(chao, 0, 0, mundo.w, mundo.h);
  return true;
}

// `atras`: posição do jogador; se ele está atrás do prédio (pés acima da base, dentro do desenho), o prédio fica meio
// transparente para o personagem não sumir (decisão do Pedro, 16/11/2026).
export const jogadorAtras = (p, pos) => Boolean(pos) && pos.y < p.y && pos.y > p.y - p.h && Math.abs(pos.x - p.x) < p.w / 2 + 20;
export function desenharPredioTerra(ctx, p, pos = null) {
  const img = carregar(p.imagem); if (!pronta(img)) return false;
  const alfa = ctx.globalAlpha; if (jogadorAtras(p, pos)) ctx.globalAlpha = alfa * .45;
  ctx.drawImage(img, Math.round(p.x - p.w / 2), Math.round(p.y - p.h), p.w, p.h);
  ctx.globalAlpha = alfa;
  return true;
}

// Nome do prédio acima da porta quando o jogador chega perto (os nomes vêm do jogo, não da arte).
export function desenharNomePredio(ctx, p, perto) {
  if (!perto) return;
  ctx.save(); ctx.font = 'bold 15px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  // Com NPCs na porta, o nome vai acima das cabeças deles (não por cima).
  const y = p.estaticos?.length ? Math.min(...p.estaticos.map(e => e.y - e.h)) - 10 : p.porta.y - Math.min(p.h, 90) - 6, w = ctx.measureText(p.nome).width + 16;
  ctx.fillStyle = '#0d1a33cc'; ctx.fillRect(p.x - w / 2, y - 21, w, 24);
  ctx.strokeStyle = '#f2c94c'; ctx.lineWidth = 1.5; ctx.strokeRect(p.x - w / 2, y - 21, w, 24);
  ctx.fillStyle = '#fff'; ctx.fillText(p.nome, p.x, y);
  ctx.restore();
}

// NPC parado na porta de um prédio de interação (Chef Saikan, no Mercado de comida). Respira em loop e vira para o
// jogador quando ele chega perto; longe, olha para a rua (sul). Altura igual à do Goku (70).
const FOLHAS_NPC = { 'Chef Saikan': NPC_CHEF_SAIKAN };
export function desenharNpcTerra(ctx, i, tempo, pos = null) {
  const folha = FOLHAS_NPC[i.npc]; if (!folha || !i.npcPos) return false;
  const img = carregar(folha.file); if (!pronta(img)) return false;
  const dx = pos ? pos.x - i.npcPos.x : 0, dy = pos ? pos.y - i.npcPos.y : 1, perto = pos && Math.hypot(dx, dy) < 260;
  const olhar = perto ? { x: dx, y: dy } : { x: 0, y: 1 };
  return drawSheet(ctx, folha, img, i.npcPos, 70, olhar, Math.floor(tempo * 2.5) % folha.columns);
}

// NPC estático (Bulma, Dr. Brief): uma pose de frente, parado, sem acompanhar o jogador.
export function desenharNpcEstatico(ctx, e) {
  const img = carregar(e.imagem); if (!pronta(img)) return false;
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, Math.round(e.x - e.w / 2), Math.round(e.y - e.h), e.w, e.h); ctx.restore();
  return true;
}
