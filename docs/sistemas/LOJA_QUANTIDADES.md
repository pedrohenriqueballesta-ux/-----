# Loja: quantidades por item

Branch `feature/hud-loja`. Cada item tem ícone do inventário, preço unitário, slider e campo numérico sincronizados, preço total de compra e peso do lote. Sementes mantêm a identificação de potência.

O máximo selecionável é calculado pelo menor limite entre Zeni disponível, peso livre e estoque restante (até 99.999 unidades por item, compatível com o save). Saldo e peso são atualizados pelos snapshots; a venda de materiais e os preços existentes permanecem iguais.

A intenção de compra passa a aceitar `{ type: 'buy', item, quantidade }`. Sem `quantidade`, continua comprando uma unidade. O servidor exige inteiro positivo, item válido, proximidade do mercador, saldo suficiente, capacidade e limite de estoque para o lote inteiro. O preço enviado pelo cliente é ignorado. A transação não entrega lote parcial nem desconta Zeni ao falhar. O botão fica bloqueado durante a requisição para evitar clique duplicado.

Como testar: abrir a loja perto do mercador, arrastar a barra de um item, digitar outra quantidade e verificar o preço total. Comprar o lote e conferir estoque, saldo e peso. Quantidades inválidas, saldo/peso insuficientes e compras longe do mercador devem ser bloqueados. A loja tem rolagem em janelas pequenas.

Validação: sintaxe aprovada e 249 testes passando. No navegador foram conferidos os seis ícones, sincronização dos controles, preço total, campo vazio, clique repetido, compra de quatro unidades por 48 Z e enquadramento em 420×740.

## Compra conjunta

Os seletores de quantidade da loja começam em zero. Na aba Comprar, selecione quantidades de diferentes itens e use Comprar tudo. O resumo mostra preço e peso totais; saldo ou capacidade insuficiente desabilitam a compra. A ação buyAll valida o conjunto no servidor e entrega tudo ou nada, ignorando entradas de quantidade zero. Após sucesso, as seleções são zeradas. Preços unitários do mercado continuam exigindo ao menos 1 Zeni; quantidade zero não cria anúncio nem vende/compra itens.

Validação desta atualização: 260 testes, sintaxe e navegador (total de itens diferentes, carrinho vazio, saldo combinado, clique duplo e layout móvel).