// Inimigos do protótipo e onde eles aparecem no mapa.
// Para ajustar atributos ou adicionar um inimigo, mexa só neste arquivo.

import { ZONES, naEscala } from './config.mjs';
import { podeAndar } from './passagem.mjs';

// Quem aparece em cada hunt (decisão do Pedro, 03/11/2026): na inicial só os mobs básicos; na média,
// as sentinelas e um subchefe; na difícil, o chefe e os demais mobs, mais fortes.
// Os NÚMEROS são provisórios, à espera de balanceamento: cada hunt repete, para a faixa de nível
// recomendada dela, a proporção das Planícies no nível 1 (golpes para derrubar, dano recebido e
// mortes por nível). Arte também provisória: básico = Saibaman, sentinela = alienígena,
// subchefe = sentinela grande, chefe = Freeza (a lore pede namekuseijins e o Piccolo de chefe).
const ATRIBUTOS = {
  inicial: {
    melee: { hp: 42, attack: 8, xp: 10, defesa: 1, speed: 115, name: 'Saibaman' }
  },
  media: {
    ranged: { hp: 230, attack: 26, xp: 45, defesa: 5, speed: 108, name: 'Sentinela alienígena' },
    subboss: { hp: 1800, attack: 45, xp: 400, defesa: 8, speed: 95, name: 'Comandante Sentinela · Subchefe' }
  },
  dificil: {
    melee: { hp: 380, attack: 42, xp: 90, defesa: 10, speed: 115, name: 'Saibaman de elite' },
    ranged: { hp: 320, attack: 38, xp: 90, defesa: 10, speed: 108, name: 'Sentinela de elite' },
    boss: { hp: 4500, attack: 70, xp: 1500, defesa: 14, speed: 80, name: 'Freeza · Chefe' }
  }
};
// Tipo que não existe na área (testes, mob avulso) usa a versão da hunt inicial ou da primeira que o tem.
export function mobStats(type, area = 'inicial') {
  const base = ATRIBUTOS[area]?.[type] || Object.values(ATRIBUTOS).find(a => a[type])?.[type] || ATRIBUTOS.inicial.melee;
  return { ...base };
}
// Segundos até o mob voltar depois de derrotado.
export const renasceEm = type => type === 'boss' ? 75 : type === 'subboss' ? 60 : 12;

// Pontos de nascimento dos inimigos: uma grade dentro de cada área, ficando só os pontos
// em terra firme (máscara de passagem) e com folga da água. O sorteio só desloca cada ponto
// um pouco, então funciona até com aleatoriedade fixa (testes). A grade acompanha a escala do
// mundo; a folga da água (24) é do tamanho do mob e não cresce.
const em_terra = (area, x, y) => [[0, 0], [24, 0], [-24, 0], [0, 24], [0, -24]].every(([dx, dy]) => podeAndar('namek', x + dx, y + dy, area));
function espalhar(random, area, n, tipo) {
  const z = ZONES.find(z => z.id === area), candidatos = [];
  const passo = naEscala(170), margem = naEscala(90), fim = naEscala(60), sorteio = naEscala(60);
  for (let y = z.y + margem; y < z.y + z.h - fim; y += passo) for (let x = z.x + margem; x < z.x + z.w - fim; x += passo) {
    const px = x + (random() - 0.5) * sorteio, py = y + (random() - 0.5) * sorteio;
    if (em_terra(area, px, py)) candidatos.push({ x: px, y: py });
  }
  // Pega n pontos bem distribuídos ao longo da lista (em vez dos n primeiros, que ficariam todos no topo).
  const salto = Math.max(1, candidatos.length / n);
  return Array.from({ length: Math.min(n, candidatos.length) }, (_, i) => ({ ...candidatos[Math.floor(i * salto)], type: tipo(i), area }));
}
// Quantidade de mobs por hunt: provisória (a densidade será decidida com o modelo montado).
export function spawnPoints(random) {
  return [
    ...espalhar(random, 'inicial', 16, () => 'melee'),
    ...espalhar(random, 'media', 10, () => 'ranged'),
    // Subchefe na cratera grande do Campo de Batalha; chefe no centro da arena do Planalto.
    { type: 'subboss', x: naEscala(3330), y: naEscala(2280), area: 'media' },
    ...espalhar(random, 'dificil', 10, i => i % 3 === 0 ? 'ranged' : 'melee'),
    { type: 'boss', x: naEscala(4070), y: naEscala(1150), area: 'dificil' }
  ];
}
