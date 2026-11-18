# Vendas e mercado da loja

Na branch feature/hud-loja, a loja oferece Comprar e Vender / Market. A segunda aba alterna entre NPC e Mercado dos jogadores.

- NPC: consumíveis pagam 50% do preço de compra (presunto 6 Z, Ki 9 Z, sementes 45/105/240/700 Z). Sucata mantém 8 Z e cristal 15 Z.
- Mercado: jogador define quantidade e preço por unidade, sem taxa. Itens saem da mochila e ficam reservados; compras podem ser parciais. Até 20 anúncios por conta e 1000 por servidor.
- Vendedor pode permanecer desconectado. O saldo fica disponível em Receber saldo; excedentes do limite da carteira permanecem reservados.
- Cancelamento devolve o restante se houver espaço na mochila. Negociações exigem proximidade do mercador, personagem vivo e conexão válida.
- Ofertas são globais às áreas desse servidor. Revisões no snapshot atualizam a lista aberta em tempo real; filtros permitem buscar item/vendedor ou ver apenas anúncios próprios.
- Contas, estoque reservado e créditos são salvos juntos em data/save.json, via arquivo temporário e renomeação. Saves antigos continuam compatíveis. Não se trata de mercado compartilhado entre processos/servidores distintos.
- Registro extensível em public/shared/itens-negociaveis.mjs. Só os itens atualmente existentes são negociáveis; equipamentos futuros precisarão registrar seus dados e, caso únicos, implementar suas instâncias.
- Transações do mercado usam saldo real mesmo em God Mode, evitando pagar outros jogadores com Zeni fictício.

Validação: npm.cmd run check e npm.cmd test (256 testes). Testes cobrem preços, quantidade, peso, saldo, reserva, compra parcial, cancelamento, vendedor offline, créditos, concorrência HTTP e reinício com persistência. Navegador: publicação, atualização de ofertas de outro jogador, compra, recebimento de saldo e janela com rolagem em 420×740.

Para testar: aproxime-se do mercador, abra a loja e selecione Vender / Market. Use uma segunda sessão/jogador para comprar anúncios e verificar o saldo do vendedor. Alterações ainda sem commit/push.