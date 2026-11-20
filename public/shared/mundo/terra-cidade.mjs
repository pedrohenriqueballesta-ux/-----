// Objetos da Cidade do Oeste (Terra): prédios dos dois kits, muros, a nave do Goku e as decorações (arte da equipe,
// 17/11/2026; recortes por ferramentas/recortar_objetos_terra.py). Tudo calculado aqui, de forma determinística
// (mesmo resultado no servidor e no cliente).
// Quarteirão FECHADO, como no Tibia (decisão do Pedro, 17/11/2026): prédios colados na borda da frente (a fachada vira
// para a rua de baixo), fileira de dentro nos quarteirões fundos, muro no fundo e o miolo como pátio decorado; não se
// entra no quarteirão (só nas portas dos prédios de interação, nos lotes guardados).
// Coordenadas em unidades do mundo (8400×5600). Folhas desenhadas com o Goku de 64 px; no jogo ele mede 70.
const K = 70 / 64;
const PX = {
  A: [371, 787], B: [307, 784], C: [691, 414], D: [556, 551], E: [433, 254], F: [371, 270], G: [499, 673], H: [245, 748],
  I: [371, 257], J: [689, 393], K: [623, 329], L: [245, 426], M: [868, 365], N: [458, 494], O: [751, 532], P: [264, 358],
  Q: [656, 575], R: [295, 322], S: [592, 238], T: [419, 434], U: [568, 76], V: [400, 73], W: [286, 115], X: [463, 271], Y: [579, 374],
  arvore: [209, 252], palmeira: [205, 292], arvore_pequena: [124, 145], arbusto: [85, 41], rocha: [117, 76], pedrinhas: [87, 40],
  canteiro: [152, 55], toco: [117, 60], poste: [69, 161], banco: [130, 60], lixeira: [33, 49], hidrante: [49, 58], maquina: [58, 98],
  caixa_correio: [52, 83], placa: [80, 107], vaso: [95, 89], nave_pequena: [310, 288], capsula_saiyajin: [223, 127], taxi: [195, 114],
  onibus: [317, 191], nave_goku: [626, 656], loja_karin: [826, 780], restaurante: [798, 594], capsula_corp: [1591, 883]
};
const largura = n => Math.round(PX[n][0] * K);
const PREDIO = /^[A-Z]$/;
const DE_INTERACAO = new Set(['loja_karin', 'restaurante', 'capsula_corp']);
const imagemDe = n => n === 'nave_goku' ? '/assets/terra/nave_goku.png' : DE_INTERACAO.has(n) ? '/assets/terra/interacao/' + n + '.png'
  : PREDIO.test(n) ? '/assets/terra/kit/' + n + '.png' : '/assets/terra/deco/' + n + '.png';

// Bloqueio no chão de cada tipo de objeto (só o pé): prédio = faixa da base; árvore/poste = tronco; enfeite baixo = nada.
const RAIO_PE = { arvore: 20, palmeira: 14, arvore_pequena: 12, rocha: 34, poste: 8, placa: 8, maquina: 18, caixa_correio: 10,
  hidrante: 10, vaso: 22, lixeira: 10, toco: 22, nave_pequena: 120, capsula_saiyajin: 80, taxi: 70, onibus: 130 };
export function objeto(nome, x, y, extra = {}) {
  // `largura` em extra: tamanho pedido pelo lote (prédios de interação, desenhados em outra escala).
  const w = extra.largura || largura(nome), h = Math.round(w * PX[nome][1] / PX[nome][0]);
  let bloqueio = null;
  if (PREDIO.test(nome) || nome === 'nave_goku' || DE_INTERACAO.has(nome)) {
    const fundo = Math.min(h * .5, Math.max(40, w * .25)), meia = w * (nome === 'nave_goku' ? .42 : .5);
    bloqueio = { x0: x - meia, x1: x + meia, y0: y - fundo, y1: y + 8 };
  } else if (RAIO_PE[nome]) {
    const r = RAIO_PE[nome]; bloqueio = { x0: x - r, x1: x + r, y0: y - Math.min(r, 30), y1: y + 6 };
  }
  return Object.freeze({ id: nome + '@' + Math.round(x) + ',' + Math.round(y), arte: nome, imagem: imagemDe(nome), x, y, w, h,
    bloqueio: bloqueio && Object.freeze(bloqueio), ...extra });
}

