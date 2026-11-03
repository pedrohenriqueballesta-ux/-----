// Folha desenhada quadro a quadro (ChatGPT), recortada e alinhada pela cabeça com
// ~/idle-dbz/ferramentas/fatiar_caminhada.py e gerada por gerar_modulo.py. Não edite à mão: gere de novo.
// Linhas: Sul, Sudeste, Leste, Nordeste, Norte. Colunas: preparação, avanço, impacto (soco), recuperação.
// Cada quadro: [sourceX, sourceY, largura, altura, âncoraX (centro do tronco), âncoraY (chão)].
export const GUERREIRO_GOLPE = {
  file: '/assets/mobs/guerreiro-soco.png', width: 960, height: 1380,
  rows: 5, columns: 4, referenceHeight: 238, idleColumn: 0,
  frames: [[[0,0,240,276,115.5,270],[240,0,240,276,355.5,270],[480,0,240,276,595.5,270],[720,0,240,276,835.5,270]],[[0,276,240,276,119.5,546],[240,276,240,276,359.5,546],[480,276,240,276,599.5,546],[720,276,240,276,839.5,546]],[[0,552,240,276,119.5,822],[240,552,240,276,359.5,822],[480,552,240,276,599.5,822],[720,552,240,276,839.5,822]],[[0,828,240,276,113.0,1098],[240,828,240,276,353.0,1098],[480,828,240,276,593.0,1098],[720,828,240,276,833.0,1098]],[[0,1104,240,276,119.0,1374],[240,1104,240,276,359.0,1374],[480,1104,240,276,599.0,1374],[720,1104,240,276,839.0,1374]]]
};
