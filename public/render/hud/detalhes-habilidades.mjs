import { TECNICAS_BOO, custoTecnicaBoo, estagioTecnicasBoo } from '../../shared/tecnicas/majin-boo.mjs';
import { CHOCOLATE_BEAM } from '../../shared/tecnicas/chocolate-beam.mjs';
import { CONFIG } from '../../shared/nucleo/config.mjs';
import { recargaConsumivel } from './recargas-hud.mjs';
import { CONSUMIVEIS_LOOT } from '../../shared/tecnicas/consumiveis-loot.mjs';
import { aplicarRaridadeItem } from './hud-elementos.mjs';
import { COLECIONAVEIS } from '../../shared/sistemas/premium-config.mjs';
import { RARIDADES_ITENS } from '../../shared/sistemas/catalogo-itens.mjs';
import { ITENS_PREMIUM } from '../../shared/sistemas/itens-premium.mjs';
import { ITENS_NEGOCIAVEIS } from '../../shared/sistemas/itens-negociaveis.mjs';
import { CURA, curaPorNivel } from '../../shared/tecnicas/cura.mjs';
import { FORMAS, formaDisponivel, formasDaVocacao, nomeDaForma } from '../../shared/tecnicas/formas.mjs';
import { RYUKEN, danoRyuken } from '../../shared/tecnicas/ryuken.mjs';
import { KAME, SUPER_KAME } from '../../shared/tecnicas/kamehameha.mjs';
import { ESTAGIOS_GALICK, estagioGalick } from '../../shared/tecnicas/galick-gun.mjs';
import { BIG_BANG_ATTACK, formaBigBangAttack } from '../../shared/tecnicas/big-bang-attack.mjs';
import { FINAL_FLASH, formaFinalFlash } from '../../shared/tecnicas/final-flash.mjs';

const NOMES = { heal: 'Cura de Vida', kame: 'Kamehameha', galick: 'Galick Gun', kaioken: 'Kaioken', barrier: 'Barreira de Ki', transform: 'Super Saiyajin', genki: 'Genki Dama' };
const segundos = n => Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' s';

