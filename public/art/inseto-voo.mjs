// Folha desenhada quadro a quadro (ChatGPT), recortada e alinhada pela cabeça com
// ferramentas/fatiar_caminhada.py e gerada por gerar_modulo.py. Não edite à mão: gere de novo.
// Linhas: Sul, Sudeste, Leste, Nordeste, Norte. Colunas: asas no alto, metade descendo, embaixo, metade subindo.
// Cada quadro: [sourceX, sourceY, largura, altura, âncoraX (centro do tronco), âncoraY (chão)].
export const INSETO_VOO = {
  file: '/assets/mobs/inseto-voo.png', width: 1024, height: 1310,
  rows: 5, columns: 4, referenceHeight: 225, idleColumn: 0,
  frames: [[[0,0,256,262,127.0,256],[256,0,256,262,383.0,256],[512,0,256,262,639.0,256],[768,0,256,262,895.0,256]],[[0,262,256,262,135.0,518],[256,262,256,262,391.0,518],[512,262,256,262,647.0,518],[768,262,256,262,903.0,518]],[[0,524,256,262,128.0,780],[256,524,256,262,384.0,780],[512,524,256,262,640.0,780],[768,524,256,262,896.0,780]],[[0,786,256,262,125.5,1042],[256,786,256,262,381.5,1042],[512,786,256,262,637.5,1042],[768,786,256,262,893.5,1042]],[[0,1048,256,262,127.5,1304],[256,1048,256,262,383.5,1304],[512,1048,256,262,639.5,1304],[768,1048,256,262,895.5,1304]]]
};
