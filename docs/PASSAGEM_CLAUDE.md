# Dragon Ball Idle — passagem para Claude Code

Data: 27/10/2026. Base executável: **0.4.0**. Documento preparado a partir desta conversa, do conceito registrado e da leitura do código incluído no ZIP. Não representa alterações feitas em computadores aos quais não temos acesso.

## Como interpretar este documento

- **DECIDIDO:** pedido explícito do usuário; preservar até nova orientação.
- **IMPLEMENTADO / PROVISÓRIO:** comportamento e números reais do código 0.4; não significa aprovação definitiva de balanceamento.
- **IDEIA / NÃO DEFINIDO:** proposta ou questão sem decisão; não tratar como requisito aprovado.
- Quando houver divergência histórica, requisitos mais recentes do usuário prevalecem. Para saber o que o programa realmente executa, conferir `public/shared/` (regras), `server.mjs`, `public/render/camera.mjs` e `public/art/`.

## 1. Visão do jogo

RPG idle de Dragon Ball, 2D visto de cima, com mundo explorável e regiões de dificuldades diferentes.
O jogador fortalece seu personagem, libera poderes por nível e derrota monstros e jogadores mais fortes.
Pode controlar movimento e técnicas manualmente ou acompanhar uma caça automática com o jogo aberto.

**DECIDIDO:** navegador; teclado ou toque; jogadores visíveis no mesmo mapa; PvP somente em regiões específicas. Começar pelo Goku. Referência estética: RPG clássico em pixel art, com cenário detalhado e interface compacta, inspirado na referência de idle de Naruto enviada pelo usuário, adaptado a Dragon Ball.

**Público:** faixa etária, persona, alcance geográfico e público comercial **não definidos**. Interesse em jogadores/fãs do tema é contexto, não pesquisa de público.

**Uso/publicação:** execução atual local para desenvolvimento e testes. Publicação, monetização, domínio, hospedagem, escala e autorização de uso comercial da propriedade intelectual **não definidos**. Não publicar automaticamente. A escolha de Dragon Ball não equivale a uma autorização de licenciamento comercial.

## 2. Stack técnica

| Item | Estado real |
| --- | --- |
| Linguagem | JavaScript ESM (`.mjs`), HTML e CSS; sem TypeScript |
| Cliente | Canvas 2D nativo; módulos ES no navegador; DOM para interface |
| Servidor | Node.js, HTTP nativo; SSE para transmitir snapshots; POST para intenções |
| Framework/engine externo | Nenhum |
| Bibliotecas/dependências | Nenhuma dependência npm; sem CDN e sem `node_modules` |
| Versão do projeto | `package.json`: `0.4.0`, `private: true`, `type: module` |
| Node mínimo declarado | `>=22` |
| Node efetivamente verificado | `v24.22.1`; usuário verificou npm `11.19.1` no Windows; testes desta entrega também executados em Node `v24.22.1` |
| Banco | Arquivo JSON local; não há banco externo |
| Build/bundler | Não existe etapa de build nem script `build` |

No Mac, já com Node instalado, executar dentro da pasta extraída:

```bash
cd dragon-ball-idle
node --version
npm --version
npm run check
npm test
npm start
```

Abrir `http://localhost:3000`. Prévia de animações: `http://localhost:3000/animacoes.html`. Encerrar com `Ctrl+C`.

**Instalação de dependências:** nenhuma. Não é necessário `npm install`, `npm ci` ou baixar pacotes. Não existe lockfile necessário nesta base. A instalação do próprio Node é pré-requisito externo, não um arquivo contido no projeto.

Alternativas existentes:

```bash
# Mac: alternativa ao npm start; pode exigir permissão de execução local.
chmod +x INICIAR_MAC.command
./INICIAR_MAC.command
# Outro host/porta, quando desejar testar na rede local:
npm start -- --host 0.0.0.0 --port 3000
# scripts.dev também aceita conexões da rede local:
npm run dev
```

Windows: `INICIAR_WINDOWS.bat`. Porta também pode vir de `PORT`; padrão 3000. Host padrão `127.0.0.1`. `npm run build` NÃO existe; o servidor serve os arquivos de `public/` diretamente. Gerar ZIP é empacotamento de fontes, não compilação.

Simulação: `setInterval(...,50)` com `game.tick(0.05)` = 20 passos/s nominais; transmissão a cada dois passos = 10 snapshots/s nominais. Sem medição de escala em produção. O cliente recebe o mundo completo; não há divisão por salas/shards.

API: `GET /api/health`; `POST /api/join`; `GET /api/events?session=...`; `POST /api/input`, `/api/action`, `/api/save` com Bearer token. Token aleatório de 20 bytes em hexadecimal (40 caracteres); é identificação do protótipo, não conta de produção. Corpo máximo 8192 caracteres; limite de 65 POSTs autenticados por segundo por token. Não expor tokens nem o save em Git.

## 3. Estrutura de pastas

| Caminho | Função |
| --- | --- |
| `package.json` | Versão, Node mínimo e comandos de execução/verificação |
| `server.mjs` | HTTP, arquivos estáticos, sessões, SSE, simulação e persistência |
| `AGENTS.md` | Invariantes e instruções para agentes de programação |
| `CLAUDE.md` | Entrada das instruções do Claude; aponta para esta passagem e demais documentos |
| `LEIA_PRIMEIRO.md` | Execução, atualização, controles e limites do protótipo |
| `INICIAR_WINDOWS.bat` / `INICIAR_MAC.command` | Inicializadores locais |
| `.gitignore` | Ignora `data/`, `node_modules/` e logs |
| `public/index.html` | Canvas, HUD (desde 30/10: topo com menus, cartão, alvo, minimapa, técnicas, automação) e diálogos |
| `public/style.css` | Interface; a HUD escala com a janela (`--e`) e tem faixas de largura (1400px e 1100px) |
| `public/client/game.mjs` | Entrada por teclado/toque/clique, rede, interface e renderização/interpolação |
| `public/shared/` | Regras autoritativas divididas: config, math, characters, enemies, game (classe Game) e index |
| `public/art/` | Carregamento dos PNGs, recortes, direções, cenário e desenho das entidades (por assunto) |
| `public/art/sprite-data.mjs` | Manifesto exato de recortes e âncoras dos sprites |
| `public/render/camera.mjs` | Zoom, câmera, coordenadas do clique, oito direções e seleção dos quadros |
| `public/animacoes.html` | Inspeção independente de caminhada/ataque/repouso, 16 quadros e oito direções |
| `public/assets/` | Todos os PNGs usados no jogo; pode conter folhas antigas não referenciadas |
| `tests/game.test.mjs` | Regras, diagonais, golpes e duas sessões HTTP reais |
| `tests/view.test.mjs` | Câmera, zoom, direção, passada e sincronização visual |
| `tests/sprites.test.mjs` | Manifestos, 16 recortes distintos e limites dos PNGs |
| `docs/CONCEITO.md` | Histórico das decisões e propostas; ler se houver dúvida de origem |
| `docs/VALIDACAO.md` | Testes e verificações históricas realizadas |
| `docs/ARTES_V0_4.md` | Organização, origem e limites das artes |
| `docs/PASSAGEM_CLAUDE.md` | Cópia deste documento dentro do projeto |
| `MANIFEST_SHA256.txt` | Relação dos arquivos entregues e hashes; exclui o próprio manifesto |
| `data/save.json` | Criado ao rodar; estado local, propositalmente fora do ZIP |

