// Assa uma pintura à mão na máscara de passagem de um mapa.
//
// Fluxo: a gente gera a tela de pintura (a arte do solo com um tom azul onde se anda hoje), pinta de MAGENTA
// (#FF00FF) por cima do que deve BLOQUEAR (rebordos de rocha das bordas, pedras, árvores, cristais, vulcões),
// e esta ferramenta lê a pintura e marca essas células como bloqueio na máscara do mapa (o `*-passagem.mjs`).
// A pintura só ACRESCENTA bloqueio: o que já era bloqueio (abismo/água) continua; o chão pintado vira bloqueio.
//
// Uso: node ferramentas/assar_pintura_mapa.mjs <mapa> <pintura.png>
//   <mapa> = vegeta | namek   (a pintura cobre o mapa inteiro, na proporção do solo)
// Precisa do ffmpeg no PATH (converte o PNG para RGBA cru, robusto a como o editor salvou).

import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const MAPAS = {
  vegeta: { modulo: 'public/shared/mundo/vegeta-passagem.mjs', nome: 'VEGETA_PASSAGEM' },
  namek:  { modulo: 'public/shared/mundo/namek-passagem.mjs',  nome: 'NAMEK_PASSAGEM'  },
};
const LIMIAR = 0.3; // fração da célula pintada de magenta para virar bloqueio.

const [mapa, pintura] = process.argv.slice(2);
if (!MAPAS[mapa] || !pintura) { console.error('uso: node ferramentas/assar_pintura_mapa.mjs <vegeta|namek> <pintura.png>'); process.exit(1); }
const { modulo, nome } = MAPAS[mapa];

// Dimensões da pintura: lê largura/altura direto do IHDR do PNG (sem depender do filtro de compressão).
const png = readFileSync(pintura);
const CW = png.readUInt32BE(16), CH = png.readUInt32BE(20);

// Pintura para RGBA cru.
const cru = `_pintura_${mapa}.raw`;
execFileSync('ffmpeg', ['-y', '-i', pintura, '-pix_fmt', 'rgba', '-f', 'rawvideo', cru], { stdio: 'ignore' });
const img = readFileSync(cru);

// Máscara atual.
const { [nome]: vp } = await import('../' + modulo + '?t=' + Date.now());
const { cols, rows } = vp, grade = new Uint8Array(cols * rows);
vp.linhas.forEach((linha, y) => { let x = 0, anda = true; for (const c of linha.split('.')) { const n = parseInt(c, 36); if (anda) grade.fill(1, y * cols + x, y * cols + x + n); x += n; anda = !anda; } });

// Conta magenta por célula. A pintura cobre o mapa inteiro, então a célula (cx,cy) corresponde à fração
// proporcional da tela — não precisa de nenhuma escala, só da proporção.
const mcount = new Uint32Array(cols * rows), mtot = new Uint32Array(cols * rows);
const ehMagenta = (r, g, b) => r > 180 && b > 160 && g < 120;
for (let py = 0; py < CH; py++) for (let px = 0; px < CW; px++) {
  const a = (py * CW + px) * 4, cx = Math.floor(px / CW * cols), cy = Math.floor(py / CH * rows), k = cy * cols + cx;
  mtot[k]++; if (ehMagenta(img[a], img[a + 1], img[a + 2])) mcount[k]++;
}
let novas = 0;
for (let k = 0; k < cols * rows; k++) if (mtot[k] && mcount[k] / mtot[k] >= LIMIAR && grade[k] === 1) { grade[k] = 0; novas++; }

// Suaviza o serrilhado (escadinha de 1 célula) que faz o personagem vibrar ao empurrar na diagonal contra a
// borda. Filtro de maioria conservador (vizinhança de 8): preenche reentrância funda (chão com >=5 vizinhos
// bloqueados) e remove bump isolado (bloqueio com >=7 vizinhos de chão). Não toca rebordos grossos nem objetos
// de 2+ células (ficam "equilibrados"), nem escadinha 45° limpa (que já desliza). 2 passadas.
const biz = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
for (let passo = 0; passo < 2; passo++) {
  const orig = grade.slice();
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    let bloq = 0, tot = 0;
    for (const [dx, dy] of biz) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue; tot++; if (orig[ny * cols + nx] === 0) bloq++; }
    const i = y * cols + x;
    if (orig[i] === 1 && bloq >= 5) grade[i] = 0;              // reentrância funda de chão: preenche
    else if (orig[i] === 0 && tot - bloq >= 7) grade[i] = 1;   // bump isolado de bloqueio: remove
  }
}

// Recodifica as linhas (RLE base 36, alternando anda/bloqueia, começando por anda).
const linhas = [];
for (let y = 0; y < rows; y++) {
  const runs = []; let esperado = 1, x = 0;
  while (x < cols) { let len = 0; while (x < cols && grade[y * cols + x] === esperado) { len++; x++; } runs.push(len.toString(36)); esperado = esperado ? 0 : 1; }
  linhas.push(runs.join('.'));
}

// Reescreve o módulo preservando o cabeçalho de comentário, ids e areas; troca só `linhas`.
const texto = readFileSync(modulo, 'utf8');
const cab = texto.slice(0, texto.indexOf('export const ' + nome));
// ids e areas só existem em máscaras com áreas (Vegeta); o Namek não tem — não inventa os campos.
const idsStr = vp.ids ? `, ids: ${JSON.stringify(vp.ids)}` : '';
const areasStr = vp.areas ? `, areas: ${JSON.stringify(vp.areas)}` : '';
const corpo = `export const ${nome} = { cols: ${cols}, rows: ${rows}, cellW: ${vp.cellW}, cellH: ${vp.cellH}` +
  `${idsStr}, linhas: ${JSON.stringify(linhas)}${areasStr} };\n`;
writeFileSync(modulo, cab + corpo);
rmSync(cru, { force: true });
console.log(`${mapa}: ${novas} células novas bloqueadas (${(100 * novas / (cols * rows)).toFixed(1)}%). Máscara atualizada em ${modulo}.`);
