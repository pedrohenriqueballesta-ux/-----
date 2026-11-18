// Efeito apenas: o HP, o custo e a recarga continuam no servidor.
export const CURA_VFX = Object.freeze({ imagem: '/assets/skills/cura/spritesheet.png',
  tamanho: 256, colunas: 8, quadros: 24, passo: 1 / 40, duracao: 0.6,
  escala: 0.34, opacidade: 0.55, baseY: 220 });

export function quadroCura(efeito, tempo) {
  if (!efeito || !Number.isFinite(efeito.started)) return -1;
  const idade = tempo - efeito.started;
  if (idade < 0 || idade + 1e-9 >= CURA_VFX.duracao) return -1;
  return Math.floor((idade + 1e-9) / CURA_VFX.passo);
}

let imagem, folha;
export function carregarCura() {
  if (!imagem) { imagem = new Image(); imagem.src = CURA_VFX.imagem; }
  return imagem;
}

export function desenharCura(ctx, jogador, pos, tempo) {
  if (jogador.dead) return false;
  const quadro = quadroCura(jogador.heal, tempo);
  if (quadro < 0) return false;
  const original = carregarCura();
  if (!original.complete || !original.naturalWidth) return false;
  if (!folha) {
    folha = document.createElement('canvas');
    folha.width = original.naturalWidth; folha.height = original.naturalHeight;
    const pintura = folha.getContext('2d'); pintura.drawImage(original, 0, 0);
    // O pacote inclui números de conferência nos cantos; não fazem parte do efeito no mundo.
    for (let i = 0; i < CURA_VFX.quadros; i++) pintura.clearRect(i % 8 * 256, Math.floor(i / 8) * 256, 52, 24);
  }
  const c = CURA_VFX, lado = c.tamanho * c.escala;
  ctx.save(); ctx.globalAlpha *= c.opacidade;
  ctx.drawImage(folha, quadro % c.colunas * c.tamanho, Math.floor(quadro / c.colunas) * c.tamanho,
    c.tamanho, c.tamanho, pos.x - lado / 2, pos.y - c.baseY * c.escala, lado, lado);
  ctx.restore();
  return true;
}
