export function limitarPosicaoPainel(posicao, tamanho, tela) {
  const margem = 8;
  return {
    x: Math.max(margem, Math.min(posicao.x, Math.max(margem, tela.w - tamanho.w - margem))),
    y: Math.max(margem, Math.min(posicao.y, Math.max(margem, tela.h - tamanho.h - margem)))
  };
}

export function instalarPainelMovel(painel, cabecalho, chave) {
  let preferida = null, arrasto = null;
  try {
    const salva = JSON.parse(localStorage.getItem(chave));
    if (salva && [salva.x, salva.y, salva.altura].every(Number.isFinite) && salva.altura >= 60 && salva.altura <= 380) preferida = salva;
  } catch {} // Armazenamento bloqueado não impede mover a janela nesta sessão.

  const aplicar = posicao => {
    const altura = Math.min(posicao.altura, Math.max(60, innerHeight - 16));
    painel.style.maxHeight = altura + 'px';
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
    if (e.button !== 0 || e.isPrimary === false || !painel.open || arrasto || e.target.closest('button, input, select, a')) return;
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
