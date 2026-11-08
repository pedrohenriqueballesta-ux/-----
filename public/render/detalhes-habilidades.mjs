import { CONFIG } from '../shared/config.mjs';
import { CURA, curaPorNivel } from '../shared/cura.mjs';

const NOMES = { heal: 'Cura de Vida', kame: 'Kamehameha', kaioken: 'Kaioken', barrier: 'Barreira de Ki', transform: 'Super Saiyajin', genki: 'Genki Dama' };
const segundos = n => Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' s';

export function detalhesHabilidade(chave, estado) {
  if (!estado) return null;
  if (NOMES[chave]) {
    const cura = estado.cura || { ...curaPorNivel(estado.level), cooldown: CURA.cooldown };
    const nivel = chave === 'heal' ? 1 : CONFIG.skills[chave];
    const custo = chave === 'heal' ? cura.custo : CONFIG.skillCosts[chave];
    const recarga = chave === 'heal' ? cura.cooldown : CONFIG.skillCooldowns[chave];
    const restante = chave === 'heal' ? cura.remaining : estado[chave + 'Remaining'];
    return { nome: NOMES[chave], linhas: [
      ['Desbloqueia', 'Nível ' + nivel], ['Custo', custo + ' Ki'], ['Cooldown', segundos(recarga)],
      ...(chave === 'heal' ? [['Cura', Number((cura.percentual * 100).toFixed(1)).toLocaleString('pt-BR') + '% do HP máximo']] : []),
      ...(chave === 'transform' ? [['Manutenção', '3,5 Ki por segundo']] : []),
      ['Estado', estado.level < nivel ? 'Bloqueada · requer nível ' + nivel : restante > 0 ? 'Em recarga · ' + segundos(restante) : 'Desbloqueada']
    ] };
  }
  const semente = /^seed(15|30|50|100)$/.exec(chave);
  if (!semente && !['food', 'ki'].includes(chave)) return null;
  const nome = semente ? 'Semente dos Deuses · ' + semente[1] + '%' : chave === 'ki' ? 'Poção de Ki' : 'Presunto';
  const restante = semente ? estado.seedRemaining : chave === 'ki' ? estado.kiRemaining : 0;
  const quantidade = estado.inventory?.[chave] || 0;
  return { nome, linhas: [
    ['Desbloqueia', 'Nível 1'], ['Custo', '1 unidade · 0 Ki'],
    ['Cooldown', semente ? segundos(CONFIG.seedCooldown) + ' · compartilhado entre sementes' : chave === 'ki' ? segundos(CONFIG.kiCooldown) : 'Renovação ao fim do efeito'],
    ['Efeito', semente ? 'Recupera ' + semente[1] + '% do HP máximo' : chave === 'ki' ? 'Recupera 45% do Ki máximo' : 'Regenera HP durante ' + CONFIG.foodDuration / 60 + ' minutos'],
    ['Estoque', quantidade + (quantidade === 1 ? ' unidade' : ' unidades')],
    ['Estado', quantidade === 0 ? 'Sem estoque' : restante > 0 ? 'Em recarga · ' + segundos(restante) : chave === 'food' && estado.foodRemaining > 0 ? 'Efeito ativo · ' + segundos(estado.foodRemaining) : 'Disponível']
  ] };
}

export function posicaoDetalhes(alvo, tamanho, largura, altura) {
  const margem = 8, folga = 12;
  const x = Math.max(margem, Math.min(alvo.left + alvo.width / 2 - tamanho.width / 2, largura - tamanho.width - margem));
  const acima = alvo.top - tamanho.height - folga;
  const y = Math.max(margem, Math.min(acima >= margem ? acima : alvo.bottom + folga, altura - tamanho.height - margem));
  return { x, y };
}

// A delegação atende botões desabilitados e os slots recriados ao mudar estoque/aba.
export function instalarDetalhesHabilidades() {
  const janela = document.createElement('div'); janela.id = 'detalhesHabilidade';
  janela.className = 'detalhes-habilidade'; janela.setAttribute('role', 'tooltip'); janela.hidden = true;
  document.body.append(janela);
  let estado = null, alvo = null, dispensado = null, assinatura = '';
  const seletor = '[data-skill], #transformButton, #seedButton, #kiPotionButton, #foodBuff, #foodButton, [data-item]';
  const chave = el => el.dataset.hotkeyConsumivel ? el.dataset.item || null : el.dataset.skill || el.dataset.item || ({ transformButton: 'transform', seedButton: 'seed' + (estado?.seedSelected || 15), kiPotionButton: 'ki', foodBuff: 'food', foodButton: 'food' })[el.id];
  const esconder = () => {
    alvo?.removeAttribute('aria-describedby'); alvo = null; assinatura = ''; janela.hidden = true;
  };
  const desenhar = () => {
    if (!alvo?.isConnected) { esconder(); return; }
    const detalhes = detalhesHabilidade(chave(alvo), estado);
    if (!detalhes) { esconder(); return; }
    const atalho = alvo.querySelector('kbd')?.textContent || (chave(alvo) === 'food' ? 'F' : '');
    const nova = JSON.stringify([detalhes, atalho]);
    if (assinatura !== nova) {
      const titulo = document.createElement('strong'); titulo.textContent = detalhes.nome;
      const lista = document.createElement('dl');
      for (const [nome, valor] of [...detalhes.linhas, ...(atalho ? [['Atalho', atalho]] : [])]) {
        const dt = document.createElement('dt'), dd = document.createElement('dd');
        dt.textContent = nome; dd.textContent = valor; lista.append(dt, dd);
      }
      janela.replaceChildren(titulo, lista); assinatura = nova;
    }
    janela.hidden = false; alvo.setAttribute('aria-describedby', janela.id);
    const pos = posicaoDetalhes(alvo.getBoundingClientRect(), janela.getBoundingClientRect(), innerWidth, innerHeight);
    janela.style.left = pos.x + 'px'; janela.style.top = pos.y + 'px';
  };
  const mostrar = el => {
    if (el === dispensado) return;
    if (alvo !== el) { esconder(); alvo = el; }
    desenhar();
  };
  document.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    const el = e.target.closest?.(seletor);
    if (dispensado !== el) dispensado = null;
    if (el) mostrar(el); else esconder();
  }, true);
  document.addEventListener('pointerout', e => { if (!e.relatedTarget) esconder(); }, true);
  document.addEventListener('focusin', e => { const el = e.target.closest?.(seletor); if (el) mostrar(el); });
  document.addEventListener('focusout', esconder);
  document.addEventListener('dragstart', esconder);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { dispensado = alvo; esconder(); } });
  addEventListener('blur', esconder);
  addEventListener('resize', esconder);
  document.addEventListener('scroll', esconder, true);
  return snapshot => {
    estado = snapshot;
    // Evita dois balões simultâneos (o nativo do navegador e a janela do jogo).
    for (const el of document.querySelectorAll(seletor)) el.removeAttribute('title');
    if (alvo) desenhar();
  };
}
