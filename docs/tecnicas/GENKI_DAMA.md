# Genki-Dama Ultimate — três etapas

Pedido de 07/11/2026. Branch `feature/genki-dama-vfx`, criada de `origin/main`
após o merge dos ajustes do minimapa. Arte original do pacote
`genki_dama_3_etapas_final.zip`, sem edição ou recoloração.

Atualização da canalização: substituída por `Carga de Energia Azul Suprema.gif`.
Os 16 frames transparentes de 313×313 foram organizados em células de 384×384,
com margem de 35 px. A ponta do V fica ancorada na cabeça (62 unidades acima dos
pés), escala 0,4, com energia crescendo para cima entre os braços e a esfera no alto.
Mantido o tempo de canalização de 1,92 s. Voo e explosão são idênticos à versão
anterior, conferidos por hash. A alteração também foi copiada para o servidor de
testes da porta 3001. Os nove testes da Genki passaram após o ajuste.

## Etapas

Cada fase usa uma folha RGBA de 1536×1536, grade 4×4, células inteiras de 384×384:

| Fase | Reprodução | Tempo por frame | Local |
| --- | --- | --- | --- |
| Canalização | 16 frames, uma vez | 120 ms | Acima do personagem, feixes na altura das mãos |
| Voo | 16 frames em loop | 100 ms | Projétil movido pelo servidor até o impacto |
| Explosão | 16 frames, uma vez | 110 ms | Ponto de impacto fixo |

A canalização dura 1,92 s e acompanha o personagem. Não usa o sprite nem a carga
do Kamehameha. No lançamento, o efeito troca de folha. O alvo capturado ao ativar
é acompanhado durante o voo, inclusive se mudar de posição. Sem alvo selecionado,
permanece possível disparar pela mira ou direção, acertando inimigos no trajeto.

Foi removida a expiração antiga de 2,35 s: duração da animação não limita distância
de voo. O projétil desaparece no impacto e cria uma única explosão visual de 1,76 s;
a animação não reaplica dano. Células completas giram diretamente no mundo pela
direção do projétil, sem recorte intermediário. Centros luminosos foram medidos
para que a cauda animada não desloque o ponto de ancoragem da esfera.

Escalas visuais provisórias: canalização 0,4, voo 0,42 e explosão 0,6.

## Regras preservadas

- Desbloqueio no nível 10; custo de 60 Ki e cooldown de 45 s, cobrados uma vez ao ativar.
- Dano bruto principal: ataque ×10 na base e ×14 transformado.
- Dano secundário: 45% do principal, no raio original de 72 em torno do alvo atingido.
- Velocidade 265 e raio de colisão 38, como na versão anterior.
- Sem PvP e sem atingir outro planeta/área ou quem está no quadrado seguro.

Morte, desconexão, entrada na safe zone, portal ou perda do alvo cancelam a carga
e o voo sem reembolsar Ki ou limpar cooldown. Sem alvo, projéteis que saem dos
limites do lugar são removidos, evitando efeitos órfãos. Explosões já criadas
permanecem apenas no lugar do impacto até acabar sua animação.

Os snapshots transmitem cargas e explosões por lugar, e o voo reutiliza a lista
existente de projéteis. O cliente apenas desenha as fases pelos timestamps.
As outras habilidades mantêm suas regras e artes.

## Validação

Suíte completa: 217 testes passaram; `npm run check` passou, incluindo disparo
sem alvo pela mira/direção. O teste antigo de impacto imediato foi atualizado para aguardar a
nova canalização solicitada.

Cobertura nova: 16 frames por fase, loop de voo, término único, arquivos RGBA,
carga em movimento, custo/recarga, dano nas duas formas e em área, voo distante
e alvo móvel, cancelamentos, isolamento, sem PvP e rotação nas oito direções com
recorte completo. Captura visual no navegador pendente por indisponibilidade do
host nesta sessão. Servidor de testes atualizado para revisão do usuário.
Commit autorizado pelo usuário em 07/11/2026; push e merge aguardam autorização.
