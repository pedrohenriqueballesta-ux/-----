# Prompt para gerar sprites do Goku Natalino montado

Crie uma spritesheet pixel-art de alta qualidade do Goku Natalino sentado naturalmente sobre uma montaria terrestre, para uso em um RPG 2D visto de cima. Gere somente o personagem montado; não desenhe a rena, nuvem, sombra de chão, projéteis ou efeitos.

## Grade obrigatória

- Uma folha PNG RGBA transparente.
- 5 linhas × 4 colunas, total de 20 frames.
- Linhas, nesta ordem: Sul/frente, Sudeste/diagonal frente-direita, Leste/perfil direita, Nordeste/diagonal costas-direita, Norte/costas.
- As direções Sudoeste, Oeste e Noroeste serão obtidas por espelhamento horizontal no motor; não desenhe linhas extras nem espelhe frente/costas.
- Todas as células devem preservar o mesmo tamanho total e o mesmo ponto de quadril.
- O quadril deve permanecer no mesmo ponto relativo em todas as quatro colunas de uma linha.

## Postura

Goku deve estar realmente sentado: tronco ereto, quadril apoiado na sela, coxas dobradas e pernas naturalmente afastadas pela largura do dorso. As botas ficam próximas às laterais da montaria, sem flutuar e sem atravessar o corpo. Os braços ficam em posição natural de condução, mas sem rédeas fixas. Preserve o traje natalino completo, chapéu, mangas longas, botas, rosto e proporções do Goku base.

Não desenhe Goku em pé, agachado no ar ou fundido ao animal. Não aumente nem reduza a altura do personagem entre direções. A cabeça e o chapéu devem ocupar a mesma escala visual do Goku base.

## Direções

- Sul: visão frontal, personagem centralizado, pernas visíveis nas laterais e cabeça da montaria não coberta artificialmente.
- Sudeste: três quartos frontal, perna distante parcialmente atrás do dorso.
- Leste: perfil direito, quadril sobre a sela, perna distante discretamente ocultada pelo corpo da montaria.
- Nordeste: três quartos traseiro, costas e cauda do chapéu coerentes com a perspectiva.
- Norte: visão traseira, quadril centralizado sobre o dorso e botas acompanhando as laterais.

Cada linha deve ser uma pose coerente do mesmo personagem, sem alterar anatomia, altura ou proporção.

## Camadas e transparência

Entregue apenas o personagem com fundo totalmente transparente. Não inclua magenta, verde, sombra, sela ou partes da rena. Não recorte pernas para esconder problemas: a composição do motor fará a montaria ser desenhada separadamente. Se uma profundidade específica for impossível com uma sprite completa, informe a limitação e forneça, opcionalmente, uma camada separada do personagem distante, mantendo a mesma grade e âncoras.

## Ações e pacote

O pacote deve conter uma folha montada estável (`07_MONTADO.png`). Se forem fornecidos estados adicionais, mantenha a mesma grade e o mesmo quadril: parado, caminhada, soco, rajada de Ki, Kamehameha e Genki-Dama continuam folhas separadas do personagem e não devem duplicar efeitos do jogo.

Antes de exportar, verifique todas as 20 células: nenhum frame pode cortar chapéu, botas ou braços; não pode haver deslocamento vertical do quadril; as bordas devem estar limpas e sem halo de chroma.

