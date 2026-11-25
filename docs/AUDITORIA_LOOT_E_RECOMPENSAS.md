# Auditoria de loot e recompensas

O catálogo tem 97 itens com arte, atributos e preço. São 14 materiais, 4 consumíveis de loot e 79 equipamentos. Há 55 itens com sorteio específico e o Cristal Azul com sorteio comum, seis entregues pelo conjunto inicial ou pela Primeira patrulha e 35 equipamentos reservados para fontes futuras. Os reservados podem ser conferidos com God Mode. Os consumíveis e materiais legados, como Presunto, Sucata e Sementes, ficam fora dessa contagem.

## Mobs e drops ativos

24 espécies nas nove hunts aparecem no Bestiário. A tabela conta as entradas específicas do catálogo por espécie. Um item pode aparecer em mais de uma linha. A lista completa de itens, fontes e chances por abate fica no [catálogo](../public/shared/sistemas/catalogo-itens.mjs). As fichas do jogo também exibem o sorteio de Sucata ou Cristal Azul e o sorteio de Semente 15%.

| Hunt | Mob | Materiais | Consumíveis | Equipamentos |
|---|---|---:|---:|---:|
| Planícies de Namekusei | Inseto de Namek | 2 | 1 | 0 |
| Planícies de Namekusei | Pássaro de Namek | 0 | 1 | 0 |
| Campo de Batalha | Comandante Sentinela BOSS | 1 | 1 | 2 |
| Campo de Batalha | Guerreiro de Namek | 2 | 1 | 3 |
| Campo de Batalha | Veterano de Namek | 2 | 1 | 4 |
| Planalto do Porunga | Porunga | 1 | 1 | 0 |
| Planalto do Porunga | Porunga BOSS | 2 | 1 | 0 |
| Cratera de Nail | Nail | 2 | 0 | 8 |
| Cratera de Nail | Piccolo Daimaoh | 3 | 0 | 8 |
| Cratera de Nail | Neva BOSS | 1 | 0 | 8 |
| Planícies Vermelhas | Hatchiyack | 2 | 0 | 3 |
| Planícies Vermelhas | Tsufurujin General | 2 | 1 | 2 |
| Planícies Vermelhas | Tsufurujin Guerreiro | 2 | 0 | 0 |
| Cânions | Dodoria | 2 | 1 | 2 |
| Cânions | Zarbon | 2 | 1 | 3 |
| Floresta Seca | Bardock | 2 | 0 | 11 |
| Floresta Seca | Nappa | 1 | 0 | 7 |
| Floresta Seca | Raditz | 2 | 0 | 8 |
| Campos de Lava | Oozaru | 2 | 1 | 0 |
| Campos de Lava | Oozaru Guerreiro | 2 | 1 | 0 |
| Campos de Lava | Oozaru Dourado BOSS | 3 | 1 | 0 |
| Grande Cratera | Broly | 2 | 0 | 3 |
| Grande Cratera | Rei Vegeta | 2 | 0 | 7 |
| Grande Cratera | Freeza BOSS | 3 | 0 | 6 |

A Sentinela alienígena/de elite, registrada como `ranged`, ainda consta como fonte extra de Aglomerado de Minério e tem uma fatia maior de Cristal Azul no sorteio comum, mas não tem spawn nas hunts atuais. Ambos os itens têm outras fontes ativas. Saibaman (registro `melee`) e Oozaru Super também têm definições no código sem spawn natural nas hunts auditadas. O Oozaru Dourado BOSS é uma espécie ativa distinta.

## Equipamentos com fonte pendente

Os 35 itens abaixo já existem no catálogo. A coluna indica o encontro, desafio ou outra fonte que precisa entrar na progressão normal. Goku e algumas fusões já aparecem como personagem ou transformação. Para conceder seus equipamentos ainda falta um encontro PvE ou recompensa direta.

