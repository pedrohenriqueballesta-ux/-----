// Folha desenhada quadro a quadro (ChatGPT), recortada e alinhada pela cabeça com
// ferramentas/fatiar_caminhada.py e gerada por gerar_modulo.py. Não edite à mão: gere de novo.
// Linhas: Sul, Sudeste, Leste, Nordeste, Norte. Colunas: preparação (garras erguidas), bote, impacto com poeira, recuperação.
// referenceHeight copiado da caminhada: o 1º quadro do ataque é agachado e mediria menos,
// o que faria o Saibaman crescer ao atacar. As duas folhas têm o mesmo tamanho de pixel.
// Cada quadro: [sourceX, sourceY, largura, altura, âncoraX (centro do tronco), âncoraY (chão)].
export const SAIBAMAN_GOLPE = {
  file: '/assets/saibaman-golpe.png', width: 1204, height: 1305,
  rows: 5, columns: 4, referenceHeight: 231, idleColumn: 3,
  frames: [[[0,0,301,261,149.5,255],[301,0,301,261,450.5,255],[602,0,301,261,751.5,255],[903,0,301,261,1052.5,255]],[[0,261,301,261,147.0,516],[301,261,301,261,448.0,516],[602,261,301,261,749.0,516],[903,261,301,261,1050.0,516]],[[0,522,301,261,155.5,777],[301,522,301,261,456.5,777],[602,522,301,261,757.5,777],[903,522,301,261,1058.5,777]],[[0,783,301,261,148.5,1038],[301,783,301,261,449.5,1038],[602,783,301,261,750.5,1038],[903,783,301,261,1051.5,1038]],[[0,1044,301,261,149.5,1299],[301,1044,301,261,450.5,1299],[602,1044,301,261,751.5,1299],[903,1044,301,261,1052.5,1299]]]
};
