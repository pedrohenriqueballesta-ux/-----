// Onde dá para andar em cada planeta. Planeta de hunt usa a máscara gerada da imagem do solo
// (namek-passagem.mjs para Namekusei); planeta sem máscara (a Terra) é livre.
import { NAMEK_PASSAGEM } from './namek-passagem.mjs';
import { VEGETA_PASSAGEM } from './vegeta-passagem.mjs';
import { OBSTACLES, PLANETS, areaPorId, casaBloqueia, decoracaoBloqueia } from './config.mjs';

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

// Área de cada célula (máscara com `areas`): corridas "índice*comprimento", índice em `ids` a partir de 1.
function decodificarAreas({ cols, rows, ids, areas }) {
  const grade = new Uint8Array(cols * rows);
  areas.forEach((linha, y) => {
    let x = 0;
    for (const corrida of linha.split('.')) { const [i, n] = corrida.split('*'); const k = parseInt(n, 36); grade.fill(Number(i), y * cols + x, y * cols + x + k); x += k; }
  });
  return { grade, indice: Object.fromEntries(ids.map((id, i) => [id, i + 1])) };
}
// A máscara foi gerada em px da imagem do solo; cada célula cresce com a escala do planeta.
// Planeta novo: gere a máscara dele e acrescente aqui.
const mascara = (planet, m) => ({ ...m, cellW: m.cellW * PLANETS[planet].escala, cellH: m.cellH * PLANETS[planet].escala, grade: decodificar(m),
  areas: m.areas ? decodificarAreas(m) : null });
const MASCARAS = { namek: mascara('namek', NAMEK_PASSAGEM), vegeta: mascara('vegeta', VEGETA_PASSAGEM) };
// Planeta com máscara tem água/penhasco: quem persegue precisa de caminho por terra.
export const temMascara = planet => Boolean(MASCARAS[planet]);

// Só o terreno (mar/lagos), sem contar casas e outras construções.
export function emTerra(planet, x, y) {
  const m = MASCARAS[planet];
  if (!m) return true;
  const cx = Math.floor(x / m.cellW), cy = Math.floor(y / m.cellH);
  return cx >= 0 && cy >= 0 && cx < m.cols && cy < m.rows && m.grade[cy * m.cols + cx] === 1;
}

// Área fechada (ids de ZONES): fora da caixa dela não se anda, mesmo que o chão continue. Se a máscara do
// planeta diz a área de cada célula (Vegeta: ilhas cujas caixas se cruzam), vale também a área da célula.
function naArea(area, x, y) {
  const z = area && areaPorId(area);
  if (!z) return true;
  if (!(x >= z.x && y >= z.y && x <= z.x + z.w && y <= z.y + z.h)) return false;
  const m = MASCARAS[z.planet], a = m?.areas;
  if (!a || !a.indice[area]) return true;
  const cx = Math.floor(x / m.cellW), cy = Math.floor(y / m.cellH);
  return a.grade[cy * m.cols + cx] === a.indice[area];
}

export function podeAndar(planet, x, y, area = null) {
  if (!naArea(area, x, y)) return false;
  if (OBSTACLES.some(o => o.planet === planet && Math.hypot(o.x - x, o.y - y) < o.r)) return false;
  const m = MASCARAS[planet];
  if (!m) return true;
  const cx = Math.floor(x / m.cellW), cy = Math.floor(y / m.cellH);
  if (cx < 0 || cy < 0 || cx >= m.cols || cy >= m.rows) return false;
  return m.grade[cy * m.cols + cx] === 1 && !casaBloqueia(planet, x, y) && !decoracaoBloqueia(planet, x, y);
}

// Pés do personagem: centro e oito pontos a 60% do raio. Evita encostar o corpo na água
// sem exigir que o círculo inteiro caiba (o que travaria em trilhas estreitas).
export function pesLivres(planet, x, y, radius, area = null) {
  const r = radius * 0.6;
  if (!podeAndar(planet, x, y, area)) return false;
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    if (!podeAndar(planet, x + Math.cos(a) * r, y + Math.sin(a) * r, area)) return false;
  }
  return true;
}