| Fonte prevista | Itens |
|---|---|
| Shin e fusões | Brincos Potara |
| Androide 17 | Armadura do Androide 17 |
| Cell | Armadura de Cell, Botas de Cell, Calça de Cell, Capacete de Cell |
| Gohan | Calça Roxa de Gohan, Traje de Gohan |
| Shin de Elite | Armadura Celestial de Elite, Calça Celestial de Elite |
| Janemba | Espada de Janemba |
| Gogeta ou Gotenks | Colete Metamoru, Calça Metamoru |
| Trunks do Futuro | Botas do Futuro, Jaqueta de Trunks, Calça de Trunks |
| Gogeta | Botas de Gogeta |
| Goku | Gi de Goku, Gi de Goku com Kanji, Botas de Goku, Calça de Goku |
| Grande Saiyaman | Traje do Grande Saiyaman, Capacete do Grande Saiyaman |
| Goku Criança | Gi de Goku Criança, Calça de Goku Criança |
| Majin Buu | Botas de Majin Buu, Capuz de Majin Buu, Jaqueta de Majin Buu, Calça de Majin Buu |
| Shin | Armadura Celestial de Shin, Botas Celestiais de Shin, Calça Celestial de Shin |
| Vegetto | Traje de Vegetto, Calça de Vegetto |
| Treino no Mundo dos Kaioshins | Espada Z |

## Itens que valem criar primeiro

| Lacuna | Proposta | Fonte sugerida |
|---|---|---|
| Colar de entrada e anel | Pingente de Namek com regeneração modesta de Ki e Anel de Patrulha com defesa leve. Hoje Potara é o único colar do catálogo, ainda reservado. O catálogo não tem anéis. | Missões de exploração e coleta nas hunts existentes. |
| Opção acessível para arma | Bastão de Treino, abaixo do Bastão Mágico, com ataque moderado. O Bastão Mágico é a única arma com fonte ativa. | Recompensa única de treinamento no início da progressão. |
| Munhequeiras intermediárias | Munhequeira Namekuseijin para defesa e Luvas Tsufurujin para regeneração de Ki. Hoje há as braçadeiras iniciais e as Luvas de Hatchiyack. | Nail/Neva e General Tsufurujin, com tabelas de origem separadas. |
| Recompensas de chefe para quem teve azar | Emblema da Força Freeza e Selo da Cratera. Servem como progresso acumulado para uma peça escolhida ou uma proteção de nível equivalente. | Objetivos limitados de chefes, após definir como contabilizar contribuição em grupo. |
| Consumíveis em faixas altas | Ração de patrulha de longa duração para HP e essência concentrada de Ki. Efeitos diferentes em duração e recuperação, com recarga por família. | Missões semanais e combinação de materiais de hunts avançadas. |

## VIP e Zeni dourado

A loja atual já usa saldo premium separado do Zeni comum e lista a Aura Dourada VIP por 120 moedas premium, além de outros cosméticos. Os preços abaixo são propostas em Zeni dourado, o nome sugerido para apresentar esse saldo.

| Produto proposto | Faixa sugerida | Entrega |
|---|---:|---|
| Moldura ou título VIP | 80–120 | Colecionável visual na conta |
| Aura ou rastro VIP | 120–200 | Efeito visual de personagem ou montaria |
| Tema de mochila ou HUD | 150–220 | Tema visual selecionável |
| Aparência alternativa da Nimbus | 250–350 | Aparência que conserva as regras da montaria |

Recompensas premium devem competir por visual e coleção. Defesa, ataque, regeneração, chance de drop e peças mais fortes ficam na progressão jogável. Nenhum produto novo foi cadastrado nesta rodada.

## Como entregar itens fortes

1. **Chefes que já existem.** Manter o drop direto da armadura, botas e capacete da Força Freeza. Uma missão de sequência pode conceder emblemas para escolher uma dessas peças depois de abates válidos suficientes. A proteção de cintura continua com fonte nos oficiais da Força Freeza. Definir a atribuição de crédito de grupo antes de ativar a missão.
2. **Conteúdo pós-Grande Cratera.** Priorizar Androide 17 e Cell em uma mesma progressão. Com duas novas fontes, cinco peças existentes passam a ter loot. Armadura de Cell fica no chefe, com peças intermediárias no percurso.
3. **Desafios por personagem.** Gi, botas e calça de Goku, peças de Gohan/Saiyaman e o traje de Trunks podem sair de duelos de treino e sagas com resgate único. Isso reaproveita a arte para itens cujo portador faz mais sentido como mentor ou rival.
4. **Marcos de fim de saga.** Reservar a Espada Z para a prova de treino dos Kaioshins, a Espada de Janemba para seu confronto e Potara para uma linha de Shin e fusões. O passe pode dar cosméticos, suprimentos e itens intermediários, com peças finais associadas ao desafio que as desbloqueia.
