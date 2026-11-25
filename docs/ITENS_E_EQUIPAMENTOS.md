# Itens e equipamentos

Balanceamento dos itens e da economia das hunts. O catálogo registra 14 materiais, quatro consumíveis de loot e 79 equipamentos, com ícones fornecidos nos dois pacotes. Cada entrada declara peso, raridade, preço fixo de venda ao NPC e preço sugerido para iniciar um anúncio. O jogador escolhe o preço no mercado. As armas e vestimentas também têm nível, slot, defesa, ataque quando aplicável e regeneração de Ki. A fonte de verdade é o [catálogo compartilhado](../public/shared/sistemas/catalogo-itens.mjs).

## Obtenção

- O personagem recém-criado começa com camisa, calça, braçadeiras e botas de iniciante já equipadas. Personagens já salvos recebem a entrega uma vez ao entrar. A entrega preenche os encaixes livres mesmo quando a mochila está acima do limite. Personagens que já receberam o conjunto preservam o equipamento e o estoque.
- A missão permanente **Primeira patrulha** entrega armadura e botas de patrulha após 12 abates. As peças exigem nível 5 e a recompensa é resgatada uma vez.
- Há 55 itens com sorteios específicos por abate e probabilidades fixas por espécie. O Bestiário usa as mesmas tabelas. O Cristal Azul é comum e disputa o sorteio de materiais com a Sucata em todos os mobs. A Semente 15% tem um sorteio independente.
- A Armadura Saiyajin tem 1,35% em Nappa, 1,1% em Raditz, 0,85% em Bardock e 2,1% no Rei Vegeta. As três peças mais fortes da Força Freeza são exclusivas do Freeza BOSS.
- As outras 35 peças têm fonte futura indicada e chance proposta. A associação usa o portador ou a família do equipamento. Esses itens entrarão no loot normal quando a respectiva fonte existir no jogo. O God Mode permite conferi-los pela ferramenta de teste, sujeito à capacidade da mochila.

## Atributos e comércio

- Peças equipadas dão bônus individuais, permitindo combinar peças de famílias diferentes. Por exemplo, a Armadura Celestial de Elite dá 35 de defesa e 6,4 Ki/s, enquanto a Calça de Goku dá mais defesa e Ki/s que a Calça Celestial de Elite. As Botas de Vegeta recuperam mais Ki/s que a armadura de Vegeta. Os valores iniciais usam a escala atual de Ki e o dreno de transformação do jogo.
- A regeneração das peças funciona durante combate, Auto Hunt e transformação. O servidor soma os bônus, aplica o dreno da forma e limita o saldo de Ki ao máximo do personagem. O nível ativo define quais peças podem ser equipadas e quais bônus são aplicados. Se o nível cair ao ajustar ou desligar o God Mode, a peça permanece no encaixe e o bônus fica suspenso até o requisito voltar a ser atendido.
- A mochila mostra peso, raridade, nível, defesa, Ki/s, ataque quando aplicável e preço pago pelo NPC. Passe o mouse sobre a peça para ver a ficha. Arraste da grade até o encaixe correspondente para equipar. Para desequipar, arraste a peça vestida até um espaço livre da grade ou sobre uma pilha da mesma peça.
- As peças vestidas ficam nos slots de equipamento. Peso e espaço da mochila são cobrados pelos itens guardados nela. Para vender ao mercador ou anunciar no mercado de jogadores, a peça deve estar na mochila.
- Fruta de Namek restaura **1 Ki/s por 60 s**. Carne de Porunga restaura **6 HP/s por 60 s**. Carne de Oozaru restaura **5 HP/s e 3 Ki/s por 90 s**. As três compartilham o efeito ativo com o Presunto.
- Poção de Energia restaura **15% do HP máximo** instantaneamente e compartilha a recarga da Poção de Ki. A opção no Auto Hunt fica desativada por padrão e usa um limite configurável de HP (padrão de 50%). Se as duas poções estiverem habilitadas, tiverem estoque e atingirem os respectivos limites, o Auto Hunt prioriza o recurso com menor porcentagem restante. Em caso de empate, prioriza HP. Os quatro itens podem ser usados pela mochila ou pela barra e continuam negociáveis.
- O Auto Hunt segue com o Presunto e a Poção de Ki nas automações existentes. Ao usar consumíveis de loot durante a caça, o Hunt Analyzer considera seu valor de venda ao NPC como custo de oportunidade.
- O [relatório de loot e recompensas](AUDITORIA_LOOT_E_RECOMPENSAS.md) relaciona os mobs ativos, as 35 peças pendentes e propostas para missões e VIP.

## Benefícios da Store

