# Auditoria de assets gráficos e sistema de HUD

**Escopo:** documentação técnica do frontend presente em `origin/main` (`cea7f6d`) e do pacote visual de referência disponível em `/tmp/dragonball-hud-kit/DragonBallIdle_Kit_Oficial_Prototipo_Aprovado`. Nenhum arquivo do jogo ou asset foi alterado nesta auditoria. O diretório extraído em `/tmp` é uma cópia de inspeção, não faz parte do repositório.

## Resumo executivo

- **40 superfícies e famílias de interface** inventariadas, incluindo os estados da entrada, overlays, janelas e HUD permanente.
- **23 famílias de componentes visuais** identificadas; a lista detalhada está na seção 2.
- **4 PNGs novos recomendados**: quatro nuvens independentes, uma para cada canto. Os recortes correspondentes do kit têm pedaços de moldura e precisam ser refeitos antes de uso isolado.
- **28 famílias de componentes adequadas a CSS** (incluindo componentes híbridos cuja estrutura e comportamento continuam em CSS), discriminadas na seção 6.
- **60 arquivos gráficos diretamente relacionados à interface já estão no repositório**: 34 em `public/assets/hud`, 21 em `public/assets/premium` e 5 em `public/assets/inventario`. Eles são candidatos a reaproveitamento; sprites de personagem, cenário e efeitos são recursos do jogo, não substitutos de peças de HUD.
- O kit de referência contém **35 PNGs individuais e 2 folhas originais**. Ele está fora da branch e não conta como asset já integrado. Há bons candidatos reutilizáveis, mas os painéis têm proporções fixas e os recortes das nuvens não estão limpos.
- Principal risco de integração: estilos de várias gerações convivem em `public/style.css`, com regras adicionadas em blocos posteriores, tipos diferentes de diálogo e mais de um container rolável em certas telas. Isso favorece bordas duplicadas, conteúdo cortado e barras de progresso com preenchimento repetido se imagens e CSS desenharem a mesma peça.

## Método e convenções

Foram inspecionados `public/index.html`, os módulos de entrada e de renderização em `public/client/` e `public/render/`, os três arquivos CSS, os assets HUD/inventário/premium existentes e o manifesto, CSS de exemplo e folhas do kit aprovado. As proporções do manifesto do kit são medidas declaradas no próprio manifesto; a presença de canal alfa dos ornamentos e botões foi consultada nos PNGs. A aparência e a limpeza dos recortes foram avaliadas contra as folhas de origem e a demonstração.

Para contar **40 superfícies**, cada linha da seção 1 representa uma experiência visual que pode ser auditada ou receber tratamento visual próprio. Itens explicitamente agrupados (por exemplo, gauges HP/Ki/EXP) contam como uma família. As **23 famílias de componentes** na seção 2 são categorias transversais, não uma contagem de instâncias HTML. As **28 famílias CSS** da seção 6 são grupos de regras/componentes recomendados; a contagem não equivale ao número de seletores CSS.

Classificação usada:

- **A — PNG transparente:** ilustração ou ornamento cuja forma precisa preservar desenho próprio.
- **B — CSS:** estrutura, geometria, texto, estado ou controle que precisa responder ao conteúdo e à tela.
- **C — Híbrido:** estrutura/comportamento em CSS com detalhe visual em PNG.
- **D — Asset existente:** arquivo disponível no projeto, apto a ser reaproveitado após validação no tamanho de uso.

## 1. Interfaces encontradas

