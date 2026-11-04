// Árvores secas e cristais da Floresta Seca (Planeta Vegeta), recortados do próprio solo por
// ~/idle-dbz/ferramentas/recortar_arvore_vegeta.py (objetos em ~/idle-dbz/referencias/mapas/vegeta/objetos-floresta.json).
// Eles já estão pintados no chão; o recorte é desenhado de novo por cima, na ordem de profundidade pela base,
// para quem passa por trás ficar coberto (relato do Pedro, 04/11: "parece que está passando por cima").
// x, y = base no chão (px da imagem de 4608); img = [x, y, largura, altura] do recorte no solo de 8192.
// O bloqueio (pé da árvore, base do cristal) está na máscara de passagem, não aqui.
export const VEGETA_OBJETOS_ESCALA = 1.7777777777777777;
export const VEGETA_OBJETOS = [
  { id: 'arvore-1', tipo: 'arvore', x: 3141, y: 473, img: [5255, 399, 735, 444] },
  { id: 'arvore-2', tipo: 'arvore', x: 2715, y: 662, img: [4563, 852, 498, 327] },
  { id: 'arvore-3', tipo: 'arvore', x: 3386, y: 441, img: [5911, 623, 254, 163] },
  { id: 'arvore-4', tipo: 'arvore', x: 3709, y: 512, img: [6436, 612, 433, 300] },
  { id: 'arvore-5', tipo: 'arvore', x: 4135, y: 520, img: [6945, 430, 759, 496] },
  { id: 'arvore-6', tipo: 'arvore', x: 3362, y: 844, img: [5705, 1081, 600, 421] },
  { id: 'arvore-7', tipo: 'arvore', x: 4119, y: 930, img: [7036, 1216, 640, 439] },
  { id: 'arvore-8', tipo: 'arvore', x: 3315, y: 1128, img: [5763, 1756, 396, 251] },
  { id: 'cristal-1', tipo: 'cristal', x: 3844, y: 288, img: [6724, 374, 216, 140] },
  { id: 'cristal-2', tipo: 'cristal', x: 2845, y: 466, img: [4988, 741, 133, 88] },
  { id: 'cristal-3', tipo: 'cristal', x: 4353, y: 580, img: [7640, 909, 209, 124] },
  { id: 'cristal-4', tipo: 'cristal', x: 2866, y: 662, img: [5047, 1101, 79, 74] },
  { id: 'cristal-5', tipo: 'cristal', x: 3003, y: 746, img: [5224, 1154, 238, 174] },
  { id: 'cristal-6', tipo: 'cristal', x: 3928, y: 906, img: [6889, 1493, 190, 116] },
  { id: 'cristal-7', tipo: 'cristal', x: 3679, y: 1045, img: [6337, 1609, 382, 251] }
];