- As poções de XP (+10%, +15% e +20%) custam 80, 120 e 160 moedas premium. O bônus começa ao usar o item e dura 8 horas de hunt, com o personagem vivo e conectado, inclusive em combate manual. O relógio pausa fora das hunts e no God Mode. Só uma poção por vez. O Perfil mostra o estado e o tempo restante.
- O VIP concede +30% de XP enquanto durar e soma com a poção de XP.
- Os extensores (+10% e +20%) custam 200 e 350 moedas premium. O extensor é equipado no encaixe de mochila e dura 8 horas enquanto equipado e conectado. O tempo pausa ao retirar. Ao expirar, o limite retém o peso já carregado acima da capacidade normal e só desce conforme o personagem libera peso. Os itens pesam 0,2 kg (poção) ou 0,3 kg (extensor).
- A Store confirma quantidade e custo total antes de descontar o saldo. Poções e extensores podem ser comprados em lotes de até 99 unidades.
- Compras entram na mochila e podem ser usadas ou negociadas no Market. Se faltar espaço ou capacidade, ficam em **Entrega pendente** na Store para recolhimento posterior. Itens Store têm borda vermelha e podem ser negociados no Market antes do primeiro uso.
- Em desenvolvimento, **Limpar efeitos e VIP** no God Mode remove a poção, a comida e o extensor ativos do personagem e encerra o VIP da conta.

## Market

O inventário de anúncio aceita itens da mochila e das entregas pendentes da Store de qualquer lugar. O primeiro espaço oferece Zeni Dourado da carteira da conta em troca de Zeni comum. O saldo anunciado fica reservado, e a compra transfere Zeni Dourado direto à carteira do comprador. Compras, cancelamentos e recebimento do saldo de vendas continuam no mercador.

## Venda ao NPC

- **Vender Tudo** vende à tabela do NPC todas as pilhas elegíveis da mochila. A seleção inclui Sucata, Cristal Azul e os materiais, armas e armaduras comuns, incomuns ou raros. Consumíveis, peças épicas e lendárias e o que está equipado ficam fora dos lotes.
- **Selecionar itens** abre um inventário de venda com os mesmos itens elegíveis. Marque os itens, ajuste quantidades e confira o total antes de usar **Vender apenas selecionados**. A venda avulsa continua disponível para consumíveis e peças especiais.
- O servidor recalcula o valor pelo catálogo, confere a proximidade do mercador geral e valida o lote inteiro antes de alterar a mochila ou o saldo. O lucro do Hunt Analyzer usa essa tabela de NPC como referência, sem depender do preço de anúncios do market.

## Economia da Auto Hunt

- Quando o sorteio de materiais é bem-sucedido, a fatia de Cristal Azul é de 16% na maioria dos mobs, 36% na Sentinela de Elite, 65% no Comandante Sentinela, 44% no Nail e 38% no Porunga. O restante cai como Sucata. A calibração preserva aproximadamente o valor esperado de venda desse grupo a 80% de chance de loot.

- Materiais comuns e incomuns sustentam a venda regular. Materiais raros têm preço maior e saem com mais frequência que equipamentos raros. O **Manto Branco Rasgado** cai no Nail a **3%** e no Piccolo Daimaoh a **7%**, vale **42 Z** e ocupa **0,18 kg**. A chance vem do mob e cada item tem seu próprio sorteio.
- Materiais mais leves, como asas e antenas, ocupam menos espaço que carne, pele e fragmentos. O Cristal Azul ocupa 0,09 kg e vale 21 Z ao NPC. Cristais roxos antigos são convertidos um por um no inventário, nos slots e nos anúncios ativos. O peso continua limitando a coleta em sessões prolongadas.
- A Venda ao NPC paga os materiais pelo valor da tabela. Para os equipamentos de loot, usa 25% do preço base de cada peça, arredondado ao Zeni inteiro. O preço sugerido no market continua vinculado ao preço base e o jogador define o preço do anúncio. As peças iniciais e de missão mantêm a venda definida para cada recompensa.
- Mobs até o nível 29 rendem 5 a 9 Z por abate. A partir do nível 30, o limite inferior e o superior recebem um bônus de 8 Z mais 0,55 Z por nível acima de 25, arredondado para baixo. O Bestiário mostra a faixa calculada pelo servidor. Chefes raros concedem 100 Z diretamente, além do loot próprio.
- Presunto custa **12 Z**, Poção de Ki **18 Z** e Semente 15% **90 Z**. Comida automática ativa com **90% de HP ou menos** quando o efeito anterior acabou. As outras duas continuam seguindo os limites configurados no Auto Hunt. A ficha de lucro considera o custo de reposição dos consumíveis usados.
- **Saldo sem vender equipamento** no Hunt Analyzer soma Zeni ganho e valor de NPC dos materiais e consumíveis recolhidos e subtrai o custo de reposição. **Saldo total a preços de NPC** também inclui equipamento recolhido. Preço de anúncio e itens que ficaram no chão ficam fora dessas contas.

### Peças e defesa

