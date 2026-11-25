// Folha desenhada quadro a quadro (ChatGPT), recortada e alinhada pela cabeça com
// ferramentas/fatiar_caminhada.py e gerada por gerar_modulo.py. Não edite à mão: gere de novo.
// Linhas: Sul, Sudeste, Leste, Nordeste, Norte. Colunas: pé esq. à frente, passagem, pé dir. à frente, passagem.
// Cada quadro: [sourceX, sourceY, largura, altura, âncoraX (centro do tronco), âncoraY (chão)].
export const ROBO_SHU_PASSO = {
  file: '/assets/mobs/robo-shu-andar.png', width: 1000, height: 1520,
  rows: 5, columns: 4, referenceHeight: 261, idleColumn: 1,
  frames: [[[0,0,250,304,123.5,298],[250,0,250,304,373.5,298],[500,0,250,304,623.5,298],[750,0,250,304,873.5,298]],[[0,304,250,304,129.5,602],[250,304,250,304,379.5,602],[500,304,250,304,629.5,602],[750,304,250,304,879.5,602]],[[0,608,250,304,124.0,906],[250,608,250,304,374.0,906],[500,608,250,304,624.0,906],[750,608,250,304,874.0,906]],[[0,912,250,304,126.0,1210],[250,912,250,304,376.0,1210],[500,912,250,304,626.0,1210],[750,912,250,304,876.0,1210]],[[0,1216,250,304,124.0,1514],[250,1216,250,304,374.0,1514],[500,1216,250,304,624.0,1514],[750,1216,250,304,874.0,1514]]]
};
