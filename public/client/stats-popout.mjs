export const CANAL_STATUS_POPUP = 'dragon-ball-idle-status-popup-v1';

export function resumirStatusPopout(snapshot) {
  const self = snapshot?.self;
  if (!self) return null;
  const jogador = snapshot.players?.find(p => p.id === snapshot.selfId);
  const time = Number(snapshot.time) || 0;
  const eventoRecente = tipo => (snapshot.events || [])
    .filter(e => e.playerId === snapshot.selfId && e.type === tipo && time >= e.at && time - e.at < 0.36)
    .sort((a, b) => b.at - a.at)[0] || null;
  const soco = eventoRecente('punch'), rajada = eventoRecente('kiShot');
  const kame = (snapshot.kamehamehas || []).find(k => k.owner === snapshot.selfId && (!k.impacto || time - k.impacto.started < 0.25));
  const genkiCarga = (snapshot.genkiCharges || []).find(g => g.owner === snapshot.selfId);
  const hpMax = Math.max(1, Number(self.stats?.hp) || 1);
  const kiMax = Math.max(1, Number(self.stats?.ki) || 1);
  const hp = Math.max(0, Number(self.hp) || 0);
  const ki = Math.max(0, Number(self.ki) || 0);
  const estado = hp <= 0 ? 'morto' : self.autoHunt ? 'cacando' : jogador?.moving ? 'explorando' : 'repouso';
  return {
    nome: jogador?.name || self.name || 'Guerreiro', vocacao: self.character || self.vocacao || 'Goku',
    nivel: Number(self.level) || 1, estado,
    hp, hpMax, hpPercentual: Math.min(100, hp / hpMax * 100),
    ki, kiMax, kiPercentual: Math.min(100, ki / kiMax * 100),
    xpHora: Math.max(0, Number(self.huntAnalyzer?.xpHora) || 0),
    sprite: jogador ? {
      id: jogador.id, moving: Boolean(jogador.moving && !jogador.montaria), facing: genkiCarga?.direction || jogador.genkiDirecao || jogador.facing || { x: 0, y: 1 },
      dead: Boolean(jogador.dead || hp <= 0), transformed: Boolean(jogador.transformed), forma: jogador.forma || self.forma || 'base',
      charge: jogador.charge ? { until: jogador.charge.until } : null, dashing: Boolean(jogador.dashing),
      genkiLancado: jogador.genkiLancado, genkiCarga: genkiCarga ? { started: genkiCarga.started } : null,
      rajadaStarted: rajada?.at, kameStarted: kame?.started, socoStarted: soco?.at,
      movementSpeed: Number(self.stats?.mobility) || 0, serverTime: time
    } : null
  };
}

export function instalarStatusPopout({ botao, windowRef = globalThis.window, obterSnapshot, avisar = () => {} }) {
  let canal = null, ultimoStatus = null, janelaFlutuante = null;
  const Canal = windowRef?.BroadcastChannel || globalThis.BroadcastChannel;
  try { if (Canal) canal = new Canal(CANAL_STATUS_POPUP); } catch {}
  const enviar = status => canal?.postMessage({ tipo: 'status', status });
  canal?.addEventListener('message', evento => {
    if (evento.data?.tipo === 'pedir-status') enviar(ultimoStatus);
  });
  const atualizar = snapshot => {
    ultimoStatus = resumirStatusPopout(snapshot);
    enviar(ultimoStatus);
  };
  const abrir = () => {
    if (!obterSnapshot()?.self) { avisar('Entre no jogo para abrir o painel de status.'); return null; }
    if (!canal) { avisar('Este navegador não oferece suporte à janela compacta.'); return null; }
    const pictureInPicture = windowRef.documentPictureInPicture;
    if (pictureInPicture?.requestWindow) {
      const existente = pictureInPicture.window || janelaFlutuante;
      if (existente && !existente.closed) { existente.focus?.(); return existente; }
      // Deve ser chamado diretamente pelo clique. A janela PiP fica acima de outros apps,
      // e o usuário pode movê-la pela barra nativa do navegador.
      return pictureInPicture.requestWindow({ width: 350, height: 300 }).then(janela => {
        janelaFlutuante = janela;
        const doc = janela.document;
        doc.title = 'Status · Dragon Ball Idle';
        doc.documentElement.style.width = doc.documentElement.style.height = '100%';
        doc.body.style.margin = '0';
        doc.body.style.width = doc.body.style.height = '100%';
        doc.body.style.overflow = 'hidden';
        const css = doc.createElement('link');
        css.rel = 'stylesheet'; css.href = '/status-popout.css'; doc.head.append(css);
        const frame = doc.createElement('iframe');
        frame.src = '/status-popout.html'; frame.title = 'Status do personagem';
        frame.style.cssText = 'display:block;width:100%;height:100%;border:0';
        doc.body.append(frame);
        janela.addEventListener('pagehide', () => { if (janelaFlutuante === janela) janelaFlutuante = null; }, { once: true });
        enviar(ultimoStatus);
        return janela;
      }).catch(() => { avisar('O navegador não conseguiu abrir a janela flutuante. Tente novamente pelo botão.'); return null; });
    }
    const janela = windowRef.open('/status-popout.html', 'dragonBallIdleStatus', 'popup=yes,width=350,height=300,resizable=yes,scrollbars=no');
    if (!janela) { avisar('Permita pop-ups deste site para abrir o painel de status.'); return null; }
    janela.focus?.();
    enviar(ultimoStatus);
    return janela;
  };
  botao?.addEventListener('click', abrir);
  return { atualizar, abrir, fechar: () => canal?.close() };
}
