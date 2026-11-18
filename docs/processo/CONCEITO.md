# Dragon Ball Idle — conceito inicial
Versão 0.9 • 27 de outubro de 2026

Este documento registra o jogo que estamos construindo em conjunto. As decisões do usuário ficam separadas das propostas de implementação. Nome definitivo, elenco de lançamento e números de balanceamento continuam em aberto.

## 1. Decisões confirmadas

| Aspecto | Decisão |
| --- | --- |
| Plataforma | Jogo para navegador. |
| Visual | 2D visto de cima, como um RPG clássico. O estilo de desenho e a escolha de pixel art continuam em aberto. |
| Mundo | Mundo aberto, com regiões de dificuldades diferentes e mobs próprios. |
| Presença online | Jogadores se encontram e se veem no mapa em tempo real. |
| Personagens | Escolher personagens marcantes de Dragon Ball. Foram citados Goku, Vegeta, Freeza, Majin Boo, Cell, Bills e Gohan, entre outros. |
| Classes | Desenvolver gradualmente, considerando as características dos personagens no anime. |
| Primeiro personagem a desenvolver | Goku, escolhido pelo usuário em 27 de outubro de 2026. |
| Movimento | Controle por teclado ou toque. |
| Combate | Ataques básicos e técnicas podem ser usados manualmente ou automatizados. |
| Caça automática | O jogador pode escolher uma região e ativar a automação para caçar. |
| AFK | Fortalecer o personagem deixando o jogo aberto enquanto estiver longe do computador. |
| Desafio manual | Habilidade do jogador deve fazer diferença nos combates difíceis. |
| Progressão | Fortalecer o personagem, liberar novos poderes e enfrentar monstros e jogadores mais fortes. |
| Técnicas do Goku | Desenvolvimento e desbloqueio conforme a evolução do nível do personagem. Os níveis exatos e a forma de aprimorar cada técnica ainda serão definidos. |
| Transformações do Goku | Desbloqueadas ao alcançar determinados níveis. Níveis específicos, efeitos, ativação e manutenção ainda serão definidos. |
| Evolução dos atributos | Automática ao subir de nível, seguindo o perfil da classe/personagem escolhido. Sem distribuição manual de pontos de atributos. |
| Status que evoluem | Vida, mana, ataque, defesa, cura, capacidade da mochila em peso, chance de drop de loot e mobilidade. Outros status podem ser definidos depois. |
| Recuperação | A comida concede recuperação de vida ao longo de um período. Sementes dos Deuses curam instantaneamente, têm níveis de potência e serão raras e caras no mercado. Haverá poções de recuperação de Ki/mana. |
| Recarga das sementes | Cada uso inicia um intervalo obrigatório antes de usar outra semente. Ter estoque não permite cura instantânea consecutiva sem espera. Duração a definir. |
| PvP | Combate entre jogadores permitido somente em regiões específicas. |

O objetivo do projeto atual é exclusivamente esta ideia de Dragon Ball idle para navegador. Propostas do antigo jogo de sobrevivência não fazem parte deste documento.

## 2. Experiência que queremos construir

O jogador escolhe um personagem, explora as regiões e encontra inimigos adequados ao seu momento de evolução. Pode lutar manualmente, automatizar parte do combate ou ativar a caça completa na região escolhida.

Ao avançar, libera poderes e passa a enfrentar ameaças maiores. A relação entre habilidade e atributos é central: o controle manual pode permitir superar um desafio difícil; depois de evoluir, aquele mesmo desafio pode tornar-se viável durante a caça automática.

Esse comportamento é uma meta de design. Precisará ser verificado com um combate jogável e ajustado por testes.

### Automação — organização proposta

Três controles permitem expressar as escolhas do jogador:

- **Ataque básico automático:** executa o ataque básico contra um alvo válido ao alcance.
- **Técnicas automáticas:** usa um conjunto de habilidades configurado.
- **Caça automática:** conduz a busca, a aproximação e o combate contra mobs dentro da região escolhida.

