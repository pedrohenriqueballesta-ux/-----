import { PLANETS, areaPorId } from '../nucleo/config.mjs';
import { mobStats, janelaRenascimento, TIPOS_CHEFE } from '../nucleo/enemies.mjs';
import { chaveBestiario, metaDrops, abatesDeChefeUnico } from './progresso-bestiario.mjs';
import { SOCA_E_ATIRA } from '../nucleo/game.mjs';
import { NOVOS_ITENS, dropsEspecificos } from './catalogo-itens.mjs';
import { RECOMPENSAS_MOBS, faixaZeniMob, fracaoCristalAzul } from './recompensas-mobs.mjs';

// Usa as espécies cadastradas no mundo, inclusive os chefes que ainda não nasceram.
// Atributos vêm da ficha base, nunca da vida/dano temporário do mob em combate.
export function criarBestiario(inimigos) {
  const vistos = new Set();
  return [...inimigos].filter(m => {
    const id = chaveBestiario(m);
    if (!areaPorId(m.area) || vistos.has(id)) return false;
    vistos.add(id); return true;
  }).map(m => {
    const z = areaPorId(m.area), atributos = mobStats(m.type, m.area), raro = Boolean(m.raro);
    const fracaoCristal = fracaoCristalAzul(m.type);
    const respawn = janelaRenascimento(m.type, m.area);
    const categoria = raro ? 'Chefe raro' : TIPOS_CHEFE.has(m.type) ? 'Subchefe' : 'Comum';
    const ataques = m.type === 'neva' ? 'Magia da mão de curto alcance e rajada de Ki TARGET' : m.type === 'freezaBoss' ? 'Death Beam; Supernova na forma de nave' : m.type === 'oozaruDourado' ? 'Pancada em área e bola de energia negra' : m.type === 'subboss' ? 'Golpe em área' : SOCA_E_ATIRA.has(m.type) || m.type === 'veterano' ? 'Corpo a corpo e projéteis de Ki TARGET' : 'Corpo a corpo';
    return { id:chaveBestiario(m), abatesParaDrops:metaDrops(m), tipo:m.type, nome:atributos.name, area:m.area, local:z.name,
      planeta:z.planet, nomePlaneta:PLANETS[z.planet].name, nivel:atributos.level, recomendado:[...z.nivel], categoria, raro,
      hp:atributos.hp, ataque:atributos.attack, defesa:atributos.defesa, xp:atributos.xp, velocidade:atributos.speed,
      agressivo:atributos.agressivo, aggro:atributos.aggro, perseguicao:atributos.perseguicao, ataques,
      renascimento:[respawn.minimo, respawn.maximo],
      zeni:faixaZeniMob(atributos.level, raro),
      drops:[{item:'scrap',nome:'Sucata',fracaoLoot:1-fracaoCristal},
        {item:'cristal-azul',nome:NOVOS_ITENS['cristal-azul'].nome,fracaoLoot:fracaoCristal},
        {item:'seed15',nome:'Semente dos Deuses 15%',chance:RECOMPENSAS_MOBS.chanceSemente15}, ...dropsEspecificos(m.type)],
      observacoes:[...(atributos.projetil ? ['Projétil TARGET: segue o jogador e acerta enquanto o alvo estiver vivo e válido. Safe zones e troca de área cancelam o ataque.'] : []),...(raro ? ['Chefe raro: a faixa recomendada é da hunt. Pode exigir grupo, equipamento e nível superior.'] : []),
        ...(atributos.nave ? ['Ao chegar a 40% do HP, Freeza entra na nave: ataque ×1,35, defesa ×1,25 e velocidade ×0,8.'] : [])]
    };
  }).sort((a,b) => a.recomendado[0]-b.recomendado[0] || Number(a.raro)-Number(b.raro) || a.nome.localeCompare(b.nome,'pt-BR'));
}

export function bestiarioDoPersonagem(catalogo, p) {
  return catalogo.map(ficha => {
    const { id, tipo, nome, local, planeta, nomePlaneta, recomendado, abatesParaDrops, drops, ...atributos } = ficha;
    const abates = Math.min(abatesParaDrops, Math.max(p.bestiarioAbates[id] ?? 0, abatesDeChefeUnico(p, id)));
    const resumo = { id, tipo, nome, local, planeta, nomePlaneta, recomendado, abatesParaDrops, abates };
    if (!abates) return resumo;
    return { ...resumo, ...atributos, ...(abates >= abatesParaDrops ? { drops } : {}) };
  });
}
