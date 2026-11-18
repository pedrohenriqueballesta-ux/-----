# Hunt Analyzer

Branch: feature/hunt-analyzer, criada da origin/main atualizada.

No Auto Hunt, abra “Hunt Analyzer”. A sessão inicia na primeira atividade de caça automática e pausa ao desligar, morrer, sair da hunt ou desconectar. Pausar e retomar conserva os totais; “Iniciar nova sessão” zera apenas as métricas. Reentrar no personagem inicia outra sessão. Não há tempo offline.

XP/h usa XP de mobs dividido pelo tempo ativo, inclusive atravessando níveis. Dano e cura contam HP efetivo, sem overkill, cura excedente ou ataques bloqueados. Contam apenas loot recolhido e consumíveis utilizados com sucesso (comida, poção e cada potência de semente). Recuperação de nível/respawn e reposição do God Mode não são cura. Uso de God Mode identifica a sessão como teste.

Saldo estimado = Zeni de mobs + loot recolhido avaliado pelo preço de venda ao NPC − supplies usados ao preço de compra do NPC. Comprar/vender no mercado não soma novamente os itens. Ki das skills não tem custo monetário. Os valores não modificam carteira ou inventário.

O catálogo atual não define raridade. O agrupamento usa o campo opcional `raridade` de ITENS_NEGOCIAVEIS, com fallback “Não definida”; nenhuma raridade ou chance de drop foi inventada. Cadastrar a classificação de balanceamento nesse catálogo habilita os grupos automaticamente.

Validação: npm test, npm run check. Testes específicos: node --test tests/hunt-analyzer.test.mjs. Para testar no jogo, entre numa hunt, ligue Auto Hunt, abra a análise, acompanhe os totais, pause e retome, e use nova sessão. Compare supplies com o estoque e teste cura perto do HP máximo.
## Modo minimizado
O botão “Iniciar nova sessão” fica no início da análise expandida. Recolher a análise ou fechar o Auto Hunt mantém um painel compacto com tempo, XP/h, saldo e gráfico de XP/h (até 60 amostras, a cada 5 segundos de tempo ativo). O painel compacto é arrastável pelo cabeçalho e guarda sua posição. A seta expande novamente a análise; não há botão para fechar o acompanhamento. A tela de login oculta o painel e a troca de personagem limpa as amostras locais. O gráfico é coletado apenas enquanto o navegador recebe snapshots; não representa histórico anterior à conexão.

Verificação adicional: navegador desktop e 420×740, botão único no topo, gráfico com três amostras, minimizar mantendo painel visível e restaurar por clique real. Sintaxe e cinco testes específicos passaram.
## Abates, mortes e visibilidade do gráfico
A análise tem abas “Resumo”, “Abates” e “Mortes”. O Loot Tracker abre automaticamente quando a Auto Hunt começa, em uma janela flutuante independente, posicionada logo acima do Hunt Analyzer minimizado e com as mesmas dimensões. A janela só pode ser estendida na vertical; ao crescer, mantém a base junto ao Hunt Analyzer. Abrir o painel Auto Hunt fecha as duas janelas compactas. O cabeçalho arrasta o Loot Tracker; o X fecha. O botão “Abrir Loot Tracker” no Auto Hunt abre novamente a janela. O Tracker registra item e raridade assim que o mob gera o drop, mesmo que o jogador não o recolha; compartilha a sessão, pausa, retomada e reset do Hunt Analyzer. O valor de loot do Analyzer continua considerando apenas itens recolhidos. Como o catálogo ainda não classifica os itens, eles aparecem em “Não definida”. Os encontros são agrupados por tipo de monstro, área e condição de chefe, mostrando nome, quantidade e último instante no tempo ativo da sessão. Chefes usam a classificação existente de combate (incluindo raros). O golpe fatal registra a morte antes de zerar HP e desligar a caça; golpes em monstros/jogadores já mortos não duplicam registros. Só eventos durante a caça ativa contam. Reset limpa também os encontros, sem afetar personagem ou combate.

O gráfico compacto agora fica oculto com Auto Hunt OFF, inclusive morte ou saída da hunt; ao retomar a caça ele volta, mantendo as métricas da sessão. O painel completo continua consultável com a caça desligada. Validado em navegador (abas, contagens, destaque de chefes, ciclo ON/OFF/ON) e suíte completa: 303 testes passando.
## Sprites e mortes com caça desligada
Abates e mortes exibem o retrato da sprite correspondente, reutilizando o desenho e as folhas do bestiário com cache. A lista só é reconstruída quando os registros mudam.

Mortes agora são registradas com Auto Hunt ON ou OFF, inclusive antes da primeira caça da conexão. A linha identifica o monstro responsável pelo golpe fatal e quantas mortes ocorreram com a automação desligada. Isso não inicia o cronômetro, não reativa a caça e não soma abates/XP fora da caça automática. O tempo indicado é o tempo ativo acumulado no registro, que permanece pausado em OFF. Não duplica golpes após a morte. Validado por testes e navegador; suíte completa: 305 testes passaram.

O gráfico minimizado fica oculto sempre que a janela do Auto Hunt estiver aberta, mesmo com a análise recolhida.