export function detalhesHabilidade(chave, estado) {
  if (!estado) return null;
  const itemChave=chave?.startsWith('item:');
  const skillChave=chave?.startsWith('skill:');
  if (skillChave) {
    chave = chave.slice(6);
    if (chave === 'ki') return null;
  }
  if(itemChave)chave=chave.slice(5);
  if (Object.hasOwn(CONSUMIVEIS_LOOT, chave) || Object.hasOwn(ITENS_PREMIUM, chave)) return detalhesItem(chave, estado, 'barra');
  if(chave?.startsWith('form:')&&chave!=='form:auto'){
    const forma=formasDaVocacao(estado.vocacao).find(f=>f.forma===chave.slice(5));if(!forma)return null;
    return {nome:forma.nome,linhas:[['Desbloqueia','Nível '+forma.nivel],['Custo','Sem custo'],['Cooldown','Sem recarga'],['Manutenção','Drena '+CONFIG.transformacao.drenoKi.toLocaleString('pt-BR')+' Ki/s'],...(forma.duracao?[['Duração',segundos(forma.duracao)]]:[]),['Estado',estado.level<forma.nivel?'Bloqueada · requer nível '+forma.nivel:estado.forma===forma.forma?'ATIVO':'Disponível']]};
  }
  const automatica = chave === 'form:auto';
  if(automatica)chave='transform';
  if (Object.hasOwn(TECNICAS_BOO, chave)) {
    const t = TECNICAS_BOO[chave], restante = estado[chave+'Remaining'] || 0;
    const e = estagioTecnicasBoo(estado.forma), formatar = n => n.toLocaleString('pt-BR');
    const atributos = {
      cloneSummoning: [['Quantidade', formatar(e.clones)]],
      supernova: [['Raio', formatar(e.raioNova / KAME.tile) + ' tiles'], ['Atração', formatar(e.atracao / KAME.tile) + ' tiles/s'],
        ['Dano por pulso', formatar(e.danoNova * 100) + '% do ataque']],
      angryExplosion: [['Raio', formatar(e.raioAngry / KAME.tile) + ' tiles'], ['Dano', formatar(e.danoAngry * 100) + '% do ataque']]
    };
    const situacao = estado.level < t.nivel ? 'Bloqueada · requer nível '+t.nivel
      : restante > 0 ? 'Em recarga · '+segundos(restante)
      : estado.ki < custoTecnicaBoo(t, estado.stats.ki) ? 'Ki insuficiente' : 'Disponível';
    return {nome:t.nome, linhas:[['Desbloqueia','Nível '+t.nivel],['Custo',t.ki+'% do Ki máximo'],
      ['Cooldown',segundos(t.recarga)],['Conjuração',segundos(t.carga)],['Efeito',t.descricao],...atributos[chave],['Estado',situacao]]};
  }
  if (chave === 'chocolateBeam') {
    const {nivel,custo,recarga,carga,alcance,nome} = CHOCOLATE_BEAM;
    const restante = estado.chocolateBeamRemaining || 0;
    const { stun, danoChocolate } = estagioTecnicasBoo(estado.forma);
    const situacao = estado.vocacao !== 'boo' ? 'Exclusiva do Majin Boo' : estado.level < nivel ? 'Bloqueada · requer nível ' + nivel
      : restante > 0 ? 'Em recarga · ' + segundos(restante) : estado.ki < custo ? 'Ki insuficiente' : 'Disponível';
    return {nome, linhas:[['Desbloqueia','Nível ' + nivel],['Custo',custo + ' Ki'],['Cooldown',segundos(recarga)],
      ['Conjuração',segundos(carga)],['Alcance',alcance + ' unidades'],['Dano no impacto', (danoChocolate * 100).toLocaleString('pt-BR') + '% do ataque'],
      ['Atordoamento', segundos(stun)],['Estado',situacao]]};
  }
  if (chave === 'finalFlash' || chave === 'bigBangAttack') {
    const bigBang = chave === 'bigBangAttack';
    const { nivel, custo, recarga, alcance, carga, dano } = bigBang ? BIG_BANG_ATTACK : FINAL_FLASH;
    const formaValida = bigBang ? formaBigBangAttack : formaFinalFlash;
    const restante = estado[chave + 'Remaining'] || 0;
    const situacao = estado.vocacao !== 'vegeta' ? 'Exclusiva do Vegeta'
      : estado.level < nivel ? 'Bloqueada · requer nível ' + nivel
      : !formaValida(estado.forma) ? 'Transforme-se em SSJ1 ou superior'
      : restante > 0 ? 'Em recarga · ' + segundos(restante)
      : estado.ki < custo ? 'Ki insuficiente' : 'Disponível';
    return { nome: bigBang ? 'Big Bang Attack' : 'Final Flash', linhas: [
      ['Desbloqueia', 'Nível ' + nivel], ['Forma', 'SSJ1 ou superior'], ['Custo', custo + ' Ki'],
      ['Cooldown', segundos(recarga)], ['Conjuração', segundos(carga)], ['Alcance', alcance + ' unidades'],
      ['Dano', '×' + dano + ' do ataque base'], ['Alvo', 'Mob marcado ao iniciar a conjuração'], ['Estado', situacao]
    ] };
  }
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
  if (NOMES[chave] && !itemChave) {
    if (chave === 'kaioken' || chave === 'transform') {
      // Um botão só (Pedro, 11/11/2026): a forma mais forte liberada; a próxima da escada aparece como "Próxima".
      const disponivel = formaDisponivel(estado.level,estado.vocacao||'goku');
      const formas = formasDaVocacao(estado.vocacao), primeira = formas[0];
      if (!primeira) return null;
      const mostrada = !automatica && estado.forma && estado.forma !== 'base' ? estado.forma : disponivel?.forma || primeira.forma;
      const ativa = estado.forma === mostrada, proxima = formas.find(f => estado.level < f.nivel);
      return { nome: nomeDaForma(mostrada), linhas: [
        ['Desbloqueia', 'Nível ' + (formas.find(f => f.forma === mostrada)?.nivel ?? primeira.nivel)], ['Custo', 'Sem custo'], ['Cooldown', 'Sem recarga'],
        ['Manutenção', 'Drena ' + CONFIG.transformacao.drenoKi.toLocaleString('pt-BR') + ' Ki/s'],
        ['Término', mostrada === 'gogeta' ? 'Após ' + segundos(FORMAS.find(f => f.forma === 'gogeta').duracao) + ' ou se o Ki zerar' : 'Volta à forma base quando o Ki zerar'], ['Alternar', 'Um buff por vez; apertar novamente volta à base'],
        ...(proxima ? [['Próxima', proxima.nome + ' no nível ' + proxima.nivel]] : []),
        ['Estado', !disponivel ? 'Bloqueada · requer nível ' + primeira.nivel : ativa ? 'ATIVO' : 'Disponível']
      ] };
    }
    const cura = estado.cura || { ...curaPorNivel(estado.level), cooldown: CURA.cooldown };
    const nivel = chave === 'heal' ? 1 : CONFIG.skills[chave];
    const custo = chave === 'heal' ? cura.custo : CONFIG.skillCosts[chave];
    const recarga = chave === 'heal' ? cura.cooldown : CONFIG.skillCooldowns[chave];
    const restante = chave === 'heal' ? cura.remaining : estado[chave + 'Remaining'];
    const galick = chave === 'galick';
    return { nome: galick && estado.galickVersao ? 'Galick Gun V' + estado.galickVersao : NOMES[chave], linhas: [
      ['Desbloqueia', 'Nível ' + nivel], ['Custo', custo + ' Ki'], ['Cooldown', segundos(recarga)],
      ...(chave === 'heal' ? [['Cura', Number((cura.percentual * 100).toFixed(1)).toLocaleString('pt-BR') + '% do HP máximo']] : []),
      ...(chave === 'kame' ? [['Alvo', 'Mob selecionado'], ['Impacto', 'Dano completo no alvo; dano adicional dividido entre os demais mobs na área da sprite']] : []),
      ...(galick ? [['Alvo', 'Mob selecionado'], ['Alcance', (estagioGalick(estado.level) ?? ESTAGIOS_GALICK[0]).alcance + ' unidades'], ['Origem', 'Mãos do Vegeta']] : []),
      ['Estado', galick && estado.vocacao !== 'vegeta' ? 'Exclusiva do Vegeta' : estado.level < nivel ? 'Bloqueada · requer nível ' + nivel : restante > 0 ? 'Em recarga · ' + segundos(restante) : galick && estado.ki < custo ? 'Ki insuficiente' : 'Desbloqueada']
    ] };
  }
  const semente = /^seed(15|30|50|100)$/.exec(chave);
  if (!semente && !['food', 'ki'].includes(chave)) return null;
  const nome = semente ? 'Semente dos Deuses · ' + semente[1] + '%' : chave === 'ki' ? 'Poção de Ki' : 'Presunto';
  const restante = recargaConsumivel(estado, chave);
  const comidaAtiva = chave === 'food' && (estado.foodId ?? 'food') === 'food' && estado.foodRemaining > 0;
  const quantidade = estado.inventory?.[chave] || 0;
  return { nome, linhas: [
    ['Desbloqueia', 'Nível 1'], ['Custo', '1 unidade · 0 Ki'],
    ['Cooldown', semente ? segundos(CONFIG.seedCooldown) + ' · compartilhado entre sementes' : chave === 'ki' ? segundos(CONFIG.kiCooldown) : 'Renovação ao fim do efeito'],
    ['Efeito', semente ? 'Recupera ' + semente[1] + '% do HP máximo' : chave === 'ki' ? 'Recupera 45% do Ki máximo' : 'Regenera HP durante ' + CONFIG.foodDuration / 60 + ' minutos'],
    ['Estoque', quantidade + (quantidade === 1 ? ' unidade' : ' unidades')],
    ['Estado', comidaAtiva ? 'Efeito ativo · ' + segundos(estado.foodRemaining) : quantidade === 0 ? 'Sem estoque' : restante > 0 ? 'Em recarga · ' + segundos(restante) : 'Disponível']
  ] };
}

