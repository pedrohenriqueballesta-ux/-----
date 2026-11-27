// Lê os eventos de telemetria (data/telemetria/*.jsonl) e imprime um resumo dos funis:
// entrada/tutorial, progressão, economia, retenção D1/D7 e saúde do servidor.
// Uso:  node ferramentas/telemetria_resumo.mjs [pasta]
//       node ferramentas/telemetria_resumo.mjs --csv saida.csv   (exporta tudo achatado)
// Zero dependência; é o "painel" do dev enquanto não há tela própria.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const csvIdx = args.indexOf('--csv');
const pasta = resolve(raiz, args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--csv') || 'data/telemetria');

async function carregar() {
  let arquivos = [];
  try { arquivos = (await readdir(pasta)).filter(f => f.endsWith('.jsonl')).sort(); }
  catch { return []; }
  const eventos = [];
  for (const f of arquivos) {
    const texto = await readFile(resolve(pasta, f), 'utf8');
    for (const linha of texto.split('\n')) { if (!linha.trim()) continue; try { eventos.push(JSON.parse(linha)); } catch {} }
  }
  return eventos;
}

const dia = ts => new Date(ts).toISOString().slice(0, 10);
const pct = (a, b) => b ? (a / b * 100).toFixed(1) + '%' : '—';

function resumir(eventos) {
  const porTipo = {};
  for (const e of eventos) porTipo[e.tipo] = (porTipo[e.tipo] || 0) + 1;

  console.log('\n=== Telemetria: ' + eventos.length + ' eventos em ' + pasta + ' ===');
  if (!eventos.length) { console.log('(nenhum evento ainda — jogue um pouco com o servidor rodando)'); return; }

  console.log('\n— Contagem por evento —');
  for (const [tipo, n] of Object.entries(porTipo).sort((a, b) => b[1] - a[1])) console.log('  ' + String(n).padStart(6) + '  ' + tipo);

  const contas = porTipo.conta_criada || 0;
  console.log('\n— Funil de entrada —');
  console.log('  contas criadas:        ' + contas);
  console.log('  personagens criados:   ' + (porTipo.personagem_criado || 0));
  console.log('  tutorial concluído:    ' + (porTipo.tutorial_concluido || 0) + '  (' + pct(porTipo.tutorial_concluido || 0, contas) + ' das contas)');
  console.log('  tutorial pulado:       ' + (porTipo.tutorial_pulado || 0));
  console.log('  entrou no mundo:       ' + (porTipo.sessao_inicio || 0));

  console.log('\n— Progressão —');
  const niveis = eventos.filter(e => e.tipo === 'nivel_up').map(e => e.nivel).filter(Number.isFinite);
  console.log('  subidas de nível:      ' + niveis.length + (niveis.length ? '  (nível máx alcançado: ' + Math.max(...niveis) + ')' : ''));
  console.log('  mortes:                ' + (porTipo.morte || 0));
  const mapas = {};
  for (const e of eventos) if (e.tipo === 'mapa_entrou') { const k = e.planeta + (e.area ? '/' + e.area : ''); mapas[k] = (mapas[k] || 0) + 1; }
  const topMapas = Object.entries(mapas).sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (topMapas.length) { console.log('  mapas mais visitados:'); for (const [k, n] of topMapas) console.log('    ' + String(n).padStart(5) + '  ' + k); }

  console.log('\n— Economia —');
  const lojas = porTipo.loja_aberta || 0, compras = porTipo.compra || 0;
  console.log('  loja aberta:           ' + lojas);
  console.log('  compras:               ' + compras + '  (conversão: ' + pct(compras, lojas) + ' das aberturas)');
  console.log('  vendas:                ' + (porTipo.venda || 0));
  console.log('  missões resgatadas:    ' + (porTipo.missao_resgatada || 0));

  // Retenção: por conta, dias distintos com sessão; D1/D7 = voltou no dia seguinte / +7 ao 1º dia.
  const diasPorConta = {};
  for (const e of eventos) if (e.tipo === 'sessao_inicio' && e.conta) (diasPorConta[e.conta] ??= new Set()).add(dia(e.t));
  const jogadores = Object.keys(diasPorConta);
  let d1 = 0, d7 = 0;
  for (const dias of Object.values(diasPorConta)) {
    const ord = [...dias].sort(); const base = Date.parse(ord[0]);
    if (ord.some(d => Date.parse(d) === base + 86400000)) d1++;
    if (ord.some(d => Date.parse(d) === base + 7 * 86400000)) d7++;
  }
  console.log('\n— Retenção —');
  console.log('  jogadores que entraram: ' + jogadores.length);
  console.log('  voltaram no dia +1 (D1): ' + d1 + '  (' + pct(d1, jogadores.length) + ')');
  console.log('  voltaram no dia +7 (D7): ' + d7 + '  (' + pct(d7, jogadores.length) + ')');

  const metricas = eventos.filter(e => e.tipo === 'metricas_servidor').at(-1);
  if (metricas) console.log('\n— Saúde do servidor (última amostra) —\n  online=' + metricas.online + ' jogadores=' + metricas.jogadores + ' mobs=' + metricas.mobs + ' tickMédio=' + metricas.tickMedioMs + 'ms tickMáx=' + metricas.tickMaxMs + 'ms memória=' + metricas.memoriaMB + 'MB');

  const erros = eventos.filter(e => e.tipo === 'erro_servidor');
  if (erros.length) { console.log('\n— Erros do servidor: ' + erros.length + ' (últimos 5) —'); for (const e of erros.slice(-5)) console.log('  [' + e.origem + '] ' + e.mensagem); }
  console.log('');
}

async function exportarCsv(eventos, destino) {
  const cols = [...new Set(eventos.flatMap(Object.keys))];
  const esc = v => v == null ? '' : /[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v);
  const linhas = [cols.join(','), ...eventos.map(e => cols.map(c => esc(e[c])).join(','))];
  await writeFile(resolve(raiz, destino), linhas.join('\n'), 'utf8');
  console.log('CSV com ' + eventos.length + ' eventos escrito em ' + destino);
}

const eventos = await carregar();
if (csvIdx >= 0) await exportarCsv(eventos, args[csvIdx + 1] || 'telemetria.csv');
else resumir(eventos);
