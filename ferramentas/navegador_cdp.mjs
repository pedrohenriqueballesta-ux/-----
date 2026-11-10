// Controla o Chrome headless via DevTools Protocol: abre uma URL, roda passos JS e tira prints.
// Uso: node cdp.mjs <url> <saida-prefixo> <arquivo-de-passos.json>
// Passos: [{ "js": "...", "esperar": ms, "print": "nome" }]
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const [url, prefixo, arquivoPassos] = process.argv.slice(2);
const passos = JSON.parse(await readFile(arquivoPassos, 'utf8'));
const porta = 9300 + Math.floor(Math.random() * 500);
const perfil = await mkdtemp(join(tmpdir(), 'cdp-'));
// Mantém o caminho do Mac e permite a conferência na máquina Windows do Pedro.
const executavel = process.env.DBI_CHROME || (process.platform === 'win32'
  ? ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync)
  : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
if (!executavel) throw new Error('Chrome não encontrado. Informe o caminho em DBI_CHROME.');
const chrome = spawn(executavel, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--remote-debugging-port=' + porta,
  '--user-data-dir=' + perfil, '--window-size=1400,900', 'about:blank'], { stdio: 'ignore' });
const dormir = ms => new Promise(ok => setTimeout(ok, ms));
let alvo;
for (let i = 0; i < 50 && !alvo; i++) {
  await dormir(200);
  try { alvo = (await (await fetch(`http://127.0.0.1:${porta}/json`)).json()).find(t => t.type === 'page'); } catch {}
}
if (!alvo) { chrome.kill(); throw new Error('O navegador não disponibilizou o protocolo de depuração.'); }
const ws = new WebSocket(alvo.webSocketDebuggerUrl);
await new Promise(ok => ws.addEventListener('open', ok));
let seq = 0; const pendentes = new Map(); const logs = [];
ws.addEventListener('message', ev => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pendentes.has(msg.id)) { pendentes.get(msg.id)(msg); pendentes.delete(msg.id); }
  if (msg.method === 'Runtime.consoleAPICalled') logs.push(msg.params.type + ': ' + msg.params.args.map(a => a.value ?? a.description).join(' '));
  if (msg.method === 'Runtime.exceptionThrown') logs.push('EXCEÇÃO: ' + (msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text));
});
const cmd = (method, params = {}) => new Promise(ok => { const id = ++seq; pendentes.set(id, ok); ws.send(JSON.stringify({ id, method, params })); });
await cmd('Runtime.enable'); await cmd('Page.enable');
await cmd('Emulation.setDeviceMetricsOverride', { width: 1400, height: 900, deviceScaleFactor: 1, mobile: false });
await cmd('Page.navigate', { url });
await dormir(1500);
for (const passo of passos) {
  if (passo.js) {
    const r = await cmd('Runtime.evaluate', { expression: passo.js, awaitPromise: true, returnByValue: true });
    const v = r.result?.result?.value; if (v !== undefined) console.log('js →', JSON.stringify(v));
    if (r.result?.exceptionDetails) console.log('js erro →', r.result.exceptionDetails.exception?.description);
  }
  if (passo.esperar) await dormir(passo.esperar);
  if (passo.print) {
    const r = await cmd('Page.captureScreenshot', { format: 'png', ...(passo.clip ? { clip: { scale: 1, ...passo.clip } } : {}) });
    await writeFile(prefixo + passo.print + '.png', Buffer.from(r.result.data, 'base64'));
    console.log('print →', prefixo + passo.print + '.png');
  }
}
for (const l of logs) console.log('console', l);
ws.close(); chrome.kill();