const numeroItem = valor => valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
export function detalhesItem(id, estado, local = 'mochila') {
  if (!Object.hasOwn(ITENS_NEGOCIAVEIS, id)) return null;
  const item = ITENS_NEGOCIAVEIS[id];
  if (Object.hasOwn(ITENS_PREMIUM, id)) {
    const linhas = [['Raridade', RARIDADES_ITENS[item.raridade]], ['Efeito', item.descricao], ['Peso', numeroItem(item.peso) + ' kg']];
    if (local === 'mochila' || local === 'barra') linhas.push(['Estoque', String(estado?.inventory?.[id] ?? 0)]);
    return { nome: item.nome, linhas };
  }
  const efeito = item.origem ? null : detalhesHabilidade('item:' + id, estado);
  const linhas = [];
  if (item.raridade) linhas.push(['Raridade', RARIDADES_ITENS[item.raridade]]);
  if (item.slot) {
    linhas.push(['Nível exigido', item.nivel], ['Defesa', '+' + item.defesa], ['Regeneração de Ki', '+' + numeroItem(item.kiPorSegundo) + ' Ki/s']);
    if (item.ataque) linhas.push(['Ataque', '+' + item.ataque]);
    if (local === 'equipado' && estado?.level < item.nivel) linhas.push(['Estado', 'Bônus inativos no nível atual']);
  }
  linhas.push(['Peso', numeroItem(item.peso) + ' kg'], ['Venda ao NPC', numeroItem(item.precoNpc) + ' Z']);
  if (efeito) linhas.push(...(local === 'previa' ? efeito.linhas.filter(([rotulo]) => ['Efeito', 'Cooldown'].includes(rotulo)) : efeito.linhas));
  if (item.consumo) {
    const c = item.consumo, comida = c.tipo === 'comida';
    const ganhos = comida
      ? [c.hpPorSegundo && numeroItem(c.hpPorSegundo) + ' HP/s', c.kiPorSegundo && numeroItem(c.kiPorSegundo) + ' Ki/s']
      : [numeroItem(c.fracaoHp * 100) + '% do HP máximo'];
    linhas.push(['Efeito', ganhos.filter(Boolean).join(' e ')],
      comida ? ['Duração', segundos(c.duracao)] : ['Recarga', segundos(CONFIG.kiCooldown) + ' · compartilhada com Poção de Ki']);
    if (comida) linhas.push(['Recarga', 'Compartilhada entre comidas']);
    if (local !== 'previa') {
      const estoque = estado?.inventory?.[id] ?? 0, restante = recargaConsumivel(estado, id);
      linhas.push(['Estoque', String(estoque)]);
      if (comida && estado?.foodId === id && estado.foodRemaining > 0) linhas.push(['Estado', 'Efeito ativo · ' + segundos(estado.foodRemaining)]);
      else if (restante > 0) linhas.push(['Estado', 'Em recarga · ' + segundos(restante)]);
    }
  }
  if (item.slot && local !== 'previa') linhas.push(['Mover', local === 'equipado' ? 'Arraste para a mochila' : 'Arraste para o encaixe correspondente']);
  return { nome: efeito?.nome ?? item.nome, linhas };
}

