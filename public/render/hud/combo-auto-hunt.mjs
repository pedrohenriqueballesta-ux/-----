import { comboPadrao, tecnicasDoCombo, minimoMobsPadrao, MAX_MINIMO_MOBS_COMBO } from '../../shared/tecnicas/combo-auto-hunt.mjs';
import { nivelDaTecnica, tecnicaPorId } from '../../shared/tecnicas/barra-tecnicas.mjs';
import { formasDaVocacao } from '../../shared/tecnicas/formas.mjs';

function botao(texto, rotulo, acao) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = texto;
  b.setAttribute('aria-label', rotulo);
  b.onclick = acao;
  return b;
}

export function instalarComboAutoHunt(painel, enviar) {
  const abas = [...painel.querySelectorAll('[data-auto-combo-aba]')];
  for (const aba of abas) aba.onclick = () => {
    for (const b of abas) {
      const ativa = b === aba;
      b.setAttribute('aria-pressed', String(ativa));
      document.getElementById(b.getAttribute('aria-controls')).hidden = !ativa;
    }
  };
  const form = painel.querySelector('#autoComboForm');
  const lista = form.querySelector('#autoComboOrdem');
  const adicionar = form.querySelector('#autoComboAdicionar');
  const buff = form.querySelector('#autoComboBuff');
  const buffMaisAlto = form.querySelector('#autoComboBuffMaisAlto');
  const reserva = form.querySelector('#autoComboReserva');
  const estado = form.querySelector('#autoComboEstado');
  let personagem, rascunho, salvando = false;

  function editado() {
    estado.textContent = '';
  }

  function desenharOrdem() {
    lista.replaceChildren(...rascunho.ordem.map(({ id, ki, minMobs }, i) => {
      const li = document.createElement('li');
      const nome = tecnicaPorId('skill:' + id).nome;
      const titulo = document.createElement('strong');
      titulo.textContent = nome;
      const minimo = document.createElement('label');
      minimo.className = 'auto-hunt-threshold';
      const input = document.createElement('input');
      Object.assign(input, { type: 'number', min: '0', max: '100', step: '1', required: true, value: String(ki) });
      input.setAttribute('aria-label', 'Ki mínimo para ' + nome);
      input.oninput = () => { rascunho.ordem[i].ki = input.valueAsNumber; editado(); };
      const percentual = document.createElement('span');
      percentual.className = 'auto-combo-percentual';
      percentual.append(input, '%');
      minimo.append('Ki mínimo', percentual);

      const minimoMobs = document.createElement('label');
      minimoMobs.className = 'auto-hunt-threshold';
      const seletorMobs = document.createElement('select');
      seletorMobs.setAttribute('aria-label', 'Mínimo de mobs para ' + nome);
      for (let quantidade = 1; quantidade <= MAX_MINIMO_MOBS_COMBO; quantidade++)
        seletorMobs.add(new Option(quantidade === 1 ? '1' : quantidade + '+', String(quantidade)));
      seletorMobs.value = String(minMobs ?? minimoMobsPadrao(id));
      seletorMobs.onchange = () => { rascunho.ordem[i].minMobs = Number(seletorMobs.value); editado(); };
      minimoMobs.append('Mobs próximos', seletorMobs);
      const mudarOrdem = destino => {
        const [linha] = rascunho.ordem.splice(i, 1);
        rascunho.ordem.splice(destino, 0, linha);
        desenharOrdem();
        editado();
        lista.children[destino].querySelector('button').focus();
      };
      const subir = botao('↑', 'Subir ' + nome, () => mudarOrdem(i - 1));
      const descer = botao('↓', 'Descer ' + nome, () => mudarOrdem(i + 1));
      subir.disabled = i === 0;
      descer.disabled = i === rascunho.ordem.length - 1;
      const remover = botao('×', 'Remover ' + nome, () => {
        rascunho.ordem.splice(i, 1);
        desenharOrdem();
        editado();
        adicionar.focus();
      });
      const controles = document.createElement('div');
      controles.className = 'auto-combo-controles';
      controles.append(subir, descer, remover);
      li.append(titulo, controles, minimo, minimoMobs);
      return li;
    }));
    const livres = tecnicasDoCombo(personagem.vocacao).filter(id => !rascunho.ordem.some(item => item.id === id));
    adicionar.replaceChildren(new Option('Adicionar técnica…', ''), ...livres.map(id => {
      const tecnica = tecnicaPorId('skill:' + id);
      return new Option(tecnica.nome + ' · Nv. ' + nivelDaTecnica(tecnica, personagem.vocacao), id);
    }));
    adicionar.disabled = !livres.length;
  }

  adicionar.onchange = () => {
    if (!adicionar.value) return;
    rascunho.ordem.push({ id: adicionar.value, ki: 0 });
    desenharOrdem();
    editado();
  };
  buff.oninput = reserva.oninput = editado;
  buffMaisAlto.onchange = () => {
    buff.disabled = buffMaisAlto.checked;
    editado();
  };
  form.onsubmit = async e => {
    e.preventDefault();
    if (!rascunho || salvando) return;
    const combo = {
      ordem: rascunho.ordem, buff: buff.value || null, buffMaisAlto: buffMaisAlto.checked, reserva: reserva.valueAsNumber
    };
    const id = personagem.id;
    const salvar = form.querySelector('[type=submit]');
    salvando = salvar.disabled = true;
    try {
      const r = await enviar({ type: 'configurarComboAutoHunt', combo });
      if (personagem.id !== id) return;
      estado.textContent = r?.ok
        ? (r.buffAplicado ? 'Configuração salva. Buff aplicado.' : 'Configuração salva.')
        : r?.reason || 'Não foi possível salvar o combo.';
    } catch (erro) {
      if (personagem.id === id) estado.textContent = erro.message;
    } finally {
      salvando = salvar.disabled = false;
    }
  };

  return (self, id) => {
    if (personagem?.id === id && personagem?.vocacao === self.vocacao && rascunho) return;
    personagem = { id, vocacao: self.vocacao };
    rascunho = structuredClone(self.comboAutoHunt ?? comboPadrao(self.vocacao));
    reserva.value = rascunho.reserva;
    buff.replaceChildren(new Option('Desativado', ''), ...formasDaVocacao(self.vocacao).map(forma =>
      new Option(forma.nome + ' · Nv. ' + forma.nivel, forma.forma)
    ));
    buff.value = rascunho.buff ?? '';
    buffMaisAlto.checked = Boolean(rascunho.buffMaisAlto);
    buff.disabled = buffMaisAlto.checked;
    estado.textContent = self.comboAutoHunt ? '' : 'Salve para ativar esta configuração.';
    desenharOrdem();
  };
}
