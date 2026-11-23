import { BIG_BANG_ATTACK } from '../../shared/tecnicas/big-bang-attack.mjs';

const largura = 362, altura = 271, quadros = 16;
const pasta = '/assets/skills/big-bang-attack/';
const folhas = {};
const centroProjetil = [
  [198, 141], [205, 143], [208, 139], [219, 131], [224, 131], [227, 135], [225, 136], [228, 136],
  [225, 141], [225, 140], [231, 143], [228, 137], [225, 140], [224, 142], [225, 141], [228, 139]
];
export function carregarBigBangAttack() {
  for (const nome of ['carga', 'projetil', 'impacto']) {
    if (folhas[nome]) continue;
    const imagem = new Image();
    imagem.src = pasta + nome + '.png';
    folhas[nome] = imagem;
  }
}

function desenharQuadro(ctx, nome, quadro, pos, escala, angulo = 0, ancora = [181, 136]) {
  const imagem = folhas[nome];
  if (!(quadro >= 0 && quadro < quadros) || !imagem?.complete || !imagem.naturalWidth) return;
  ctx.save();
  ctx.translate(pos.x, pos.y);
  if (angulo) ctx.rotate(angulo);
  ctx.drawImage(imagem, (quadro % 4) * largura, Math.floor(quadro / 4) * altura, largura, altura,
    -ancora[0] * escala, -ancora[1] * escala, largura * escala, altura * escala);
  ctx.restore();
}

export function desenharCargaBigBang(ctx, carga, tempo, pos) {
  const t = Math.max(0, tempo - carga.started);
  const quadro = Math.min(quadros - 1, Math.floor(t * quadros / BIG_BANG_ATTACK.carga));
  desenharQuadro(ctx, 'carga', quadro, pos, 0.17);
}

export function posicaoBigBang(efeito, segundosAposSnapshot) {
  if (efeito.impactoEm !== undefined) return efeito.pesAlvo;

  const avanco = Math.min(efeito.avancoVisual, efeito.speed * Math.min(.07, Math.max(0, segundosAposSnapshot)));
  const percorrido = BIG_BANG_ATTACK.alcance - efeito.restante;
  const contato = efeito.distanciaAteContato;
  const progresso = Math.min(1, (percorrido + avanco) / (percorrido + contato || 1));
  const contatoX = efeito.x + efeito.dx * contato;
  const contatoY = efeito.y + efeito.dy * contato;

  // A simulação para na borda do corpo. A projeção visual vai da palma aos pés
  // para que o último ponto do voo coincida com a âncora da explosão.
  return {
    x: efeito.x + efeito.dx * avanco + (efeito.pesAlvo.x - contatoX) * progresso,
    y: efeito.y + efeito.dy * avanco + (efeito.pesAlvo.y - contatoY) * progresso - efeito.altura * (1 - progresso)
  };
}

export function desenharBigBang(ctx, efeito, tempo, pos) {
  if (efeito.impactoEm !== undefined) {
    const quadro = Math.floor(Math.max(0, tempo - efeito.impactoEm) * quadros / BIG_BANG_ATTACK.impacto);
    desenharQuadro(ctx, 'impacto', quadro, pos, 0.34);
    return;
  }
  const fase = Math.floor(Math.max(0, tempo - efeito.started) * 30);
  const quadro = fase < 8 ? fase : 8 + (fase - 8) % 8;
  const dx = efeito.pesAlvo.x - pos.x, dy = efeito.pesAlvo.y - pos.y;
  const angulo = Math.hypot(dx, dy) > .001 ? Math.atan2(dy, dx) : Math.atan2(efeito.dy, efeito.dx);
  desenharQuadro(ctx, 'projetil', quadro, pos, 0.24, angulo, centroProjetil[quadro]);
}