export function posicaoDetalhes(alvo, tamanho, largura, altura) {
  const margem = 8, folga = 12;
  const x = Math.max(margem, Math.min(alvo.left + alvo.width / 2 - tamanho.width / 2, largura - tamanho.width - margem));
  const acima = alvo.top - tamanho.height - folga;
  const y = Math.max(margem, Math.min(acima >= margem ? acima : alvo.bottom + folga, altura - tamanho.height - margem));
  return { x, y };
}

const MARGEM_ITEM = 8, FOLGA_ITEM = 10;
function espacoLateralItem(alvo, largura) {
  return {
    esquerda: alvo.left - FOLGA_ITEM - MARGEM_ITEM,
    direita: largura - alvo.right - FOLGA_ITEM - MARGEM_ITEM
  };
}
export function posicaoDetalhesItem(alvo, tamanho, largura, altura) {
  const { esquerda, direita } = espacoLateralItem(alvo, largura);
  if (Math.max(esquerda, direita) < tamanho.width) return posicaoDetalhes(alvo, tamanho, largura, altura);
  return {
    x: direita >= esquerda ? alvo.right + FOLGA_ITEM : alvo.left - FOLGA_ITEM - tamanho.width,
    y: Math.max(MARGEM_ITEM, Math.min(alvo.top + (alvo.height - tamanho.height) / 2, altura - tamanho.height - MARGEM_ITEM))
  };
}