| # | Superfície | Elementos e comportamento observados | Módulo/arquivo principal |
|---:|---|---|---|
| 1 | HUD permanente e navegação | Marca, menu responsivo com 12 destinos, conexão e atalhos | `public/index.html`, `public/style.css` |
| 2 | Resumo do personagem | Retrato, nome, nível, HP, Ki, EXP, Zeni, capacidade e acesso à janela de status | `public/index.html`, `public/client/hud.mjs` |
| 3 | Alvo selecionado | Nome e HP do alvo; aparece e some conforme seleção | `public/index.html`, `public/client/hud.mjs` |
| 4 | Indicadores HP/Ki/EXP e peso | Trilha, preenchimento, texto/valor e mudança com estado | `public/index.html`, `public/style.css` |
| 5 | Barra de habilidades e consumíveis | Slots, atalhos, bloqueio, recarga, ativação, quantidade e buffs | `public/index.html`, `public/render/atalhos-hud.mjs` |
| 6 | Minimapa | Área, zoom, indicadores, centralização, arrasto e clique para navegação | `public/index.html`, `public/render/minimapa.mjs` |
| 7 | Chat | Canais, histórico rolável, setas, campo e envio | `public/index.html`, `public/client/hud.mjs` |
| 8 | Painel e controles de Auto Hunt | Iniciar/pausar, ataque/técnicas, cura, poções, sementes, comida e limites | `public/index.html`, `public/client/hud.mjs` |
| 9 | Hunt Analyzer expandido | Sessão, resumo, abates, mortes e dados roláveis dentro do Auto Hunt | `public/index.html`, `public/render/hunt-analyzer.mjs` |
| 10 | Hunt Analyzer minimizado | Status, gráfico de XP/h, tempo e saldo estimado | `public/index.html`, `public/render/hunt-analyzer.mjs` |
| 11 | Loot Tracker | Janela móvel, status e drops agrupados por raridade | `public/index.html`, `public/render/hunt-analyzer.mjs` |
| 12 | Mochila e equipamentos | Grade de 30 slots, filtros, peso, Zeni, silhueta, equipamento, minimizar, cadeado e redimensionamento em grade | `public/index.html`, `public/client/hud.mjs` |
| 13 | Perfil do personagem | Sprite atual, forma, XP, atributos e montaria Nimbus | `public/render/perfil-hud.mjs` |
| 14 | Missões | Filtro, resgate individual/coletivo, capacidade, cards, progresso e acompanhamento | `public/render/missoes-hud.mjs` |
| 15 | Faixa de missão acompanhada | Nome e andamento fora da janela de Missões | `public/render/abas-hud.mjs` |
| 16 | Bestiário | Catálogo, retratos e informações dos inimigos | `public/render/bestiario.mjs` |
| 17 | Mapa | Canvas da área, posição/local e lista de áreas; consulta, sem viagem pelo mapa | `public/index.html`, `public/render/minimapa.mjs` |
| 18 | Portal / escolha de destino | Cards de planeta ou hunt e fechamento | `public/index.html`, `public/client/hud.mjs` |
| 19 | Mercado NPC | Comprar/vender, recursos, estoque e confirmação pelo fluxo de loja | `public/index.html`, `public/render/loja.mjs` |
| 20 | Store premium | Saldo, catálogo, coleção, histórico e confirmação | `public/render/store.mjs`, `public/render/premium-comum.mjs` |
| 21 | Battle Pass | Nível, progresso, trilhas de recompensas, prévia e resgates | `public/render/battle-pass-hud.mjs`, `premium-comum.mjs` |
| 22 | Ranking | Listas e posições dos jogadores | `public/render/ranking-hud.mjs` |
| 23 | Guildas | Lista, detalhes, convites e solicitações | `public/render/guildas-hud.mjs` |
| 24 | Correio e novidades | Filtros, lista, leitura, arquivamento, recompensas e convites | `public/render/correio-hud.mjs`, `public/render/novidades-hud.mjs` |
| 25 | Configurações e atalhos | Preferências, áudio, sliders, alternadores, ações da conta e tabela de teclas | `public/render/configuracoes-hud.mjs` |
| 26 | God Mode | Configuração, nível, recursos infinitos e catálogo de itens | `public/index.html`, `public/render/godmode-hud.mjs` |
| 27 | Login, cadastro e recuperação | Entrar, criar conta, redefinir senha e campos de credencial | `public/client/entrada.mjs`, `public/entrada.css` |
| 28 | Chave de recuperação | Exibição, cópia e continuação | `public/client/entrada.mjs`, `public/entrada.css` |
| 29 | Seleção de personagens | Lista, seleção, entrar/criar personagem e sair/trocar conta | `public/client/entrada.mjs`, `public/entrada.css` |
| 30 | Criação de personagem | Campo de nome, vocação Goku, validação e retorno | `public/client/entrada.mjs`, `public/entrada.css` |
| 31 | Estado de carregamento da entrada | Indicador animado e mensagem enquanto entra no mundo | `public/client/entrada.mjs`, `public/entrada.css` |
| 32 | Detalhe de notícia | Modal com conteúdo completo | `public/client/entrada.mjs`, `public/entrada.css` |
| 33 | Tutorial | Painéis e tabela de atalhos, incluindo comportamento em telas menores | `public/client/tutorial.mjs`, `public/style.css` |
| 34 | Janela flutuante de status | Popout independente com estado do personagem | `public/client/stats-popout.mjs`, `public/client/status-popout.mjs`, `public/status-popout.css` |
| 35 | Controles de toque | Joystick e knob móveis | `public/index.html`, `public/style.css` |
| 36 | Avisos transitórios | Notificações/feedback, alertas de nível, loot e mensagens de ação | `#notifications`, renderizadores e `public/style.css` |
| 37 | Derrota e retorno | Overlay de personagem derrotado e instrução de retorno | `#respawn`, `public/index.html` |
| 38 | Aviso de Safe Zone | Estado protegido, instrução para sair e continuar a caça | `#safeZoneAviso`, `public/index.html`, `public/render/safe-zone.mjs` |
| 39 | Tooltips de habilidade e item | Informação contextual ancorada no alvo e no conteúdo | `public/render/detalhes-habilidades.mjs`, renderização de inventário |
| 40 | Confirmações e transição de portal | Confirmação de resgate/compra e animação de viagem | módulos de Missões, premium e `public/render/teleporte.mjs` |