Não há configuração externa de engine, arquivo `.env`, segredo de API, servidor de banco ou asset remoto necessário para executar esta base.

### Pacote idle-dbz-assets e arquivos de outros computadores

O pacote **`idle-dbz-assets_v1.zip` existe nos arquivos disponíveis do usuário, mas NÃO está integrado ao código 0.4**. Não há importação dele no renderizador desta base e não se deve afirmar que seus tiles já aparecem no mapa. Sua integração e auditoria de conteúdo permanecem pendentes. Por ser condicional à integração no pedido, não foi anexado silenciosamente como dependência ativa do jogo.

Arquivo disponível separadamente: [idle-dbz-assets_v1.zip](https://chatgpt.com/library?file_id=libfile_68c1ae8ace6881918a188c5f73f25e65&account_id=personal). Seu conteúdo binário não foi auditado nesta passagem; não assumir tamanho de grade ou qualidade seamless a partir do nome. Existem pedidos em outra conversa para folhas de tiles/vegetação, mas não são especificação já implementada neste código.

**Fora desta entrega por serem locais do usuário:** `data/save.json` com o progresso real e os tokens `dbi-session`/`dbi-last-session` do navegador. Não temos o save real do computador do usuário. Quaisquer alterações feitas apenas no Mac/PC ou pelo Claude e não enviadas aqui também não estão disponíveis; nomes desses arquivos **não definidos/desconhecidos**. Não há outro arquivo conhecido indispensável para rodar que esteja faltando.

## 4. Histórico de versões

| Versão | Implementação registrada |
| --- | --- |
| 0.1 | Primeiro executável: servidor compartilhado, Goku, mapa, combate manual/automático, caça, XP/nível, consumíveis, mochila, loja NPC, loot, PvP delimitado e save. Dez testes. |
| 0.2 | Primeira revisão de pixel art: Goku, árvores, pedras, terreno, Saibaman, alienígena e vendedor; minimapa; painel recolhível. Dez testes. Poses ainda limitadas. |
| 0.3 | Ciclos de dois quadros para caminhada/ataque, forma SSJ, estradas/junções suavizadas, pedras assentadas, barra compacta com atalhos maiores, zoom pela roda e botões. Treze testes. |
| 0.4 | Dezesseis quadros de caminhada e ataque para todos os mobs atuais e Goku/SSJ; diagonais específicas, passada por distância, orientação de mobs e recuperação após impacto; prévia `animacoes.html`. Dezenove testes. |
| Reenvio 0.4 | ZIP anterior estava incompleto; foi refeito e sua extração verificada. Não foi uma versão de gameplay nova. |
| Esta passagem | Documentação, manifesto e pacote completo de colaboração sobre a 0.4.0; não incrementa versão de gameplay. |

Não há versão posterior conhecida desta implementação. Trabalho externo não sincronizado não pode ser declarado mais novo sem inspecionar os arquivos.

## 5. Loop principal

**DECIDIDO:** fortalecer personagem → desbloquear poderes por nível → vencer inimigos mais fortes → acessar desafios e PvP mais fortes. Manual e automático devem coexistir; desafios difíceis devem recompensar habilidade de movimento e uso de técnicas.

**Primeiro minuto, comportamento disponível:** entrar com nome, aparecer na vila em `(430,440)`, conferir HP/Ki/consumíveis, mover por WASD/setas/clique/toque, ir aos Campos ou ativar caça por região. Caça liga ataque e técnicas automáticas. Comida automática consome uma unidade quando a caça está ativa e o efeito anterior acabou, se houver estoque.

**Primeira hora:** não há roteiro/metas de nível validados. É possível repetir caça, subir de nível, coletar materiais, usar técnicas liberadas, visitar mercado, explorar cratera, tentar chefe e área PvP. Não prometer determinado nível em uma hora.

**Primeiro dia:** conteúdo/endgame, ritmo, metas, sessões diárias, eventos, recompensas de login e retenção diária **não definidos**.

**Offline:** não há ganho offline implementado. Ao perder a última conexão SSE, a caça é desligada e a entrada de movimento zerada; `connected=false` impede atualização do jogador. No save os timers são timestamps absolutos: comida e recargas podem ter expirado ao voltar. Portanto não há simulação de caça offline nem crédito retroativo de XP, mas duração de buff não é uma reserva de 300 segundos de tempo conectado. Comportamento definitivo desses timers offline **não definido**.

## 6. Sistemas

### 6.1 Personagens, atributos e progressão

**DECIDIDO:** personagens marcantes de Dragon Ball como escolhas de classe/personagem; foram citados Goku, Vegeta, Freeza, Majin Boo, Cell, Bills e Gohan. Começar pelo Goku. Demais classes devem ser construídas gradualmente. Técnicas e transformações liberam por nível. Atributos aumentam automaticamente conforme classe, sem distribuição manual.

**IMPLEMENTADO:** só Goku é jogável; não há seletor funcional de todas as classes nem curvas diferentes por classe. Para nível `L`, definir `n=max(0,L-1)`:

```js
HPmax = 120 + 22*n
KImax = 80 + 10*n
ATK = 12 + 2.8*n
DEF = 2 + 0.65*n
CURA = 1 + 0.08*n
CAPACIDADE_KG = 20 + 1.3*n
CHANCE_LOOT = min(0.8, 0.35 + 0.008*n)
VELOCIDADE = 175 + min(60, 2*n)
XP_PARA_PROXIMO_NIVEL(L) = Math.round(30 * Math.pow(L, 1.35))
```

O XP é subtraído a cada nível dentro de um `while`; nível máximo atual 100. Ao subir, HP e Ki recebem o aumento de seus máximos, limitados ao máximo novo; não há restauração total garantida. Na carga: nível limitado a 1..100, XP a 0..XPnecessário−1, estoque por item 0..99999, Zeni 0..9999999. O comportamento do XP acumulado no nível 100 merece revisão; não há progressão final definida.

### 6.2 Transformação e técnicas

**IMPLEMENTADO / PROVISÓRIO:** Super Saiyajin no nível 5; alternância manual por T; para ativar exige pelo menos 10 Ki, mas não desconta 10 Ki de entrada. Consome `3.5*dt` Ki por passo de simulação e termina em Ki zero. Não existe multiplicador global de todos os atributos: os multiplicadores estão nos ataques da tabela abaixo. Não há Kaioken/Genkidama implementados.

| Ação | Nível | Custo Ki | Intervalo | Dano bruto base / SSJ | Geometria/tempo |
| --- | --- | --- | --- | --- | --- |
| Combo básico | 1 | 0 | 0.45 s | ATK / 1.5×ATK | Um alvo até 70 unidades; dano imediato no servidor |
| Rajada de Ki | 2 | 7 | 0.7 s | 1.4×ATK / 2.1×ATK | Velocidade 470, vida 0.95 s; colisão por distância ao segmento <19 |
| Kamehameha | 3 | 23 | 5 s | 4.2×ATK / 6×ATK | Carrega 0.65 s; comprimento 440; distância do alvo à linha <35 para mob, <32 para jogador |
| Imagem Residual | 2 | 0 | 4 s | Sem dano | Velocidade 620 por 0.18 s; imunidade a dano enquanto `time<dashUntil`; interrompe carga |

Durante carga, movimento manual usa `0.35*VELOCIDADE`. A carga não impõe esse fator no ramo de condução automática: é comportamento do código, não promessa de regra final. Dash usa direção da entrada se seu módulo >0.1; senão usa mira/direção disponível. Não há treino de técnica por repetição, upgrades compráveis de técnicas ou árvore de talentos.

### 6.3 Combate e automação

Dano aplicado:

```js
DEF_ALVO = jogador ? stats.defense : (mob.zone === 'cratera' ? 5 : 1)
DANO = max(1, Math.round(DANO_BRUTO * 100 / (100 + 3*DEF_ALVO)))
HPnovo = max(0, HP - DANO)
```

PvP exige ambos conectados/vivos na mesma região com `pvp=true`, jogadores diferentes. Vale também para projétil e feixe, não só para soco. Mundo compartilhado já permite encontros; clãs, ranking, punição por morte, duelo e recompensas PvP **não definidos**.

Manual: 1 Combo; 2 Rajada; 3 Kame; 4/Espaço esquiva; T forma; F comida; Q poção; R semente; H caça. Clique em entidade seleciona alvo; clique no chão solicita movimento. A escolha automática de alvo da técnica ainda pode selecionar o inimigo próximo quando não houver um alvo válido; não é mira livre absoluta em todas as condições.

Ataque automático e técnicas automáticas têm flags separadas. Movimento manual encerra caça/condução; não necessariamente desliga essas flags. `hunt` liga ambas e escolhe Campos/Cratera. Condução usa desvio local de obstáculos, não A*.

Automação atual:

```js
// Caça: ao entrar na região, mantém alvo vivo da região ou busca o mais próximo até 2000.
// Aproxima enquanto distância >49.
if (autoAttack && target && distance < 70) cast('basic')
if (autoSkills && target) {
  if (level>=3 && ki>0.35*KImax && distance<400 && target.hp>1.6*ATK) cast('kame')
  else if (ki>0.15*KImax && distance<390) cast('ki')
}
```

Alvo auxiliar no update: mais próximo até 320; no `cast`, até 70 para básico e 430 para outras técnicas. Não há interface de prioridade arbitrária nem configuração de todas as técnicas; isso permanece ideia.

### 6.4 Recuperação, itens e mochila

**DECIDIDO:** HP ao longo do tempo depende de comida; semente é cura instantânea, rara/cara, com potências e cooldown para impedir spam; poção recupera Ki. Todas as potências de semente compartilham cooldown como regra operacional adotada para impedir troca abusiva.

**IMPLEMENTADO / PROVISÓRIO:**

```js
// Comida: 1 presunto, duração 300 s, um efeito ativo inclusive em combate.
HPnovo = min(HPmax, HP + 2*CURA*dt) // só enquanto foodUntil > time
// Nova comida é bloqueada se foodUntil > time+1; há janela de renovação no último segundo.
// Semente, potência P em [15,30,50,100]:
HPnovo = min(HPmax, HP + HPmax*P/100)
seedReady = time + 20 // todas as potências
// Poção:
KInovo = min(KImax, KI + 0.45*KImax)
kiReady = time + 8
```

Não gasta semente em HP cheio nem poção em Ki cheio. Sem HP gratuito fora da comida; Ki recupera `4*dt` quando `!transformed && !autoHunt && !charge && time-shotReady>1.5 && time-basicReady>1.5`. Isso não exige que o personagem esteja parado: “Ki em repouso” nos textos é uma simplificação, não um teste de velocidade.

Autofood padrão ligado, só renova durante caça; autoKi e autoSeed padrão desligados. AutoKi usa poção abaixo de 25% do Ki; autoSeed usa semente selecionada abaixo de 30% HP, com estoque e cooldown liberado.

Peso: `PESO = Σ(inventory[item]*itemWeights[item])`; entrada bloqueada se peso novo > capacidade +0.0001. Itens que não cabem continuam no chão e XP é mantido.

| Item | Peso kg | Compra Zeni |
| --- | --- | --- |
| Presunto | 0.35 | 12 |
| Poção Ki | 0.20 | 18 |
| Semente 15% | 0.08 | 90 |
| Semente 30% | 0.08 | 210 |
| Semente 50% | 0.08 | 480 |
| Semente 100% | 0.08 | 1400 |
| Sucata | 0.70 | Não comprável; vende por 8 |
| Cristal | 0.45 | Não comprável; vende por 15 |

Kit inicial: 200 Zeni; 5 comidas; 4 poções; 2 sementes15, 1 semente30, 1 semente50, 1 semente100; sucata/cristal zero. Loja NPC em `(430,300)` exige distância ≤180. Venda: `8*scrap + 15*crystal`; esvazia os dois estoques. Não há equipamentos, crafting, mercado entre jogadores ou raridades de equipamentos definidos.

### 6.5 Mobs, recompensas e mundo

| Mob | HP Campos / Cratera | ATK Campos / Cratera | XP por morte | Velocidade |
| --- | --- | --- | --- | --- |
| Saibaman | 42 / 90 | 8 / 15 | 10 / 18 | 115 |
| Sentinela | 60 / 105 | 12 / 12 | 17 / 17 | 108 |
| Guardião (Cratera) | — / 650 | — / 30 | 140 | 80 |

São 14 mobs nos Campos, 8 na Cratera e 1 chefe. Respawn: comuns 12 s; chefe 75 s. Ataque de área: Saibaman aviso0.65 s, raio43, alcance para iniciar62; chefe aviso1.15 s, raio125, alcance150. Sentinela inicia até235, aviso0.8 s; projétil velocidade250 e vida2 s. Após impacto: recarga comum0.95 s, chefe1.5 s. Aggro: até300 comuns,460 chefe; retorna para casa quando se afasta >470; dentro de10 da origem deixa de retornar. Vila é protegida contra seleção/dano dos mobs.

Recompensas ao jogador que finaliza: `Zeni=100` chefe ou `5+floor(random()*5)` comum. Um teste de drop usa `random()<CHANCE_LOOT`; tipo cristal se outro `random()<0.3`, senão sucata; uma unidade. Teste separado `random()<0.008` gera uma semente15. Não há drop natural de semente30/50/100 nesta base. Loot dura45 s, exclusivo do responsável15 s, coleta por distância<60. Sem divisão de XP/loot por participação.

Mundo 3300×2200 unidades; raio de colisão padrão do ator15; obstáculos circulares definidos em `OBSTACLES`.

**Colisão atual (28/10/2026; substitui o que diz o parágrafo acima sobre colisão):** Namekusei tem 4608×3072 unidades. Onde dá para pisar é decidido em `public/shared/passagem.mjs`: a máscara do mar (`namek-passagem.mjs`) mais a pegada das casas e ruínas (`casaBloqueia` em `config.mjs`), conferidas nos pés do ator (`pesLivres`). **Pegada das casas:** a base vista de cima é uma elipse, e a curva de baixo do desenho é a metade da frente dela; `public/shared/pegadas-casas.mjs` guarda essa curva por coluna, gerada dos PNGs por `~/idle-dbz/ferramentas/gerar_pegadas.py` (trocou um desenho, gere de novo). A casa ocupa o chão de trás da elipse até a frente, inclusive nas laterais; quem pisa à frente da curva é desenhado na frente da casa (`profundidade` em `client/game.mjs`), mesmo acima da linha da base. Nas ruínas a borda de baixo é escombro, então a profundidade é fixa por ruína (`PROFUNDIDADE_RUINA` na ferramenta). Um passo de movimento é sempre `deslocar()`, a mesma função no servidor (`Game.move`, jogadores e mobs) e na predição local do cliente. **Regra:** obstáculo novo entra em `podeAndar`/`deslocar`, nunca numa checagem separada no cliente; se servidor e cliente divergirem, o personagem treme ao encostar no obstáculo (foi o que acontecia na beira da água e nas casas antes de 28/10). Regiões:

| ID | Nome | x,y | largura,altura | PvP |
| --- | --- | --- | --- | --- |
| vila | Vila do Lago | 70,70 | 650,540 | Não |
| campos | Campos da Terra | 800,120 | 1780,1070 | Não |
| cratera | Cratera Rubra | 700,1320 | 1880,700 | Não |
| arena | Fronteira de Combate | 2720,220 | 490,1750 | Sim |

Morte do jogador: volta à vila em4 s, HP/Ki máximos, sem perda de XP; caça e transformação desligadas. Essa regra é provisória.

**Mundo em áreas fechadas (desde 03/11/2026; substitui a tabela de regiões acima e o seletor de mundos do PR #15).** **DECIDIDO (Pedro, respostas de 03/11):** o jogador nasce na Terra (lobby simples, por enquanto só uma praça com o portal) e vai a Namekusei por portal. Em Namekusei aparece na **Vila** (área própria e segura, só a praça com as casas, o mercador e os portais). Da Vila saem **3 portais, um por hunt**: inicial (Planícies, nível 1–10), média (Campo de Batalha, 10–20) e difícil (Planalto, 20–30). O nível é **só recomendação**: entra quem quiser, com aviso. Cada hunt é **fechada**: não se anda de uma para outra. A **saída fica no ponto de chegada** e leva à Vila ou às outras duas hunts; para ir à Terra passa-se pela Vila. Chegada num ponto fixo, **protegido por alguns segundos**. **Morte volta ao começo da mesma hunt** (pode mudar). **Caça automática roda a hunt inteira** (saiu o seletor de região). Mobs: inicial só básicos; média, sentinelas e um subchefe; difícil, o chefe e mobs mais fortes. **Sem PvP nesta versão** (o Planalto fica, como hunt difícil). O que sobra do mapa (ilha norte, ilha noroeste, ilhotas) fica para uma **4ª área no futuro**. O menu **Mapa só consulta** (onde estou, áreas, portais), sem teleportar. Todos os planetas futuros seguem o mesmo modelo.

Como está no código:
- `ZONES` em `config.mjs` são as áreas (`vila`, `inicial`, `media`, `dificil`): caixa em px da imagem, `chegada`, `nivel`, `segura`, `pvp` (nenhuma é pvp). Proposta desenhada em `~/idle-dbz/referencias/mapas/namek/proposta-divisao-namek.png`.
- Jogador e mob têm `planet` e `area`. **Regra:** tudo o que interage confere `Game.mesmoLugar` (mesmo planeta e mesma área): dano (`hit`), alvo, aggro, projéteis, feixe do Kamehameha, loot e o snapshot (cada jogador só recebe o próprio lugar, o que também diminui o tráfego). Sistema novo que toca outra entidade tem de passar por ela.
- Andar: `deslocar`, `podeAndar`, `pesLivres` e `caminhoPorTerra` recebem a área; fora da caixa não se anda, mesmo onde o chão continua (os cortes retos entre ilhas). O cliente passa a mesma área na predição, para não tremer na borda.
- Portais: `PORTAIS` e `RAIO_PORTAL` em `config.mjs`; destino por `lugar(id)`. Ação `portal` no servidor confere se o jogador está no portal e se o destino é dele (`Game.usePortal`). `Game.levar` põe na chegada e dá `CONFIG.chegadaSegura` (3 s, provisório) de proteção; `Game.protegido` vale também na Terra e na Vila. Saiu a ação `travelPlanet`.
- Cliente: o portal é desenhado no chão (`drawPortal`, provisório até o desenho ser escolhido), na cor do destino (verde, laranja, vermelho; azul para Vila, Terra e saídas). Encostar abre a janela de destinos (`abrirPortal` em `hud.mjs`), uma vez por entrada no círculo, e **não abre com a caça automática ligada** (perseguindo mob, ela passava por cima da saída). Fora da área fica escuro (`drawForaDaArea`), no mapa e no minimapa.
- **PROVISÓRIO:** atributos dos mobs por hunt e quantidade (16 comuns em cada; subchefe na cratera grande do Campo de Batalha; chefe no centro da arena do Planalto) em `enemies.mjs`. Simulação de 5 min de caça automática no nível recomendado: inicial nv 1 → 101 abates e 0 mortes; média nv 10 → 36 abates e 3 mortes; difícil nv 20 → 49 abates e 6 mortes, quase todas pelo chefe, porque a caça automática ataca o mob mais próximo, chefes inclusive (decisão em aberto). Arte provisória: básico = Saibaman, sentinela = alienígena, subchefe = sentinela grande, chefe = Freeza; a lore pede namekuseijins e o Piccolo de chefe. **Em aberto:** limite de jogadores por hunt (vai existir, número a decidir), densidade, desenho do portal, NPCs da Vila.
- **Defeito antigo achado (não corrigido):** a condução por clique pode travar na quina de uma casa mesmo com caminho por terra. O portal da hunt média foi posto longe da porta da casa 2 por isso, e o teste "dá para chegar andando a cada portal" protege os portais.

### 6.6 Sistemas sem implementação

Treino separado da caça, prestígio/rebirth, missões, conquistas, crafting, equipamentos, pets, guildas, ranking, história, eventos, recompensa diária e monetização: **não implementados; regras e fórmulas não definidas**. Não inventar custos ou apresentar como compromissos. Poderes futuros como Kaioken e Genkidama foram sugestões de repertório, não conteúdo pronto.

## 7. Balanceamento

Todas as fórmulas numéricas da seção6 são as atuais do protótipo, não curvas aprovadas para lançamento. Não há custo de subir nível em Zeni, distribuição de pontos, compras de atributo ou fórmula de prestígio.

Exemplos verificáveis da curva atual:

| L | HP | Ki | ATK | DEF | Cura | kg | Loot | Velocidade | XP próximo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 120 | 80 | 12.0 | 2.00 | 1.00 | 20.0 | 35.0% | 175 | 30 |
| 2 | 142 | 90 | 14.8 | 2.65 | 1.08 | 21.3 | 35.8% | 177 | 76 |
| 3 | 164 | 100 | 17.6 | 3.30 | 1.16 | 22.6 | 36.6% | 179 | 132 |
| 5 | 208 | 120 | 23.2 | 4.60 | 1.32 | 25.2 | 38.2% | 183 | 263 |
| 10 | 318 | 170 | 37.2 | 7.85 | 1.72 | 31.7 | 42.2% | 193 | 672 |
| 50 | 1198 | 570 | 149.2 | 33.85 | 4.92 | 83.7 | 74.2% | 235 | 5898 |
| 100 | 2298 | 1070 | 289.2 | 66.35 | 8.92 | 148.7 | 80.0% | 235 | 15036 |

Mobilidade atinge235 no nível31; loot atinge80% no nível58. Metas de tempo para níveis, primeiro SSJ, chefe, primeira hora ou primeiro dia: **não definidas**. O teste de caça de60 s com RNG fixo valida progressão funcional (≥10 mortes, nível≥3 e vivo), não uma meta universal nem um balanceamento de produção.

## 8. Arte e animação

**DECIDIDO:** melhorar visual mantendo a jogabilidade considerada funcional pelo usuário; pernas com movimento visível; 16 quadros para mobs e quatro diagonais; estradas com curvas, pedras assentadas, skills compactas e atalhos legíveis; scroll para zoom.

**Pronto:** caminhada e ataque básico de Goku/SSJ, Saibaman, Sentinela e Guardião em16 quadros/ciclo. PNG RGBA com transparência. Guardião reutiliza Sentinela ampliada. As oito direções são S, SW, W, NW, N, NE, E, SE; diagonais dianteiras/traseiras usam folhas específicas em três quartos. Direções opostas espelhadas para manter consistência; não rotacionar sprite frontal para representar diagonal.

Não são spritesheets uniformes perfeitas: algumas saídas geradas do Goku têm17 colunas, mas o manifesto seleciona16 recortes distintos. O Saibaman diagonal usa partes válidas de uma folha e ataque em folha separada. **Não dividir PNG em grade presumida nem substituir nomes sem atualizar manifesto.** Cada quadro é `[sourceX,sourceY,width,height,anchorX,anchorY]`. Escala de desenho `alturaDesejada/referenceHeight`; âncora junto ao chão. Arquivos finais e dimensões estão no inventário ao fim; as dimensões são dos PNGs reais, não do tamanho do personagem em tela.

Goku desenhado com altura70; mob comum58, Guardião105 na chamada do jogo. Marcha por distância:

```js
cycle = ((travelled/stride + phase)%1 + 1)%1
frame = floor(cycle*16)%16
// stride: Goku96; Saibaman80; Sentinela80; Guardião136 unidades/ciclo
// phase do mob = (número do id %16)/16
```

A interpolação acumula distância realmente percorrida enquanto `moving`; teleporte>250 reinicia acumulador. Direção persiste ao parar. Ataque visual do jogador dura0.36 s; dano básico do servidor é imediato, portanto não afirmar sincronização perfeita dos 16 quadros do jogador com o instante de dano. Mobs: primeira metade do ciclo durante aviso, segunda metade durante0.32 s de recuperação após release; não altera dano/recarga. Os16quadros não significam16FPS: frequência depende de deslocamento e renderização.

Terreno usa texturas grass/earth, clareiras arredondadas e união suavizada em máscara de resolução4 com blur6px e limiar alpha128. Isso é visual; colisão continua em `OBSTACLES`. Árvores/pedras ordenadas por profundidade; pedra tem sombra de contato. Minimap acompanha entidades/câmera.

Escala do mundo de Namekusei (desde 28/10/2026; substitui as dimensões de mundo citadas acima): `ESCALA_MUNDO` e `ESCALA_CONSTRUCOES` em `public/shared/config.mjs`. **1 px da imagem do solo (4608×3072) vale `ESCALA_MUNDO` = 1,8 unidades**, então o mundo tem 8294×5530. Ela amplia terreno, regiões, chegada, posição do mercador, pontos de nascimento dos mobs, posição do chefe e a máscara de passagem. As posições continuam escritas em px da imagem (as mesmas das ferramentas) e passam por `naEscala`. **Não amplia** personagens (Goku 70), velocidades, alcances, tempos nem distâncias de interação. As casas e ruínas têm escala própria, `ESCALA_CONSTRUCOES` = 2 sobre o desenho original: o vão das portas fica com 1,0–1,1 vez a altura do Goku. Mudou uma das duas escalas? Gere o solo de novo com `~/idle-dbz/ferramentas/assentar_casas.py`, com a largura das casas em px da imagem = w × ESCALA_CONSTRUCOES ÷ ESCALA_MUNDO, para terreiro e contato acompanharem. O save não guarda posição (o jogador sempre começa na Terra), então mudar a escala não exige migração.

**DECIDIDO (Pedro, 28/10):** mundo ampliado com personagens do mesmo tamanho; testado 2× e escolhido **1,8×**; casas na proporção aprovada no teste de 2×. Medido com o Goku nível 1 (velocidade 175): praça da Vila → entrada das Planícies 4,6 s (1×) → 8,2 s (1,8×); → centro das Planícies 10,6 s → 18,9 s. **Efeito conhecido, em aberto:** os mesmos 16 mobs nas Planícies ficam mais espalhados; em 10 min de caça automática a partir do nível 1, 277 mortes e nível 11 (1×) contra 108 e nível 7 (1,8×). Decidir se a quantidade de mobs aumenta.

HUD (desde 30/10/2026, pelo modelo do Pedro): o HTML fica em `public/index.html`; tudo o que mexe na página (atualizar barras, ligar botões, notificações, loja, janelas de mundo e caçada) fica em `public/client/hud.mjs`; `client/game.mjs` fica com mapa, rede, teclado, joystick e minimapa. Na HUD, `$` devolve um elemento vazio quando o id não existe e avisa no console uma vez por id: dá para tirar ou trocar peças sem derrubar o jogo, e os avisos listam o que falta ligar. Tamanho: tudo em múltiplos de `--u` = 1px × `--e`, com `--e` = min(largura/1600, altura/950) entre 0,6 e 2,2. Faixas: abaixo de 1400px os menus ficam só com ícone; abaixo de 1100px viram o botão ≡ e o chat some. Celular fica para depois (decisão do Pedro). Minimapa mostra a região em volta do jogador (decisão do Pedro), não o planeta inteiro. Teclas novas: 6 = Semente, 7 = Recuperar Ki (R e Q continuam). O canvas `#world` **precisa** de `image-rendering:pixelated` (sem isso a pixel art borra em tela Retina). Ícones em emoji são provisórios; das telas dos menus só Loja e Mapa existem.

Câmera e zoom (desde 28/10/2026): todos os valores ficam em `CAMERA`, em `public/render/camera.mjs`; para calibrar, mexer só ali. Zoom de 80% a 200%, padrão 100%. Roda: `z'=clamp(z*exp(-deltaPixels*0.0012),0.8,2)`, linhas×16, páginas×600; botões −/+ dividem/multiplicam por 1,2.

O campo de visão é medido em **unidades do mundo**, não em pixels de tela: com zoom 100%, qualquer tela mostra a mesma área de mundo (1200×750 = 900 mil unidades²), com teto de 1300 no lado maior e piso de 600 no lado menor; o piso vence o teto. Escala = `min(max(√(largura·altura/900000), ladoMaior/1300), ladoMenor/600) * zoom`. Clique converte pela câmera e escala atuais.

**DECIDIDO (Pedro, 28/10):** câmera mais próxima da ação e limitada: monitor grande não vê mais mapa que notebook, e o jogador descobre o cenário avançando nas hunts, sem ver uma região inteira afastando a câmera. **DECIDIDO:** piso de 600 no lado menor, para nenhum ataque vir de fora da tela (Sentinela ataca de 235, mob percebe a 300). Efeito aceito: celular e tablet passaram a ver um pouco mais de mapa do que na versão anterior. Os demais números (área 1200×750, teto 1300, zoom 0,8–2) são calibração provisória.

| Tela | Zoom 100% | Zoom 80% (máximo afastamento) |
|---|---|---|
| Notebook 1366×768 | 1265×711 | 1582×889 |
| Monitor 1920×1080 ou 2560×1440 | 1265×712 | 1581×889 (antes: até 3751×2110) |
| Ultralargo 3440×1440 | 1433×600 | 1792×750 |
| Celular em pé 390×844 | 601×1300 | 751×1625 |

**Falta:** sequências próprias de16quadros para morte, esquiva, item, interação e habilidades especiais; demais personagens; arte exclusiva de chefe; polimento de alinhamento/consistência; integração de `idle-dbz-assets`. Não confundir efeitos de energia já desenhados no Canvas com sequência completa de16sprites para cada técnica.

## 9. Salvamento

`data/save.json` no computador que roda o servidor; escrita em `save.tmp`, seguida de rename para `save.json`. Auto-save a cada5000ms, botão Salvar e encerramento normal SIGINT/SIGTERM. Arquivo JSON associa token da sessão ao resultado de `exportPlayer`:

```js
{name,level,xp,x,y,hp,ki,zeni,inventory,kills,bossKills,foodUntil,seedReady,kiReady}
```

Não persiste mundo completo: mobs, loot no chão e projéteis reiniciam. Também não persiste transformação, cooldowns de skills, configuração de automação, alvo ou sessão autenticada de produção. Stats são recalculados do nível.

Navegador: `sessionStorage['dbi-session']`; `localStorage['dbi-last-session']` e `['dbi-name']`. Abrir aba adicional com token já em uso cria outro personagem. Mudar dispositivo, origem/porta ou limpar armazenamento pode impedir acesso ao save mesmo com `save.json` preservado. O token não deve ser publicado.

Atualizar: salvar → parar servidor → copiar pasta `data` real para backup → extrair novo código separado → copiar `data` para a raiz nova → abrir no mesmo navegador/origem. Transferir `save.json` ao Mac não transfere automaticamente token do navegador do Windows. Procedimento seguro de importação entre dispositivos ainda não implementado.

## 10. Funcionamento, problemas e bugs conhecidos

**Verificado nesta passagem:** `npm run check` e19testes passaram em Node24.22.1. Há testes de cura/recarga, XP, peso, PvP, transformação, caça, duas conexões HTTP, diagonais, sincronização de mobs, zoom e manifestos. Documentação histórica registra testes visuais no navegador e recuperação de save0.3→0.4 com sessão, nível, XP e itens preservados. Não foi feita nova sessão visual nesta passagem documental.

**Incidente conhecido de entrega:** ZIP anterior incompleto; reenviado. Esta entrega testa CRC, extração e igualdade de bytes. Isso não altera o gameplay.

**Limitações reais, não bugs novos reproduzidos:** só Goku; mundo pequeno; arte ainda de protótipo; chefe reaproveita arte; falta animação de todas as ações; sem login/contas de produção, servidor publicado ou carga testada; toque não testado em aparelho físico; pathfinding é desvio local e pode demandar revisão; sem ganho offline.

**Pontos identificados por leitura, ainda sem correção nesta entrega:**

- `move()` marca `moving` pela intenção mesmo se colisão impedir deslocamento; o acumulador de distância evita avançar marcha sem deslocamento, mas flag não é prova de movimento real.
- `save()` captura erro e o endpoint ainda pode responder `{ok:true}`; investigar retorno de falha antes de afirmar salvamento robusto.
- JSON de save inválido é silenciosamente ignorado no carregamento (`catch {}`); não há migração/versionamento/backup automático do save.
- Multiplicador0.35 de velocidade carregando Kame é aplicado ao movimento manual, não a toda condução automática.
- XP no nível100 pode crescer em memória, mas é limitado no carregamento; comportamento de teto precisa ser definido.
- Timers absolutos expiram desconectado, sem ganho offline; UI de “repouso” do Ki não corresponde estritamente a estar parado.
- O ataque básico do jogador aplica dano antes de completar a animação de0.36 s; refinamento visual pendente.

Não foi relatado outro bug de gameplay reproduzido após o reenvio. Ausência de falha nos testes não significa inexistência de bugs.

## 11. Ideias em aberto e alternativas descartadas

| Assunto | Classificação e motivo |
| --- | --- |
| HP regenerando gratuitamente | Substituído pela decisão de comida temporária; não reintroduzir sem pedido |
| Gastar várias sementes seguidas sem intervalo | Rejeitado explicitamente: anula dinâmica da batalha |
| Distribuição manual de atributos | Rejeitada pelo modelo de crescimento automático por classe |
| PvP em qualquer lugar | Fora da decisão: restrito a regiões específicas |
| Copiar tema/personagem Naruto | Referência visual apenas; jogo deve ser adaptado para Dragon Ball |
| Ciclo curto/deslizamento sem pernas | Insatisfação explícita; usuário pediu16quadros e diagonais |
| Estradas em ângulo reto, pedra flutuando, barra extensa | Insatisfação visual explícita; tratado na0.3, continuar refinando se necessário |
| Phaser + TypeScript e Colyseus | Sugestões iniciais não adotadas para entregar protótipo sem dependências; migração futura possível, não decidida |
| Kaioken, Genkidama, concentração de Ki | Ideias de repertório; regras, custos e marcos não definidos |
| Transformação automática e prioridades de técnicas | Ideias; ativação manual SSJ e automação simples já existem, interface completa não existe |
| Economia definitiva, duração/tiers de comida, sementes e obtenção | Valores de teste existem, aprovação final não definida |
| Classes adicionais, equipamentos, troca entre jogadores | Desejo/possibilidade futura, especificações não definidas |
| Mapas baseados em cenários do anime / novos lotes de tiles | Trabalho de arte externo em andamento; não integrado nesta base; escolher lote final e validar arquivos |
| Publicação, ganhos offline, endgame e monetização | Não definidos; sem compromisso de escopo ou data |

## 12. Próximos passos por prioridade

**PROPOSTA de execução, não nova decisão do usuário:**

1. Claude abre este pacote no Mac, lê `CLAUDE.md`/esta passagem, roda checks/testes e confirma jogo e prévia local. Preservar save antes de qualquer mudança.
2. Estabelecer repositório Git único e baseline0.4.0; fazer inventário de eventuais mudanças que existam só em outros computadores antes de sobrepor pastas.
3. Inspecionar o pacote `idle-dbz-assets_v1.zip` e lotes aprovados de chão/vegetação; definir quais substituirão terreno e objetos. Importar em tarefa separada, mantendo colisão e escala coerentes.
4. Revisar alinhamento dos sprites e as diagonais na prévia e no mapa; só depois expandir outras ações/classes. Não presumir que16quadros de caminhar resolvem todas as animações.
5. Tratar confiabilidade/importação do save e os pontos da seção10, com testes direcionados e migração quando necessária.
6. Ajustar pathfinding e experiência de toque após observar problemas reais; testar em aparelho físico.
7. Discutir próximos personagens, marcos e economia com o usuário; adicionar conteúdo com metas e números aprovados, em vez de inventar sistemas de prestígio/missões.
8. Planejar hospedagem/autenticação/segurança e direitos de uso caso publicação venha a ser decidida.

## 13. Divisão de trabalho e transferência de mudanças

**PROPOSTA:** Claude Code implementa e executa no Mac; ChatGPT ajuda a definir regras, revisar diffs, investigar bugs, planejar conteúdo e produzir/revisar artes/documentação. O usuário decide prioridades e mudanças de design. Isso não cria comunicação automática entre os agentes: cada um só vê os arquivos/contexto que recebe.

Preferir um Git remoto único (serviço não definido). Não foi criado remoto nesta entrega. Inicialização opcional no Mac, depois de verificar que a pasta ainda não é um repositório:

```bash
git init
git add .
git commit -m "Base Dragon Ball Idle 0.4.0 e passagem"
git tag v0.4.0
```

Em cada tarefa: partir de commit conhecido; criar branch (`git switch -c melhoria/nome-curto`); implementar um escopo; rodar `npm run check` e `npm test`; validar no navegador o que mudou; atualizar documentação/versão quando pertinente; gerar commit com resumo. Não usar `git reset --hard` nem sobrescrever save para resolver divergências. Não editar simultaneamente o mesmo arquivo em cópias sem sincronização.

Passar do Claude para o ChatGPT: enviar ZIP atualizado sem `node_modules`, `data` ou segredos; incluir commit-base, commit final, arquivos alterados, resultados dos checks, bugs/limites e captura do resultado quando útil. Alternativa: patch textual com `git diff COMMIT_BASE..COMMIT_FINAL` para código/documentação; para PNGs alterados, enviar também os binários (ou usar patch binário explicitamente). Não usar só patch textual para transportar artes.

Passar do ChatGPT para o Claude: entregar este documento + ZIP/patch + lista do que foi alterado e base de versão. Claude compara `git status` e diffs antes de aplicar. Se não houver Git: parar as edições, criar backup datado, manter changelog e copiar apenas alterações conferidas; nunca misturar dois ZIPs sem comparar arquivos. Versionar `package.json`, texto da UI e health endpoint juntos quando houver nova versão de jogo.

Save e código são transferências distintas. Fazer backup de `data/` fora do repositório. Não enviar o save real ou tokens a repositório público. O inventário SHA256 do pacote permite conferir integridade dos arquivos, mas não substitui histórico Git.

**Primeira instrução sugerida ao Claude:** “Leia CLAUDE.md e docs/PASSAGEM_CLAUDE.md. Rode npm run check e npm test; inicie npm start e confira /animacoes.html. Não mude regras de balanceamento nem integre assets sem descrever o plano e preservar as decisões. Liste qualquer divergência entre esta base e meus arquivos locais antes de mesclar.”

## Apêndice A — inventário real de sprites e texturas

A tabela a seguir é extraída dos PNGs entregues. Os arquivos sem sufixo16 de versões anteriores podem ser legados; o manifesto e `art.mjs` determinam quais são consumidos. Não apagar `goku-sheet.png` nem estáticos de fallback só porque existem folhas novas.

| Arquivo em public/assets/ | Dimensões px | Bytes |
| --- | --- | --- |
| alien-attack-16.png | 1774 × 887 | 2480125 |
| alien-attack.png | 1774 × 887 | 1319904 |
| alien-diagonals-16.png | 1254 × 1254 | 2336886 |
| alien-walk-16.png | 1774 × 887 | 2307755 |
| alien-walk.png | 1774 × 887 | 1242558 |
| alien.png | 1254 × 1254 | 688764 |
| earth.png | 1448 × 1086 | 2254837 |
| goku-attack-16.png | 1774 × 887 | 2201763 |
| goku-attack.png | 1774 × 887 | 1026823 |
| goku-diagonals-16.png | 1254 × 1254 | 1849159 |
| goku-portrait.png | 1290 × 1219 | 477437 |
| goku-sheet.png | 1254 × 1254 | 1269811 |
| goku-walk-16.png | 1774 × 887 | 2060158 |
| goku-walk.png | 1774 × 887 | 860733 |
| grass.png | 1536 × 1024 | 2410075 |
| rock.png | 1536 × 1024 | 997946 |
| saibaman-attack-16.png | 1774 × 887 | 1926348 |
| saibaman-attack.png | 1774 × 887 | 1124486 |
| saibaman-diagonals-attack-16.png | 1774 × 887 | 1650973 |
| saibaman-diagonals-walk-16.png | 1254 × 1254 | 2051929 |
| saibaman-walk-16.png | 1774 × 887 | 2361136 |
| saibaman-walk.png | 1774 × 887 | 1179277 |
| saibaman.png | 1254 × 1254 | 378871 |
| ssj-attack-16.png | 1774 × 887 | 2664079 |
| ssj-attack.png | 1774 × 887 | 1175342 |
| ssj-diagonals-16.png | 1254 × 1254 | 2205250 |
| ssj-walk-16.png | 1774 × 887 | 2562908 |
| ssj-walk.png | 1774 × 887 | 1044870 |
| tree.png | 1343 × 1171 | 1240321 |
| vendor.png | 1244 × 1264 | 602132 |

## Apêndice B — completude da entrega

O ZIP contém código, inicializadores, instruções, configurações existentes, testes, todos os PNGs locais e esta passagem. Não inclui node_modules, sessão de teste, .git, caches, dados do usuário ou dependências externas. O pacote idle-dbz-assets não é uma dependência desta versão e continua separado, pendente de integração. O histórico detalhado de decisões está em docs/CONCEITO.md.