Ainda precisamos definir como esses controles se relacionam, como o jogador retoma o movimento manual e como a automação reage a morte, falta de recursos, desconexão e ataques de outros jogadores.

AFK com a sessão aberta está confirmado. Recompensas com o navegador fechado não foram definidas.

### Combate — possibilidades para testar

Ataques inimigos anunciados, projéteis evitáveis, posicionamento, alcance e momento de uso das técnicas podem dar valor ao controle manual.

Custos de Ki, recuperação, esquiva, prioridades das técnicas e transformações são propostas a detalhar por personagem. Seus números ainda não foram estabelecidos.

## 3. Mundo e PvP

As regiões comuns permitem a presença de vários jogadores e combate contra os mobs. As regiões específicas de PvP permitem também combate entre jogadores.

**Proposta de apresentação:** mostrar os limites de PvP no mapa e indicar claramente a regra da região na interface.

**Proposta técnica:** o servidor valida a elegibilidade de cada alvo e a regra da região em todos os tipos de dano, incluindo projéteis e efeitos de área. A marcação visual acompanha a regra efetiva do combate.

Continuam em aberto:

- Se os mobs são disputados, compartilhados ou instanciados.
- Como dividir experiência e recompensas entre participantes.
- Se haverá grupos, chefes cooperativos ou canais de mapa.
- O que acontece ao morrer.
- Como a caça automática reage ao PvP.
- Como funcionam fronteiras de combate, desconexão e reconexão.
- Como viajar entre regiões.

## 4. Primeiro teste jogável proposto

Este recorte testa os pilares do jogo. Seu conteúdo é uma sugestão de trabalho e não define o tamanho do jogo final.

| Parte | Recorte sugerido |
| --- | --- |
| Personagem | Goku é o primeiro personagem escolhido para desenvolver. |
| Cenário | Um pequeno mapa conectado, com obstáculos e duas áreas de caça de dificuldade diferente. |
| Inimigos | Um mob de aproximação e outro com ataque anunciado que possa ser evitado. |
| Combate | Ataque básico e duas técnicas, disponíveis para uso manual ou automático. |
| Progressão | Experiência, crescimento automático dos atributos conforme a classe e desbloqueio de uma habilidade por nível. |
| Automação | Caça limitada à região selecionada e opção de retomar o controle. |
| Multiplayer | Duas sessões reais conectadas, vendo a movimentação e o combate. |
| PvP | Um setor delimitado onde o dano entre jogadores fica habilitado. |

### O que esse teste precisa demonstrar

1. Movimentação e combate funcionam com teclado e controles de toque.
2. Dois jogadores reais se veem e recebem o mesmo resultado de combate.
3. É possível usar ataques e técnicas manualmente e por automação.
4. A caça permanece na região escolhida e continua evoluindo o personagem com a sessão aberta.
5. O controle manual ajuda a superar pelo menos um ataque inimigo evitável.
6. Dano entre jogadores é recusado fora da área PvP e permitido dentro dela conforme a regra definida.
7. Experiência e dano são calculados pelo servidor.

A sessão com dois jogadores é um teste inicial de integração. A capacidade de jogadores simultâneos dependerá de implementação, hospedagem e testes de carga.

## 5. Base técnica sugerida e primeira implementação

Pesquisa realizada em 27 de outubro de 2026. As opções abaixo foram recomendações iniciais.

**Implementação entregue no protótipo 0.1:** Canvas 2D no navegador e servidor Node.js com módulos JavaScript, HTTP e transmissão de estado por SSE. A escolha permite executar o teste sem dependências externas. Phaser, TypeScript e Colyseus permanecem candidatos para uma evolução posterior; não são dependências do código entregue.

