// Escada de transformações (decisão do Pedro, 11/11/2026): o jogador tem UMA transformação por vez na barra — a mais
// forte que o nível já liberou. Quando o Super Saiyajin libera, a Kaioken deixa de estar disponível; depois o
// A forma mais forte liberada ocupa um único botão de buff. A duração de Gogeta é limitada por CONFIG.transformacao.
import { CONFIG } from './config.mjs';

export const FORMAS = Object.freeze([
  { forma: 'kaioken', nome: 'Kaioken', nivel: CONFIG.skills.kaioken },
  { forma: 'ssj', nome: 'Super Saiyajin', nivel: CONFIG.skills.transform, icone: '/assets/skills/transformacoes/ssj1.png' },
  { forma: 'ssj2', nome: 'Super Saiyajin 2', nivel: CONFIG.skills.ssj2, icone: '/assets/skills/transformacoes/ssj2.png' },
  { forma: 'ssj3', nome: 'Super Saiyajin 3', nivel: CONFIG.skills.ssj3, icone: '/assets/skills/transformacoes/ssj3.png' },
  { forma: 'ssj4', nome: 'Super Saiyajin 4', nivel: CONFIG.skills.ssj4, icone: '/assets/skills/transformacoes/ssj4.png' },
  { forma: 'gogeta', nome: 'Gogeta', nivel: CONFIG.skills.gogeta, duracao: CONFIG.transformacao.gogetaDuracao, icone: '/assets/skills/transformacoes/gogeta.png' },
  { forma: 'vegito', nome: 'Vegetto', nivel: CONFIG.skills.vegito, icone: '/assets/skills/transformacoes/vegeto.png' }
]);
// A forma que o botão de transformação ativa neste nível (null antes da primeira).
export const formaDisponivel = level => FORMAS.filter(f => level >= f.nivel).at(-1) || null;
export const nomeDaForma = forma => FORMAS.find(f => f.forma === forma)?.nome || 'Forma base';

// Multiplicador do ataque por golpe e forma. Base, Kaioken (base × 1,4) e SSJ são os valores que já existiam;
// SSJ2 = SSJ × 1,5 e SSJ3 = SSJ2 × 1,5 (decisões do Pedro, 11–12/11/2026). Bônus não acumulam: uma forma por vez.
// No SSJ3 a tecla do Kamehameha vira o Ryuken (Punho do Dragão); o valor de 'kame' dele só vale até o Ryuken entrar.
const BASE = { soco: 1, rajada: 1.4, kame: 4.2, genki: 10 };
const SSJ = { soco: 1.5, rajada: 2.1, kame: 6, genki: 14 };
const vezes = (t, k) => Object.fromEntries(Object.entries(t).map(([g, v]) => [g, Math.round(v * k * 1000) / 1000]));
const SSJ2 = vezes(SSJ, 1.5);
const SSJ3 = vezes(SSJ2, 1.5), SSJ4 = vezes(SSJ3, 1.5), GOGETA = vezes(SSJ4, 1.5), VEGITO = vezes(GOGETA, 1.5);
export const DANO_DA_FORMA = Object.freeze({ base: BASE, kaioken: vezes(BASE, 1.4), ssj: SSJ, ssj2: SSJ2, ssj3: SSJ3, ssj4: SSJ4, gogeta: GOGETA, vegito: VEGITO });
export const multiplicadorDaForma = (forma, golpe) => (DANO_DA_FORMA[forma] || BASE)[golpe];
