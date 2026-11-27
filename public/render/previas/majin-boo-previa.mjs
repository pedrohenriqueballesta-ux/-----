import { drawSheet } from '../../art/atlas.mjs';
import { alturaBoo, folhasBoo } from '../../art/personagens/majin-boo/boo.mjs';
import { FORMAS_BOO } from '../../shared/tecnicas/formas.mjs';
import { carregarVaporBoo, desenharVaporBoo, quadrosPreviaVaporBoo } from '../vfx/boo-vapor.mjs';
import { desenharRaiosTransformacao } from '../vfx/raios-transformacao.mjs';
import { RAIOS_POR_FORMA } from '../../art/raios-transformacoes.mjs';
import { POSES_MAJIN_BOO, RETRATO_MAJIN_BOO } from '../../art/personagens/majin-boo/folhas.mjs';
import { DIRECTIONS } from '../mapa/camera.mjs';

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
const acao = document.querySelector('#acao');
const forma = document.querySelector('#forma');
const vapor = document.querySelector('#vapor');
const fundo = document.querySelector('#fundo');
const reproduzir = document.querySelector('#reproduzir');
const quadro = document.querySelector('#quadro');
const status = document.querySelector('#status');
const icones = document.querySelector('#icones');

function exibirIcone(url, nome) {
  const imagem = new Image();
  imagem.src = url;
  imagem.alt = nome;
  imagem.title = nome;
  icones.append(imagem);
}
exibirIcone(RETRATO_MAJIN_BOO, 'Retrato de Majin Boo');
forma.add(new Option('Majin Boo', 'base'));
for (const f of FORMAS_BOO) {
  forma.add(new Option(f.nome + ' · Nv. ' + f.nivel, f.forma));
  exibirIcone(f.icone, f.nome);
}
carregarVaporBoo();
for (const [id, pose] of Object.entries(POSES_MAJIN_BOO)) {
  acao.add(new Option(pose.nome, id));
  if (pose.icone) exibirIcone(pose.icone, pose.nome);
}

const folhas = new Map();
let frame = 0;
let timer = null;
let selecao = 0;

function pintar() {
  const escuro = fundo.value === 'escuro';
  const pose = POSES_MAJIN_BOO[acao.value];
  const folha = folhasBoo(forma.value)[acao.value];
  const imagem = folhas.get(folha.file);
  const altura = alturaBoo(forma.value) * 100 / alturaBoo('base');
  const idades = quadrosPreviaVaporBoo(acao.value);
  vapor.disabled = !idades;
  const marco = pose.quadroAcao === frame + 1;
  const marcoNorte = pose.quadroNorte === frame + 1;

  atualizarQuadro(marco, marcoNorte);
  ctx.fillStyle = escuro ? '#101d33' : '#f1ebdf';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = '14px system-ui';
  ctx.textAlign = 'center';

  DIRECTIONS.forEach((direcao, i) => {
    const x = (i + 0.5) * 132;
    const y = 181;
    const ativo = direcao.id === 'n' && pose.quadroNorte ? marcoNorte : marco;
    ctx.fillStyle = ativo ? (escuro ? '#ffdc8c' : '#624425') : escuro ? '#ecf3ff' : '#122947';
    ctx.fillText(direcao.label, x, 24);
    ctx.fillRect(x - 38, y + 6, 76, 1);
    if (!imagem?.naturalWidth) return;
    const pos = { x, y };
    const opcaoVapor = !vapor.disabled && vapor.value !== 'nenhum';
    const estadoVapor = { acao: acao.value, forma: forma.value, folha, pos, altura, direcao, coluna: frame,
      idade: idades?.[frame], marcadores: vapor.value === 'poros' };
    if (forma.value === 'kidBoo')
      desenharRaiosTransformacao(ctx, { id: 'previa-' + i, vocacao: 'boo', forma: forma.value }, pos, performance.now() / 1000, altura, RAIOS_POR_FORMA);
    if (opcaoVapor) desenharVaporBoo(ctx, { ...estadoVapor, camada: 'atras' });
    drawSheet(ctx, folha, imagem, pos, altura, direcao, frame);
    if (opcaoVapor) desenharVaporBoo(ctx, { ...estadoVapor, camada: 'frente' });
  });
}

function atualizarQuadro(marco, marcoNorte) {
  const pose = POSES_MAJIN_BOO[acao.value];
  const descricao = marcoNorte ? ' · pose de ação no Norte'
    : marco ? (pose.quadroNorte ? ' · pose de ação nas outras direções' : ' · pose de ação') : '';
  quadro.value = 'Quadro ' + (frame + 1) + ' / 4' + descricao;
}

async function selecionar() {
  const arquivo = folhasBoo(forma.value)[acao.value].file;
  const atual = ++selecao;
  frame = 0;
  if (folhas.get(arquivo)?.naturalWidth) {
    status.textContent = '';
    pintar();
    return;
  }
  status.textContent = 'Carregando folha…';
  pintar();
  const imagem = new Image();
  imagem.src = arquivo;
  try {
    await imagem.decode();
    folhas.set(arquivo, imagem);
    if (atual === selecao) {
      status.textContent = '';
      pintar();
    }
  } catch {
    if (atual === selecao) status.textContent = 'Não foi possível carregar a folha.';
  }
}

function pausar() {
  clearInterval(timer);
  timer = null;
  reproduzir.setAttribute('aria-pressed', 'false');
  reproduzir.textContent = 'Reproduzir';
}

function avancar(delta) {
  frame = (frame + delta + 4) % 4;
  pintar();
}

document.querySelector('#anterior').onclick = () => { pausar(); avancar(-1); };
document.querySelector('#proximo').onclick = () => { pausar(); avancar(1); };
reproduzir.onclick = () => {
  if (timer) return pausar();
  reproduzir.setAttribute('aria-pressed', 'true');
  reproduzir.textContent = 'Pausar';
  timer = setInterval(() => avancar(1), 160);
};
acao.onchange = selecionar;
forma.onchange = selecionar;
vapor.onchange = pintar;
fundo.onchange = pintar;
selecionar();