| Camada | Opção | Papel no projeto |
| --- | --- | --- |
| Jogo no navegador | Phaser + TypeScript | Câmera, mapas, sprites, animações, controles e apresentação do combate. |
| Desenvolvimento do cliente | Vite | Servir o projeto durante o desenvolvimento e gerar os arquivos de publicação. |
| Multiplayer | Colyseus + Node.js/TypeScript | Sincronizar jogadores e executar a simulação compartilhada no servidor. |
| Dados duráveis | Banco de dados a escolher | Guardar personagens, experiência, poderes e progresso entre sessões. |

**Justificativa:** Phaser é voltado a jogos 2D de navegador e admite JavaScript/TypeScript. Colyseus fornece uma base para servidores de jogo com estado compartilhado em tempo real. A combinação atende às necessidades descritas; a adequação prática deve ser validada pelo teste proposto.

O navegador apresenta o jogo e envia intenções, como mover, atacar e ativar a caça. O servidor verifica essas ações e calcula posições válidas, acertos, dano, recompensas e experiência.

Para AFK, a simulação proposta roda no servidor enquanto a sessão estiver elegível, com política de conexão e reconexão a definir. A interface não deve ser a única responsável por contar o tempo de caça.

A publicação do cliente e a hospedagem do servidor de jogo precisam ser planejadas separadamente. Provedor e custos não foram escolhidos.

## 6. Referências oficiais consultadas

