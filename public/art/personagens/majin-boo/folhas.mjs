// As chaves abaixo identificam poses do atlas. IDs de combate pertencem ao catálogo de técnicas.
const limitesY = [0, 307, 614, 922, 1229, 1536];

function folha(nome, pes, recortes) {
  const frames = recortes ?? pes.map((pe, linha) => Array.from({ length: 4 }, (_, coluna) => {
    const x = coluna * 256;
    const y = limitesY[linha];
    return [x, y, 256, limitesY[linha + 1] - y, x + 128, y + pe];
  }));
  return { file: '/assets/majin-boo/' + nome, width: 1024, height: 1536,
    rows: 5, columns: 4, referenceHeight: 240, frames };
}

// Soco e Angry Explosion ultrapassam células nominais. Os retângulos exclusivos
// de cada pose preservam os pixels da arte e os pivôs continuam fixos por direção.
export const FOLHAS_MAJIN_BOO = Object.freeze({
  parado: folha('01_parado.png', [274, 279, 282, 277, 277]),
  andar: folha('02_caminhada.png', [280, 278, 275, 266, 271]),
  soco: folha('03_soco.png', null, [
    [[25, 35, 201, 239, 128, 274], [280, 34, 202, 240, 384, 274], [529, 34, 212, 241, 640, 274], [795, 35, 202, 240, 896, 274]],
    [[30, 341, 191, 239, 128, 580], [282, 338, 192, 241, 384, 580], [530, 337, 216, 244, 640, 580], [803, 342, 189, 238, 896, 580]],
    [[50, 645, 154, 250, 128, 896], [286, 644, 188, 252, 384, 896], [534, 646, 228, 252, 640, 896], [804, 646, 170, 249, 896, 896]],
    [[33, 951, 181, 245, 128, 1198], [274, 945, 200, 256, 384, 1198], [526, 947, 242, 254, 640, 1198], [794, 951, 181, 245, 896, 1198]],
    [[30, 1257, 192, 241, 128, 1500], [283, 1257, 209, 243, 384, 1500], [526, 1259, 234, 243, 640, 1500], [802, 1260, 195, 240, 896, 1500]],
  ]),
  rajada: folha('04_rajada_ki.png', [277, 273, 278, 269, 268]),
  chocolate: folha('05_raio_chocolate.png', [276, 260, 262, 250, 265]),
  clones: folha('06_invocacao_clones.png', [276, 273, 278, 269, 266]),
  supernova: folha('07_supernova.png', [286, 259, 272, 270, 278]),
  angry: folha('08_angry_explosion.png', null, [
    [[34, 44, 192, 230, 128, 274], [283, 44, 205, 230, 384, 274], [537, 41, 203, 234, 640, 274], [782, 30, 228, 245, 896, 274]],
    [[33, 345, 190, 226, 128, 570], [275, 345, 207, 226, 384, 570], [518, 341, 215, 229, 640, 570], [772, 334, 241, 236, 896, 570]],
    [[45, 636, 159, 236, 128, 872], [271, 641, 191, 231, 384, 872], [512, 637, 194, 234, 640, 872], [764, 626, 227, 246, 896, 872]],
    [[37, 927, 180, 240, 128, 1169], [272, 930, 179, 239, 384, 1169], [511, 924, 189, 245, 640, 1169], [756, 910, 240, 260, 896, 1169]],
    [[33, 1242, 193, 250, 128, 1492], [272, 1244, 213, 248, 384, 1492], [511, 1236, 226, 255, 640, 1492], [757, 1229, 256, 263, 896, 1492]],
  ])
});

export const RETRATO_MAJIN_BOO = '/assets/hud/vocacoes/profile_majin_boo.png';

const icone = arquivo => '/assets/skills/majin-boo/majin_boo_' + arquivo + '.png';

export const POSES_MAJIN_BOO = Object.freeze({
  parado: { nome: 'Parado' },
  andar: { nome: 'Caminhada' },
  soco: { nome: 'Soco', quadroAcao: 3 },
  rajada: { nome: 'Rajada de Ki', quadroAcao: 3, quadroNorte: 4 },
  chocolate: { nome: 'Raio de Chocolate', quadroAcao: 3, icone: icone('chocolate_beam') },
  clones: { nome: 'Invocação de Clones', quadroAcao: 4, icone: icone('clone_summoning') },
  supernova: { nome: 'Supernova', quadroAcao: 3, icone: icone('supernova') },
  angry: { nome: 'Angry Explosion', quadroAcao: 4, icone: icone('angry_explosion') }
});
