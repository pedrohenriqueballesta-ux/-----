// Espalha árvores, arbustos e pedras por Namekusei e grava public/shared/decoracao-namek.mjs.
// Uso: node gerar_decoracao.mjs <terreno.json> <objetos.json>
// Regras (Pedro, 03/11/2026): árvores e arbustos só onde há mata, aleatórios, sem exagero; pedras em toda
// a terra, menos o chão vermelho do Campo de Batalha. Para parecer natural (Pedro: "muito artificial e
// plantado"): na borda da mata e em grupos, não soltos no meio do tapete de copas do mapa. Só dentro das áreas jogáveis, longe de portais,
// chegadas, mercador, casas e ruínas e círculo do chefe. Quem bloqueia (troncos e
// pedras grandes) só vai em chão aberto, para não fechar trilha.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const J = fileURLToPath(new URL('../public/shared/', import.meta.url));   // public/shared do repositório
writeFileSync(J + 'decoracao-namek.mjs', 'export const DECORACAO_NAMEK = [];\n');   // gera sem bloqueios antigos
const { ZONES, PORTAIS, MERCHANT, HOUSES, naEscala } = await import(J + 'config.mjs');
const { pesLivres } = await import(J + 'passagem.mjs');
const { CIRCULO_DO_CHEFE } = await import(J + 'enemies.mjs');
const [terrenoArq, objetosArq] = process.argv.slice(2);
const terreno = JSON.parse(readFileSync(terrenoArq)), objetos = JSON.parse(readFileSync(objetosArq));
const CEL = naEscala(6), cols = 768, rows = 512;
const grade = linhas => linhas.map(l => [...l].map(Number));
const mataBruta = grade(terreno.mata), vermelho = grade(terreno.vermelho), areia = grade(terreno.areia);
// mata suavizada: maioria numa janela de 7×7 células (o detector pinta a mata salpicada)
const mata = mataBruta.map((l, y) => l.map((_, x) => {
  let s = 0, n = 0;
  for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const r = mataBruta[y + dy]?.[x + dx]; if (r !== undefined) { s += r; n++; } }
  return s / n > 0.45 ? 1 : 0;
}));
const em = (g, x, y) => g[Math.floor(y / CEL)]?.[Math.floor(x / CEL)] === 1;
let semente = 20261103; const rnd = () => (semente = (semente * 16807) % 2147483647) / 2147483647;
const longe = [...PORTAIS.filter(o => o.planet === 'namek').map(o => [o.x, o.y, 260]), ...ZONES.map(z => [z.chegada.x, z.chegada.y, 300]),
  [MERCHANT.x, MERCHANT.y, 260], ...HOUSES.map(c => [c.x, c.y, c.w * 0.9]),
  [CIRCULO_DO_CHEFE.x, CIRCULO_DO_CHEFE.y, CIRCULO_DO_CHEFE.r + 120]];
