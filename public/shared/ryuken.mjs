// Ryuken / Punho do Dragão (decisões do Pedro, 12/11/2026): técnica do Super Saiyajin 3, na tecla do Kamehameha.
// O dragão dourado sai do soco, voa até o alvo selecionado acompanhando-o e explode nele: alvo único, sem área.
// Dano ×13,5 do ataque (1,5× o Kamehameha), 40 Ki, 10 s de recarga, alcance = o do Kamehameha no nível.
// Tempos casam com a arte v2 da equipe (16 quadros a 60 ms): o dragão nasce no fim do lançamento.
export const RYUKEN = Object.freeze({
  forma: 'ssj3', custo: 40, recarga: 10, dano: 13.5,
  quadro: 0.06, quadros: 16,
  lancamento: 16 * 0.06,     // aura + energia no punho; o voo começa no último quadro
  impacto: 16 * 0.06,        // duração da explosão no alvo
  velocidade: 430, colisao: 26, alturaAlvo: 22,
  // No último quadro do lançamento a cabeça do dragão já está 90 unidades à frente do punho (487 px × 74/400):
  // o voo começa ali, senão o dragão "volta" para o punho e parece sumir e reaparecer.
  cabecaAFrente: 90,
  sustentacao: 0.6           // segundos com o braço esticado depois que o dragão sai
});
// Só no SSJ3 (que libera no mesmo marco, CONFIG.skills.ryuken = 300).
export const usaRyuken = p => p?.forma === RYUKEN.forma;