// Um passo de movimento: eixo X e depois Y, cada um só se o destino estiver dentro do mundo,
// longe dos obstáculos e com os pés em terra. Servidor (Game.move) e predição do cliente usam
// esta mesma regra; se divergirem, o cliente anda onde o servidor não deixa e o personagem treme.
// `area` prende o passo à área fechada onde a entidade está (null: sem área, como na Terra).
export function deslocar(planet, x, y, dx, dy, dist, radius = 15, area = null) {
  const world = PLANETS[planet] || PLANETS.namek;
  // Quem já está num ponto bloqueado (save antigo, mob nascido na água) pode sair dele.
  const preso = !pesLivres(planet, x, y, radius, area);
  const livre = (nx, ny) => nx >= radius && ny >= radius && nx <= world.w - radius && ny <= world.h - radius
    && !OBSTACLES.some(o => o.planet === planet && Math.hypot(o.x - nx, o.y - ny) < o.r + radius)
    && (preso || pesLivres(planet, nx, ny, radius, area));
  const nx = x + dx * dist, ny = y + dy * dist;
  if (livre(nx, y)) x = nx;
  if (livre(x, ny)) y = ny;
  return [x, y];
}

// Caminho por terra entre dois pontos, sem cortar água, quinas ou obstáculos entre as células.
// O fim opcional deixa o jogador dentro do alcance de combate sem tentar ocupar o mesmo ponto do mob.
const PASSO_GRADE = 4;   // células da máscara por célula de busca (24 px da imagem, ≈43 unidades do mundo)
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
  const g = { planet, area, raio, cols, rows, cw, ch, livre, arestas: new Map() };
  cacheGrade.set(chave, g); return g;
}
// Célula livre mais próxima de (cx, cy). Com `alcanca`, só vale a que dá para alcançar andando em linha
// reta a partir do ponto real: sem isso, quem está numa fresta sem saída recebia uma célula do outro lado
// da parede e ficava empurrando a parede (trava da caça automática, 03/11).
function celulaLivreMaisProxima(g, cx, cy, alcanca = null) {
  for (let r = 0; r < 8; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const x = cx + dx, y = cy + dy;
    if (x >= 0 && y >= 0 && x < g.cols && y < g.rows && g.livre[y * g.cols + x]
      && (!alcanca || alcanca((x + 0.5) * g.cw, (y + 0.5) * g.ch))) return y * g.cols + x;
  }
  return -1;
}
// Dá para ir de `de` até (x, y) em linha reta com os pés livres (amostras a cada 6 unidades)?
function retaLivre(planet, area, de, x, y, raio = 15) {
  const n = Math.max(1, Math.ceil(Math.hypot(x - de.x, y - de.y) / 6));
  for (let i = 1; i <= n; i++) if (!pesLivres(planet, de.x + (x - de.x) * i / n, de.y + (y - de.y) * i / n, raio, area)) return false;
  return true;
}
function centro(g, i) { return { x: (i % g.cols + 0.5) * g.cw, y: (Math.floor(i / g.cols) + 0.5) * g.ch }; }
function vizinhosLivres(g, c, validarArestas = true) {
  const cx = c % g.cols, p = centro(g, c), viz = [1, -1, g.cols, -g.cols, g.cols + 1, g.cols - 1, -g.cols + 1, -g.cols - 1], livres = [];
  for (const d of viz) {
    const n = c + d, nx = n % g.cols;
    if (n < 0 || n >= g.livre.length || Math.abs(nx - cx) > 1 || !g.livre[n]) continue;
    // Diagonal só com as duas vizinhas retas livres: não corta quina.
    if (nx !== cx && n - c !== 1 && n - c !== -1 && (!g.livre[c + (nx - cx)] || !g.livre[n - (nx - cx)])) continue;
    const q = centro(g, n);
    if (validarArestas) {
      const chave = c < n ? c * g.livre.length + n : n * g.livre.length + c;
      if (!g.arestas.has(chave)) g.arestas.set(chave, retaLivre(g.planet, g.area, p, q.x, q.y, g.raio));
      if (!g.arestas.get(chave)) continue;
    }
    livres.push(n);
  }
  return livres;
}
export function caminhoPorTerra(planet, de, ate, area = null, alcanceFinal = 0) {
  if (!MASCARAS[planet]) return null;
  const alcanca = pesLivres(planet, de.x, de.y, 15, area) ? (x, y) => retaLivre(planet, area, de, x, y) : null;
  return buscar(gradeBusca(planet, area, FOLGA_CAMINHO), de, ate, alcanca, alcanceFinal)
    || buscar(gradeBusca(planet, area), de, ate, alcanca, alcanceFinal);
}
function celulasObjetivo(g, ate, alcance) {
  if (!alcance) {
    const fim = celulaLivreMaisProxima(g, Math.floor(ate.x / g.cw), Math.floor(ate.y / g.ch));
    return fim < 0 ? [] : [fim];
  }
  const cx = Math.floor(ate.x / g.cw), cy = Math.floor(ate.y / g.ch), raio = Math.ceil(alcance / Math.min(g.cw, g.ch)) + 1, fins = [];
  for (let dy = -raio; dy <= raio; dy++) for (let dx = -raio; dx <= raio; dx++) {
    const x = cx + dx, y = cy + dy, i = y * g.cols + x;
    if (x < 0 || y < 0 || x >= g.cols || y >= g.rows || !g.livre[i]) continue;
    const px = (x + 0.5) * g.cw, py = (y + 0.5) * g.ch;
    if (Math.hypot(px - ate.x, py - ate.y) <= alcance) fins.push(i);
  }
  return fins;
}
function buscar(g, de, ate, alcanca, alcanceFinal) {
  const ini = celulaLivreMaisProxima(g, Math.floor(de.x / g.cw), Math.floor(de.y / g.ch), alcanca);
  const fins = celulasObjetivo(g, ate, alcanceFinal);
  if (ini < 0 || !fins.length) return null;
  const objetivo = new Uint8Array(g.livre.length); for (const i of fins) objetivo[i] = 1;
  const veio = new Int32Array(g.cols * g.rows).fill(-1); veio[ini] = ini;
  const fila = new Int32Array(g.cols * g.rows); let a = 0, b = 0; fila[b++] = ini; let fim = -1;
  while (a < b) {
    const c = fila[a++]; if (objetivo[c]) { fim = c; break; }
    for (const n of vizinhosLivres(g, c)) if (veio[n] < 0) { veio[n] = c; fila[b++] = n; }
  }
  if (fim < 0) return null;
  const pontos = [];
  for (let c = fim; ; c = veio[c]) {
    pontos.push({ x: (c % g.cols + 0.5) * g.cw, y: (Math.floor(c / g.cols) + 0.5) * g.ch });
    if (c === ini) break;
  }
  pontos.reverse();
  // Reduz a rota em segmentos retos seguros. Seguir cada centro da grade fazia o personagem
  // corrigir a direção a cada poucos pixels e tremular, mesmo em trechos abertos.
  const rota = []; let origem = de, inicio = 0;
  while (inicio < pontos.length) {
    let proximo = inicio;
    for (let i = inicio; i < pontos.length; i++) {
      if (retaLivre(g.planet, g.area, origem, pontos[i].x, pontos[i].y, g.raio)) proximo = i;
    }
    origem = pontos[proximo]; rota.push(origem); inicio = proximo + 1;
  }
  return rota;
}