**Observação:** portal/mapa, Loja NPC/Store premium e as variantes de entrada são fluxos visuais diferentes, apesar de compartilharem controles. As abas Personagem, Ajustes, Missões, Correio, Ranking e Guildas usam um diálogo funcional compartilhado que é montado pelo módulo de abas.

## 2. Componentes encontrados

As **23 famílias** transversais observadas ou necessárias são:

1. Botão de ação: primário, secundário, terciário, destrutivo e ação de navegação.
2. Botão de ícone: fechar, minimizar, expandir, travar, centralizar, enviar, voltar e avançar.
3. Abas e filtros selecionáveis.
4. Cabeçalho de janela, título, subtítulo e ações de janela.
5. Moldura de janela modal, não modal e painel compacto.
6. Painel permanente, painel lateral e contêiner de HUD móvel.
7. Card/listagem para missão, item, recompensa, loja, personagem e inimigo.
8. Slots de inventário e equipamento.
9. Slots de habilidade e consumível com estados de combate.
10. Campos de texto, busca, número, senha e seleção.
11. Checkbox, alternador ON/OFF, slider e seletor de quantidade.
12. Scroll container e scrollbar vertical/horizontal.
13. Barra de progresso e seus estados de valor/limite.
14. Badges, contadores, indicadores de raridade e status.
15. Ícones de menu, item, moeda, personagem e ação.
16. Avatar/retrato e miniatura de sprite.
17. Tooltip/popover.
18. Toast, banner e mensagem de estado.
19. Confirmação e estado de carregamento.
20. Controles móveis/toque.
21. Controles de arrasto, trava e redimensionamento.
22. Campo de chat e mensagens por canal.
23. Gráficos de sessão e indicadores resumidos.

### Botões e estados

| Categoria | Uso atual/necessário | Tratamento recomendado |
|---|---|---|
| Primário | Entrar, comprar, confirmar, resgatar, aplicar e iniciar | CSS compartilhado, variante azul ou dourada por importância; hover, pressionado, foco e desativado |
| Secundário | Acompanhar, cancelar, voltar e ações auxiliares | CSS, contraste inferior ao primário; hover, pressionado, foco e desativado |
| Terciário/ícone | Navegação, abas, expandir/recolher, centralizar e enviar | CSS; área de toque mínima constante e foco visível |
| Desativado/bloqueado | Ação indisponível por nível, estoque, estado ou requisito | CSS e texto/tooltip explicando condição; não depender só de cor |
| Fechar/minimizar/restaurar | Diálogos e janelas flutuantes | CSS com glifo/ícone; botão de fechar vermelho do kit é opcional onde o estilo aprovado pedir destaque |
| Comprar/resgatar/equipar | Catálogo, Missões, Passe e mochila | Variantes do primário/secundário; estado concluído/indisponível expresso no texto e visualmente |
| Quantidade/adicionar/remover | Estoque e seletores quando visíveis | CSS; desativar limites e preservar o valor atual |
| Carregando | Login, requisições e ações assíncronas | Manter dimensões estáveis; spinner CSS e `aria-busy` |

**Estados comuns a cobrir:** normal, hover, pressionado, foco de teclado, selecionado/ativo, desativado/bloqueado e carregando. Seleção de aba não deve ser confundida com hover. Loading só é necessário para ações assíncronas. Não há justificativa para exportar um PNG por estado: CSS pode derivar os estados de uma mesma base. PNG independente só se justifica para um ícone ilustrado que não possa ser obtido dos assets existentes.

### Molduras e comportamento

| Tipo | Onde se aplica | Solução indicada |
|---|---|---|
| Janela grande | Missões, Bestiário, Store, Passe, mapa | Moldura CSS responsiva; ornamentos nos quatro cantos como camada independente; conteúdo rolável interno |
| Janela média/vertical | Perfil, Configurações, Correio, Ranking, Guildas, mochila | CSS com largura por breakpoint e altura limitada ao viewport; layout interno sem deformar arte |
| Painel lateral/compacto | Auto Hunt, Analyzer, Loot Tracker | CSS com dimensões próprias, cabeçalho estável e corpo rolável separado |
| HUD permanente | Status, alvo, minimapa, chat, habilidades, automação | CSS compacto; ornamentação mínima para manter a cena visível |
| Card | Missão, prêmio, item, personagem, mob | CSS; imagem do conteúdo é o asset de jogo ou catálogo existente |
| Tooltip/notificação/confirmar | Contexto transitório | CSS com camada/z-index e limites de viewport; sem moldura de tela completa |

Janelas redimensionáveis não devem usar uma imagem inteira esticada. A borda CSS cresce com o conteúdo; ornamentos PNG independentes ficam em camada absoluta com `pointer-events:none`. Se uma textura de moldura completa for necessária, usar 9-slice com medidas verificadas e sem escalar os cantos. Em todos os casos, separar `header`, `body` rolável e moldura externa; só o `body` deve rolar.

### Cards e slots