const ARVORES = [...Array(12).keys()], ARBUSTOS = [12, 13, 14], PEDRAS = [15, 16, 17], BLOQUEIA = new Set([...ARVORES, 15, 16]);
const postos = [];
function aberto(x, y, area, r) {   // chão andável num anel em volta (não fecha trilha)
  for (let a = 0; a < 8; a++) { const t = a * Math.PI / 4; if (!pesLivres('namek', x + Math.cos(t) * r, y + Math.sin(t) * r, 15, area)) return false; }
  return pesLivres('namek', x, y, 15, area);
}
// Borda: a coisa está a até `r` unidades de outro tipo de chão (areia, trilha, água, penhasco).
function naBorda(x, y, dentro, r) {
  for (let a = 0; a < 12; a++) { const t = a * Math.PI / 6, px = x + Math.cos(t) * r, py = y + Math.sin(t) * r; if (!dentro(px, py)) return true; }
  return false;
}
const naMata = (x, y) => em(mata, x, y), terraLivre = (x, y) => pesLivres('namek', x, y, 15) && !em(mata, x, y);
// Grupos: um centro na borda e de 1 a `max` vizinhos em volta (árvores não nascem uma a uma, igual espaçadas).
function grupos(quantos, sprites, aceita, borda, max, raioGrupo, distMin) {
  let tentativas = 0, feitos = 0;
  while (feitos < quantos && tentativas++ < quantos * 600) {
    const z = ZONES[Math.floor(rnd() * ZONES.length)];
    const cx = z.x + rnd() * z.w, cy = z.y + rnd() * z.h;
    if (!aceita(cx, cy) || !borda(cx, cy)) continue;
    const n = 1 + Math.floor(rnd() * max);
    for (let i = 0; i < n && feitos < quantos; i++) {
      const a = rnd() * Math.PI * 2, d = i ? 40 + rnd() * raioGrupo : 0;
      const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.7, sprite = sprites[Math.floor(rnd() * sprites.length)];
      if (!aceita(x, y) || longe.some(([lx, ly, r]) => Math.hypot(lx - x, ly - y) < r)) continue;
      if (postos.some(p => Math.hypot(p.x - x, p.y - y) < distMin)) continue;
      if (!aberto(x, y, z.id, BLOQUEIA.has(sprite) ? 70 : 20)) continue;
      postos.push({ sprite, x: Math.round(x), y: Math.round(y), escala: +(0.8 + rnd() * 0.3).toFixed(2) }); feitos++;
    }
  }
  return feitos;
}
// Árvores e arbustos em CHÃO ABERTO (areia, clareira, beira de trilha) encostados na borda de fora da mata:
// em cima do tapete de copas desenhado no mapa (visto de cima) uma árvore em pé parecia adesivo (Pedro, 03/11).
// Pedras na terra sem mata, perto de bordas e penhascos. Nada no chão vermelho. Grupos de 1 a 3.
// Chão aberto = areia/trilha/chão bege de verdade (cor bem definida no mapa; a mata escura engana o detector).
const chaoAberto = (x, y) => pesLivres('namek', x, y, 15) && em(areia, x, y) && !em(vermelho, x, y);
const naoAreia = (x, y) => !em(areia, x, y) && !em(vermelho, x, y);
// Junto da mata: a até r há chão que não é areia, é terra e não é vermelho (a mata, vista do lado da areia).
const juntoDaMata = r => (x, y) => { for (let a = 0; a < 12; a++) { const t = a * Math.PI / 6, px = x + Math.cos(t) * r, py = y + Math.sin(t) * r; if (naoAreia(px, py) && pesLivres('namek', px, py, 15)) return true; } return false; };
const nArv = grupos(100, ARVORES, chaoAberto, juntoDaMata(70), 3, 120, 95);
const nArb = grupos(80, ARBUSTOS, chaoAberto, juntoDaMata(35), 2, 60, 55);
const nPed = grupos(80, PEDRAS, chaoAberto, (x, y) => naBorda(x, y, terraLivre, 55), 3, 80, 60);
postos.sort((a, b) => a.y - b.y);
writeFileSync(J + 'decoracao-namek.mjs', `// Árvores, arbustos e pedras de Namekusei, gerados por ferramentas/gerar_decoracao.mjs
// (não edite à mão: gere de novo). x, y = base no chão, em unidades do mundo; sprite = índice em
// OBJETOS_DECORACAO (config.mjs); escala = variação de tamanho.
export const DECORACAO_NAMEK = ${JSON.stringify(postos)};
`);
writeFileSync(J + 'decoracao-objetos.mjs', `// Recortes da folha de árvores/arbustos/pedras (public/assets/namek/decoracao.png), por
// ferramentas/recortar_objetos.py: [sx, sy, w, h, baseX, baseY]. 0–11 árvores, 12–14 arbustos, 15–17 pedras.
export const OBJETOS_DECORACAO = ${JSON.stringify(objetos)};
`);
console.log('árvores', nArv, 'arbustos', nArb, 'pedras', nPed);
