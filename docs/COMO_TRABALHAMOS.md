# Como trabalhamos neste projeto

Manual para qualquer pessoa ou IA (Claude, em qualquer máquina) que for mexer no jogo. Ele junta as regras do
Pedro e o que já aprendemos fazendo. Leia junto com `AGENTS.md` (decisões do jogo) e `docs/PASSAGEM_CLAUDE.md`
(estado técnico, número por número). Escrito em 05/11/2026; atualize quando uma regra mudar.

## 1. Idioma e tom

- Tudo em **português do Brasil**: código, comentários, commits, PRs, documentos e conversa.
- Comentário explica o **porquê** e diz de onde veio a decisão ("decisão do Pedro, 05/11"), não repete o código.

## 2. Repositório do grupo: as regras do Pedro

O repositório é de 4 pessoas trabalhando em paralelo. A `main` só recebe trabalho por pull request.

1. **Antes de abrir uma branch, procurar branches locais/remotas e PRs abertas do mesmo assunto; reutilizar uma branch existente quando ainda estiver em andamento (pedido de 07/11/2026).** Branches já integradas não contam como trabalho aberto.
   **Nunca commitar na `main`.** Antes de mexer, executar `git fetch`; se não houver branch correspondente em andamento, criar um ramo a partir da `origin/main` mais nova.
   Instale as travas uma vez em cada clone: `sh ferramentas/travas-git/instalar.sh`.
2. **Não fazer commits nem pushs sem autorização explícita do Pedro para cada ação (reforçado em 08/11/2026).** Nada no GitHub sem OK explícito a cada vez: enviar ramo, abrir PR, comentar, abrir issue.
   **Sempre que implementar algo em uma nova branch, reiniciar o servidor e confirmar o endereço para o Pedro testar (pedido de 08/11/2026).**
3. **PR só "perfeitamente encaixado".** Antes de propor, audite:
   - a `main` andou? (`git log ramo..origin/main`) Se andou, atualize o ramo e teste de novo;
   - há PRs abertos de colegas que mexem nos mesmos arquivos?;
   - sem conflito: `git merge-tree --write-tree origin/main ramo`;
   - `npm run check` e `npm test` verdes;
   - nada de `data/save.json`, segredos ou mudanças só de teste (ex.: nível inicial alterado para a prévia);
   - `docs/PASSAGEM_CLAUDE.md` sem valor desatualizado.
4. **O merge é sempre o Pedro quem dá.** Entregue o link do PR.
5. Descrição do PR: o que entra, por quê, números medidos (equilíbrio, testes), o que foi conferido no navegador
   e um aviso aos colegas se arquivos muito compartilhados mudaram (`shared/game.mjs`, `client/game.mjs`, `index.html`).

## 3. Qualidade antes de economia

- Releia o arquivo antes de editar; nunca edite de memória.
- **Toda mudança visual é conferida no navegador**, com print, não só com teste verde.
  `ferramentas/navegador_cdp.mjs` abre o jogo num Chrome sem janela, executa passos e tira prints.
- Testes, `check` e auditoria nunca são cortados para ir mais rápido.
- Bug relatado: primeiro reproduzir e achar a causa (medir, gravar quadros), depois corrigir.

## 4. Prévias sem estragar o save

- Para mostrar uma versão ao Pedro, rode o servidor numa **cópia separada** (`git worktree add --detach <pasta> <ramo>`),
  não na pasta principal: o servidor grava `data/save.json` da pasta em que roda.
- Na cópia da prévia pode-se mudar o nível inicial (ex.: `|| 60` em `characters.mjs`) para ele testar hunts altas.
  Essa mudança **nunca** vai para commit.
- `DBI_CHEFE_JA=1 node server.mjs` faz o chefe raro nascer em 10 s (só para teste).
- Ao terminar, desligue o servidor e remova a cópia (`git worktree remove`).

## 5. Arte: é do Pedro

- A arte vem do Pedro (gerada no ChatGPT). **Integre a arte dele por código** (recorte, profundidade, sombra,
  posição); **nunca troque por outra arte** sem ele pedir, e **não mude as cores** das imagens dele sem OK.
- "Parece artificial / colado" = fazer a arte dele parecer parte do cenário, não redesenhar.
- Sempre que o próximo passo depender de arte nova, entregue **o que pedir e o prompt pronto** para colar no
  ChatGPT. Modelos que já funcionaram: `docs/prompts-chatgpt.md`.