- **Inventário/equipamento:** manter grade CSS e ícones de itens existentes. Estados: vazio, ocupado, foco/hover, selecionado/arrastando, item equipado e item indisponível. Quantidade e raridade são conteúdo dinâmico, não devem estar embutidas na imagem do slot.
- **Habilidades/consumíveis:** manter atlas/ícones atuais. Estados: pronto, cooldown, ativo, bloqueado por nível, sem Ki/estoque, alvo inválido e slot de consumível configurável. O fundo e o aro do slot podem ser CSS.
- **Missões:** estado disponível, andamento, concluída, resgatada e bloqueada; uma barra de progresso apenas; card e texto com contraste suficiente.
- **Store/Battle Pass:** item normal, VIP/premium, selecionado, disponível para resgate, resgatado e bloqueado. Reutilizar PNG de catálogo atual e construir o card em CSS.
- **Personagem/mob:** retrato ou sprite existente com seleção/raridade em CSS. Evitar cortar cabeça/sprite dentro de avatar redondo; usar `object-fit:contain` ou recorte de sprite já existente.

## 3. Assets existentes e reutilizáveis

### No projeto (`public/assets`)

| Local | Contagem | Uso atual ou potencial |
|---|---:|---|
| `public/assets/hud/` | 34 arquivos | Ícones de menu, controles de capacidade, cadeado, mapa, correio, guilda, missões, bestiário, mochila, personagem, ranking, loja, alerta e Zeni; inclui subpastas de slots/equipamento e comida |
| `public/assets/premium/` | 21 arquivos | Store/Battle Pass animados, catálogo e caixa; preservar imagens e GIFs atuais |
| `public/assets/inventario/` | 5 arquivos | Comida, cristal, sucata, poção de Ki e semente |
| **Total diretamente relacionado** | **60 arquivos** | Reutilizar conforme finalidade; validar dimensões, alpha e legibilidade no tamanho final |

Também há retratos/sprites de personagens, mobs, técnicas, itens e mundos espalhados por `public/assets` e `public/art`. Esses recursos são **D** quando já correspondem ao conteúdo mostrado; não devem ser redesenhados como ícones genéricos nem copiados para um kit paralelo. O repositório contém 330 PNGs no total em `public/assets`, mas a maioria é arte de jogo (sprites, mapas, itens e efeitos), não peças estruturais de HUD.

### Pacote de referência aprovado — fora do repositório

O pacote inspecionado tem 35 PNGs no manifesto: 8 molduras/painéis, 12 botões/setas, 6 controles, 4 cards e 5 ornamentos; há ainda duas folhas gráficas originais. Arquivos são candidatos a reutilização visual, não assets integrados ou aprovados tecnicamente para qualquer escala.

**Reaproveitar após validação:** botões longos azul/dourado/cinza, abas, fechar, cadeado, setas, esfera, campos compactos/busca/select, cards e painéis quando mantidos na proporção natural ou renderizados com 9-slice calculado. Os PNGs do pacote têm canal alfa declarado para ornamentos e botões consultados. As proporções originais diferem; não definir um tamanho comum esticando a imagem. Painéis de janela têm razões como 849×448, 515×425 e 339×391, o que indica peças ilustradas de proporção fixa, não fundos universais.

**Não considerar prontos para aplicação direta:** `canto-superior-*` e `canto-inferior-*`. O manifesto indica que são recortes da folha de molduras; eles incluem partes da borda/painel junto com a nuvem. Esse conteúdo pode invadir cabeçalho e corpo quando sobreposto a uma moldura CSS, como já aconteceu nos testes visuais. A folha completa pode ser usada como referência de redesenho, mas não como fundo interativo nem como recorte de screenshot.

O kit traz `scroll_vertical.png` e imagens de fundo/preenchimento de barra, mas CSS é preferível para manter funcionalidade independente do conteúdo e do tamanho. As barras em PNG só devem ser adotadas se forem aplicadas como uma única camada visual, sem `progress` ou pseudo-elemento também preenchendo a mesma área.

## 4. Assets ausentes

### PNGs novos recomendados: 4

São os únicos PNGs novos classificados como necessários nesta auditoria. O resto da identidade pode ser implementado com CSS e assets existentes/do kit após validação. Cada nuvem precisa ser desenhada/exportada individualmente sobre transparência real, sem pixel azul, linha da moldura ou pedaço de outra peça preso ao desenho. Não cortar da imagem de referência aprovada.