- [Phaser — apresentação](https://phaser.io/oss/docs/phaser/getting-started/what-is-phaser): características do motor 2D para navegador e uso de TypeScript.
- [Template oficial Phaser + Vite + TypeScript](https://github.com/phaserjs/template-vite-ts): projeto inicial com licença MIT. O package.json consultado declara Phaser 4.0.0; a versão final do nosso projeto ainda será selecionada.
- [Colyseus — documentação](https://docs.colyseus.io/): servidor autoritativo e sincronização de estado.
- [Tutorial oficial de Phaser com Colyseus](https://docs.colyseus.io/learn/tutorial/phaser): referência de integração para múltiplos jogadores, movimentação e sincronização.
- [Código do tutorial](https://github.com/colyseus/tutorial-phaser): o README declara código sob MIT e assets de demonstração sob CC0. O código e suas dependências ainda precisam de revisão antes de serem incorporados ao nosso projeto.

Consultar a documentação da mesma versão usada no código será parte da configuração. Os exemplos são referências de integração; as regras e o conteúdo do nosso jogo serão implementados conforme as decisões deste documento.

## 7. Primeiro personagem: Goku

**Confirmado pelo usuário:** Goku será desenvolvido primeiro.

**Confirmado sobre a progressão:** técnicas e transformações do Goku são desbloqueadas conforme a evolução do nível do personagem. Os atributos evoluem automaticamente segundo o perfil da classe/personagem, sem distribuição manual de pontos.

**Situação da ficha:** repertório, efeitos, custos, níveis específicos de desbloqueio, regras de aprimoramento e funcionamento das transformações durante o combate continuam como propostas. O nível como requisito de desbloqueio de técnicas e transformações está confirmado.

### Identidade de jogo proposta

- **Versão inicial:** Goku adulto, na forma base.
- **Estilo:** lutador versátil, combinando combate corpo a corpo, ataques de Ki e mobilidade.
- **Ponto forte:** adaptar o combate à distância e aproveitar aberturas do adversário.
- **Decisão central:** administrar o Ki entre causar dano, reposicionar e preparar um golpe mais forte.
- **Classe:** nome e relação com raça, personagem e especialização ainda serão definidos junto aos demais personagens.

### Repertório proposto

| Ação ou técnica | Papel no jogo proposto | Decisão no controle manual |
| --- | --- | --- |
| Socos e chutes | Ataque básico de curta distância para sustentar o combate. | Aproximar, atacar e reposicionar ao reconhecer uma ameaça. |
| Rajada de Ki | Projétil rápido de menor custo, como opção de ataque à distância a desenvolver. | Escolher alcance, direção e oportunidade do disparo. |
| Kamehameha | Golpe direcional com preparação, custo de Ki e compromisso de posicionamento. | Alinhar o disparo e escolher a abertura para carregar e soltar. |
| Imagem Residual / Zanzo-Ken | Reposicionamento curto com efeito de imagem residual, adaptado para evitar uma ameaça. | Escolher direção e momento da utilização. |

**Ação geral sugerida:** concentrar-se para recuperar Ki, assumindo uma janela de vulnerabilidade. A recuperação de energia precisa ser definida para todos os personagens; não será tratada como uma habilidade exclusiva do Goku.

Para o primeiro teste jogável, o recorte sugerido permanece ataque básico + Kamehameha + Imagem Residual. A rajada e as evoluções entram depois de validarmos esse núcleo.

### Caça automática proposta

O jogador seleciona as habilidades que podem ser usadas automaticamente e suas prioridades. Exemplos de configurações a testar:

- Usar ataques básicos para concluir inimigos fracos.
- Reservar uma quantidade de Ki antes de liberar técnicas mais caras.
- Priorizar Kamehameha contra um alvo resistente ou um grupo bem alinhado.
- Escolher se a técnica de mobilidade entra na automação.

Manual e automático utilizam as mesmas regras de dano e custo. A vantagem do jogador ativo vem da escolha de alvo, direção, posicionamento e momento de agir. A automação deve seguir a configuração disponível, com comportamento que possa ser observado e compreendido.

### Evolução das técnicas por nível e transformações

**Regra confirmada:** a evolução de nível determina o acesso às técnicas do Goku. Uma técnica nova é liberada no marco de nível definido para ela. A progressão de habilidades e status segue automaticamente o perfil da classe/personagem; o jogador não precisa distribuir pontos de atributos. Valores e efeitos de cada etapa ainda serão definidos.

**Proposta de interface:** mostrar as próximas técnicas, o nível necessário e o progresso até o próximo desbloqueio. Isso dá uma meta visível para a caça manual e automática.

**Sequência ilustrativa a discutir, sem níveis numéricos definidos:**

| Etapa proposta | Repertório sugerido |
| --- | --- |
| Início | Socos, chutes e rajada de Ki. |
| Primeiros avanços | Kamehameha e Imagem Residual. |
| Avanços posteriores | Kaioken e Genkidama, em marcos a definir. |

A ordem é uma sugestão de design. Não estabelece a cronologia da obra nem uma distribuição de níveis já aprovada.

- **Aprimoramento automático:** o desenvolvimento segue a progressão de nível da classe/personagem. Os ganhos de poder, eficiência e demais efeitos de cada técnica ainda serão definidos.
- **Kaioken:** técnica temporária de amplificação. A proposta de jogo inclui benefício de combate e algum custo ou desgaste; tipo, intensidade e limite dependem de balanceamento.
- **Genkidama:** técnica futura com preparação prolongada e oportunidade de alto impacto. Condições de uso e interação com grupos continuam em aberto.
- **Super Saiyajin:** proposta de primeira transformação importante, liberada por um marco de nível. O nível exato e os efeitos ainda serão discutidos.
- Formas posteriores e poderes de outras fases da história serão desenvolvidos gradualmente.

A lista não fixa níveis de desbloqueio nem multiplicadores de poder do anime. Técnicas e transformações são liberadas por marcos de nível. A progressão precisa funcionar com os mobs, o multiplayer e as regras de PvP escolhidas para o jogo.

### Ativação das transformações — proposta a discutir

O desbloqueio por nível e a ativação durante o combate são regras distintas. Como proposta inicial, a forma aprendida fica disponível no personagem; o jogador decide quando ativá-la, e sua manutenção utiliza Ki. Uma configuração de transformação automática também pode ser avaliada.

Essa proposta de ativação e consumo de Ki ainda não foi confirmada. Transformações específicas, efeitos, custos, combinações possíveis e requisitos de manutenção serão detalhados depois. Os níveis de desbloqueio devem ser definidos junto com o tempo de evolução desejado, para dar sentido a cada marco.

### Exemplo de desafio para testar a habilidade

Um inimigo sinaliza um golpe de área. O jogador usa a Imagem Residual para sair da zona de impacto, se posiciona na recuperação do inimigo e responde com Kamehameha.

O teste deve verificar se esse ciclo é legível, responsivo e recompensador. Com atributos maiores, o mesmo inimigo pode tornar-se adequado para a caça automática.

### Referências de personagem

As fontes abaixo sustentam os nomes e características gerais das técnicas. Alcance, controles, custos, recargas, condições de automação e efeitos de balanceamento são propostas nossas.

- [Compêndio oficial de técnicas do Goku](https://en.dragon-ball-official.com/news/01_140.html): Kamehameha e Zanzo-Ken.
- [Goku na saga Red Ribbon — perfil oficial](https://en.dragon-ball-official.com/news/01_1866.html): uso de Kamehameha e Imagem Residual.
- [Kaioken — explicação oficial](https://en.dragon-ball-official.com/news/01_277.html): técnica de amplificação temporária do Ki e das capacidades do usuário.
- [Senhor Kaioh — perfil oficial](https://en.dragon-ball-official.com/news/01_657.html): treinamento de Goku e aprendizado de Kaioken e Genkidama.

## 8. Crescimento automático das classes

### Decisões confirmadas

Ao subir de nível, o personagem aumenta suas habilidades e status automaticamente conforme a classe selecionada. O jogador não escolhe em quais atributos investir.

A lista citada pelo usuário inclui:

| Status | Definição confirmada e detalhe pendente |
| --- | --- |
| Vida | Evolui automaticamente com o nível e a classe. Quantidade e fórmula a definir. |
| Mana | Evolui automaticamente. Ki é uma sugestão de nome para esse recurso no jogo; a nomenclatura final está em aberto. |
| Ataque | Evolui automaticamente. Relação entre dano físico e técnicas de energia ainda será definida. |
| Defesa | Evolui automaticamente. Fórmula de redução de dano a definir. |
| Cura | Evolui automaticamente. A regeneração de vida ao longo do tempo vem do efeito temporário de comida; o efeito exato do atributo Cura sobre essa recuperação e os demais consumíveis ainda será definido. |
| Capacidade da mochila em peso | A capacidade de carregar itens aumenta com o nível e a classe. Pesos dos itens e comportamento da mochila cheia a definir. |
| Chance de drop de loot | Evolui automaticamente. Taxas, incidência por categoria de item e limites a definir. |
| Mobilidade | Evolui automaticamente. Velocidade de movimento, esquiva e outros possíveis efeitos ainda precisam de definição. |

Todos esses status progridem automaticamente. As classes podem ter curvas diferentes de evolução para cada status, preservando a identidade do personagem. As curvas e as diferenças concretas entre classes ainda serão desenhadas.

### Organização proposta

O crescimento pode ser definido por uma tabela ou curva de progressão de cada classe. Ao atingir um novo nível, o jogo aplica os ganhos correspondentes e mostra ao jogador o que melhorou.

Para o Goku, o perfil versátil continua como proposta de design. Destaques específicos em ataque, mana ou mobilidade e seus valores ainda não foram aprovados.

### Balanceamento a discutir

Vida, mana e outros valores de combate podem usar curvas diferentes das porcentagens e da velocidade. Como proposta de balanceamento, chance de drop e mobilidade podem ter crescimento mais suave e limites de efeito a definir.

A progressão de capacidade de peso precisa ser acompanhada por regras de coleta e mochila cheia, principalmente para a caça automática. Comida, Semente dos Deuses e poções de Ki foram confirmadas como tipos de consumíveis. Valores, pesos, obtenção, equipamentos e descarte ainda serão definidos.

### Personalização que permanece em aberto

O jogador já pode escolher seu personagem e alternar entre combate manual e automático. As configurações de habilidades e automação continuam como propostas de personalização. Equipamentos e outras formas de modificar atributos ainda não foram decididos.

## 9. Recuperação de vida e Ki

### Decisões confirmadas e correção do modelo anterior

A recuperação de vida ao longo do tempo vem do uso de comida. O usuário esclareceu o mecanismo: comer ativa um efeito temporário de regeneração. A ideia anterior de uma regeneração natural de vida separada da comida deixa de ser a regra proposta.

| Recurso | Funcionamento confirmado |
| --- | --- |
| Comida | Concede recuperação de vida ao longo de um período. |
| Semente dos Deuses | Recupera vida instantaneamente. Será um item raro e caro no mercado. |
| Níveis de sementes | Existirão sementes de diferentes potências de cura instantânea. |
| Poções de recuperação de Ki | Recuperam a energia usada pelas técnicas, cumprindo a função de poções de mana. |

### Comida e duração do efeito

O exemplo fornecido foi um presunto que faz o personagem recuperar uma quantidade de vida durante cinco minutos após comê-lo.

Presunto e cinco minutos são exemplos de item e duração. A quantidade total recuperada, a frequência dos pulsos de cura e os valores de outros alimentos ainda serão definidos.

O efeito de comida precisa estar ativo para gerar essa recuperação ao longo do tempo. O fim da duração encerra o efeito daquele alimento.

Como proposta de interface, mostrar o alimento ativo, sua duração restante e a recuperação concedida. Comida em uso durante o combate, intensidade nessa situação, possibilidade de acumular efeitos e comportamento ao trocar de alimento continuam em aberto.

### Níveis de Semente dos Deuses

Os percentuais citados pelo usuário como exemplos foram:

| Potência ilustrativa | Efeito |
| --- | --- |
| 15% | Cura instantânea proporcional à vida. |
| 30% | Cura instantânea proporcional à vida. |
| 50% | Cura instantânea proporcional à vida. |
| 100% | Recuperação instantânea completa. |

A existência de níveis de potência está confirmada. Os percentuais foram apresentados como exemplos; nomes, raridade individual e preço de cada nível ainda não foram definidos.

**Proposta de cálculo:** usar a vida máxima como referência percentual, limitando a vida resultante ao máximo do personagem. Isso ainda é uma definição de balanceamento a confirmar.

O mercado foi mencionado pelo usuário. Se ele será uma loja de NPC, comércio entre jogadores ou ambos continua em aberto. Obtenção por drop, fabricação, compra, disponibilidade e valores monetários ainda não foram escolhidos.

### Atributo Cura — proposta de integração

O atributo continua crescendo automaticamente com a classe e o nível.

Como proposta inicial, ele pode melhorar a regeneração proporcionada pela comida, enquanto as sementes mantêm os percentuais próprios de cada potência. A relação do atributo com cada consumível ainda não foi confirmada.

Essa organização permite diferenciar recuperação sustentada por comida e cura instantânea pelas sementes.

### Uso manual e automático — proposta

Permitir uso manual e configuração opcional de consumo automático. O jogador pode selecionar os itens autorizados, a condição de vida ou Ki para usá-los e a reposição de comida quando seu efeito terminar.

O consumo de novas unidades depende do estoque carregado. Limites de peso, quantidade de itens e comportamento da mochila cheia ainda serão definidos.

Sementes podem ficar reservadas para uso manual se o jogador não autorizar seu consumo automático. Essa configuração continua sendo uma proposta.

### Recarga das Sementes dos Deuses

**Confirmado pelo usuário:** cada uso de semente terá um cooldown antes do próximo uso. O objetivo é preservar a dinâmica da batalha: possuir muitas sementes não permite consumir todas consecutivamente sem intervalo.

**Regra operacional adotada para atender a esse objetivo:** a recarga vale para a categoria Semente dos Deuses. Trocar a potência, o item na barra ou o espaço da mochila respeita o mesmo intervalo.

Fluxo de uso proposto para implementação:

1. Se o uso estiver disponível, o personagem consome uma unidade e recebe a cura instantânea.
2. Esse uso inicia o intervalo de recarga das sementes.
3. Enquanto o intervalo estiver ativo, nenhum outro uso de semente é aceito, incluindo sementes de potências diferentes.
4. Uma tentativa durante a recarga não consome o item e não gera cura.
5. Ao terminar o intervalo, o personagem pode usar outra semente se tiver estoque e atender às demais condições de uso que forem definidas.

Essa regra deve valer igualmente para uso manual e eventual consumo automático. A interface pode mostrar o tempo restante em todas as sementes.

Na implementação multiplayer proposta, o servidor controla e valida a recarga. Esse comportamento está implementado no protótipo local 0.1; a duração da recarga continua ajustável.

**Ainda em aberto:** duração do intervalo e se a duração iniciada varia conforme a potência consumida. Recargas e interações de comida e poções de Ki ainda não foram decididas.

### Outras regras de recuperação a discutir

- Um único efeito de comida ativo por vez é uma proposta inicial; acumulação, substituição e renovação ainda não foram definidos.
- As regras de recuperação de Ki, além das poções confirmadas, ainda precisam ser detalhadas.
- A ação de concentrar-se para recuperar Ki permanece como proposta separada.

## 10. Próximas decisões

O intervalo obrigatório entre usos de semente está confirmado e foi organizado como uma recarga da categoria, para que trocar de potência mantenha a espera.

Os próximos assuntos são coleta e mochila cheia, duração e interação dos alimentos, obtenção e custo dos consumíveis, ritmo de experiência, marcos de técnicas e transformações e primeira região. A duração das recargas e a ativação e manutenção das transformações continuam em aberto.

## 11. Primeiro código executável — protótipo 0.1

A pedido do usuário, foi criado e executado um projeto local completo. Ele inclui servidor multiplayer, interface, controles, mapa, Goku, mobs, caça automática, evolução, inventário, consumíveis, mercado de NPC e região de PvP.

### Verificação realizada

- Dez testes automatizados passaram, incluindo recarga compartilhada, comida com duração, atributos automáticos, desbloqueios, peso da mochila, transformação, suspensão ao desconectar e duas sessões HTTP reais.
- No navegador, duas sessões apareceram no mesmo mundo. Foram observados caça e evolução, retorno ao controle manual, compra de comida e recarga de uma semente bloqueando outra potência.
- A interface desktop foi inspecionada visualmente. Os controles de toque foram implementados; um aparelho físico não foi usado na validação.

### Valores provisórios efetivamente usados

- Comida: cinco minutos, dois pontos de vida por segundo multiplicados pelo atributo Cura, com um efeito ativo por vez, inclusive em combate.
- Sementes: percentuais da vida máxima e vinte segundos de recarga compartilhada.
- Poção de Ki: 45% da reserva máxima e oito segundos de recarga.
- Rajada de Ki e Imagem Residual no nível 2; Kamehameha no nível 3; Super Saiyajin no nível 5.
- Super Saiyajin consome Ki. Há recuperação lenta de Ki em repouso.
- Morte retorna à vila sem perda de XP. Mochila cheia mantém XP e deixa os itens que não cabem no chão.
- Mercado de NPC e kit inicial de consumíveis para experimentar as regras.

Esses valores viabilizam a experiência e não confirmam as questões de design que estavam em aberto.

### Como executar

O pacote Dragon_Ball_Idle_Prototipo_v0_1.zip contém todo o código e o arquivo LEIA_PRIMEIRO.md. Requer Node.js 22 ou superior. Extraia o pacote, abra a pasta dragon-ball-idle no Terminal e execute npm start. Abra http://localhost:3000 . Não é necessário instalar bibliotecas.

A execução é local. Abrir outra aba conecta um segundo personagem real ao mesmo servidor. O código não publica infraestrutura na internet e o mundo completo e as demais classes ainda serão desenvolvidos.

## 12. Direção visual — protótipo 0.2

O usuário aprovou a jogabilidade e pediu melhorar os gráficos. Enviou uma referência de jogo idle visto de cima, com cenário em pixel art detalhado e painéis compactos, além de uma folha de poses do Goku para orientar a arte.

A versão 0.2 aplica uma primeira adaptação: Goku a partir da folha enviada, texturas de grama e terra, árvores e rochas, Saibaman, soldado alienígena e mercador em pixel art, minimapa com personagens e inimigos, painel recolhível e atalho de caça. As regras de evolução, combate, cura e caça não foram alteradas nesta etapa.

A folha de referência apresenta poses isoladas, mas não uma sequência completa de quadros para cada direção. O protótipo usa poses disponíveis e um movimento simples de passo; animações completas em oito direções e ações de combate ainda são trabalho futuro.

Foram executados os dez testes existentes. Em navegador desktop, foram conferidos o cenário, a caça, o retorno ao movimento manual, a poção de Ki e o Super Saiyajin. Controles de toque em um aparelho físico não foram testados nesta versão. As instruções de atualização explicam como copiar data/save.json e usar o mesmo navegador para recuperar o personagem.
## 13. Movimento, mapa e zoom — protótipo 0.3

O usuário enviou uma nova referência visual de animações e pediu que personagens dos jogadores e mobs deixassem de deslizar ao caminhar. Pediu também curvas mais naturais nas estradas, pedras apoiadas no chão, barra de habilidades menos extensa com teclas de atalho maiores e zoom pela roda do mouse.

A versão 0.3 inclui ciclos de dois quadros com pernas alternadas para Goku na forma base e Super Saiyajin, Saibaman e sentinela alienígena, com vistas de frente, costas e laterais. O Goku tem preparação e execução do ataque básico; os mobs mostram poses de preparação e ataque durante os avisos existentes. Os quadros são adaptações geradas a partir das imagens de referência, e não constituem animações completas para todas as ações mostradas na referência.

As estradas e junções têm bordas suavizadas, as rochas receberam sombra de contato e posicionamento junto ao solo, e a barra usa menos espaço horizontal com atalhos maiores. A roda do mouse sobre o mapa aproxima e afasta; botões de mais e menos também controlam o zoom. A câmera e a conversão do clique acompanham o zoom.

As regras do servidor foram mantidas. Os 13 testes automatizados passaram; no navegador desktop, foram observados passos e direção, caça, zoom pela roda e seleção de um mob com o mapa ampliado. Um salvamento real criado pela versão 0.2 foi recuperado na 0.3 com nível, XP e inventário. Não houve teste em aparelho de toque físico nesta versão.


## 14. Dezesseis quadros e diagonais — protótipo 0.4

O usuário pediu 16 quadros para todos os mobs e ajuste de sprites e movimentação nas diagonais nordeste, noroeste, sudeste e sudoeste. A versão 0.4 usa 16 quadros por ciclo de caminhada e ataque básico para Saibaman, Sentinela e Guardião da Cratera, além de Goku e Super Saiyajin. As diagonais receberam vistas específicas em três quartos; os lados opostos são espelhados para consistência.

Os passos acompanham a distância realmente percorrida e deixam de avançar sem deslocamento. O servidor transmite a orientação dos mobs e os instantes de preparação, impacto e recuperação. A velocidade nas diagonais é normalizada, e os tempos de aviso, dano, recarga, evolução e cura foram preservados. O Guardião continua usando a identidade visual ampliada da Sentinela.

A tela local /animacoes.html permite selecionar caminhada, ataque ou repouso, avançar pelos 16 quadros e comparar as oito direções sem alterar o progresso. As regras e a apresentação passaram por 19 testes automatizados e verificação de sintaxe. As vistas em três quartos e quadros de caminhada e golpe foram inspecionados no navegador desktop; a caça permaneceu ativa e houve passagem do nível 13 para o 14. Um salvamento real 0.3 foi recuperado na 0.4 com sessão, nível, XP e itens preservados. Morte, esquiva e uso de itens ainda não têm sequências próprias de 16 quadros; não houve teste em aparelho de toque físico nem carga de produção.
