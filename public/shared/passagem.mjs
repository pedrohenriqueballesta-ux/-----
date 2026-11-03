// Onde dá para andar em cada planeta. Namekusei usa a máscara gerada da imagem do solo
// (namek-passagem.mjs); os demais planetas são livres.
import { NAMEK_PASSAGEM } from './namek-passagem.mjs';
import { ESCALA_MUNDO, OBSTACLES, PLANETS, areaPorId, casaBloqueia } from './config.mjs';

function decodificar({ cols, rows, linhas }) {
  const grade = new Uint8Array(cols * rows);
  linhas.forEach((linha, y) => {
    let x = 0, anda = true;
    for (const corrida of linha.split('.')) {
      const n = parseInt(corrida, 36);
      if (anda) grade.fill(1, y * cols + x, y * cols + x + n);
      x += n; anda = !anda;
    }
  });
  return grade;
}

// A máscara foi gerada em px da imagem do solo; cada célula cresce com a escala do mundo.
const MASCARAS = { namek: { ...NAMEK_PASSAGEM, cellW: NAMEK_PASSAGEM.cellW * ESCALA_MUNDO, cellH: NAMEK_PASSAGEM.cellH * ESCALA_MUNDO, grade: decodificar(NAMEK_PASSAGEM) } };

// Grade da máscara de um planeta (null se ele não tiver água): o cliente usa para desenhar a névoa
// sobre a terra que fica fora da área onde o jogador está.
export const mascaraDe = planet => MASCARAS[planet] || null;

// Só o terreno (mar/lagos), sem contar casas e outras construções.
export function emTerra(planet, x, y) {
  const m = MASCARAS[planet];
  if (!m) return true;
  const cx = Math.floor(x / m.cellW), cy = Math.floor(y / m.cellH);
  return cx >= 0 && cy >= 0 && cx < m.cols && cy < m.rows && m.grade[cy * m.cols + cx] === 1;
}

// Área fechada (ids de ZONES): fora da caixa dela não se anda, mesmo que o chão continue.
function naArea(area, x, y) {
  const z = area && areaPorId(area);
  return !z || (x >= z.x && y >= z.y && x <= z.x + z.w && y <= z.y + z.h);
}

export function podeAndar(planet, x, y, area = null) {
  if (!naArea(area, x, y)) return false;
  const m = MASCARAS[planet];
  if (!m) return true;
  const cx = Math.floor(x / m.cellW), cy = Math.floor(y / m.cellH);
  if (cx < 0 || cy < 0 || cx >= m.cols || cy >= m.rows) return false;
  return m.grade[cy * m.cols + cx] === 1 && !(planet === 'namek' && casaBloqueia(x, y));
}

// Pés do personagem: centro e quatro pontos a 60% do raio. Evita encostar o corpo na água
// sem exigir que o círculo inteiro caiba (o que travaria em trilhas estreitas).
export function pesLivres(planet, x, y, radius, area = null) {
  const r = radius * 0.6;
  return podeAndar(planet, x, y, area) && podeAndar(planet, x + r, y, area) && podeAndar(planet, x - r, y, area)
    && podeAndar(planet, x, y + r, area) && podeAndar(planet, x, y - r, area);
}

// Um passo de movimento: eixo X e depois Y, cada um só se o destino estiver dentro do mundo,
// longe dos obstáculos e com os pés em terra. Servidor (Game.move) e predição do cliente usam
// esta mesma regra; se divergirem, o cliente anda onde o servidor não deixa e o personagem treme.
// `area` prende o passo à área fechada onde a entidade está (null: sem área, como na Terra).
export function deslocar(planet, x, y, dx, dy, dist, radius = 15, area = null) {
  const world = PLANETS[planet] || PLANETS.namek, onNamek = planet === 'namek';
  // Quem já está num ponto bloqueado (save antigo, mob nascido na água) pode sair dele.
  const preso = !pesLivres(planet, x, y, radius, area);
  const livre = (nx, ny) => nx >= radius && ny >= radius && nx <= world.w - radius && ny <= world.h - radius
    && (!onNamek || !OBSTACLES.some(o => Math.hypot(o.x - nx, o.y - ny) < o.r + radius))
    && (preso || pesLivres(planet, nx, ny, radius, area));
  const nx = x + dx * dist, ny = y + dy * dist;
  if (livre(nx, y)) x = nx;
  if (livre(x, ny)) y = ny;
  return [x, y];
}

