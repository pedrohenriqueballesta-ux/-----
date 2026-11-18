import {instalarRedimensionamento} from './redimensionar-hud.mjs';
export function limitarPosicaoPainel(posicao, tamanho, tela) {
  const margem = 8;
  return {
    x: Math.max(margem, Math.min(posicao.x, Math.max(margem, tela.w - tamanho.w - margem))),
    y: Math.max(margem, Math.min(posicao.y, Math.max(margem, tela.h - tamanho.h - margem)))
  };
}

// Arrasta um painel comum da HUD (<section>/<div>) pela alça; salva a posição no localStorage.
// Duplo clique na alça reseta a posição (volta ao lugar padrão do CSS).
export function instalarArrasto(painel, alca, chave, opcoes={}) {
  if(typeof document!=='undefined')instalarRedimensionamento(painel,chave,opcoes);
  let pref = null, arr = null;
  try { const s = JSON.parse(localStorage.getItem(chave)); if (s && Number.isFinite(s.x) && Number.isFinite(s.y)) pref = s; } catch {}
  const aplicar = pos => {
    const caixa = painel.getBoundingClientRect();
    const p = limitarPosicaoPainel(pos, { w: caixa.width, h: caixa.height }, { w: innerWidth, h: innerHeight });
    Object.assign(painel.style, { left: p.x + 'px', top: p.y + 'px', right: 'auto', bottom: 'auto', transform: 'none' });
    return p;
  };
  alca.addEventListener('pointerdown', e => {
    if (painel.classList?.contains?.('hud-posicao-travada') || e.button !== 0 || e.isPrimary === false || arr || (e.target.closest?.('button,input,select,textarea,a') && e.target.closest?.('button,input,select,textarea,a') !== painel)) return;
    const caixa = painel.getBoundingClientRect();
    arr = { id: e.pointerId, ix: e.clientX, iy: e.clientY, left: caixa.left, top: caixa.top, moveu: false };
    alca.setPointerCapture(e.pointerId); e.preventDefault();
  });
  alca.addEventListener('pointermove', e => {
    if (!arr || arr.id !== e.pointerId) return;
    const dx = e.clientX - arr.ix, dy = e.clientY - arr.iy;
    if (!arr.moveu && Math.hypot(dx, dy) < 3) return;
    arr.moveu = true; alca.classList.add('arrastando');
    arr.pos = aplicar({ x: arr.left + dx, y: arr.top + dy });
    e.preventDefault();
  });
  const terminar = e => {
    if (!arr || arr.id !== e.pointerId) return;
    const a = arr; arr = null; alca.classList.remove('arrastando');
    if (a.moveu && a.pos) { pref = a.pos; try { localStorage.setItem(chave, JSON.stringify(pref)); } catch {} }
    if (alca.hasPointerCapture?.(e.pointerId)) alca.releasePointerCapture(e.pointerId);
  };
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) alca.addEventListener(ev, terminar);
  alca.addEventListener('dblclick', e => { if(painel.classList?.contains?.('hud-posicao-travada') || e.target.closest?.('button,input,select,textarea,a'))return; Object.assign(painel.style, { left: '', top: '', right: '', bottom: '', transform: '' }); pref = null; try { localStorage.removeItem(chave); } catch {} });
  addEventListener('resize', () => { if (pref&&(painel.tagName!=='DIALOG'||painel.open))requestAnimationFrame(()=>aplicar(pref)); });
  const restaurar=()=>{if(!pref||(painel.tagName==='DIALOG'&&!painel.open))return false;aplicar(pref);return true;};
  if (pref) requestAnimationFrame(restaurar);
  return {restaurar};
}

export function instalarPainelMovel(painel, cabecalho, chave) {
  if(typeof document!=='undefined')instalarRedimensionamento(painel,chave);
  let preferida = null, arrasto = null;
  try {
    const salva = JSON.parse(localStorage.getItem(chave));
    if (salva && [salva.x, salva.y, salva.altura].every(Number.isFinite) && salva.altura >= 60 && salva.altura <= 380) preferida = salva;
  } catch {} // Armazenamento bloqueado não impede mover a janela nesta sessão.

  const aplicar = posicao => {
    const manual=painel.classList?.contains('hud-tamanho-manual');
    const altura = manual ? painel.getBoundingClientRect().height : Math.min(posicao.altura, Math.max(60, innerHeight - 16));
    if(!manual)painel.style.maxHeight = altura + 'px';
    const caixa = painel.getBoundingClientRect();
    const ponto = limitarPosicaoPainel(posicao, { w: caixa.width, h: altura }, { w: innerWidth, h: innerHeight });
    Object.assign(painel.style, { left: ponto.x + 'px', top: ponto.y + 'px', right: 'auto', bottom: 'auto' });
    return { ...ponto, altura: posicao.altura };
  };
  const terminar = e => {
    if (!arrasto || arrasto.id !== e.pointerId) return;
    const anterior = arrasto; arrasto = null;
    cabecalho.classList.remove('arrastando');
    if (anterior.moveu) {
      preferida = anterior.posicao;
      try { localStorage.setItem(chave, JSON.stringify(preferida)); } catch {}
    }
    if (cabecalho.hasPointerCapture(e.pointerId)) cabecalho.releasePointerCapture(e.pointerId);
  };
  cabecalho.addEventListener('pointerdown', e => {
    if (painel.classList?.contains?.('hud-posicao-travada') || e.button !== 0 || e.isPrimary === false || !painel.open || arrasto || e.target.closest('button, input, select, a')) return;
    const caixa = painel.getBoundingClientRect();
    arrasto = { id: e.pointerId, inicioX: e.clientX, inicioY: e.clientY,
      esquerda: caixa.left, topo: caixa.top, altura: caixa.height, moveu: false };
    cabecalho.setPointerCapture(e.pointerId); e.preventDefault();
  });
  cabecalho.addEventListener('pointermove', e => {
    if (!arrasto || arrasto.id !== e.pointerId) return;
    const dx = e.clientX - arrasto.inicioX, dy = e.clientY - arrasto.inicioY;
    if (!arrasto.moveu && Math.hypot(dx, dy) < 3) return;
    arrasto.moveu = true; cabecalho.classList.add('arrastando');
    arrasto.posicao = aplicar({ x: arrasto.esquerda + dx, y: arrasto.topo + dy, altura: arrasto.altura });
    e.preventDefault();
  });
  for (const evento of ['pointerup', 'pointercancel', 'lostpointercapture']) cabecalho.addEventListener(evento, terminar);
  return {
    restaurar() {
      if (!preferida) return false;
      aplicar(preferida); return true;
    }
  };
}