// ---- Planta (a mesma do chão: ferramentas/gerar_chao_terra.py) ----
export const QUARTEIROES = [];
for (const [x0, x1] of [[2750, 3650], [3950, 4850], [5150, 6050]])
  for (const [y0, y1] of [[400, 950], [1250, 2050], [2350, 2950]]) QUARTEIROES.push(Object.freeze({ x0, x1, y0, y1 }));
export const RUAS = [[1100, 300, 6400, 260], [2200, 300, 6400, 260], [4800, 300, 8100, 220]].map(([y, x0, x1, l]) => ({ x0, x1, y0: y - l / 2, y1: y + l / 2 }))
  .concat([[2600, 300, 3150, 240], [3800, 300, 3150, 240], [5000, 300, 3150, 240], [6200, 300, 3150, 240],
    [1500, 2200, 4800, 220], [3800, 3150, 4800, 220], [6200, 3150, 4800, 220]].map(([x, y0, y1, l]) => ({ x0: x - l / 2, x1: x + l / 2, y0, y1 })));
export const CAMPUS = Object.freeze({ cx: 1400, cy: 1650, r: 420 });
export const PARQUE = Object.freeze({ x0: 6400, y0: 400, x1: 8000, y1: 2950 });
// Lotes dos prédios de interação, na frente dos quarteirões que dão para a avenida da chegada. Os dois logo acima da
// chegada já têm prédio (Pedro, 17/11/2026): a Loja do Mestre Karin e o Mercado de comida; os outros esperam a arte.
export const LOTES_INTERACAO = Object.freeze({
  karin: { x0: 3950, x1: 4400, y0: 1650, y1: 2050 }, comida: { x0: 4400, x1: 4850, y0: 1650, y1: 2050 },
  correio: { x0: 3230, x1: 3650, y0: 1650, y1: 2050 }, depot: { x0: 5150, x1: 5600, y0: 1650, y1: 2050 },
  guilda: { x0: 5600, x1: 6050, y0: 1650, y1: 2050 }
});