// Conectividade estática da hunt a partir da chegada. Também impede que mobs surjam em ilhas
// de terra isoladas pela água/penhasco, onde a caça automática nunca poderia alcançá-los.
const componentesCache = new Map();
function componenteDesde(planet, area, origem) {
  const chave = `${planet}:${area}:${origem.x}:${origem.y}`;
  if (componentesCache.has(chave)) return componentesCache.get(chave);
  const g = gradeBusca(planet, area, 15), alcanca = (x, y) => retaLivre(planet, area, origem, x, y, 15);
  const ini = celulaLivreMaisProxima(g, Math.floor(origem.x / g.cw), Math.floor(origem.y / g.ch), alcanca);
  if (ini < 0) { componentesCache.set(chave, null); return null; }
  const alcancaveis = new Uint8Array(g.livre.length), fila = new Int32Array(g.livre.length); let a = 0, b = 0;
  fila[b++] = ini; alcancaveis[ini] = 1;
  while (a < b) for (const n of vizinhosLivres(g, fila[a++], false)) if (!alcancaveis[n]) { alcancaveis[n] = 1; fila[b++] = n; }
  const componente = { g, alcancaveis }; componentesCache.set(chave, componente); return componente;
}
export function pontoAlcancavelDesde(planet, origem, ponto, area, alcance = 49) {
  if (!MASCARAS[planet]) return true;
  const componente = componenteDesde(planet, area, origem);
  if (!componente) return false;
  const { g, alcancaveis } = componente, cx = Math.floor(ponto.x / g.cw), cy = Math.floor(ponto.y / g.ch);
  const raio = Math.ceil(alcance / Math.min(g.cw, g.ch)) + 1;
  for (let dy = -raio; dy <= raio; dy++) for (let dx = -raio; dx <= raio; dx++) {
    const x = cx + dx, y = cy + dy, i = y * g.cols + x;
    if (x < 0 || y < 0 || x >= g.cols || y >= g.rows || !alcancaveis[i]) continue;
    const c = centro(g, i);
    if (Math.hypot(c.x - ponto.x, c.y - ponto.y) <= alcance) return true;
  }
  return false;
}
