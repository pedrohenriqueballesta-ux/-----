const campos = {
  'skill:basic': 'basicRemaining',
  'skill:ki': 'shotRemaining',
  'skill:dash': 'dashRemaining',
  'skill:kame': 'kameRemaining',
  'skill:galick': 'galickRemaining',
  'skill:finalFlash': 'finalFlashRemaining',
  'skill:bigBangAttack': 'bigBangAttackRemaining',
  'skill:barrier': 'barrierRemaining',
  'skill:genki': 'genkiRemaining',
  'skill:ryuken': 'ryukenRemaining',
  'skill:superKamehameha': 'superKameRemaining'
};

export function recargaConsumivel(estado, item) {
  if (item === 'food') return Math.max(0, (estado?.foodRemaining ?? 0) - 1);
  if (item === 'ki') return estado?.kiRemaining ?? 0;
  return item?.startsWith('seed') ? estado?.seedRemaining ?? 0 : 0;
}

export function recargaTecnica(estado, id) {
  if (id?.startsWith('item:')) return recargaConsumivel(estado, id.slice(5));
  if (id === 'skill:heal') return estado?.cura?.remaining ?? 0;
  return estado?.[campos[id]] ?? 0;
}

export function atualizarContadorRecarga(icone, segundos) {
  let contador = icone.querySelector(':scope > .contador-recarga');
  if (segundos <= 0) {
    contador?.remove();
    return;
  }
  if (!contador) {
    contador = document.createElement('span');
    contador.className = 'contador-recarga';
    contador.setAttribute('aria-hidden', 'true');
    icone.append(contador);
  }
  const texto = (segundos < 1 ? (Math.ceil(segundos * 10) / 10).toFixed(1).replace('.', ',') : Math.ceil(segundos)) + 's';
  if (contador.textContent !== texto) contador.textContent = texto;
}