// Montagem dos quarteirões (revisão de 17/11/2026, depois da varredura do Pedro: prédio por cima de carro, árvore
// atrás de prédio, lixeira atrás de muro, hidrante na rua). Regras:
// - Prédios só na borda da FRENTE (fachada para a rua de baixo), colados, e o desenho inteiro DENTRO do quarteirão: a
//   altura não passa do muro do fundo. Só a fileira de cima da cidade (atrás dela é floresta) aceita as torres altas.
// - Muro no fundo dos quarteirões que têm rua atrás; o pátio entre o muro e os prédios recebe árvores e carros, só
//   onde couberem sem encostar em prédio, lote de interação ou outro objeto.
// - Mobiliário de rua só no meio-fio na frente das fachadas; nada atrás de muro ou de prédio. Carros fora por enquanto.
const altura = n => Math.round(PX[n][1] * K);
const TORRES = 'ABGHLPRT', BAIXOS = 'CDEFIJKLMNOPQRSTXY';
const MURO_ALTO = 40;                                        // base do muro: 40 abaixo do topo do quarteirão
const comFundo = q => q.y0 > 1000;                            // quarteirões com rua atrás (têm muro)
const limiteDeAltura = q => comFundo(q) ? q.y1 - (q.y0 + MURO_ALTO) : Infinity;
const sobra = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
export const desenho = o => ({ x0: o.x - o.w / 2, x1: o.x + o.w / 2, y0: o.y - o.h, y1: o.y });
// Combinação de 1 a 3 prédios que enche o vão (sobra pequena, repartida), preferindo os menos usados na cidade e, com
// `alvo`, preferindo a altura que deixa só um pátio estreito atrás (o quarteirão não fica oco).
function encher(vao, conjunto, usados, repetir = false, alvo = 0) {
  let melhor = null, notaMelhor = -Infinity;
  const letras = [...conjunto];
  const testar = c => {
    const soma = c.reduce((t, l) => t + largura(l), 0);
    if (soma > vao || soma < vao - 130 || (!repetir && new Set(c).size !== c.length)) return;
    const nota = -(vao - soma) * 2                                                          // vão bem cheio
      - c.reduce((t, l) => t + usados.filter(u => u === l).length, 0) * 500                  // variedade na cidade
      - (alvo ? c.reduce((t, l) => t + Math.abs(altura(l) - alvo), 0) / c.length : 0);      // perto da altura-alvo
    if (nota > notaMelhor) { melhor = c; notaMelhor = nota; }
  };
  for (const a of letras) { testar([a]); for (const b of letras) { testar([a, b]); for (const c of letras) testar([a, b, c]); } }
  return melhor || [];
}
const objetos = [];
const usados = [];
function fileira(x0, x1, base, letras, tipo) {
  const ws = letras.map(largura), folga = (x1 - x0 - ws.reduce((a, b) => a + b, 0)) / Math.max(1, letras.length - 1);
  let x = letras.length === 1 ? x0 + (x1 - x0 - ws[0]) / 2 : x0;
  letras.forEach((l, i) => {
    const cx = x + ws[i] / 2, provisorio = tipo === 'cenario' && lotes.some(lt => cx > lt.x0 && cx < lt.x1 && base > lt.y0 && base <= lt.y1);
    objetos.push(objeto(l, cx, base, { tipo, ...(provisorio ? { provisorio: true } : {}) })); x += ws[i] + folga; if (tipo === 'cenario') usados.push(l);
  });
}
const lotes = Object.values(LOTES_INTERACAO);
// Prédios de interação (sem interior): o NPC fica na frente (ou no balcão, dentro do desenho); perto da frente aparece o
// botão de interação, que abre a janela da loja já filtrada (`loja`). Botão e tecla são PROVISÓRIOS (Pedro, 17/11/2026).
export const INTERACOES = Object.freeze([
  { arte: 'loja_karin', lote: 'karin', nome: 'Loja do Mestre Karin', loja: 'karin', npc: 'Mestre Karin' },
  // O cozinheiro fica parado na PORTA do restaurante, do lado de fora (Pedro, 17/11/2026); a sprite dele está pedida (05b).
  { arte: 'restaurante', lote: 'comida', nome: 'Mercado de comida', loja: 'comida', npc: 'Chef Saikan', npcNaPorta: true },
  // Corporação Cápsula (Pedro, 18/11/2026): no campus redondo ao lado da nave do Goku, a base encostando na avenida.
  // Serviços de equipamento (comprar, vender drops, melhorar) aparecem como "em breve" até o equipamento existir.
  // Bulma e Dr. Brief parados na porta, de frente, sem virar para o jogador (Pedro, 18/11/2026); sem interior por enquanto.
  { arte: 'capsula_corp', campus: { x: CAMPUS.cx, y: CAMPUS.cy + CAMPUS.r - 2, largura: 800 }, nome: 'Corporação Cápsula', npc: 'Bulma',
    servicos: ['Comprar equipamentos', 'Vender drops', 'Melhorar equipamentos'],
    estaticos: [{ nome: 'Bulma', imagem: '/assets/terra/npc/bulma.png', x: CAMPUS.cx - 80, altura: 70, px: [131, 339] },
      { nome: 'Dr. Brief', imagem: '/assets/terra/npc/dr_brief.png', x: CAMPUS.cx + 80, altura: 66, px: [157, 342] }] }
].map(i => {
  // NPCs estáticos ficam no calçadão da entrada (dentro do desenho do prédio, ao pé da escada).
  if (i.campus) return objeto(i.arte, i.campus.x, i.campus.y, { tipo: 'interacao', nome: i.nome, npc: i.npc, servicos: i.servicos, campus: true,
    largura: i.campus.largura, porta: Object.freeze({ x: i.campus.x, y: i.campus.y + 45 }),
    estaticos: Object.freeze(i.estaticos.map(e => Object.freeze({ ...e, y: i.campus.y - 50, w: Math.round(e.altura * e.px[0] / e.px[1]), h: e.altura }))) });
  const l = LOTES_INTERACAO[i.lote], x = (l.x0 + l.x1) / 2;
  return objeto(i.arte, x, l.y1, { tipo: 'interacao', nome: i.nome, loja: i.loja, npc: i.npc, largura: l.x1 - l.x0 - 10,
    porta: Object.freeze({ x, y: l.y1 + 45 }), ...(i.npcNaPorta ? { npcPos: Object.freeze({ x: x - 95, y: l.y1 + 60 }) } : {}) });
}));
objetos.push(...INTERACOES);
const ocupados = ['karin', 'comida'].map(k => LOTES_INTERACAO[k]);
for (const q of QUARTEIROES) {
  const conjunto = [...(comFundo(q) ? BAIXOS : TORRES)].filter(l => altura(l) <= limiteDeAltura(q)).join('');
  // A frente inteira recebe prédios. Os que caem num lote de interação são PROVISÓRIOS: saem quando o prédio de
  // interação (Loja, Mercado...) chegar, para o lote não ficar como uma praça vazia até lá (Pedro, 17/11/2026).
  // Trechos da frente sem prédio de interação já pronto.
  let x = q.x0;
  for (const l of [...ocupados.filter(l => l.x1 > q.x0 && l.x0 < q.x1 && l.y1 === q.y1).sort((a, b) => a.x0 - b.x0), { x0: q.x1, x1: q.x1 }]) {
    if (l.x0 - x > 200) fileira(x, l.x0, q.y1, encher(l.x0 - x, conjunto, usados, false, comFundo(q) ? limiteDeAltura(q) * .8 : 0), 'cenario');
    x = Math.max(x, l.x1);
  }
  if (comFundo(q)) fileira(q.x0, q.x1, q.y0 + MURO_ALTO, encher(q.x1 - q.x0, 'UVW', [], true), 'muro');
}