// A delegação atende botões desabilitados e os slots recriados ao mudar estoque/aba.
export function instalarDetalhesHabilidades() {
  const janela = document.createElement('div'); janela.id = 'detalhesHabilidade';
  janela.className = 'detalhes-habilidade'; janela.setAttribute('role', 'tooltip'); janela.hidden = true;
  document.body.append(janela);
  let estado = null, alvo = null, dispensado = null, assinatura = '', arrastando = false;
  const seletor = '[data-skill], #transformButton, #seedButton, #kiPotionButton, #foodBuff, #foodButton, [data-item], [data-equip-item]:not([data-equip-item=""]), [data-inspecionar-item], [data-inspecionar-colecionavel]';
  const chave = el => {
    if (el.dataset.hotkeyConsumivel) return 'item:' + (el.dataset.item || '');
    const id = el.dataset.skill || el.dataset.item;
    if (id?.startsWith('item:')) return id;
    return id || ({ transformButton: 'transform', seedButton: 'seed' + (estado?.seedSelected || 15), kiPotionButton: 'ki', foodBuff: 'food', foodButton: 'food' })[el.id];
  };
  const esconder = () => {
    alvo?.removeAttribute('aria-describedby'); alvo = null; assinatura = ''; janela.hidden = true;
  };
  const desenhar = () => {
    if (!alvo?.isConnected || alvo.closest('dialog:not([open])') || !alvo.getClientRects().length || arrastando) { esconder(); return; }
    const idMochila = alvo.dataset.equipItem || (alvo.closest('#mochilaGrade') ? alvo.dataset.item : null);
    const { inspecionarItem, inspecionarColecionavel } = alvo.dataset;
    const colecionavel = COLECIONAVEIS[inspecionarColecionavel];
    const detalhes = idMochila ? detalhesItem(idMochila, estado, alvo.dataset.equipItem ? 'equipado' : 'mochila')
      : inspecionarItem ? detalhesItem(inspecionarItem, estado, 'previa')
        : colecionavel ? { nome: colecionavel.nome, linhas: [['Categoria', colecionavel.tipo], ['Destino', 'Coleção da conta']] }
          : detalhesHabilidade(chave(alvo), estado);
    if (!detalhes) { esconder(); return; }
    aplicarRaridadeItem(janela, idMochila || inspecionarItem || chave(alvo)?.replace(/^item:/, ''));
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
    // Um tooltip anexado ao body ficaria atrás da camada modal do God Mode.
    const camada = alvo.closest('dialog:modal') ?? document.body;
    if (janela.parentElement !== camada) camada.append(janela);
    janela.hidden = false; alvo.setAttribute('aria-describedby', janela.id);
    const item = Boolean(idMochila || inspecionarItem || inspecionarColecionavel);
    const ancora = item ? alvo.querySelector('[data-ancora-inspecao]') ?? alvo : alvo;
    const caixa = ancora.getBoundingClientRect();
    const { esquerda, direita } = espacoLateralItem(caixa, innerWidth);
    const espaco = Math.floor(Math.max(esquerda, direita));
    janela.style.maxWidth = item && espaco >= 195 ? espaco + 'px' : '';
    const posicionar = item ? posicaoDetalhesItem : posicaoDetalhes;
    const pos = posicionar(caixa, janela.getBoundingClientRect(), innerWidth, innerHeight);
    janela.style.left = pos.x + 'px'; janela.style.top = pos.y + 'px';
  };
  const mostrar = el => {
    if (el === dispensado || arrastando) return;
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
  document.addEventListener('dragstart', () => { arrastando = true; esconder(); });
  document.addEventListener('dragend', () => { arrastando = false; });
  document.addEventListener('drop', () => { arrastando = false; }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { dispensado = alvo; esconder(); } });
  addEventListener('blur', esconder);
  addEventListener('resize', esconder);
  document.addEventListener('scroll', esconder, true);
  return snapshot => {
    estado = snapshot;
    // Evita dois balões simultâneos (o nativo do navegador e a janela do jogo).
    for (const el of document.querySelectorAll(':is(' + seletor + ')[title]')) el.removeAttribute('title');
    if (alvo) desenhar();
  };
}
