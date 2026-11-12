// Ryuken / Punho do Dragão (decisões do Pedro, 12/11/2026): técnica do Super Saiyajin 3, na tecla do Kamehameha.
// O dragão dourado sai do soco, voa até o alvo selecionado acompanhando-o e explode nele: alvo único, sem área.
// Dano ×13,5 do ataque (1,5× o Kamehameha), 40 Ki, 10 s de recarga, alcance = o do Kamehameha no nível.
// Tempos casam com os GIFs da equipe (12 quadros a 70 ms): o dragão nasce no fim do lançamento.
export const RYUKEN = Object.freeze({
  forma: 'ssj3', custo: 40, recarga: 10, dano: 13.5,
  quadro: 0.07, quadros: 12,
  lancamento: 12 * 0.07,     // pose de carga + energia no punho; o voo começa no último quadro
  impacto: 12 * 0.07,        // duração da explosão no alvo
  velocidade: 430, colisao: 26, alturaAlvo: 22,
  sustentacao: 0.6           // segundos com o braço esticado depois que o dragão sai
});
export const usaRyuken = p => p?.forma === RYUKEN.forma;
