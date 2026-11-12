// Escada de transformações (decisão do Pedro, 11/11/2026): o jogador tem UMA transformação por vez na barra — a mais
// forte que o nível já liberou. Quando o Super Saiyajin libera, a Kaioken deixa de estar disponível; depois o
// Super Saiyajin 2 substitui o Super Saiyajin, e o Super Saiyajin 3 substitui o 2 (12/11/2026). Ativar é grátis, sem recarga, e drena Ki (CONFIG.transformacao).
import { CONFIG } from './config.mjs';

export const FORMAS = Object.freeze([
  { forma: 'kaioken', nome: 'Kaioken', nivel: CONFIG.skills.kaioken },
  { forma: 'ssj', nome: 'Super Saiyajin', nivel: CONFIG.skills.transform },
  { forma: 'ssj2', nome: 'Super Saiyajin 2', nivel: CONFIG.skills.ssj2 },
  { forma: 'ssj3', nome: 'Super Saiyajin 3', nivel: CONFIG.skills.ssj3 }
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
export const DANO_DA_FORMA = Object.freeze({ base: BASE, kaioken: vezes(BASE, 1.4), ssj: SSJ, ssj2: SSJ2, ssj3: vezes(SSJ2, 1.5) });
export const multiplicadorDaForma = (forma, golpe) => (DANO_DA_FORMA[forma] || BASE)[golpe];
