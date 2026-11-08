# Passe de Batalha horizontal

Branch: feature/battle-pass, criada de origin/main após merge #65.

## Configuração e comportamento
- public/shared/premium-config.mjs: TEMPORADAS, datas explícitas (primeira temporada de 01/11/2026 a 01/12/2026 UTC, 30 dias), 50 níveis, 1.000 XP por nível, Premium de 500 moedas, seis missões e 100 recompensas.
- XP_ATIVIDADES_PASSE: 1 XP por inimigo derrotado e 50 adicionais por chefe. Missões dão os valores pedidos. XP independente do personagem e limitado a 50.000; não há extras configurados.
- Adicionar a próxima temporada à lista com ID único e datas sem sobreposição. Ao chegar a data, troca automaticamente; sem próxima temporada configurada, encerra sem permitir compras/resgates.
- Missões diárias renovam à meia-noite UTC; semanais na segunda-feira UTC. Concluir missões do jogo significa resgatar com sucesso sua recompensa, sem contar missões do próprio Passe.
- Materiais usam o item existente sucata; não foi criado um sistema de evolução. Baús têm conteúdo fixo descrito e entregam os recursos diretamente, sem criar outro inventário ou sorteio.
- Premium é da conta e só da temporada. Recursos vão para o personagem que resgata, moedas e cosméticos para a conta. Mochila cheia não marca o resgate nem entrega recursos parcialmente.

## Persistência e migração
O estado canônico está em conta.battlePass.temporadas, salvo junto de inventário e carteira no save JSON atômico existente. Eventos do personagem ativo referenciam esse mesmo estado. Migração automática considera os saves de todos os personagens, mantém maior XP (não soma cópias), une Premium e recompensas recebidas, e une missões do mesmo período usando o maior contador. Saves antigos não voltam a ser importados após a migração. XP antigo é preservado numericamente, sob o novo custo de nível; resgates antigos permanecem recebidos.

Compras e recompensas usam validação no servidor, execução síncrona antes da persistência e resposta de sucesso somente após salvar. Reenvio não duplica recompensa. Compra mantém a confirmação idempotente existente. Nenhuma rota aceita XP/contadores livres do cliente. God Mode não gera progresso nem permite resgatar recompensas.

## Interface
50 colunas horizontais, Premium acima e Grátis abaixo, destaque do nível atual, cadeados, checks verdes, brilho disponível, prévia ampliada, feedback de XP/nível/resgate premium. Rolagem pela roda, botões, setas com foco na trilha, arraste com mouse e toque nativo. Em telas pequenas também há rolagem vertical para acessar todos os controles. Posição horizontal é preservada nas atualizações. Janela usa o sistema existente de mover/redimensionar.

## Testar
1. npm run dev e abrir http://localhost:3000. Atualizar o navegador após reiniciar o backend.
2. Entrar no personagem, abrir o ícone Battle Pass no HUD central. Conferir Recompensas e Missões do Passe.
3. Caçar sem God Mode, usar técnicas e resgatar missões reais; conferir XP e contadores. Missões do Passe exigem resgate do XP pelo botão.
4. Em desenvolvimento, usar os pacotes simulados da Store para obter 500 moedas e comprar o Premium. Não há pagamento real.
5. Alcançar um nível, resgatar, trocar de personagem e verificar que o progresso e os resgates permanecem. Repetir clique/reconectar não entrega de novo.
6. Testar mochila cheia, celular, roda/arraste e prévias. npm test cobre migração, limite de XP, ciclos de missões, temporada seguinte, cotação na virada, capacidade, compartilhamento e persistência real após reiniciar.

## Artes e integrações pendentes
Poções, sementes, Zeni, cristais e sucata reutilizam sprites existentes. Traje, auras, título, moldura, efeito Celeste, montaria e prêmio final usam imagens ilustrativas. Precisam de sprites próprias e da integração de equipar/exibir cosméticos no personagem; esta entrega registra sua posse na coleção e informa essa limitação nas prévias. Nenhum bônus de combate foi criado. Baú usa a arte Store como ilustração; pode receber ícone próprio.

## Arquivos
Modificados: public/shared/premium-config.mjs, battle-pass.mjs, missoes.mjs, game.mjs; server.mjs; server/premium.mjs; public/render/battle-pass-hud.mjs, premium-comum.mjs; public/style.css; tests/premium.test.mjs, premium-servidor.test.mjs.
Criados: tests/battle-pass-conta.test.mjs e este relatório.
