// Uma forma ativa por vez. A barra pode equipar qualquer forma desbloqueada;
// o atalho "melhor transformação" mantém o comportamento automático antigo.
// A duração de Gogeta é limitada por CONFIG.transformacao.
import { CONFIG } from '../nucleo/config.mjs';

export const FORMAS = Object.freeze([
  { forma: 'kaioken', nome: 'Kaioken', nivel: CONFIG.skills.kaioken, vocacoes: ['goku'] },
  { forma: 'ssj', nome: 'Super Saiyajin', nivel: CONFIG.skills.transform, vocacoes: ['goku', 'vegeta'], icone: '/assets/skills/transformacoes/ssj1.png', icones: { vegeta: '/assets/skills/transformacoes/vegeta/ssj1.png' } },
  { forma: 'ssj2', nome: 'Super Saiyajin 2', nivel: CONFIG.skills.ssj2, vocacoes: ['goku'], icone: '/assets/skills/transformacoes/ssj2.png', icones: { vegeta: '/assets/skills/transformacoes/vegeta/ssj2.png' } },
  { forma: 'ssj3', nome: 'Super Saiyajin 3', nivel: CONFIG.skills.ssj3, vocacoes: ['goku'], icone: '/assets/skills/transformacoes/ssj3.png' },
  { forma: 'majin', nome: 'Majin Vegeta', nivel: CONFIG.skills.majin, vocacoes: ['vegeta'], icone: '/assets/skills/transformacoes/vegeta/majin.png' },
  { forma: 'ssj4', nome: 'Super Saiyajin 4', nivel: CONFIG.skills.ssj4, niveis: { vegeta: CONFIG.skills.ssj4Vegeta }, vocacoes: ['goku', 'vegeta'], icone: '/assets/skills/transformacoes/ssj4.png', icones: { vegeta: '/assets/skills/transformacoes/vegeta/ssj4.png' } },
  { forma: 'ssjGod', nome: 'Super Saiyajin God', nivel: CONFIG.skills.ssjGod, vocacoes: ['vegeta'], icone: '/assets/skills/transformacoes/vegeta/vegeta_ssj_god.png' },
  { forma: 'gogeta', nome: 'Gogeta', nivel: CONFIG.skills.gogeta, vocacoes: ['goku'], duracao: CONFIG.transformacao.gogetaDuracao, icone: '/assets/skills/transformacoes/gogeta.png' },
  { forma: 'vegito', nome: 'Vegetto', nivel: CONFIG.skills.vegito, vocacoes: ['goku'], icone: '/assets/skills/transformacoes/vegeto.png' }
]);
export const formasDaVocacao = (vocacao = 'goku') => FORMAS
  .filter(f => !f.vocacoes || f.vocacoes.includes(vocacao))
  .map(f => f.niveis?.[vocacao] === undefined ? f : { ...f, nivel: f.niveis[vocacao] });

// A forma que o botão de transformação ativa neste nível (null antes da primeira).
export const formaDisponivel = (level, vocacao = 'goku') => formasDaVocacao(vocacao).findLast(f => level >= f.nivel) || null;
export const nomeDaForma = forma => FORMAS.find(f => f.forma === forma)?.nome || 'Forma base';
export const iconeDaForma = (forma, vocacao = 'goku') => { const f = FORMAS.find(item => item.forma === forma); return f?.icones?.[vocacao] || f?.icone || null; };

// Multiplicador do ataque por golpe e forma. Base, Kaioken (base × 1,4) e SSJ são os valores que já existiam;
// SSJ2 = SSJ × 1,5 e SSJ3 = SSJ2 × 1,5 (decisões do Pedro, 11–12/11/2026). Bônus não acumulam: uma forma por vez.
// O Kamehameha vale em todas as formas; Ryuken (SSJ3/SSJ4) e Super Kamehameha (SSJ4) são técnicas à parte.
const BASE = { soco: 1, rajada: 1.4, kame: 4.2, genki: 10 };
const SSJ = { soco: 1.5, rajada: 2.1, kame: 6, genki: 14 };
const vezes = (t, k) => Object.fromEntries(Object.entries(t).map(([g, v]) => [g, Math.round(v * k * 1000) / 1000]));
const SSJ2 = vezes(SSJ, 1.5);
const SSJ3 = vezes(SSJ2, 1.5), MAJIN = SSJ3, SSJ4 = vezes(SSJ3, 1.5), GOGETA = vezes(SSJ4, 1.5), VEGITO = vezes(GOGETA, 1.5);
export const DANO_DA_FORMA = Object.freeze({ base: BASE, kaioken: vezes(BASE, 1.4), ssj: SSJ, ssj2: SSJ2, ssj3: SSJ3, majin: MAJIN, ssj4: SSJ4, ssjGod: SSJ4, gogeta: GOGETA, vegito: VEGITO });
export const multiplicadorDaForma = (forma, golpe) => (DANO_DA_FORMA[forma] || BASE)[golpe];
