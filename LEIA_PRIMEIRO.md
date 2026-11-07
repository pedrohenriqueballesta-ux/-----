# Dragon Ball Idle — protótipo jogável 0.6

Esta versão amplia a caminhada e o ataque para 16 quadros por ciclo e acrescenta vistas diagonais ao Goku, Super Saiyajin e a todos os mobs atuais. Mantém caminhos com curvas, pedras ajustadas, barra de habilidades compacta, zoom, caça automática e servidor multiplayer local.

## Como atualizar a versão anterior sem perder o progresso

1. No jogo aberto, clique em **Salvar progresso**. Na janela preta do servidor, pressione **Ctrl+C** para encerrá-lo.
2. Extraia o ZIP novo em uma pasta separada da versão anterior.
3. Na pasta da versão anterior, entre em **data** e copie o arquivo **save.json**. Na pasta nova, crie uma pasta chamada **data** se ainda não existir e cole o arquivo nela.
4. Abra **INICIAR_WINDOWS.bat** na pasta nova. Mantenha a janela preta aberta e acesse http://localhost:3000 no mesmo navegador usado anteriormente. Atualize a página.

O ZIP não contém o progresso do seu computador. O arquivo save.json e a sessão do navegador permitem recuperar o personagem ao usar o mesmo endereço local.

## Como executar no Windows ou Mac

1. Instale Node.js 22 ou superior, caso ainda não tenha. O instalador está em https://nodejs.org/ .
2. Extraia o ZIP inteiro. Evite executar arquivos diretamente de dentro do ZIP.
3. Abra o Terminal na pasta dragon-ball-idle, onde está package.json.
4. Execute npm start.
5. Abra http://localhost:3000 no navegador.

Não é necessário executar npm install. Este protótipo usa somente recursos nativos do Node.js e do navegador, sem pacotes externos. A HUD v0.6 foi integrada sobre a tela de jogo existente; ela não substitui o mapa por uma imagem estática.

Você também pode iniciar pelo INICIAR_WINDOWS.bat. No Mac, rode npm start pelo Terminal; INICIAR_MAC.command é uma alternativa se o sistema permitir sua execução.

Para encerrar, pressione Ctrl+C no Terminal. O progresso fica no arquivo data/save.json. Reabrir a página no mesmo navegador permite continuar a última sessão disponível. Cada aba adicional conectada ganha outro personagem para testar o multiplayer.

## Controles

| Ação | Controle |
| --- | --- |
| Mover | WASD, setas, clique no chão ou direcional de toque |
| Aproximar / afastar | Roda do mouse sobre o mapa ou botões + / − junto ao minimapa |
| Selecionar alvo | Clique no mob ou em outro jogador |
| Kamehameha | Disponível no nível 3; estágios pelo nível do personagem: 1, 20, 50, 100 e 150 |
| Kaioken | 2, disponível no nível 2; aumenta o dano por 6 s |
| Barreira de Ki | 3, disponível no nível 2; reduz o dano recebido por 2,5 s |
| Super Saiyajin | 4 ou T, disponível no nível 5 |
| Genki Dama | 5, disponível no nível 10; recarga de 120 s |
| Ataque básico | Espaço |
| Esquiva rápida | Shift |
| Comer | F |
| Poção de Ki | Q |
| Semente selecionada | R |
| Iniciar/pausar caça | H ou botão no painel |

A HUD nova fica sobre o mapa que continua ativo. O retrato, HP, Ki, experiência, recursos, minimapa, bússola, missões, menu lateral, chat e cinco slots de habilidade são elementos HTML/CSS; os personagens e o mundo continuam renderizados no Canvas. O botão **Mais** abre o painel de status, inventário e caça. A HUD de missões/chat é uma interface de protótipo; o chat mostrado é demonstrativo, não um chat multiplayer persistente.

Goku, Super Saiyajin, Saibaman, Sentinela e Guardião da Cratera usam 16 quadros por ciclo de caminhada e ataque básico. As oito direções incluem nordeste, noroeste, sudeste e sudoeste com vistas em três quartos. A velocidade nas diagonais permanece igual à das direções retas. As pernas acompanham a distância realmente percorrida; quando não há deslocamento, o ciclo não avança. Os mobs mantêm a orientação ao parar, e a recuperação da animação continua após o impacto.

Para conferir as sprites sem mexer no progresso, com o servidor ligado abra **http://localhost:3000/animacoes.html**. Escolha caminhar, atacar ou parado; use **Anterior**, **Próximo** ou **Reproduzir** para comparar os 16 quadros nas oito direções. Ações como morte, uso de itens e esquiva ainda não possuem sequências próprias de 16 quadros.

## Roteiro para o primeiro teste

1. Entre com um nome e confira a vida, o Ki e o peso inicial da mochila.
2. Ative a caça nos Campos da Terra. Ela liga os ataques automáticos e as técnicas disponíveis. A comida é renovada automaticamente quando autorizada e houver estoque.
3. Ao chegar ao nível 2, use a Imagem Residual para sair dos círculos vermelhos anunciados pelos inimigos.
4. No nível 3, experimente alinhar o Kamehameha. O ataque é direcional e tem preparação.
5. Após sofrer dano, use uma semente. Tente trocar a potência durante os 20 segundos de recarga: todas continuam bloqueadas.
6. Abra outra aba para ver um segundo jogador real. Os dois só se veem no mesmo lugar (Terra, Vila ou a mesma hunt). Não há PvP nesta versão: o servidor recusa dano entre jogadores.
7. Volte ao mercador da vila, venda materiais e reponha comida e poções.

