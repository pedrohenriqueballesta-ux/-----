import { instalarCatalogoItens } from './catalogo-itens-hud.mjs';
import { GODMODE_PADRAO } from '../../shared/nucleo/characters.mjs';
import { marcarItemInspecionavel, nomeComRaridade } from './hud-elementos.mjs';
import { ITENS_NEGOCIAVEIS } from '../../shared/sistemas/itens-negociaveis.mjs';
import { CONFIG, areaPorId } from '../../shared/nucleo/config.mjs';
import { CHEFES_TESTE, mobStats } from '../../shared/nucleo/enemies.mjs';

const $ = id => document.getElementById(id);
const criar = (tag, classe, texto = null) => {
  const el = document.createElement(tag);
  if (classe) el.className = classe;
  if (texto != null) el.textContent = texto;
  return el;
};

export function instalarGodmodeHud(acao) {
  const janela = $('godmodeDialog'), grade = $('godmodeItems');
  if (!janela || !grade) return { atualizar() {} };
  const opcoes = ['hpInfinite', 'kiInfinite', 'zeniInfinite', 'capacityInfinite', 'cooldownNormal', 'velocidadeMaxima'];
  const botaoAplicar = $('godmodeApply'), botaoLimpar = $('godmodeLimparEfeitos');
  let limpando = false;
  botaoLimpar?.addEventListener('click', async () => {
    if (limpando || !confirm('Remover a poção de XP, a comida e o extensor deste personagem, além do VIP da conta?')) return;
    limpando = true;
    botaoLimpar.disabled = true;
    try {
      const resultado = await acao({ type: 'godmodeLimparEfeitos' });
      if (resultado?.ok) $('godmodeStatus').textContent = 'Efeitos de itens removidos do personagem. VIP da conta removido.';
      else avisarFalha(resultado);
    } catch (erro) {
      $('godmodeStatus').textContent = erro.message || 'Não foi possível limpar os efeitos.';
    } finally {
      limpando = false;
    }
  });
  const valor = key => $(key).checked;
  const lerOpcoes = () => ({ level: Number($('godmodeLevel').value), ...Object.fromEntries(opcoes.map(key => [key, valor(key)])) });
  const iguais = (a, b) => !!a && !!b && ['level', ...opcoes].every(key => a[key] === b[key]);
  let alteracoesPendentes = false, aplicando = false, revisao = 0, aguardandoSnapshot = null;
  const avisarFalha = resultado => { if (resultado && !resultado.ok) $('godmodeStatus').textContent = resultado.reason || 'A ação de teste não foi concluída.'; };
  const marcarAlteracao = () => {
    revisao++;
    alteracoesPendentes = true;
    botaoAplicar.disabled = aplicando;
    $('godmodeStatus').textContent = 'Alterações pendentes · clique em Aplicar para confirmar.';
  };
  const mostrarOpcoes = options => {
    $('godmodeLevel').value = String(options.level);
    $('godmodeLevelInput').value = String(options.level);
    $('godmodeLevelValue').textContent = String(options.level);
    for (const key of opcoes) $(key).checked = options[key] ?? GODMODE_PADRAO[key];
  };
  const enviarConfig = async () => {
    const options = lerOpcoes();
    if (!Number.isSafeInteger(options.level) || options.level < 1 || options.level > CONFIG.progression.nivelMaximo) {
      $('godmodeStatus').textContent = 'Escolha um nível entre 1 e ' + CONFIG.progression.nivelMaximo + '.';
      return false;
    }
    const revisaoEnviada = revisao;
    aplicando = true; botaoAplicar.disabled = true; botaoAplicar.textContent = 'Aplicando…';
    $('godmodeStatus').textContent = 'Aplicando configuração…';
    try {
      const resultado = await acao({ type: 'godmodeConfig', options });
      if (!resultado?.ok) {
        avisarFalha(resultado);
        return false;
      }
      aguardandoSnapshot = options;
      if (revisao === revisaoEnviada) {
        alteracoesPendentes = false;
        $('godmodeStatus').textContent = 'Configuração aplicada · nível ' + options.level + '.';
      }
      return true;
    } catch (erro) {
      $('godmodeStatus').textContent = erro.message || 'Não foi possível aplicar as opções.';
      return false;
    } finally {
      aplicando = false; botaoAplicar.textContent = 'Aplicar';
      botaoAplicar.disabled = !alteracoesPendentes;
    }
  };

  const selecionarAba = nome => {
    for (const botao of janela.querySelectorAll('[data-godmode-tab]')) {
      const ativa = botao.dataset.godmodeTab === nome;
      botao.classList.toggle('ativa', ativa); botao.setAttribute('aria-selected', String(ativa));
    }
    $('godmodeConfigPanel').hidden = nome !== 'config';
    $('godmodeItemsPanel').hidden = nome !== 'items';
    $('godmodeBossesPanel').hidden = nome !== 'bosses';
  };
  for (const botao of janela.querySelectorAll('[data-godmode-tab]')) botao.addEventListener('click', () => selecionarAba(botao.dataset.godmodeTab));
  $('godmodeToolbarSettings')?.addEventListener('click', () => { if (!janela.open) janela.showModal(); });
  $('godmodePanelToggle')?.addEventListener('click', async () => {
    if (alteracoesPendentes && !await enviarConfig()) return;
    const resultado = await acao({ type: 'godmode' });
    avisarFalha(resultado);
  });
  $('godmodeLevel').max = String(CONFIG.progression.nivelMaximo);
  $('godmodeLevelInput').max = String(CONFIG.progression.nivelMaximo);
  $('godmodeLevel').addEventListener('input', () => {
    $('godmodeLevelInput').value = $('godmodeLevel').value;
    $('godmodeLevelValue').textContent = $('godmodeLevel').value;
    marcarAlteracao();
  });
  $('godmodeLevelInput').addEventListener('input', () => {
    const n = Number($('godmodeLevelInput').value);
    if (Number.isSafeInteger(n) && n >= 1 && n <= CONFIG.progression.nivelMaximo) {
      $('godmodeLevel').value = String(n); $('godmodeLevelValue').textContent = String(n);
    }
    marcarAlteracao();
  });
  botaoAplicar.addEventListener('click', enviarConfig);
  for (const key of opcoes) $(key).addEventListener('change', marcarAlteracao);

  const bossSelect = $('godmodeBossSelect'), bossButton = $('godmodeSpawnBoss'), bossStatus = $('godmodeBossStatus');
  for (const boss of CHEFES_TESTE) {
    const option = criar('option', null, mobStats(boss.type, boss.area).name + ' · ' + areaPorId(boss.area).name);
    option.value = boss.type; bossSelect.append(option);
  }
  bossButton.addEventListener('click', async () => {
    bossButton.disabled = true;
    try {
      const result = await acao({ type:'godmodeSpawnBoss', boss:bossSelect.value });
      bossStatus.textContent = result?.ok ? 'Chefe invocado no local habitual.' : result?.reason || 'Não foi possível invocar o chefe.';
    } catch (erro) { bossStatus.textContent = erro.message || 'Não foi possível invocar o chefe.'; }
    finally { bossButton.disabled = false; }
  });

  let godmodeAtivo = false;
  const botoesAdicionar = [];
  const criarCard = item => {
    const card = criar('article', 'godmode-item'); card.dataset.godmodeItem = item.id;
    marcarItemInspecionavel(card, item.id);
    const img = criar('img', 'godmode-item-icon'); img.src = item.icone; img.alt = ''; img.loading = 'lazy'; img.dataset.ancoraInspecao = '';
    const nome = nomeComRaridade(criar('strong', 'godmode-item-name', item.nome), item.id);
    const peso = criar('small', 'godmode-item-weight', 'Peso unitário · ' + item.peso.toLocaleString('pt-BR') + ' kg');
    const qtd = criar('input', 'godmode-item-quantity'); qtd.type = 'number'; qtd.min = '1'; qtd.max = '9999'; qtd.step = '1'; qtd.value = '1';
    qtd.setAttribute('aria-label', 'Quantidade de ' + item.nome);
    const pegar = criar('button', 'godmode-item-grant', 'Adicionar'); pegar.type = 'button';
    pegar.disabled = !godmodeAtivo;
    botoesAdicionar.push(pegar);
    pegar.addEventListener('click', async () => {
      const quantidade = Number(qtd.value);
      if (!Number.isSafeInteger(quantidade) || quantidade < 1 || quantidade > 9999) {
        $('godmodeStatus').textContent = 'Informe uma quantidade entre 1 e 9.999.'; return;
      }
      pegar.disabled = true; pegar.textContent = 'Adicionando…';
      try { avisarFalha(await acao({ type: 'godmodeGrantItem', item: item.id, quantidade })); }
      catch (erro) { $('godmodeStatus').textContent = erro.message || 'Não foi possível adicionar o item.'; }
      finally { pegar.disabled = !godmodeAtivo; pegar.textContent = 'Adicionar'; }
    });
    card.append(img, nome, peso, qtd, pegar);
    return card;
  };
  const mostrarItens = instalarCatalogoItens({ grade, itens:Object.values(ITENS_NEGOCIAVEIS), criarCard });
  mostrarItens();

  return {
    atualizar(estado) {
      if (!estado) return;
      $('godmodeToggle').querySelector('b').textContent = estado.godmode ? 'ON' : 'OFF';
      $('godmodeToggle').classList.toggle('ligado', estado.godmode);
      if (botaoLimpar) {
        botaoLimpar.hidden = !estado.beneficiosDeTeste;
        botaoLimpar.disabled = !estado.godmode || limpando || estado.hp <= 0;
      }
      $('godmodePanelToggle').textContent = estado.godmode ? 'Desligar God Mode' : 'Ligar God Mode';
      $('godmodeModeStatus').textContent = estado.godmode ? 'Ativo · alterações só afetam este personagem em modo de teste.' : 'Desligado · configure as opções e ative para testar.';
      const options = { ...GODMODE_PADRAO, ...estado.godmodeOptions };
      $('godmodeLevel').max = String(estado.godmodeLevelMax || CONFIG.progression.nivelMaximo);
      $('godmodeLevelInput').max = $('godmodeLevel').max;
      if (aguardandoSnapshot && iguais(options, aguardandoSnapshot)) aguardandoSnapshot = null;
      if (!alteracoesPendentes && !aguardandoSnapshot) mostrarOpcoes(options);
      botaoAplicar.disabled = aplicando || !alteracoesPendentes;
      if (godmodeAtivo !== estado.godmode) {
        godmodeAtivo = estado.godmode;
        for (const btn of botoesAdicionar) btn.disabled = !godmodeAtivo || btn.textContent === 'Adicionando…';
      }
      $('godmodeItemHint').textContent = estado.godmode ? 'Escolha a quantidade e adicione diretamente à mochila de teste.' : 'Ative o God Mode para conceder itens.';
      bossButton.disabled = !estado.godmode;
    }
  };
}