| Arquivo proposto | Função/uso | Dimensão e proporção de produção | Transparência e escala | Variantes/estados | Prioridade |
|---|---|---|---|---|---|
| `cloud-corner-top-left.png` | Nuvem ornamental superior esquerda; janelas grandes e médias | 192×144 px, 4:3 | PNG RGBA; área externa 100% transparente. Reduzir proporcionalmente; não esticar | Sem estados; desenho próprio para este canto | P0 |
| `cloud-corner-top-right.png` | Nuvem ornamental superior direita; janelas grandes e médias | 192×144 px, 4:3 | PNG RGBA; área externa 100% transparente. Reduzir proporcionalmente; não esticar | Sem estados; desenho próprio, não espelhar automaticamente | P0 |
| `cloud-corner-bottom-left.png` | Nuvem ornamental inferior esquerda; janelas grandes e médias | 192×144 px, 4:3 | PNG RGBA; área externa 100% transparente. Reduzir proporcionalmente; não esticar | Sem estados; desenho próprio para este canto | P0 |
| `cloud-corner-bottom-right.png` | Nuvem ornamental inferior direita; janelas grandes e médias | 192×144 px, 4:3 | PNG RGBA; área externa 100% transparente. Reduzir proporcionalmente; não esticar | Sem estados; desenho próprio para este canto | P0 |

**Margens de integração para as nuvens:** manter o detalhe principal dentro de até 160×112 px, deixando pelo menos 16 px de transparência em cada lado. Em CSS, dimensionar por `width`/`height` proporcionais e `object-fit:contain`; posicionar sobre a moldura, sem participar do fluxo nem cobrir controles/cabeçalhos. A 1×, começar com cerca de 96×72 CSS px e ajustar visualmente nos breakpoints. A especificação de arquivo é 192×144 px para telas de alta densidade.

Não recomendo PNG novo para botão de minimizar/maximizar, scrollbar, barra de HP/Ki/EXP, missão, botão primário/secundário, slot, card ou campo. Há CSS adequado ou asset reutilizável; novos arquivos para esses usos criariam versões duplicadas do mesmo componente.

## 5. Especificações de produção e qualidade

Para os quatro PNGs da seção 4:

- Exportar em PNG RGBA com alfa real; testar sobre fundo claro e escuro e confirmar que não há retângulo opaco.
- Separar cada canto em arquivo próprio. Não juntar moldura, fundo de painel, cabeçalho, sombra da janela ou conteúdo de screenshot.
- Evitar texto e decoração que funcione como borda horizontal/vertical: ornamento deve cobrir apenas a região do canto.
- Preservar contorno e suavização sem halos de cor azul/dourada no alfa; conferir a 100% e em escala reduzida.
- Não gerar variantes hover/disabled das nuvens; a função é ornamental e sem interação.
- Codificar nomes em minúsculas, palavras separadas por hífen, dentro de `public/assets/hud/ornaments/` após aprovação da produção.
- Verificar que os quatro cantos não se sobreponham ao título, fechar, cadeado, minimizar, conteúdo rolável ou alça de redimensionamento.

### Requisitos visuais comuns aos elementos CSS e PNG

- Componentes com texto devem ajustar tamanho/flow por viewport; nunca rasterizar texto variável.
- Controles interativos devem ter foco de teclado visível, alvo tátil razoável e rótulo acessível.
- Imagens de item/personagem devem preservar proporção; usar contain para arte completa e recorte apenas quando a origem for uma sprite/ícone desenhado para isso.
- Reutilizar tokens para cores, espaçamentos, borda, sombra, raio e alturas dos controles. A moldura não deve possuir um fundo opaco que cubra o painel interno.
- Um componente visual deve ter uma fonte de preenchimento/borda. Evitar a barra em PNG sobre um `<progress>` com preenchimento visível simultaneamente.

## 6. Componentes CSS

**28 famílias recomendadas para CSS:**

1. Tokens de cor, espaçamento, raio, tipografia, sombra e escala de HUD.
2. Geometria das janelas, painel, cartão e moldura dourada.
3. Cabeçalho, área do título e layout dos botões de janela.
4. Layout responsivo de modal, painel lateral e janela móvel.
5. Botões primários, secundários, terciários e destrutivos.
6. Estados hover, ativo, selecionado, foco, desativado e carregando.
7. Abas, filtros e paginação.
8. Texto, hierarquia tipográfica e contraste.
9. Campos de texto, busca, senha e número.
10. Selects, checkboxes, switches e sliders.
11. Barras de progresso/trilhas/preenchimentos.
12. Contorno, preenchimento e slots de inventário/equipamento/habilidade.
13. Cards de conteúdo, listas e divisórias.
14. Badge, contador, selo e estado de raridade.
15. Scroll container, trilho, thumb e rolagem horizontal/vertical.
16. Posicionamento, limite de viewport e camadas de z-index.
17. Arrasto, travamento, redimensionamento e alças de janela.
18. Tooltips e popovers responsivos.
19. Toasts, avisos, confirmação e mensagens de estado.
20. Status de conexão e chips/pílulas de informação.
21. Gráfico simples de tendência do Analyzer (SVG já existente) e dados tabulares.
22. Progresso/cooldown de habilidade se expresso como arco ou trilha simples.
23. Chat, linhas, canais, composer e ação de envio.
24. Painel compacto de personagem e gauges.
25. Joystick/knob por CSS geométrico.
26. Estados de missão/battle pass e separação de recompensas.
27. Regras de desktop, tablet e celular, incluindo `dvh` e safe area.
28. Preferência `prefers-reduced-motion` e transições de estado.

