// Árvores secas e cristais da Floresta Seca (Planeta Vegeta), recortados do próprio solo por
// ferramentas/recortar_arvore_vegeta.py (objetos em ~/idle-dbz/referencias/mapas/vegeta/objetos-floresta.json).
// Eles já estão pintados no chão; o recorte é desenhado de novo por cima, na ordem de profundidade pela base,
// para quem passa por trás ficar coberto (relato do Pedro, 04/11: "parece que está passando por cima").
// Vulcões dos Campos de Lava (05/11, relato do Pedro: bloqueavam onde não deviam): recortados pelo contorno marcado à mão
// (ferramentas/recortar_vulcoes.py + referencias/mapas/vegeta/vulcoes.json); só o pé do cone bloqueia.
// x, y = base no chão (px da imagem de 4608; nos vulcões, o ponto mais baixo do pé). Vulcão: `frente` = borda de baixo do
// contorno de 8 em 8 px; quem está abaixo dela naquela coluna é desenhado na frente (como na frente da casa); img = [x, y, largura, altura] do recorte no solo de 8192.
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
  { id: 'cristal-7', tipo: 'cristal', x: 3679, y: 1045, img: [6337, 1609, 382, 251] },
  { id: 'vulcao-grande', tipo: 'vulcao', x: 4140, y: 1744, img: [6842, 2566, 1018, 539], frente: {"x0": 3850, "passo": 8, "y": [1675, 1678, 1681, 1684, 1687, 1690, 1693, 1696, 1699, 1702, 1705, 1708, 1711, 1714, 1717, 1720, 1721, 1723, 1724, 1726, 1727, 1729, 1730, 1732, 1733, 1735, 1737, 1738, 1740, 1741, 1743, 1744, 1744, 1744, 1744, 1743, 1743, 1743, 1742, 1742, 1742, 1742, 1741, 1741, 1741, 1740, 1740, 1740, 1739, 1737, 1736, 1734, 1733, 1732, 1730, 1729, 1727, 1726, 1724, 1723, 1721, 1720, 1718, 1715, 1708, 1702, 1695, 1689, 1683, 1676, 1670, 1663]} },
  { id: 'vulcao-sudoeste', tipo: 'vulcao', x: 3505, y: 2014, img: [5820, 3180, 831, 405], frente: {"x0": 3275, "passo": 8, "y": [1975, 1980, 1985, 1990, 1995, 2000, 2000, 2001, 2001, 2002, 2003, 2003, 2004, 2005, 2005, 2006, 2007, 2007, 2008, 2009, 2009, 2010, 2011, 2011, 2012, 2013, 2013, 2014, 2014, 2014, 2014, 2014, 2013, 2013, 2013, 2013, 2012, 2012, 2012, 2012, 2011, 2011, 2011, 2011, 2010, 2010, 2010, 2009, 2006, 2003, 2000, 1997, 1994, 1991, 1988, 1984, 1981, 1978, 1975]} },
  { id: 'vulcao-norte', tipo: 'vulcao', x: 4148, y: 1397, img: [7150, 2291, 449, 197], frente: {"x0": 4023, "passo": 8, "y": [1370, 1374, 1378, 1383, 1384, 1385, 1386, 1388, 1389, 1390, 1392, 1393, 1394, 1395, 1397, 1397, 1397, 1397, 1397, 1397, 1397, 1397, 1397, 1397, 1396, 1393, 1389, 1386, 1383, 1380, 1377, 1373]} }
];
