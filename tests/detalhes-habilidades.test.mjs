import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../public/shared/config.mjs';
import { CURA } from '../public/shared/cura.mjs';
import { detalhesHabilidade, posicaoDetalhes } from '../public/render/detalhes-habilidades.mjs';
const estado = { level: 50, inventory: { ki: 3, seed30: 2, food: 1 }, seedSelected: 30 };
const campos = detalhe => Object.fromEntries(detalhe.linhas);

test('detalhes das skills seguem configuração e progressão, inclusive cura de 0,7s', () => {
  for (const chave of ['kame','kaioken','barrier','transform','genki']) {
    const dados = campos(detalhesHabilidade(chave, estado));
    assert.equal(dados.Desbloqueia, 'Nível ' + CONFIG.skills[chave]);
    assert.equal(dados.Custo, CONFIG.skillCosts[chave] + ' Ki');
    assert.equal(dados.Cooldown, CONFIG.skillCooldowns[chave] + ' s');
  }
  const cura = campos(detalhesHabilidade('heal', estado));
  assert.equal(cura.Cooldown, CURA.cooldown.toLocaleString('pt-BR') + ' s');
  assert.equal(cura.Custo, '14 Ki'); assert.equal(cura.Cura, '3% do HP máximo');
  assert.match(campos(detalhesHabilidade('genki', {...estado,level:1})).Estado, /Bloqueada/);
  assert.match(campos(detalhesHabilidade('kame', {...estado,kameRemaining:2.3})).Estado, /2,3 s/);
});

test('consumíveis informam potência, estoque, recarga compartilhada e ausência de custo de Ki', () => {
  for (const potencia of CONFIG.seedPotencies) {
    const dados = campos(detalhesHabilidade('seed' + potencia, estado));
    assert.equal(dados.Custo, '1 unidade · 0 Ki');
    assert.match(dados.Cooldown, new RegExp('^' + CONFIG.seedCooldown + ' s'));
    assert.equal(dados.Efeito, 'Recupera ' + potencia + '% do HP máximo');
  }
  assert.equal(campos(detalhesHabilidade('seed30', estado)).Estoque, '2 unidades');
  assert.equal(campos(detalhesHabilidade('ki', {...estado, inventory:{}})).Estado, 'Sem estoque');
  assert.match(campos(detalhesHabilidade('food', {...estado,foodRemaining:20})).Estado, /Efeito ativo/);
  assert.equal(detalhesHabilidade('scrap', estado), null);
  assert.equal(detalhesHabilidade('heal', null), null);
});

test('janela fica acima da barra e se mantém dentro das bordas em HUDs reposicionadas', () => {
  const tamanho = {width:280,height:260};
  for (const [largura,altura,alvo] of [
    [1400,900,{left:500,top:790,bottom:880,width:84}],
    [1400,900,{left:0,top:0,bottom:70,width:84}],
    [320,568,{left:280,top:500,bottom:560,width:40}]
  ]) {
    const p = posicaoDetalhes(alvo,tamanho,largura,altura);
    assert.ok(p.x >= 8 && p.x + tamanho.width <= largura - 8);
    assert.ok(p.y >= 8 && p.y + tamanho.height <= altura - 8);
    if (alvo.top >= 272) assert.ok(p.y + tamanho.height < alvo.top);
  }
});