### Scrollbars

Containers roláveis existentes incluem corpo do Auto Hunt, Loot Tracker, mochila/grade, diálogos funcionais e Bestiário, corpo premium, trilhas horizontais do Battle Pass, conteúdo do tutorial/tabela de atalhos, notícias e lista de personagens na entrada. Hoje alguns usam `overflow:auto` e `scrollbar-color` nativo; o Battle Pass define sua própria cor, e há uma imagem de scrollbar no kit.

**Recomendação:** CSS nativo para todas as scrollbars. Configurar `scrollbar-width:thin`/`scrollbar-color` como aprimoramento e pseudo-elementos WebKit quando necessário; manter `overflow` e gesto nativos para o funcionamento. Estados de thumb normal/hover/arrastando vêm de CSS. Evitar imagens de thumb ou trilho: uma imagem isolada não acompanha o comprimento variável, teclado, trackpad, wheel e conteúdo. Se o tratamento CSS personalizado não estiver disponível, a scrollbar nativa continua sendo fallback funcional. A scrollbar do Battle Pass horizontal pode manter affordances de cursor/arrasto sem imagem.

**Achado estrutural:** há mais de um nível com `overflow:auto` em algumas janelas. Em tamanho manual, a janela externa também passa a rolar; isso pode criar duas scrollbars e cortar canto/rodapé. O container externo deve controlar tamanho e recorte da moldura, o corpo interno deve ser o dono da rolagem, e cabeçalho/ações devem ficar fora desse corpo.

### Barras de progresso

| Barra | Construção indicada | Aparência/estados | PNG? |
|---|---|---|---|
| HP e alvo | Trilho e fill CSS, valor no estado autoritativo | Vermelho/verde conforme padrão atual, transição de largura; estado crítico pode mudar cor | Não |
| Ki | Trilho e fill CSS | Azul/ciano, transição; manter valor legível | Não |
| EXP e peso | Trilho e fill CSS | Ciano/azul; texto/valor em camada independente | Não |
| Missões | Um único fill dentro de um único trilho | Ciano, 0–100%, sem outra borda/fill duplicada | Não |
| Passe de Batalha | `<progress>` existente estilizado em CSS | Ciano, valor crescente animado; respeitar redução de movimento | Não |
| Canalização | Trilha/fill CSS conforme componente da skill | Tempo restante ou avanço único | Não |
| Cooldown | Overlay CSS/clipping ou máscara em slot existente | Escurecer a porção ainda indisponível, contador à parte | Não |
| Carregamento | Indicador CSS/animado, não barra de dado de jogo | Ocultar movimento com `prefers-reduced-motion` | Não |

**Regra anti-duplicação:** escolher um único `track` e um único elemento `fill` para cada barra. As regras já têm elementos `.barra` com `<i>` para algumas HUDs e `<progress>` em telas premium; a futura camada visual pode padronizar a aparência sem colocar um PNG de barra preenchida sobre o preenchimento existente. A barra de progresso do kit tem recortes de trilho e fill de dimensões diferentes (663×34 e 663×54 no manifesto), portanto não devem ser empilhados em suas dimensões naturais sem definir máscara/recorte.

## 7. Paleta e evidência

Os hex abaixo estão **declarados em CSS**, não amostrados de pixels da referência. Portanto são valores verificáveis no arquivo de origem, mas não uma medição colorimétrica do PNG aprovado. A imagem aprovada pode sofrer compressão/redimensionamento de exibição; não tratar cores estimadas nela como fonte primária.

### Tokens do CSS de exemplo do kit (fonte existente, kit externo)

| Função | HEX | Evidência/uso |
|---|---|---|
| Ink / azul quase preto | `#031323` | Token `--db-ink` no `03_CSS/dragon-ball-hud.css` |
| Azul-marinho | `#061d38` | Token `--db-navy` |
| Azul de cabeçalho | `#06377b` | Token `--db-header` |
| Azul de botão | `#004d9c` | Token `--db-blue` |
| Dourado | `#ffb519` | Token `--db-gold` |
| Dourado claro | `#ffe47d` | Token `--db-gold-light` |
| Ciano | `#21c7ed` | Token `--db-cyan` |
| Texto | `#f5f7fe` | Token `--db-text` |
| Contorno escuro azul | `#00254b` | Token `--db-outline` |
| Botão vermelho de fechar | `#ea2c20` → `#a90000` | Degradê de `.db-btn--close` no CSS de exemplo |

### Tokens da HUD atual em `public/style.css` (fonte existente no projeto)

| Função | HEX | Token atual |
|---|---|---|
| Dourado | `#f2b53a` | `--ouro` |
| Dourado claro | `#ffd36a` | `--ouro-claro` |
| Azul HUD | `#0d1a3a` | `--azul-hud` |
| Azul HUD escuro | `#071026` | `--azul-hud-2` |
| Azul de borda | `#3d5c98` | `--borda-azul` |
| Ciano em progressos/animações | `#6bd4ff` ou tons locais | Não há um único token oficial equivalente no CSS atual |
| Cinza desativado | filtros/opacidade e tons locais | Não há token único |

