# Barreira de Ki — animação

Pedido de 07/11/2026. Branch `feature/barreira-ki-vfx`, criada de `origin/main`.

Arte original de `barreira_ki_spritesheets.zip`: folha PNG RGBA 1536×1024,
grade 4×4, células 384×256. O arquivo é preservado sem alterações. No primeiro
desenho, o cliente prepara uma cópia em canvas e torna transparentes os resíduos
do fundo RGB (146, 242, 253), com tolerância de 3 por canal. O restante do alfa
e das cores é preservado. Imagem e canvas são reutilizados.

## Sequência

- Frames 0–3: uma vez, 120 ms por frame (480 ms no total).
- Frames 4–9: ciclo de 720 ms até terminar a proteção do servidor.
- Frames 10–15: uma vez, a partir do fim da proteção (720 ms), depois desaparece.
- Escala visual provisória: 0,42; centro 34 unidades acima dos pés interpolados.
- A sequência e o tamanho independem de nível, direção e pose de ataque.
- O snapshot inclui início e fim da Barreira nos jogadores do mesmo lugar,
  permitindo que observadores vejam a mesma fase. Personagens mortos não exibem o efeito.

## Regras preservadas

A proteção dura 2,5 s, custa 30 Ki e tem recarga de 8 s. O dano bruto recebido
continua multiplicado por 0,28 antes da defesa. O encerramento visual não prolonga
a proteção. Nenhuma regra ou arte das outras técnicas foi alterada.

## Conferência

`npm test`: 169 testes passaram. `npm run check`: passou, incluindo os dois módulos novos.
Os testes cobrem sequência completa, repetição, encerramento, transparência dos 16
quadros, limpeza da cor-chave, acompanhamento nas oito direções e níveis,
carregamento único, observadores e preservação das regras de combate.

Prévia sem sessão e sem gravação de save: `/barreira-ki.html`. Mostra oito direções,
ataques, movimento e as três fases, com pausa e controle de tempo.

Conferência visual com captura pendente: o controle do navegador foi interrompido
por não conseguir determinar a URL atual com confiança. A escala ainda precisa
de revisão visual no navegador; os testes não substituem essa avaliação.

Usuário revisou a prévia, aprovou o resultado e autorizou o commit em 07/11/2026.
Push e merge aguardam autorização.
