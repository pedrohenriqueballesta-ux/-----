// Transição visual: a viagem continua sendo validada pela ação de portal do servidor.
export const TELEPORTE = Object.freeze({ imagens: Object.freeze(Array.from({ length: 16 }, (_, i) =>
  '/assets/teleports/transicao-nimbus/frame_' + String(i).padStart(2, '0') + '.png')),
  largura: 414, altura: 231, quadros: 16, passo: 1.5 / 16,
  troca: 9 * 1.5 / 16, revelar: 13 * 1.5 / 16, duracao: 1.5,
  fadeEntrada: 0.09, fadeSaida: 0.2625, limiteEspera: 20 });

export class RelogioTeleport {
  constructor() { this.ativa = false; }
  iniciar(destino) {
    if (this.ativa) return false;
    this.ativa = true; this.destino = destino; this.tempo = 0; this.espera = 0;
    this.enviada = false; this.confirmada = false; this.erro = null;
    return true;
  }
  atualizar(dt, pronto = false) {
    if (!this.ativa) return { quadro: -1, viajar: false };
    this.tempo += dt;
    const viajar = !this.enviada && this.tempo + 1e-9 >= TELEPORTE.troca;
    if (viajar) this.enviada = true;
    if (this.tempo >= TELEPORTE.revelar && !(this.confirmada && pronto)) {
      this.tempo = TELEPORTE.revelar - 0.001;
      this.espera += dt;
      if (this.espera >= TELEPORTE.limiteEspera) this.erro = 'O destino demorou para carregar. Confira a conexão.';
    }
    if (this.erro || this.tempo + 1e-9 >= TELEPORTE.duracao) this.ativa = false;
    return { quadro: this.ativa ? Math.min(TELEPORTE.quadros - 1, Math.floor((this.tempo + 1e-9) / TELEPORTE.passo)) : -1, viajar };
  }
}

export function enquadramentoTeleport(largura, altura) {
  const t = TELEPORTE, escala = Math.min(largura / t.largura, altura / t.altura);
  const cobertura = Math.max(largura / t.largura, altura / t.altura);
  return { x: (largura - t.largura * escala) / 2, y: (altura - t.altura * escala) / 2,
    w: t.largura * escala, h: t.altura * escala,
    fundoW: t.largura * cobertura, fundoH: t.altura * cobertura };
}

export function desenharTransicao(ctx, imagem, largura, altura, tempo) {
  const t = TELEPORTE, g = enquadramentoTeleport(largura, altura);
  ctx.clearRect(0, 0, largura, altura);
  ctx.save();
  // Fundo expandido e suavizado preenche as laterais sem cortar a logo do quadro principal.
  ctx.globalAlpha = Math.max(0, Math.min(1, tempo / t.fadeEntrada, (t.duracao - tempo) / t.fadeSaida));
  ctx.filter = 'blur(18px)';
  ctx.drawImage(imagem, 0, 0, t.largura, t.altura,
    (largura - g.fundoW) / 2 - 24, (altura - g.fundoH) / 2 - 24, g.fundoW + 48, g.fundoH + 48);
  ctx.filter = 'none';
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(imagem, 0, 0, t.largura, t.altura, g.x, g.y, g.w, g.h);
  ctx.restore();
}

export function criarTransicaoTeleport({ viajar, pronto, concluir, avisar, container }) {
  const relogio = new RelogioTeleport(), imagens = TELEPORTE.imagens.map(src => {
    const imagem = new Image(); imagem.src = src; return imagem;
  });
  let preparando = false, versao = 0;
  return {
    get ativa() { return preparando || relogio.ativa; },
    async iniciar(destino) {
      if (preparando || relogio.ativa) return;
      const rodada = ++versao;
      preparando = true;
      let tela;
      let prazo;
      try {
        // Não viaja com a tela descoberta se o arquivo estiver ausente ou ainda carregando.
        await Promise.race([Promise.all(imagens.map(imagem => imagem.decode())), new Promise((_, rejeitar) => {
          prazo = setTimeout(() => rejeitar(new Error('Não foi possível carregar a animação de teleporte.')), 10000);
        })]);
        clearTimeout(prazo);
        tela = document.createElement('canvas');
        tela.setAttribute('aria-label', 'Viajando para o destino'); tela.setAttribute('role', 'status');
        tela.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:10000;pointer-events:auto;touch-action:none';
        (container||document.body).append(tela);
        const pintura = tela.getContext('2d');
        relogio.iniciar(destino); preparando = false;
        let anterior = performance.now();
        const finalizar = () => {
          tela.remove(); relogio.ativa = false;
          concluir();
          if (relogio.erro) avisar(relogio.erro);
        };
        const frame = agora => {
          // Cada quadro aparece mesmo depois de uma aba ficar em segundo plano; nunca reinicia o ciclo.
          const dt = Math.min(TELEPORTE.passo, Math.max(0, (agora - anterior) / 1000)); anterior = agora;
          const estado = relogio.atualizar(dt, pronto(destino));
          if (estado.viajar) {
            Promise.resolve().then(() => viajar(destino)).then(resultado => {
              if (rodada !== versao || !relogio.ativa) return;
              if (!resultado?.ok) relogio.erro = resultado?.reason || 'O teleporte não foi autorizado.';
              else relogio.confirmada = true;
            }).catch(erro => { if (rodada === versao && relogio.ativa) relogio.erro = erro.message; });
          }
          if (!relogio.ativa) { finalizar(); return; }
          const w = window.innerWidth, h = window.innerHeight;
          if (tela.width !== w || tela.height !== h) { tela.width = w; tela.height = h; }
          desenharTransicao(pintura, imagens[estado.quadro], w, h, relogio.tempo);
          requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      } catch (erro) {
        clearTimeout(prazo);
        tela?.remove(); preparando = false; relogio.ativa = false; concluir(); avisar(erro.message);
      }
    }
  };
}
