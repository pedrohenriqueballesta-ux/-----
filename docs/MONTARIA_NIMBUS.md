# Primeira montaria: Nimbus

Branch feature/montaria-nimbus, criada de origin/main após merge #68.

- Gratuita para todos, conforme decisão do usuário. Ativar/desativar em Personagem → Montaria. A escolha persiste no backend por personagem e é transmitida aos demais jogadores.
- PNGs independentes em public/assets/montarias/nimbus/sprites, com oito direções específicas e cinco frames por direção, 130 ms/frame, sem espelhamento.
- public/shared/montarias.mjs: configuração de escala, APOIOS_NIMBUS por direção/frame no centro da massa da nuvem, amplitude/frequência da flutuação e AJUSTES_NIMBUS com offsets X/Y por skin (Goku base e SSJ inicialmente).
- public/render/nimbus.mjs: carrega os 40 frames uma vez, desenha a nuvem antes do corpo e devolve a posição visual do personagem. Personagem fica em repouso sobre a nuvem durante deslocamento; poses de ataque/carga permanecem existentes. Flutuação é visual, respeitando a preferência de reduzir animações.
- Não altera coordenadas de mundo, velocidade, caminhos, colisões, hitboxes, dano ou habilidades. Mortos não exibem montaria. Equipamento anterior é mantido para após renascer.
- Não depende da compra do colecionável Nimbus Dourada da Store/Passe: compras anteriores permanecem registradas, mas o uso da Nimbus é gratuito nesta versão.

## Testar
- npm run dev; abrir http://localhost:3000, Personagem → Montar Nimbus. Mover com teclado/navegação automática, mudar direções, atacar e transformar. Conferir outro jogador e reconexão.
- http://localhost:3000/nimbus.html: modo isolado com oito direções simultâneas, controles de escala, offsets X/Y, flutuação, movimento, Super Saiyajin, ataque e pausa/frame manual. O bloco JSON mostra os ajustes para replicar em AJUSTES_NIMBUS; os controles não modificam saves.
- npm run check e npm test. tests/montarias.test.mjs verifica frames/direções, offsets sem mutação, multiplayer, persistência/reinício por HTTP, personagens inválidos/mortos, conservação de atributos e igualdade de deslocamento montado/desmontado.

## Arte corrigida
O pacote inicial continha uma faixa marrom opaca. Os 40 quadros foram tratados individualmente com a ferramenta integrada imagegen, removendo o fundo e preservando a composição quadrada, a nuvem, caudas e partículas. As saídas foram normalizadas para PNG RGBA de 256×256 com redimensionamento nearest-neighbor e remoção de resíduos de alfa quase invisíveis (<16). As imagens finais substituem os arquivos em public/assets/montarias/nimbus/sprites/. A configuração de animação permanece igual. O apoio original [128,110] foi substituído por APOIOS_NIMBUS para centralizar o personagem na massa da nuvem, excluindo rabinho e partículas. O ZIP original fornecido pelo usuário permanece intacto em Downloads.

Prompt aplicado a cada frame (substituindo {arquivo}):
Background extraction of existing game animation sprite {arquivo}. Remove ONLY the brown/bronze opaque horizontal rectangular band behind the golden Nimbus cloud. Keep only the exact existing yellow pixel art cloud, pointed tail and existing tiny yellow particles. Transparent alpha outside cloud: no background, no brown patch, no glow haze, no ground shadow. Preserve source square canvas framing, cloud position, scale, silhouette and frame pose, with surrounding transparent padding. Do not enlarge or recenter. Use the original 256×256 coordinate grid. Do not add cloud parts or particles, redesign, or change tail direction. Align as this exact frame of a 40-frame animation. Output transparent PNG with the same square composition.

Validação da correção: os 40 PNGs finais foram carregados no navegador. A região lateral antes ocupada pela faixa ficou transparente em todos os quadros. Conferidas as oito direções nos frames 1 e 5, animação em movimento, Super Saiyajin e layout móvel. Os seis testes de montarias passaram após substituir as imagens.

## Centralização na massa da nuvem
Os 40 pontos de apoio foram calibrados na região espessa de cada sprite, desconsiderando cauda e partículas. O centro é medido pela região interior da silhueta e o apoio é colocado na sua superfície superior. A renderização desloca a nuvem sob o personagem, mantendo a posição visual do corpo estável durante a troca de frames e direções. A prévia mostra os apoios por direção do frame atual. Conferidos os frames 1 e 5 das oito direções no navegador; os sete testes de montarias passaram, incluindo alinhamento dos 40 quadros sem deslocamento do personagem.
