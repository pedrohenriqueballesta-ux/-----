# Teleports com Nuvem Voadora

Pedidos de 07/11/2026, implementados localmente em `fix/tps-planetas-hunts`.

## Pontos de viagem

Todos os TPs usam a arte fornecida em `nuvem_voadora_16_frames.zip`:
`public/assets/teleports/nuvem.png`, 16 frames em grade 4×4, células 443×221,
100 ms/frame em loop. Cores e transparência originais preservadas.

Saídas das oito hunts ficam no canto superior esquerdo da safe zone, a 60 unidades
à esquerda e 60 acima da chegada. Distância até o spawn: aproximadamente 85;
gatilho de abertura do menu: 55. Assim, chegar não abre novamente a seleção de TP.
Os testes conferem chão caminhável, acesso por clique e viagem em todas as hunts.

## Transição da viagem

Arte atual fornecida em `Animação da Nuvem Nimbus e Logo Dragon Ball.gif`:
`public/assets/teleports/transicao-nimbus/frame_00.png` até `frame_15.png`,
16 quadros extraídos do GIF, 414×231, sem recolorir ou modificar a arte.
A versão anterior `transicao-hd/` e a folha antiga `transicao.png` foram removidas.
Todos os quadros são carregados e decodificados antes do início da transição;
a reprodução usa os quadros individuais para controlar o tempo sem loop automático do GIF.
Reprodução única em 1,5 s, 93,75 ms/frame (ajuste solicitado para teste):

- 0–3: nuvem próxima ao chão.
- 4–8: aproximação e cobertura.
- 9–12: logo Dragon Ball Idle.
- 13–15: afastamento e revelação do mapa real com fade de saída de 262,5 ms.

O arquivo original tem cenário opaco, mantido sem alteração. Há um fade de entrada
de 90 ms. O quadro principal cabe inteiro na tela, sem deformação ou recorte da
logo; uma cópia expandida e suavizada preenche as laterais em outras proporções.

A requisição de viagem é enviada uma única vez no frame 9, já coberto. O cliente
recebe e desenha o destino sob a transição. Antes do frame 13, aguarda confirmação
do servidor, snapshot do lugar correto e carregamento do solo; se necessário,
segura o frame 12 (sem reiniciar ou repetir a animação). Erros e espera excessiva
liberam a tela com aviso. Falha no arquivo de animação não envia viagem.

Durante a transição, o cliente envia movimento zero, ignora comandos de jogo e
não reabre o menu de TP. Ao trocar de lugar, descarta posições interpoladas e
efeitos do mapa anterior. Ao concluir, devolve os controles. Não há nova proteção,
mudança de alcance, destinos, cooldown, combate ou regras autoritativas de portal.

## Validação

`npm test`: 175 testes passaram. `npm run check`: passou.
Testes específicos cobrem sequência completa, viagem única sob cobertura, espera,
recusa do servidor, arquivo indisponível, nova tentativa e proporções de telas
desktop, ultrawide, tablet e celular. Conferência visual em navegador pendente;
o controle do navegador ficou indisponível nesta sessão. Servidor local reiniciado
para revisão do usuário. Commit autorizado pelo usuário em 07/11/2026;
push e merge aguardam autorização.