### Paleta proposta para centralização

Usar os tokens do kit como base para as janelas novas, validando visualmente com a referência antes de propagar a toda a HUD. Para cores ainda sem token específico no kit (`cinza` e `laranja de destaque`), os exemplos são **estimativas** derivadas das regras atuais: cinza `#687482`, laranja `#f27800`. Vermelho pode usar o degradê de fechar já declarado no exemplo. A amostra aprovada deve decidir o refinamento final.

| Papel | Valor recomendado | Confiança |
|---|---|---|
| Fundo profundo | `#031323` | Declarado pelo CSS do kit |
| Fundo principal | `#061d38` | Declarado pelo CSS do kit |
| Cabeçalho | `#06377b` | Declarado pelo CSS do kit |
| Botão azul | `#004d9c` | Declarado pelo CSS do kit |
| Cards | `#07335c` | Declarado no CSS do kit como valor do card |
| Dourado principal | `#ffb519` | Declarado pelo CSS do kit |
| Dourado claro | `#ffe47d` | Declarado pelo CSS do kit |
| Laranja de destaque | `#f27800` | Estimado a partir do gradiente de botão do kit |
| Ciano de progresso | `#21c7ed` | Declarado pelo CSS do kit |
| Cinza desativado | `#687482` | Estimado; requer aprovação visual |
| Vermelho crítico | `#ea2c20` → `#a90000` | Declarado como degradê de fechar no kit |
| Texto principal | `#f5f7fe` | Declarado pelo CSS do kit |
| Texto secundário | `#b7c9df` | Estimado para manter contraste; validar |
| Linha/contorno discreto | `#1673a8` | Declarado como contorno de card no kit |

Não manter simultaneamente `--ouro`/`--azul-hud` antigos e tokens `--db-*` com papéis iguais por muito tempo. A etapa de integração deverá mapear os tokens atuais a uma fonte compartilhada, preservando a barra superior aprovada e evitando alteração não solicitada da HUD permanente.

## 8. Arquitetura reutilizável proposta

1. Centralizar tokens de identidade em um arquivo CSS de tema (cores, raio, sombras, borda, altura de controle e camadas) importado uma vez por `public/index.html`.
2. Criar componentes CSS compartilhados para janela, cabeçalho, corpo, ações, card, botão, tab, campo, badge, progress e scroll region. Eles devem estilizar o DOM existente; não mudar IDs, listeners, endpoints ou contratos.
3. Aplicar ornamentos com quatro elementos decorativos próprios em `position:absolute`, cada um limitado ao canto. Definir `pointer-events:none`, `aria-hidden` e ordem de camada abaixo dos botões e acima da borda; não colocar nuvens dentro da área rolável.
4. Usar moldura composta de CSS (fundo, gradiente, borda, sombra e raio). Reservar o PNG para nuvem/arte. Se a arte de uma moldura completa do kit for escolhida, usar 9-slice apenas após medir os pixels de borda e proteger cantos sem esticá-los.
5. Separar janela em `outer frame` (tamanho/posicionamento), cabeçalho fixo e `body` rolável com `min-height:0`. A scrollbar pertence ao body, nunca ao ornamento/frame, exceto quando a janela não tiver regiões internas.
6. Tratar botões pelo papel sem incorporar texto no PNG. Reusar PNGs de ícones quando já existem; CSS faz tamanho, padding, alinhamento e estados. Variantes não mudam as dimensões dos slots.
7. Definir escala responsiva com limites por viewport (`min()`, `max()`, `dvh`) e pontos tablet/celular. O conteúdo deve reduzir/reorganizar antes de recortar; resize manual respeita mínimo legível e safe area.
8. Atribuir camadas de z-index por função: cena, HUD permanente, janela não modal, modal, tooltip/toast e entrada. Consolidar camada na classe da janela; evitar números locais divergentes.
9. Reduzir duplicação progressivamente por camada visual, não por reescrita dos renderizadores: primeiro Missões, depois janelas dinâmicas e premium, depois painéis HUD. Preservar lógica e markup funcional.

## 9. Prioridades

| Prioridade | Elementos | Motivo |
|---|---|---|
| **P0 — Missões** | Quatro nuvens limpas; moldura CSS; cabeçalho/ações; botão/abas; cards; único progresso; conteúdo/scroll separado; fechar/cantos responsivos | Corrigir sobreposições, cantos recortados, preenchimento duplicado, acessibilidade e diferenças de tela na janela já escolhida para piloto |
| **P1 — Demais janelas** | Componentes compartilhados; botões/estados; painéis/cards de Perfil, mochila, Bestiário, Mapa, Portal, Loja, Store, Passe, Ranking, Guilda, Correio, Ajustes e God Mode; tooltip/confirmações | Expandir identidade após Missões validada, sem replicar defeitos por tela |
| **P2 — HUD permanente** | Aplicação seletiva de tokens em status, alvo, gauges, habilidades, minimapa, chat e Auto Hunt; revisar popout, controle móvel e notificações | Elementos ficam sobre a cena e precisam continuar compactos; preservar a barra superior aprovada |
| **P3 — Complementar/futuro** | Acabamentos de carregamento, detalhes adicionais de raridade, variações decorativas e microanimações opcionais | Só após validação desktop/tablet e aprovação da camada principal |