### Folhas de mobs e personagens

- Formato: imagem **1024×1536**, grade **5 linhas × 4 colunas**, um quadro por célula, pés na mesma linha de base.
  Linhas: frente (sul), diagonal frente-direita, perfil direito, diagonal costas-direita, costas (norte, **sem rosto**).
  O jogo espelha o lado esquerdo.
- Fundo **magenta** puro (#FF00FF). Se o personagem tiver vermelho/roxo/lilás perto do magenta, fundo **verde** (#00FF00).
- Pedido de qualidade no prompt: pixel art nítida, contorno escuro contínuo, 3 tons por cor, personagem em ~80% da célula.
- Mob que anda e luta: 3 folhas (andar, soco, rajada de ki). Peça as 3 **num chat só**: o prompt único gera a
  folha 1 e, a cada "próxima", a seguinte, usando a primeira como referência de tamanho e traço.
- Na rajada, só o clarão na mão (ou na boca); o raio que voa o jogo desenha.
- Conferir sempre: costas sem rosto, 4 quadros diferentes por linha, nada cortado na borda (cabelo, cauda, chifres).
- Recorte: `ferramentas/fatiar_caminhada.py` (modo `conectado` para personagem roxo; 7º argumento `verde` para fundo
  verde) e depois `ferramentas/gerar_modulo.py` para o módulo `public/art/*.mjs`.

### Mapas

- Mapa grande sai em partes: primeiro o mapa-múndi numa imagem só, aprovado; depois 36 partes com molde
  (`partes_mapa.py`), conferidas (`conferir_parte.py` / `conferir_abismo.py`) e montadas com costura (`montar_mapa.py`).
- Parte refeita: anexe a **vizinha pronta** como referência de textura e meça o tamanho do grão, não só a cor.
- Peça o mapa com cada área já **cercada por barreira natural** (abismo, paredão, mar): o limite da hunt cai no desenho.
- Máscara de passagem (onde se anda) é gerada e **conferida pintada sobre o mapa**; o que é alto mas tem a cor do chão
  (mesas, vulcões, pé de árvore, cristal) é marcado à mão.

## 6. Regras de jogo que já aprendemos a não quebrar

- **Servidor e predição do cliente usam a mesma regra de passo** (`deslocar` em `shared/passagem.mjs`); se divergirem,
  o personagem treme.
- **Tudo que interage passa por `Game.mesmoLugar`** (mesmo planeta e mesma área): dano, alvo, projétil, loot, snapshot.
- **Objeto grande precisa de tamanho próprio** nas regras de distância, bloqueio e profundidade. Números pensados para
  o Goku (70 de altura) não escalam: um Oozaru parava "em cima" do Goku até ganhar `corpo`; um vulcão bloqueava chão
  plano até ganhar contorno e profundidade ponto a ponto.
- Objeto do cenário com profundidade (árvore, cristal, vulcão, casa): só a base bloqueia; o desenho é redesenhado por
  cima, na ordem de profundidade, para quem passa atrás ficar coberto.
- Objeto com a mesma cor de outra regra automática (cristal roxo × paredão roxo) precisa ser excluído dela.

## 7. Equilíbrio

- Critério do Pedro: **o nível mínimo de cada hunt não mata os mobs com facilidade**; o mais fraco da hunt cai, o
  mais forte só cai perto do nível máximo da faixa. Chefe raro não cai sozinho sem equipamento.
- Meça por simulação, sem navegador: duelo 1×1 (`Game` com `populate: false`, `addMob`, `tick`) e caça automática de
  5 min no nível mínimo (abates e mortes). Informe os números no PR e em `docs/PASSAGEM_CLAUDE.md`.
- Mudou algo que vale para todos os mobs (ex.: aggro)? Compare a caça automática **antes e depois** em todas as hunts.

## 8. Decisões e registro

- Separe **decisão do Pedro** de **valor provisório**. Decisão vai para `AGENTS.md` (curta) e `docs/PASSAGEM_CLAUDE.md`
  (com números e data). Provisório é marcado como tal.
- Quando algo depender de uma escolha dele, pergunte com opções e uma recomendação; não decida sozinho.