| Peça | Nível | Defesa | Ki/s | Fonte |
|---|---:|---:|---:|---|
| Armadura de Patrulha Saiyajin | 5 | +4 | 0,32 | Primeira patrulha |
| Manto de Piccolo | 40 | +9 | 1,30 | Nail, Piccolo Daimaoh e Neva |
| Armadura Saiyajin | 65 | +12 | 0,70 | Nappa, Raditz, Bardock e Rei Vegeta |
| Armadura de Bardock | 96 | +20 | 1,40 | Bardock e Rei Vegeta |
| Proteção de Cintura da Força Freeza | 116 | +10 | 1,32 | Freeza BOSS 22%, Zarbon 0,55%, Dodoria 0,30% |
| Capacete da Força Freeza | 121 | +13 | 1,72 | Freeza BOSS 25% |
| Botas da Força Freeza | 122 | +14 | 1,80 | Freeza BOSS 24% |
| Armadura da Força Freeza | 140 | +26 | 2,55 | Freeza BOSS 20% |
| Traje de Broly Super | 145 | +27 | 2,30 | Broly 0,35% |

O multiplicador de dano recebido é `100 / (100 + 3 × defesa)`, com arredondamento e variação de combate. Por exemplo, um Goku nível 140 recebe cerca de 17% menos dano ao equipar a Armadura da Força Freeza, comparado com a defesa básica do mesmo personagem. No nível 67, a rodada de Vegeta nos Cânions com equipamento recebeu 2.281 de dano e gastou 12 Z. Sem equipamento, recebeu 3.366 e gastou 48 Z. Abaixo da faixa, no nível 48, recebeu 4.512, gastou 192 Z e terminou com saldo operacional de −59 Z.

### Medições e projeções

52 rodadas cobriram as nove hunts de Namekusei e do Planeta Vegeta, as duas vocações e perfis equipado, sem equipamento e abaixo da faixa. As rodadas duraram 90 s simulados ou até a primeira morte, com nível fixo, automação de consumíveis ativa e sementes reproduzíveis. A última faixa de Zeni foi aplicada aos abates observados, pois ela só altera o valor recebido por abate. A coluna de saldo exclui venda de equipamento.

As projeções de 1, 4 e 8 horas usam o ritmo e a proporção de recolha observados. Elas descontam reposição dos consumíveis e limitam o valor recolhido pelo peso disponível, estimando queda na receita de loot quando a mochila enche. São cenários condicionados a manter o ritmo da amostra e ter suprimentos suficientes. O limite de pilhas, evolução de nível, competição, mortes futuras e viagens ao mercador podem mudar o saldo de uma sessão real.

| Hunt | Nível equipado | Abates em 90 s | Saldo observado (Z) | Nível abaixo · saldo (Z) | Projeção 1 h | Projeção 4 h | Projeção 8 h |
|---|---:|---:|---:|---:|---:|---:|---:|
| Planícies de Namekusei | 6 | 31 a 39 | 276 a 435 | — | 9.968 a 11.193 | 31.568 a 36.273 | 60.368 a 69.713 |
| Campo de Batalha | 15 | 21 a 28 | 504 a 582 | 7 · 195 a 353 | 10.005 a 10.319 | 29.493 a 30.767 | 55.477 a 58.031 |
| Planalto do Porunga | 25 | 33 a 37 | 700 a 864 | 15 · 241 a 268 | 14.684 a 15.597 | 40.532 a 44.205 | 74.996 a 82.349 |
| Cratera de Nail | 35 | 5 | 60 a 109 | 23 · -239 a -102 | 2.984 a 3.784 | 11.425 a 14.440 | 12.609 a 18.664 |
| Planícies Vermelhas | 51 | 5 a 6 | 160 a 249 | 31 · -85 a 26 | 8.280 a 9.291 | 31.830 a 32.646 | 50.774 a 54.150 |
| Cânions | 67 | 4 a 8 | 222 a 449 | 48 · -59 a 237 | 8.659 a 17.256 | 34.638 a 58.705 | 60.411 a 102.449 |
| Floresta Seca | 89 | 3 a 5 | 218 a 402 | 56 · -33 a 151 | 8.773 a 13.182 | 35.093 a 52.726 | 67.524 a 93.764 |
| Campos de Lava | 117 | 3 a 4 | 226 a 340 | 82 · 12 a 103 | 9.941 a 14.672 | 39.762 a 55.961 | 79.525 a 94.745 |
| Grande Cratera | 139 | 3 a 5 | 291 a 437 | 99 · 42 a 262 | 12.549 a 19.284 | 50.195 a 77.136 | 97.653 a 139.257 |


Para conferir uma rodada em memória, sem alterar saves:

```sh
node ferramentas/simular_economia_hunts.mjs vegeta 90 27183 namek
node ferramentas/simular_economia_hunts.mjs goku 90 12345 vegeta-cratera
```
