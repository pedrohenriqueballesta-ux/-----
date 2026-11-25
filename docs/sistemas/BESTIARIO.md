# Bestiário

A aba Bestiário fica entre Missões e Mapa na HUD superior. O menu mantém os dez ícones alinhados, com espaçamento reduzido para conservar a largura. A arte fornecida foi recortada com transparência.

A janela possui busca por inimigo/local, filtro de planeta e categoria. Lista as 21 combinações de espécie/hunt presentes no mundo, incluindo chefes raros ainda não nascidos. Espécies antigas reservadas e sem nascimento no mundo não aparecem como disponíveis.

A API de consulta `/api/bestiario` deriva a lista dos mobs registrados pelo servidor e consulta as fichas de `enemies.mjs`. Não expõe posições, aggro atual ou dados dos jogadores. HP, ataque, defesa e XP são valores de referência, sem interferência da vida atual ou efeitos de combate.

A faixa de nível mostrada é a recomendação da hunt, não uma garantia de vitória contra o chefe. Chefes raros têm aviso sobre grupo/equipamento. Também são mostrados ataques, agressividade, percepção, perseguição, renascimento e a troca de forma do Freeza.

Recompensas de Zeni e probabilidades estão centralizadas em `public/shared/sistemas/recompensas-mobs.mjs`, reutilizadas pelo combate e pela consulta. O material depende da chance de loot do personagem. Quando o sorteio é bem-sucedido, ele entrega Sucata ou Cristal Azul, na proporção definida por espécie. A Semente dos Deuses de 15% tem chance independente de 0,8%. XP e inventário continuam decididos no servidor. Os percentuais exibidos consideram os atributos do personagem ao abrir/selecionar uma ficha.

Para testar: atualizar com Ctrl+F5, abrir o livro na HUD, buscar um mob, filtrar por planeta/categoria e selecionar Freeza ou Oozaru Dourado para conferir os avisos e respawn. Conferir o menu recolhido em telas pequenas. O bestiário é não modal: a caça continua; digitar na busca não ativa atalhos. Escape fecha a janela.
