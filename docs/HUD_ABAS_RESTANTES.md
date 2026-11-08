# Abas restantes do HUD

Branch: feature/hud-abas-restantes, criada de origin/main (3b71fc4). Sem commit, push, PR ou merge automático.

## Funcionalidades

- Personagem: sprite desenhada pelo drawGoku existente, forma atual, nível, XP, HP/Ki, atributos base, bônus reais do ataque, buffs ativos, velocidade, peso, drop e eliminações. Não existe raça configurada, equipamento funcional nem distribuição de pontos. Ataque de Ki não é um atributo separado: as técnicas aplicam multiplicadores do ataque. Poder de combate é um indicador informativo derivado de HP/10 + Ki/10 + ataque×5 + defesa×3, sem efeito no dano; o ranking usa a mesma fórmula com atributos permanentes.
- Configurações: qualidade (redução de sombras), partículas e intensidade decorativas, números de dano, barras de vida no mapa, limite de 30/60/120 FPS, escala da HUD, opacidade das novas janelas, dicas/acompanhamento e redução de animações destas janelas. Os golpes e avisos de área continuam visíveis. Avisos comuns podem ser ocultados na tela, permanecendo no chat. Preferências usam o save existente por jogador. Há acesso ao Auto Hunt existente e salvamento manual/restauração dos padrões.
- Missões: catálogo modular com nove objetivos principais, secundários, diários e semanais. Eventos confirmados de mortes, coleta de drops e ativações aceitas alimentam os contadores. O nível histórico alimenta os objetivos de progressão. Recompensas em XP, Zeni e itens validam carteira, peso e estoque antes do resgate. Acompanhamento opcional na HUD. God Mode não acumula contadores novos nem permite resgatar recompensas; missões de nível usam o nível real.
- Mensagens: lista de conteúdo publicado pelo servidor com remetente, data, prévia e leitura completa; filtros, leitura individual/todas, arquivo e recompensas. Não se pode arquivar recompensa pendente. IDs de recompensas recebidas persistem mesmo depois que a mensagem sai da lista. Convites e solicitações reais de guilda aparecem na central e levam à aba de resposta. Nenhum anúncio oficial, presente ou evento fictício foi incluído no jogo normal.
- Ranking: jogadores reais conhecidos pelo servidor, incluindo contas salvas e desconectadas. Categorias de nível/XP, poder, eliminações, chefes raros e guildas; 20 registros por página, empates com posição compartilhada, destaque do próprio jogador mesmo fora da página e resumo ao selecionar. Contas em God Mode não participam. O escopo é este servidor, não um ranking global entre instalações independentes.
- Guildas: criação (nome/sigla únicos, descrição, emblema de um catálogo e nível mínimo), busca, solicitação, aceite/recusa, convite, lista de membros, cargos, edição de aviso/descrição, expulsão, transferência de liderança e saída. O último membro encerra a guilda; líder com outros membros precisa transferir antes de sair. Todas as permissões são validadas no servidor. Limites: 50 membros, 30 solicitações/convites por guilda, 200 guildas. Pontuação é a soma de eliminações dos membros atuais; não foi inventado nível de guilda, banco ou guerra/PvP.

## Persistência e integração

Preferências, missões e correio ficam nos registros existentes dos personagens; guildas ficam em __guildas no mesmo data/save.json que contas e mercado. Saves anteriores migram com estados vazios/padrão. Identidades públicas usam mercadoId estável, sem expor tokens de sessão. /api/hud é autenticada; consultas e operações não confiam em campos de permissão enviados pelo cliente. Resgates e operações sociais persistem antes da resposta HTTP de sucesso.

Períodos de missão usam o relógio do servidor: dia UTC e semana iniciada segunda-feira UTC. Chaves dos períodos e resgates são persistidas. Missões permanentes não reiniciam. Novas missões e recompensas propostas estão definidas em public/shared/missoes.mjs para balanceamento posterior; não alteram o desbloqueio já existente de regiões ou habilidades.

As seis abas compartilham uma janela não modal, com ícone alternando abrir/fechar, botão × e Escape. O mundo/Auto Hunt continua simulando. Campos e janela impedem atalhos acidentais; fechar libera as teclas. Consultas de ranking/guilda só ocorrem com a aba aberta, a cada 5/4 segundos. Não existem timers de consulta criados por reabertura. O visual da barra superior e seus ícones não foram alterados. Mochila, Bestiário, Mapa e Loja mantêm suas implementações.

## Recursos ainda indisponíveis

Áudio: falta um motor de áudio/conteúdo sonoro; explicitamente indicado, sem controles decorativos. Atalhos são fixos nesta versão e não existe remapeamento a restaurar. Mensagens privadas entre jogadores não foram habilitadas. Equipamentos, banco/nível de guilda e ranking entre servidores independentes dependem de sistemas futuros. Ranking e guildas deste servidor têm backend real e não dependem de dados fictícios.

