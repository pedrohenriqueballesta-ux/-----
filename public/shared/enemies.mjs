// Inimigos do protótipo e onde eles aparecem no mapa.
// Para ajustar atributos ou adicionar um inimigo, mexa só neste arquivo.

import { ZONES, naEscala } from './config.mjs';
import { podeAndar } from './passagem.mjs';

// Quem aparece em cada hunt (decisão do Pedro, 03/11/2026): na inicial só os mobs básicos (Pássaro e
// Inseto de Namek, metade de cada, os dois atacando de perto); na média (decisão de 03/11), metade Guerreiros
// de Namek (de perto) e metade Veteranos de Namek (de longe e de perto), mais o subchefe; antes eram
// as sentinelas e um subchefe; na difícil, o chefe e os demais mobs, mais fortes.
// Os NÚMEROS são provisórios, à espera de balanceamento: cada hunt repete, para a faixa de nível
// recomendada dela, a proporção das Planícies no nível 1 (golpes para derrubar, dano recebido e
// mortes por nível). Arte também provisória: básico = Saibaman, sentinela = alienígena,
// subchefe = sentinela grande (provisório); chefe da hunt difícil = Porunga BOSS (folhas definitivas).
const ATRIBUTOS = {
  inicial: {
    passaro: { hp: 42, attack: 8, xp: 10, defesa: 1, speed: 115, name: 'Pássaro de Namek' },
    inseto: { hp: 42, attack: 8, xp: 10, defesa: 1, speed: 115, name: 'Inseto de Namek' },
    melee: { hp: 42, attack: 8, xp: 10, defesa: 1, speed: 115, name: 'Saibaman' }
  },
  media: {
    guerreiro: { hp: 210, attack: 17, xp: 45, defesa: 5, speed: 112, name: 'Guerreiro de Namek' },
    // Veterano de Namek: ataca de longe (rajada de ki) e de perto (soco).
    veterano: { hp: 190, attack: 16, xp: 45, defesa: 5, speed: 108, name: 'Veterano de Namek' },
    ranged: { hp: 200, attack: 17, xp: 45, defesa: 5, speed: 108, name: 'Sentinela alienígena' },
    subboss: { hp: 1800, attack: 45, xp: 400, defesa: 8, speed: 95, name: 'Comandante Sentinela · Subchefe' }
  },
  dificil: {
    // Porunga (decisão do Pedro, 03/11): o mob mais fraco da hunt difícil, voa e ataca de perto (garra).
    porunga: { hp: 380, attack: 33, xp: 90, defesa: 10, speed: 115, name: 'Porunga' },
    melee: { hp: 380, attack: 33, xp: 90, defesa: 10, speed: 115, name: 'Saibaman de elite' },
    ranged: { hp: 320, attack: 30, xp: 90, defesa: 10, speed: 108, name: 'Sentinela de elite' },
    // Chefe raro do Planalto (decisão do Pedro, 03/11): voa, ataque de perto por enquanto, 3× o Goku.
    boss: { hp: 12000, attack: 85, xp: 1500, defesa: 14, speed: 80, name: 'Porunga BOSS' }
  }
};
// Tipo que não existe na área (testes, mob avulso) usa a versão da hunt inicial ou da primeira que o tem.
export function mobStats(type, area = 'inicial') {
  const base = ATRIBUTOS[area]?.[type] || Object.values(ATRIBUTOS).find(a => a[type])?.[type] || ATRIBUTOS.inicial.melee;
  return { ...base };
}
// Segundos até o mob voltar depois de derrotado.
// Chefe raro (decisão do Pedro, 03/11): volta num tempo sorteado entre 45 e 90 minutos.
export const CHEFE_RARO = { minimo: 45 * 60, maximo: 90 * 60 };
export const renasceEm = (type, random = Math.random) => type === 'boss'
  ? CHEFE_RARO.minimo + random() * (CHEFE_RARO.maximo - CHEFE_RARO.minimo) : type === 'subboss' ? 60 : 12;
// Círculo do Planalto do Porunga onde o chefe raro nasce, num ponto sorteado (px da imagem → mundo).
export const CIRCULO_DO_CHEFE = { x: naEscala(4065), y: naEscala(1150), r: naEscala(190) };
export function pontoNoCirculo(random) {
  for (let i = 0; i < 40; i++) {
    const a = random() * Math.PI * 2, d = Math.sqrt(random()) * CIRCULO_DO_CHEFE.r;
    const x = CIRCULO_DO_CHEFE.x + Math.cos(a) * d, y = CIRCULO_DO_CHEFE.y + Math.sin(a) * d;
    if (em_terra('dificil', x, y)) return { x, y };
  }
  return { x: CIRCULO_DO_CHEFE.x, y: CIRCULO_DO_CHEFE.y };
}

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
// Quantidade de mobs por hunt: na inicial, 20 (16 + 25%, pedido do Pedro, 03/11); nas outras, 16
// comuns, provisório (a densidade será decidida pelo Pedro com o modelo montado).
export function spawnPoints(random) {
  return [
    ...espalhar(random, 'inicial', 20, i => i % 2 ? 'inseto' : 'passaro'),
    ...espalhar(random, 'media', 16, i => i % 2 ? 'veterano' : 'guerreiro'),
    // Subchefe na cratera grande do Campo de Batalha; chefe no centro da arena do Planalto.
    { type: 'subboss', x: naEscala(3330), y: naEscala(2280), area: 'media' },
    // Planalto do Porunga: só Porungas (decisão do Pedro, 03/11) e o chefe raro no círculo.
    ...espalhar(random, 'dificil', 16, () => 'porunga'),
    { type: 'boss', ...pontoNoCirculo(random), area: 'dificil', raro: true }
  ];
}
