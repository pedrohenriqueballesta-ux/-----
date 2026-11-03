// Folha desenhada quadro a quadro (ChatGPT), recortada e alinhada pela cabeça com
// ~/idle-dbz/ferramentas/fatiar_caminhada.py e gerada por gerar_modulo.py. Não edite à mão: gere de novo.
// Linhas: Sul, Sudeste, Leste, Nordeste, Norte. Colunas: asas no alto, metade descendo, embaixo, metade subindo.
// Cada quadro: [sourceX, sourceY, largura, altura, âncoraX (centro do tronco), âncoraY (chão)].
export const PASSARO_VOO = {
  file: '/assets/mobs/passaro-voo.png', width: 1076, height: 1325,
  rows: 5, columns: 4, referenceHeight: 229, idleColumn: 0,
  frames: [[[0,0,269,265,135.0,259],[269,0,269,265,404.0,259],[538,0,269,265,673.0,259],[807,0,269,265,942.0,259]],[[0,265,269,265,130.0,524],[269,265,269,265,399.0,524],[538,265,269,265,668.0,524],[807,265,269,265,937.0,524]],[[0,530,269,265,131.0,789],[269,530,269,265,400.0,789],[538,530,269,265,669.0,789],[807,530,269,265,938.0,789]],[[0,795,269,265,132.0,1054],[269,795,269,265,401.0,1054],[538,795,269,265,670.0,1054],[807,795,269,265,939.0,1054]],[[0,1060,269,265,133.5,1319],[269,1060,269,265,402.5,1319],[538,1060,269,265,671.5,1319],[807,1060,269,265,940.5,1319]]]
};
