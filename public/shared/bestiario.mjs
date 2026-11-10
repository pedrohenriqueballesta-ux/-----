import { PLANETS, areaPorId } from './config.mjs';
import { mobStats, TEMPO_CHEFE_RARO } from './enemies.mjs';
import { SOCA_E_ATIRA } from './game.mjs';
import { RECOMPENSAS_MOBS } from './recompensas-mobs.mjs';

// Usa as espécies cadastradas no mundo, inclusive os chefes que ainda não nasceram.
// Atributos vêm da ficha base, nunca da vida/dano temporário do mob em combate.
export function criarBestiario(inimigos) {
  const vistos = new Set();
  return [...inimigos].filter(m => {
    const id = m.area + ':' + m.type;
    if (!areaPorId(m.area) || vistos.has(id)) return false;
    vistos.add(id); return true;
  }).map(m => {
    const z = areaPorId(m.area), atributos = mobStats(m.type, m.area), raro = Boolean(m.raro);
    const respawn = TEMPO_CHEFE_RARO[m.type];
    const categoria = raro ? 'Chefe raro' : m.type === 'subboss' ? 'Subchefe' : 'Comum';
    const ataques = m.type === 'neva' ? 'Magia da mão de curto alcance e rajada de Ki TARGET' : m.type === 'freezaBoss' ? 'Death Beam; Supernova na forma de nave' : m.type === 'oozaruDourado' ? 'Pancada em área e bola de energia negra' : m.type === 'subboss' ? 'Golpe em área' : SOCA_E_ATIRA.has(m.type) || m.type === 'veterano' ? 'Corpo a corpo e projéteis de Ki TARGET' : 'Corpo a corpo';
    return { id:m.area + ':' + m.type, tipo:m.type, nome:atributos.name, area:m.area, local:z.name,
      planeta:z.planet, nomePlaneta:PLANETS[z.planet].name, recomendado:[...z.nivel], categoria, raro,
      hp:atributos.hp, ataque:atributos.attack, defesa:atributos.defesa, xp:atributos.xp, velocidade:atributos.speed,
      agressivo:atributos.agressivo, aggro:atributos.aggro, perseguicao:atributos.perseguicao, ataques,
      renascimento:respawn ? [respawn.minimo,respawn.maximo] : m.type === 'subboss' ? [60,60] : [12,12],
      zeni:raro ? [RECOMPENSAS_MOBS.zeniChefe,RECOMPENSAS_MOBS.zeniChefe] : [RECOMPENSAS_MOBS.zeniMinimo,RECOMPENSAS_MOBS.zeniMinimo+RECOMPENSAS_MOBS.zeniVariacao-1],
      drops:[{item:'scrap',nome:'Sucata',fracaoLoot:1-RECOMPENSAS_MOBS.fracaoCristal},
        {item:'crystal',nome:'Cristal',fracaoLoot:RECOMPENSAS_MOBS.fracaoCristal},
        {item:'seed15',nome:'Semente dos Deuses 15%',chance:RECOMPENSAS_MOBS.chanceSemente15}],
      observacoes:[...(atributos.projetil ? ['Projétil TARGET: segue o jogador e acerta enquanto o alvo estiver vivo e válido. Safe zones e troca de área cancelam o ataque.'] : []),...(raro ? ['Chefe raro: a faixa recomendada é da hunt. Pode exigir grupo, equipamento e nível superior.'] : []),
        ...(atributos.nave ? ['Ao chegar a 40% do HP, Freeza entra na nave: ataque ×1,35, defesa ×1,25 e velocidade ×0,8.'] : [])]
    };
  }).sort((a,b) => a.recomendado[0]-b.recomendado[0] || Number(a.raro)-Number(b.raro) || a.nome.localeCompare(b.nome,'pt-BR'));
}