## Arquivos criados

- public/shared/preferencias.mjs, perfil.mjs, missoes.mjs, correio.mjs, guildas.mjs, hud-servidor.mjs.
- public/render/hud-elementos.mjs, abas-hud.mjs, perfil-hud.mjs, configuracoes-hud.mjs, missoes-hud.mjs, correio-hud.mjs, ranking-hud.mjs, guildas-hud.mjs.
- tests/hud-abas.test.mjs e docs/HUD_ABAS_RESTANTES.md.

## Arquivos modificados

- public/shared/characters.mjs: novos campos persistidos.
- public/shared/game.mjs: eventos confirmados, ações, perfil e snapshot.
- public/shared/novidades.mjs: metadados e recompensas confiáveis do correio.
- public/render/novidades-hud.mjs: alertas de missões e guildas.
- public/client/hud.mjs: integração das novas abas e preferências.
- public/client/game.mjs: aplicação das opções gráficas e limite de FPS.
- public/style.css: estilos isolados das janelas novas.
- server.mjs: consultas autenticadas, operações sociais e persistência.
- package.json: novos módulos incluídos na verificação de sintaxe; sem dependências adicionais.

## Verificações

- npm.cmd run check; npm.cmd test: 272 testes passaram.
- Testes novos: preferências e perfil, eventos de missão, validação/duplicidade dos resgates, UTC diário/semanal, histórico do correio, hierarquia e cargos após restauração, ranking/paginação/empates, autorização HTTP, persistência após reiniciar e resgates concorrentes.
- Navegador desktop 1400×900 e móvel 420×740: abrir/alternar/fechar as seis abas, Escape, salvar preferência e recarregar, resgatar e acompanhar missão, leitura e recompensa de mensagem, selo de notificação, ranking, criação/entrada em guilda com dois jogadores, permissões e menus existentes.
- Combate e Auto Hunt continuaram com perfil aberto: três eliminações confirmadas também produziram progresso 3/15 na missão diária. Limite de 30 FPS salvo; teclado retomou o movimento e cancelou a caça ao fechar.
- Os dados de mensagens/recompensas e níveis utilizados em QA ficaram exclusivamente nos servidores temporários sem salvamento. O servidor principal usa seu progresso normal.
- Sem novos erros de console no roteiro final. Existem avisos prévios do projeto para IDs de HUD antigos ausentes, ignorados pelo adaptador existente. Casos encontrados e corrigidos: importação antecipada da arte em testes Node, restauração indevida de cargo de guilda e abertura de abas antes do primeiro snapshot.

## Como testar

Execute npm.cmd start e abra http://localhost:3000. Use os seis ícones existentes. Abra Personagem para conferir atributos, Configurações para salvar uma preferência e atualizar a página, Missões para acompanhar objetivos e resgatar os concluídos. Correio fica vazio se nenhum conteúdo real tiver sido publicado pelo servidor. Em Ranking consulte o escopo do servidor. Em Guildas crie um grupo; com uma segunda sessão solicite entrada, aceite como líder e teste cargos e saída. Para testar caça, entre em uma hunt, ligue Auto Hunt e abra as janelas; a simulação deve continuar normalmente.
## Ajustes adicionais: janelas e vocação

- Cabeçalhos das janelas permitem arrastar com mouse/toque; botões e campos não iniciam o movimento. Posições ficam salvas no localStorage e são limitadas à tela ao abrir/redimensionar; duplo clique no cabeçalho restaura a posição padrão. As seis novas abas usam a posição compartilhada de sua janela. Auto Hunt mantém seu controlador próprio.
- Um coordenador fecha a janela anterior antes de abrir outra, incluindo Mochila, Mapa, Loja, Bestiário e Auto Hunt. Loja e Mapa agora abrem sem bloquear os ícones superiores. Escape fecha a janela ativa mesmo com foco fora dela.
- Ranking de jogadores inclui nome e sprite da vocação. Goku é a única opção registrada. A vocação é persistida no personagem e enviada pelo servidor; saves anteriores recebem Goku. public/shared/vocacoes.mjs registra as vocações e public/render/vocacao-retrato.mjs usa os desenhistas existentes; futuras opções precisam registrar sua implementação real.
- Novos arquivos desta revisão: public/render/janelas-hud.mjs, public/render/vocacao-retrato.mjs, public/shared/vocacoes.mjs e tests/janelas-hud.test.mjs. Também foram ajustados o arrasto compartilhado, a apresentação do ranking, a persistência e as aberturas de Loja/Mapa.
- Validação adicional: testes de fechamento exclusivo, arrasto/restauração e vocação; navegador com arrasto real, troca entre todas as abas, restauração após recarregar e sprite não vazia no ranking desktop/móvel. Suíte atual: 275 testes.