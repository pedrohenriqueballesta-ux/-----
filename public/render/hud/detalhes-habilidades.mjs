import { CONFIG } from '../../shared/nucleo/config.mjs';
import { CURA, curaPorNivel } from '../../shared/tecnicas/cura.mjs';
import { FORMAS, formaDisponivel, nomeDaForma } from '../../shared/tecnicas/formas.mjs';
import { RYUKEN, danoRyuken } from '../../shared/tecnicas/ryuken.mjs';
import { SUPER_KAME } from '../../shared/tecnicas/kamehameha.mjs';

const NOMES = { heal: 'Cura de Vida', kame: 'Kamehameha', kaioken: 'Kaioken', barrier: 'Barreira de Ki', transform: 'Super Saiyajin', genki: 'Genki Dama' };
const segundos = n => Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' s';

export function detalhesHabilidade(chave, estado) {
  if (!estado) return null;
  if(chave?.startsWith('skill:'))chave=chave.slice(6);
  if(chave?.startsWith('item:'))chave=chave.slice(5);
  if(chave?.startsWith('form:')&&chave!=='form:auto'){
    const forma=FORMAS.find(f=>f.forma===chave.slice(5));if(!forma)return null;
    return {nome:forma.nome,linhas:[['Desbloqueia','Nível '+forma.nivel],['Custo','Sem custo'],['Cooldown','Sem recarga'],['Manutenção','Drena '+CONFIG.transformacao.drenoKi.toLocaleString('pt-BR')+' Ki/s'],...(forma.duracao?[['Duração',segundos(forma.duracao)]]:[]),['Estado',estado.level<forma.nivel?'Bloqueada · requer nível '+forma.nivel:estado.forma===forma.forma?'ATIVO':'Disponível']]};
  }
  if(chave==='form:auto')chave='transform';
  if (chave === 'ryuken') {
    const restante = estado.ryukenRemaining || 0, nivel = CONFIG.skills.ryuken;
    return { nome: 'Ryuken (Punho do Dragão)', linhas: [
      ['Desbloqueia', 'Nível ' + nivel], ['Forma', 'Só no Super Saiyajin 3 e 4'], ['Custo', RYUKEN.custo + ' Ki'], ['Cooldown', segundos(RYUKEN.recarga)],
      ['Dano', '×' + String(RYUKEN.dano).replace('.', ',') + ' do ataque (SSJ3) · ×' + String(danoRyuken('ssj4')).replace('.', ',') + ' (SSJ4)'], ['Alvo', 'Mob selecionado; o dragão acompanha e acerta só ele'],
      ['Estado', estado.level < nivel ? 'Bloqueada · requer nível ' + nivel : restante > 0 ? 'Em recarga · ' + segundos(restante) : !RYUKEN.formas.includes(estado.forma) ? 'Transforme-se em Super Saiyajin 3 ou 4' : 'Disponível']
    ] };
  }
  if (chave === 'superKamehameha') {
    const restante = estado.superKameRemaining || 0, nivel = CONFIG.skills.superKamehameha;
    return { nome: 'Super Kamehameha', linhas: [
      ['Desbloqueia', 'Nível ' + nivel], ['Forma', 'Só no Super Saiyajin 4'], ['Custo', SUPER_KAME.custo + ' Ki'], ['Cooldown', segundos(SUPER_KAME.recarga)],
      ['Dano', '×' + SUPER_KAME.dano.toLocaleString('pt-BR') + ' do ataque'], ['Alvo', 'Mob selecionado; feixe carmesim do último nível, com área no impacto'],
      ['Estado', estado.level < nivel ? 'Bloqueada · requer nível ' + nivel : restante > 0 ? 'Em recarga · ' + segundos(restante) : estado.forma !== SUPER_KAME.forma ? 'Transforme-se em Super Saiyajin 4' : 'Disponível']
    ] };
  }
  if (NOMES[chave]) {
    if (chave === 'kaioken' || chave === 'transform') {
      // Um botão só (Pedro, 11/11/2026): a forma mais forte liberada; a próxima da escada aparece como "Próxima".
      const disponivel = formaDisponivel(estado.level), ativa = estado.forma && estado.forma !== 'base';
      const mostrada = ativa ? estado.forma : disponivel?.forma || FORMAS[0].forma, proxima = FORMAS.find(f => estado.level < f.nivel);
      return { nome: nomeDaForma(mostrada), linhas: [
        ['Desbloqueia', 'Nível ' + (FORMAS.find(f => f.forma === mostrada)?.nivel ?? FORMAS[0].nivel)], ['Custo', 'Sem custo'], ['Cooldown', 'Sem recarga'],
        ['Manutenção', 'Drena ' + CONFIG.transformacao.drenoKi.toLocaleString('pt-BR') + ' Ki/s'],
        ['Término', mostrada === 'gogeta' ? 'Após ' + segundos(FORMAS.find(f => f.forma === 'gogeta').duracao) + ' ou se o Ki zerar' : 'Volta à forma base quando o Ki zerar'], ['Alternar', 'Um buff por vez; apertar novamente volta à base'],
        ...(proxima ? [['Próxima', proxima.nome + ' no nível ' + proxima.nivel]] : []),
        ['Estado', !disponivel ? 'Bloqueada · requer nível ' + FORMAS[0].nivel : ativa ? 'ATIVO' : 'Disponível']
      ] };
    }
    const cura = estado.cura || { ...curaPorNivel(estado.level), cooldown: CURA.cooldown };
    const nivel = chave === 'heal' ? 1 : CONFIG.skills[chave];
    const custo = chave === 'heal' ? cura.custo : CONFIG.skillCosts[chave];
    const recarga = chave === 'heal' ? cura.cooldown : CONFIG.skillCooldowns[chave];
    const restante = chave === 'heal' ? cura.remaining : estado[chave + 'Remaining'];
    return { nome: NOMES[chave], linhas: [
      ['Desbloqueia', 'Nível ' + nivel], ['Custo', custo + ' Ki'], ['Cooldown', segundos(recarga)],
      ...(chave === 'heal' ? [['Cura', Number((cura.percentual * 100).toFixed(1)).toLocaleString('pt-BR') + '% do HP máximo']] : []),
      ...(chave === 'kame' ? [['Alvo', 'Mob selecionado'], ['Impacto', 'Dano completo no alvo; dano adicional dividido entre os demais mobs na área da sprite']] : []),
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