// Caminho por terra entre dois pontos (busca em largura numa grade grossa da máscara), sem sair da área.
// Devolve a lista de pontos do mundo até o destino, ou null se não houver ligação por terra.
const PASSO_GRADE = 4;   // células da máscara por célula de busca (6 px * 4 = 24 unidades)
// O caminho prefere passar com folga (raio 24): rente ao obstáculo o personagem entrava em cantinhos
// e travava (quina de casa na Vila, recorte de penhasco no Planalto). Sem caminho com folga, usa o raio do pé.
const FOLGA_CAMINHO = 24;
const cacheGrade = new Map();
function gradeBusca(planet, area, raio = 15) {
  const chave = planet + ':' + area + ':' + raio;
  if (cacheGrade.has(chave)) return cacheGrade.get(chave);
  const m = MASCARAS[planet];
  const cols = Math.floor(m.cols / PASSO_GRADE), rows = Math.floor(m.rows / PASSO_GRADE);
  const livre = new Uint8Array(cols * rows), cw = m.cellW * PASSO_GRADE, ch = m.cellH * PASSO_GRADE;
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++)
    livre[y * cols + x] = pesLivres(planet, (x + 0.5) * cw, (y + 0.5) * ch, raio, area) ? 1 : 0;
  const g = { cols, rows, cw, ch, livre };
  cacheGrade.set(chave, g); return g;
}
function celulaLivreMaisProxima(g, cx, cy) {
  for (let r = 0; r < 8; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const x = cx + dx, y = cy + dy;
    if (x >= 0 && y >= 0 && x < g.cols && y < g.rows && g.livre[y * g.cols + x]) return y * g.cols + x;
  }
  return -1;
}
export function caminhoPorTerra(planet, de, ate, area = null) {
  if (!MASCARAS[planet]) return null;
  return buscar(gradeBusca(planet, area, FOLGA_CAMINHO), de, ate) || buscar(gradeBusca(planet, area), de, ate);
}
function buscar(g, de, ate) {
  const ini = celulaLivreMaisProxima(g, Math.floor(de.x / g.cw), Math.floor(de.y / g.ch));
  const fim = celulaLivreMaisProxima(g, Math.floor(ate.x / g.cw), Math.floor(ate.y / g.ch));
  if (ini < 0 || fim < 0) return null;
  const veio = new Int32Array(g.cols * g.rows).fill(-1); veio[ini] = ini;
  const fila = new Int32Array(g.cols * g.rows); let a = 0, b = 0; fila[b++] = ini;
  const viz = [1, -1, g.cols, -g.cols, g.cols + 1, g.cols - 1, -g.cols + 1, -g.cols - 1];
  while (a < b) {
    const c = fila[a++]; if (c === fim) break;
    const cx = c % g.cols;
    for (const d of viz) {
      const n = c + d, nx = n % g.cols;
      if (n < 0 || n >= veio.length || Math.abs(nx - cx) > 1 || veio[n] >= 0 || !g.livre[n]) continue;
      // Diagonal só com as duas vizinhas retas livres: não corta quina.
      if (nx !== cx && n - c !== 1 && n - c !== -1 && (!g.livre[c + (nx - cx)] || !g.livre[n - (nx - cx)])) continue;
      veio[n] = c; fila[b++] = n;
    }
  }
  if (veio[fim] < 0) return null;
  const pontos = [];
  for (let c = fim; c !== ini; c = veio[c]) pontos.push({ x: (c % g.cols + 0.5) * g.cw, y: (Math.floor(c / g.cols) + 0.5) * g.ch });
  return pontos.reverse();
}