Viagem só por portal: na Terra, o portal leva à Vila de Namekusei; na Vila, um portal para cada hunt e outro de volta à Terra; em cada hunt, a saída fica onde você chegou e leva à Vila ou às outras hunts. Movimentar manualmente interrompe a condução automática.

## Dois computadores ou celular na mesma rede

Para permitir conexões da sua rede, inicie com npm start -- --host 0.0.0.0 . No outro dispositivo, abra http://IP-DO-SEU-COMPUTADOR:3000 . Substitua o IP pelo endereço local do computador que está rodando o servidor. O firewall pode exigir liberação dessa conexão local.

O servidor padrão aceita conexões apenas do próprio computador. Esta entrega não publica um servidor na internet.

## O que está implementado

- Mundo 2D visto de cima, movimentação por teclado e toque e personagens reais compartilhando o mapa.
- Goku com ataques manuais e automáticos, caça automática pela hunt inteira e técnicas desbloqueadas por nível.
- Crescimento automático de vida, Ki, ataque, defesa, cura, capacidade em peso, chance de loot e mobilidade.
- Comida com efeito temporário de recuperação, sem regeneração gratuita de vida fora do efeito.
- Sementes de 15%, 30%, 50% e 100% da vida máxima, com recarga compartilhada.
- Poções de Ki, inventário com peso, coleta de materiais, Zeni e um mercado de NPC.
- Vila segura e três hunts fechadas em Namekusei (inicial, média com subchefe, difícil com chefe), ligadas por portais.
- Simulação e validação de ações no servidor, inclusive dano, experiência, estoque e recarga.
- Salvamento local do servidor. A caça é suspensa se a sessão desconectar.

## Decisões provisórias usadas para viabilizar o teste

Os números e comportamentos abaixo foram escolhidos para o protótipo e podem ser alterados. Eles não substituem nossas decisões futuras de design.

| Regra | Valor de teste |
| --- | --- |
| Duração da comida | 300 segundos |
| Cura por comida | 2 de vida/s, multiplicados pelo atributo Cura |
| Acumulação de comida | Um efeito ativo por vez |
| Comida em combate | Continua funcionando |
| Recarga das sementes | 20 segundos para toda a categoria |
| Referência da semente | Percentual da vida máxima, limitado à vida máxima |
| Poção de Ki | 45% do Ki máximo; recarga de 8 segundos |
| Ki em repouso | Recuperação lenta, fora da caça e dos ataques |
| Rajada e esquiva | Nível 2 |
| Kamehameha | Nível 3 |
| Super Saiyajin | Nível 5, com consumo de Ki |
| Morte | Retorna à vila sem perder XP |
| Mochila cheia | Continua recebendo XP; itens que não cabem ficam no chão |
| Loot | Prioridade ao responsável pela derrota durante 15 segundos |
| Mercado | Vendedor de NPC; sementes fortes são caras |
| Kit inicial | Consumíveis gratuitos para experimentar as regras |

O protótipo tem apenas Goku e um mapa pequeno. Ainda não há contas de produção, comércio entre jogadores, todas as classes, mundo completo ou infraestrutura de publicação. O nome de jogador é uma identificação de teste, não uma conta autenticada.

## Estrutura do código

- server.mjs: servidor HTTP, conexão de jogadores, transmissão de estado e salvamento.
- public/shared/: regras autoritativas compartilhadas pelo servidor e pelo navegador.
  - config.mjs (mundo, zonas, obstáculos e números), math.mjs (helpers puros),
    characters.mjs (Goku, progressão e inventário inicial), enemies.mjs (inimigos, incl. Freeza),
    game.mjs (classe Game: combate, movimento, tick) e index.mjs (ponto de entrada).
- public/client/game.mjs: interface, controles, desenho do mapa e sprites de reserva.
- public/art/: desenho separado por assunto (terrain, goku, saibaman, alien, freeza, atlas, assets) + index.mjs.
- public/art/sprite-data.mjs: recortes e âncoras de chão das folhas de animação.
- public/render/camera.mjs: zoom, câmera, mira no mapa e seleção de quadros de movimento.
- public/animacoes.html: prévia das oito direções e dos 16 quadros de cada ciclo.
- public/assets/: sprites e texturas em PNG.
- public/style.css: apresentação e adaptação para telas pequenas.
- tests/game.test.mjs, tests/view.test.mjs, tests/sprites.test.mjs: testes de regras, câmera e sprites.
- docs/CONCEITO.md: cópia das decisões do projeto no momento desta entrega.

Como o projeto não usa empacotador, o navegador carrega os módulos direto pela URL;
por isso todo código compartilhado fica dentro de public/.

As tecnologias Phaser + TypeScript e Colyseus foram recomendações iniciais. Para entregar um teste local sem instalação de bibliotecas, esta versão usa Canvas 2D e Node.js com módulos JavaScript. O código de regras está separado da apresentação para permitir uma migração futura se ela se mostrar útil.

## Verificação

Execute npm test para verificar as regras, a conexão de dois jogadores, diagonais, quadros e sincronização dos golpes. Os 21 testes passaram nesta entrega, incluindo desbloqueios e cooldowns de Kaioken/Barreira de Ki e desbloqueio/impacto de área da Genki Dama. Execute npm run check para verificar a sintaxe dos módulos.

O servidor transmite o estado para o navegador e calcula as regras. A primeira validação envolve duas sessões; capacidade de jogadores em produção ainda precisa de testes próprios.