// ---- Onde cabe decoração solta: grama (fora de rua, quarteirão, campus, rio/lago e da nave), com folga ----
const RIO = [[300, 3300], [1500, 3000], [2700, 3500], [3800, 3300], [4800, 3700], [6000, 3500], [7200, 3900], [8100, 3700],
  [8100, 4200], [7200, 4400], [6000, 4000], [4800, 4200], [3800, 3800], [2700, 4000], [1500, 3500], [300, 3800]];
export function dentroDoRio(x, y) {
  let dentro = false;
  for (let i = 0, j = RIO.length - 1; i < RIO.length; j = i++) {
    const [xi, yi] = RIO[i], [xj, yj] = RIO[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
}
export const LAGO = Object.freeze({ cx: 7250, cy: 1650, rx: 350, ry: 650 });
const naCaixa = (c, x, y, f = 0) => x >= c.x0 - f && x <= c.x1 + f && y >= c.y0 - f && y <= c.y1 + f;
const noLago = (x, y, f = 0) => ((x - LAGO.cx) / (LAGO.rx + f)) ** 2 + ((y - LAGO.cy) / (LAGO.ry + f)) ** 2 < 1;
// A nave de viagem é um veículo de rua, não um prédio: mantemos sua largura
// em 72% da arte recortada para que ela fique proporcional ao personagem e à
// Corporação Cápsula. A largura também alimenta o bloqueio, mantendo colisão e
// desenho sincronizados.
export const NAVE_GOKU = objeto('nave_goku', 2150, 2050, {
  largura: Math.round(largura('nave_goku') * .72), tipo: 'nave', nome: 'Nave do Goku',
  porta: Object.freeze({ x: 2150, y: 2085 })
});
function grama(x, y, f) {
  if (x < 300 + f || x > 8100 - f || y < 300 + f || y > 5300 - f) return false;
  if (RUAS.some(r => naCaixa(r, x, y, f + 30)) || QUARTEIROES.some(q => naCaixa(q, x, y, f + 30))) return false;
  if (Math.hypot(x - CAMPUS.cx, y - CAMPUS.cy) < CAMPUS.r + f + 30 || noLago(x, y, f + 40)) return false;
  if (naCaixa(NAVE_GOKU.bloqueio, x, y, f + 60) || (Math.abs(x - NAVE_GOKU.x) < NAVE_GOKU.w / 2 + f && y < NAVE_GOKU.y + 40 && y > NAVE_GOKU.y - NAVE_GOKU.h)) return false;
  for (const [dx, dy] of [[0, 0], [f + 40, 0], [-f - 40, 0], [0, f + 40], [0, -f - 40]]) if (dentroDoRio(x + dx, y + dy)) return false;
  return true;
}
let semente = 20261117;
const aleatorio = () => (semente = (semente * 1103515245 + 12345) % 2147483648) / 2147483648;
const postos = [];
function por(nome, x, y, extra = {}) {
  const raio = largura(nome) / 2;
  // A conferência usa a meia-largura inteira do desenho (a copa da palmeira não pode encostar na rua).
  if (!grama(x, y, raio) || postos.some(p => Math.hypot(p.x - x, (p.y - y) * 1.6) < (p.raio + raio) * .8)) return false;
  // Nada atrás de prédio, muro ou nave (ficaria escondido ou "atravessando" o desenho).
  const o = objeto(nome, x, y, { tipo: 'deco', ...extra }), r = desenho(o);
  if (objetos.concat(NAVE_GOKU).some(b => ['cenario', 'muro', 'nave', 'interacao'].includes(b.tipo) && sobra(r, desenho(b)))) return false;
  // Nem o desenho pode ficar por cima da rua (copa de árvore "plantada" na calçada) nem encavalar outra decoração.
  if (RUAS.some(rua => sobra(r, { x0: rua.x0 - 20, x1: rua.x1 + 20, y0: rua.y0 - 20, y1: rua.y1 + 20 }))) return false;
  if (objetos.some(b => b.tipo === 'deco' && sobra(r, desenho(b)))) return false;
  // Nem por cima da água (amostras no desenho inteiro) nem atravessando a borda do parque.
  for (let i = 0; i <= 4; i++) for (let j = 0; j <= 4; j++) {
    const px = r.x0 + (r.x1 - r.x0) * i / 4, py = r.y0 + (r.y1 - r.y0) * j / 4;
    if (dentroDoRio(px, py) || noLago(px, py, 30)) return false;
  }
  const dentroP = naCaixa(PARQUE, r.x0, r.y0, -25) && naCaixa(PARQUE, r.x1, r.y1, -25), foraP = !sobra(r, { x0: PARQUE.x0 - 25, x1: PARQUE.x1 + 25, y0: PARQUE.y0 - 25, y1: PARQUE.y1 + 25 });
  if (!dentroP && !foraP) return false;
  postos.push({ x, y, raio }); objetos.push(o); return true;
}
// Peças de destaque primeiro (lugar pensado), depois a natureza espalhada.
[[650, 2000], [650, 1850], [2000, 2900], [7300, 2800], [1000, 4600]].some(([x, y]) => por('nave_pequena', x, y));   // a 1ª que couber
por('capsula_saiyajin', 6800, 2700); por('capsula_saiyajin', 7650, 2600);
for (const [x, y] of [[700, 1500], [2300, 1500], [600, 2950], [2350, 2900], [7000, 550]]) por('banco', x, y);
const ESPALHAR = [['arvore', 70], ['palmeira', 30], ['arvore_pequena', 50], ['arbusto', 50], ['canteiro', 18], ['rocha', 14], ['pedrinhas', 18], ['toco', 8]];
for (const [nome, quantos] of ESPALHAR) {
  let postosDoTipo = 0;
  for (let t = 0; t < quantos * 40 && postosDoTipo < quantos; t++)
    if (por(nome, 350 + aleatorio() * 7700, 350 + aleatorio() * 4900)) postosDoTipo++;
}
// Pátios sem nada por enquanto (Pedro, 17/11/2026: tirar os carros e as árvores do piso de cimento da cidade).
// Mobiliário de rua: no meio-fio na frente das fachadas (entre o quarteirão e a avenida), longe dos cruzamentos, da
// chegada, das portas futuras (meio dos lotes de interação) e uns dos outros.
const meioFio = q => q.y1 + 12;
const portasFuturas = lotes.map(l => (l.x0 + l.x1) / 2);
const ocupado = [];
function naCalcada(nome, x, q) {   // devolve true se pôs
  const portas = objetos.filter(o => o.tipo === 'cenario' && o.y === q.y1).map(o => o.x);          // a porta fica no meio da fachada
  // Nada na frente dos prédios de interação (Pedro, 17/11/2026: tirar os postes da frente do Mercado de comida e do Karin).
  const naFrenteDeInteracao = INTERACOES.some(i => Math.abs(x - i.x) < i.w / 2 + 40 && Math.abs(meioFio(q) - i.y) < 60);
  if (naFrenteDeInteracao || x < q.x0 + 25 || x > q.x1 - 25 || ocupado.some(o => Math.abs(o - x) < 80) || portasFuturas.concat(portas).some(p => Math.abs(p - x) < 70)) return;
  ocupado.push(x); objetos.push(objeto(nome, x, meioFio(q), { tipo: 'rua' })); return true;
}
for (const q of QUARTEIROES) if (q.y1 < 2100) {                 // quarteirões com avenida na frente
  naCalcada('hidrante', q.x0 + 45, q); naCalcada('placa', q.x1 - 40, q);
  // Postes nas divisas entre prédios (nunca na frente de uma porta) e nas pontas do quarteirão.
  const frente = objetos.filter(o => o.tipo === 'cenario' && o.y === q.y1).sort((a, b) => a.x - b.x);
  for (let i = 1; i < frente.length; i++) naCalcada('poste', (frente[i - 1].x + frente[i - 1].w / 2 + frente[i].x - frente[i].w / 2) / 2, q);
  naCalcada('poste', q.x0 + 130, q); naCalcada('poste', q.x1 - 130, q);
}
// Largo da chegada: lixeiras, máquina de cápsulas e vaso nas laterais do piso claro (fora do caminho do meio).
// Na metade de baixo do largo: a de cima fica livre para chegar na frente da Loja do Karin e do Mercado de comida.
for (const [n, x, y] of [['lixeira', 4262, 2190], ['vaso', 4262, 2290], ['lixeira', 4538, 2190], ['maquina', 4538, 2290]]) objetos.push(objeto(n, x, y, { tipo: 'rua', largo: true }));
objetos.push(NAVE_GOKU);

export const OBJETOS_TERRA = Object.freeze(objetos);
// O piso do quarteirão é andável (Pedro, 17/11/2026: "tem lugares que não consigo passar no quarteirão mesmo sem
// nenhuma construção"); só bloqueia o que está construído (prédio, muro, nave e o pé das decorações).
export const objetoBloqueia = (x, y) => OBJETOS_TERRA.some(o => o.bloqueio && x > o.bloqueio.x0 && x < o.bloqueio.x1 && y > o.bloqueio.y0 && y < o.bloqueio.y1)
  || INTERACOES.some(i => i.npcPos && Math.abs(x - i.npcPos.x) < 18 && y > i.npcPos.y - 14 && y < i.npcPos.y + 6);   // o pé do NPC

// Conferência da montagem (usada pelos testes): devolve a lista de problemas, vazia se a cidade está certa.
export function conferirCidade() {
  const problemas = [], grandes = OBJETOS_TERRA.filter(o => ['cenario', 'muro', 'nave', 'interacao'].includes(o.tipo));
  for (const o of OBJETOS_TERRA) {
    const r = desenho(o);
    for (const b of grandes) if (b !== o) {
      const rb = desenho(b);
      if (!sobra(r, rb)) continue;
      if (['cenario', 'muro', 'interacao'].includes(o.tipo) && ['cenario', 'muro', 'interacao'].includes(b.tipo) && o.y === b.y) { if (r.x1 - rb.x0 > 2 && rb.x1 - r.x0 > 2) problemas.push(o.id + ' encavalado em ' + b.id); continue; }
      if (o.tipo === 'muro' && ['cenario', 'interacao'].includes(b.tipo)) continue;             // muro do fundo atrás do topo do prédio
      if (o.tipo === 'patio' && b.tipo === 'muro' && o.y < b.y + 50) problemas.push(o.id + ' em cima do muro');
      if (o.tipo === 'patio' && b.tipo === 'muro') continue;             // na frente do muro, com folga: normal
      if (o.y < b.y) problemas.push(o.id + ' atrás de ' + b.id);          // escondido / atravessando o desenho
    }
    if (o.tipo === 'cenario' || o.tipo === 'muro' || (o.tipo === 'interacao' && !o.campus)) {
      const q = QUARTEIROES.find(q => o.x > q.x0 && o.x < q.x1 && o.y > q.y0 && o.y <= q.y1);
      if (!q) problemas.push(o.id + ' fora de quarteirão');
      else if (comFundo(q) && r.y0 < q.y0 - 1 && o.tipo === 'cenario') problemas.push(o.id + ' passa do fundo do quarteirão');
    }
    if (o.tipo === 'deco' && RUAS.some(rua => sobra(r, rua))) problemas.push(o.id + ' por cima da rua');
    if (o.tipo === 'deco') for (let i = 0; i <= 4; i++) for (let j = 0; j <= 4; j++) {
      const px = r.x0 + (r.x1 - r.x0) * i / 4, py = r.y0 + (r.y1 - r.y0) * j / 4;
      if (dentroDoRio(px, py) || noLago(px, py)) { problemas.push(o.id + ' por cima da água'); i = j = 9; }
    }
    if (o.tipo === 'deco' && OBJETOS_TERRA.some(b => b !== o && b.tipo === 'deco' && sobra(r, desenho(b)))) problemas.push(o.id + ' encavalado em outra decoração');
    if (o.tipo === 'rua' && ['poste', 'placa', 'hidrante'].includes(o.arte) && OBJETOS_TERRA.some(b => b.tipo === 'cenario' && Math.abs(b.y - o.y) < 20 && Math.abs(b.x - o.x) < 60)) problemas.push(o.id + ' na frente de uma porta');
    if (o.tipo === 'rua' && o.arte !== 'onibus' && !o.largo && (RUAS.some(r2 => naCaixa(r2, o.x, o.y)) || QUARTEIROES.some(q => o.x > q.x0 && o.x < q.x1 && o.y > q.y0 && o.y < q.y1))) problemas.push(o.id + ' fora do meio-fio');
  }
  return problemas;
}
