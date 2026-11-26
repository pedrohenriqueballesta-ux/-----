// Folha desenhada quadro a quadro (ChatGPT), recortada e alinhada pela cabeça com
// ferramentas/fatiar_caminhada.py e gerada por gerar_modulo.py. Não edite à mão: gere de novo.
// Linhas: Sul, Sudeste, Leste, Nordeste, Norte. Colunas: pé esq. à frente, passagem, pé dir. à frente, passagem.
// Cada quadro: [sourceX, sourceY, largura, altura, âncoraX (centro do tronco), âncoraY (chão)].
export const CELL_IMPERFEITO_PASSO = {
  file: '/assets/mobs/cell-imperfeito-andar.png', width: 784, height: 1470,
  rows: 5, columns: 4, referenceHeight: 256, idleColumn: 1,
  frames: [[[0,0,196,294,97.5,288],[196,0,196,294,293.5,288],[392,0,196,294,489.5,288],[588,0,196,294,685.5,288]],[[0,294,196,294,95.5,582],[196,294,196,294,291.5,582],[392,294,196,294,487.5,582],[588,294,196,294,683.5,582]],[[0,588,196,294,86.0,876],[196,588,196,294,282.0,876],[392,588,196,294,478.0,876],[588,588,196,294,674.0,876]],[[0,882,196,294,97.5,1170],[196,882,196,294,293.5,1170],[392,882,196,294,489.5,1170],[588,882,196,294,685.5,1170]],[[0,1176,196,294,97.0,1464],[196,1176,196,294,293.0,1464],[392,1176,196,294,489.0,1464],[588,1176,196,294,685.0,1464]]]
};
