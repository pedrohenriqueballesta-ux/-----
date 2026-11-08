# Consumíveis nas hotkeys 7 e 8

Abra a mochila e arraste Presunto, Poção de Ki ou qualquer potência de semente para o slot 7 ou 8 da HUD. O slot passa a exibir o item, quantidade e recarga correspondentes. Atribuir é apenas um atalho: não move nem consome estoque. Materiais e slots de skills 1–6 não aceitam atribuição.

Clique no slot ou use 7/R e 8/Q. O servidor resolve o item salvo e usa o mesmo caminho de consumo existente, respeitando estoque, vida/Ki cheios, efeito ativo e cooldown. Duas hotkeys com sementes compartilham a recarga; a atribuição não zera timers. O item continua vinculado quando acaba, e o slot continua aceitando drop durante recarga ou sem estoque. A potência escolhida na automação continua independente da semente vinculada manualmente.

Configuração salva por personagem no servidor em hotkeysConsumiveis. Saves antigos recebem semente da potência selecionada no slot 7 e poção no 8. Ícones e tooltips usam os dados do item vinculado. Durante o arrasto, evita reconstruir o slot de origem e suprime clique acidental ao soltar.

Validação: testes de whitelist, estoque, rejeição de slots inválidos/materiais, consumo único, recarga compartilhada, comida, persistência e migração de saves. Navegador em servidor temporário sem saves reais: entrar com personagem de QA, arrastar comida da mochila para 8, conferir que atribuir preserva estoque e pressionar 8 para usar exatamente uma unidade e exibir a recarga.

## Remover atalho
Arraste o consumível do slot 7 ou 8 da HUD para a janela aberta da mochila. O servidor remove somente a vinculação e mantém o slot vazio, inclusive no save e na reconexão. Estoque, peso, efeitos e cooldowns não mudam: os itens já pertenciam à mochila. A hotkey vazia não usa nada e aceita novo drop. Cancelar/soltar fora da mochila mantém o item vinculado; um arrasto antigo não remove um item trocado depois.

Verificado no jogo com conta temporária: equipar comida em 8, usar uma unidade, devolver para a mochila, conferir slot vazio e estoque preservado, e pressionar 8 sem consumo adicional. Suíte completa: 313 testes passaram.