## 10. Plano de produção e implementação

1. **Preparar os quatro ornamentos independentes** nas especificações da seção 4; revisar alpha, borda, halo e composição individual sobre fundos claros/escuros. O arquivo aprovado é referência, não fonte para recorte.
2. **Auditar/organizar o kit externo**: medir alpha, margens e proporções dos 35 PNGs; separar reutilizáveis, arquivos que precisam de reexportação e imagens de proporção fixa. Não copiar para o jogo antes de aprovar essa seleção.
3. **Definir tokens** que conciliem o tema do kit com tokens atuais. Preservar a barra superior e estabelecer contraste/foco e estados.
4. **Preparar moldura responsiva reutilizável** em CSS, área de cabeçalho fixa, corpo rolável único e camada de nuvens sem capturar eventos. Definir 9-slice somente para peças que realmente forem usadas como skin completa.
5. **Aplicar só em Missões**, removendo causas de duplicação visual (borda/ornamento concorrente e segundo fill) sem mudar handlers, chamadas, dados ou estrutura funcional necessária.
6. **Comparar screenshots** da janela com a referência aprovada em desktop e tablet, em tamanhos estreito/alto e largo/baixo; verificar barra superior, estados dos botões, scroll, foco, zoom do navegador e `prefers-reduced-motion`.
7. **Solicitar aprovação da janela de Missões antes de expandir para outras HUDs**. Depois, aplicar aos demais diálogos reutilizando os componentes comuns; por último, fazer aplicação seletiva às HUDs permanentes.
8. **Registrar arquivos/estados e validar visualmente** cada tela alterada. Alterações visuais futuras podem rodar `npm run check`; testes de gameplay só são necessários se houver mudança de lógica, que está fora desta auditoria.

### Problemas estruturais encontrados

1. `public/style.css` é uma folha monolítica com regras acumuladas em blocos posteriores. Há ajustes de layout e responsividade repetidos, elevando o risco de regra antiga sobrescrever componente compartilhado.
2. Janelas usam padrões diferentes: alguns diálogos são estáticos em `index.html`; outros são criados dinamicamente pelos renderizadores; alguns são diálogos modais, outros são janelas não modais e seções flutuantes. Uma mudança de estilo global precisa distinguir esses contratos.
3. Vários containers podem rolar e, em tamanhos manuais, a própria janela recebe `overflow:auto!important`. Isso pode criar rolagem dupla e cortar bordas/ornamentos em vez de manter cabeçalho e moldura fixos.
4. A referência do kit tem molduras/ornamentos em peças com escalas e proporções diferentes. Os quatro recortes de canto carregam partes da moldura, por isso seu uso como nuvem isolada gera fragmentos/sobreposição.
5. O kit mostra progresso com trilho e fill em arquivos distintos, enquanto o jogo já tem barras CSS (`.barra > i`) e `<progress>`. Sobrepor os dois sistemas produziria barra dupla; uma implementação deve escolher um único fill.
6. A paleta da HUD atual e a paleta do kit estão declaradas em tokens diferentes (`--ouro`, `--azul-hud`, `--db-gold`, `--db-navy`, etc.). Sem mapeamento, botões, bordas e fundos podem divergir entre telas.
7. Botões atuais misturam glifos/Unicode, classes e imagens de ícone. A padronização deve equalizar caixa, área de interação, foco e alinhamento sem rasterizar rótulos ou forçar tamanhos diferentes.
8. Ícones existentes devem ser preservados; assets do pacote externo não devem substituí-los. Cartões de produto do kit são bases de painel, não substitutos dos ícones de moedas/itens reais.

## Fechamento

| Medida | Resultado |
|---|---:|
| Superfícies/famílias de interface analisadas | **40** |
| Famílias de componentes transversais | **23** |
| Novos PNGs recomendados | **4** (quatro nuvens isoladas) |
| Famílias de componentes recomendadas para CSS | **28** |
| Assets HUD/inventário/premium já no repositório | **60** |
| PNGs individuais existentes no kit externo, candidatos a reutilização | **35** |
| Principais problemas | CSS acumulado, scroll aninhado, ornamentos recortados com moldura, risco de fill duplicado e paletas sem token comum |

Esta é uma auditoria e proposta de produção. Não autoriza implementar automaticamente a nova identidade nem acrescentar vocações, gameplay ou outras funcionalidades. A etapa seguinte deve começar após a revisão/aprovação deste documento e da produção dos quatro ornamentos.
