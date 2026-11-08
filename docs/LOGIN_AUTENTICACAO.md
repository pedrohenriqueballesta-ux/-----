# Login, seleção de personagens e tutorial por conta

Branch feature/tela-login, iniciada em origin/main bca0938. Sem commit, push ou merge automático.

## Fluxo e funcionalidades

Login → autenticação → seleção validada → animação de carregamento existente → mundo. Ao atualizar, uma sessão válida volta à seleção. Não existe mais entrada anônima nem recuperação automática direta para o mundo. Sair da conta invalida a sessão no servidor. A sessão também perde sua seleção ativa quando a conexão com o mundo termina. Uma conta pode manter uma entrada ativa no mundo por vez; outras abas da mesma conta não criam jogadores duplicados.

Cadastro e login usam nome de usuário e senha. Há confirmação, mostrar/ocultar senha e opção de lembrar apenas o usuário. O limite de personagens é 3, definido por AUTH_CONFIG.maxPersonagens e configurável pelo construtor de Autenticacao. Apenas Goku está registrado. Seleção e criação usam os personagens reais vinculados à conta; o servidor rejeita IDs de outras contas e entrada sem seleção.

A tela utiliza o cenário fornecido, um recorte transparente de Goku, balões contextuais, formulário central, mural e contador. É responsiva e organiza o formulário primeiro no celular. A marca textual é Dragon Ball Idle; o logo “Dragon Ball RPG Online” do pacote não foi usado como nome do projeto. Goku/cenário ficam em elementos separados, prontos para animações futuras.

Português, inglês e espanhol estão em arquivos separados. Idioma inicial segue o navegador, com fallback em português; a troca é persistida no navegador e na conta. Textos de login, cadastro, recuperação, seleção, tutorial e erros são traduzidos. O restante da HUD continua com seu idioma existente.

O áudio existente é reutilizado: login e seleção mantêm a trilha de login, com volume 0–100%, mute e preferências de conta/cache local. Ao concluir o carregamento, a trilha passa ao ambiente do mundo. Há um só elemento de áudio. Controle de efeitos sonoros aparece identificado e desabilitado porque o projeto ainda não possui sons de efeitos; não se simulou um motor de SFX.

## Segurança e persistência

- Senhas usam scrypt assíncrono nativo do Node (N=131072, r=8, p=1), salt aleatório de 16 bytes e chave de 64 bytes. Isso mantém Node >=22 sem instalar framework/dependência. Scrypt foi escolhido porque Argon2 nativo não está disponível em toda a versão mínima suportada.
- Sessões usam segredo aleatório de 32 bytes em cookie HttpOnly, SameSite=Strict, Path=/, Secure em HTTPS (ou com COOKIE_SECURE=true). O save guarda somente o hash do segredo, ID da conta e expiração (7 dias), nunca o token bruto.
- Login tem erro genérico para usuário/senha inválidos e limitação por origem/usuário. Há limite global de duas derivações de senha simultâneas e fila de até 16 trabalhos. Senhas/chaves não são registradas em logs.
- POST exige JSON e rejeita Origin diferente do host/protocolo. Para HTTPS atrás de proxy, encaminhar corretamente X-Forwarded-Proto e usar COOKIE_SECURE=true. Nenhum CORS amplo foi adicionado.
- APIs do jogo, inclusive SSE, Bestiário e Mercado, exigem sessão válida e personagem selecionado/ativo. EventSource utiliza cookie de mesma origem, sem token na URL. URLs diretas e o antigo /api/join não contornam autenticação.
- Senhas, tokens novos e chaves não são salvos em localStorage/sessionStorage. O navegador só guarda idioma, usuário lembrado e preferências de áudio. As leituras dos tokens antigos existem exclusivamente para migração e são removidas após autenticação bem-sucedida.
- A infraestrutura continua de instância única com arquivo JSON e gravação temporária/rename no save existente. Não é um banco compartilhado entre múltiplos processos. Contas, personagens, tutorial e sessões ficam em __auth; mercado e guildas permanecem no mesmo arquivo.

### Recuperação de senha

Sem provedor de e-mail configurado no projeto, a recuperação usa uma chave secreta forte entregue apenas no cadastro. O usuário precisa guardá-la. O servidor armazena somente seu hash. Redefinir exige usuário, chave e senha nova; gira a chave e invalida todas as sessões da conta. Não se simulou envio de e-mail. O novo código é mostrado uma única vez. Sem senha nem chave, a recuperação automática não é possível nesta versão.

### Migração dos personagens anteriores

Não é necessário comando de banco. Na primeira inicialização com saves anteriores, o servidor cria data/save-antes-auth-<timestamp>.json antes de habilitar __auth. Registros anônimos antigos ficam preservados até serem vinculados.

No mesmo navegador onde havia progresso anterior, a tela lê o token legado já existente e o envia no cadastro/login. O servidor só importa se esse segredo corresponder a um save não vinculado; nome do personagem sozinho não dá acesso. O save completo é movido para a conta, preservando nível, inventário, dinheiro, identidade pública e vínculos de mercado/guilda. Outros saves legados continuam preservados. Sem o token antigo, a importação precisa de administração manual a partir do backup; não foi criada uma rota pública para reclamar personagens por nome.

## Tutorial

São 12 etapas com destaques dos elementos reais do HUD, escurecimento, próximo, voltar, pular e conclusão. Os destaques acompanham resize e usam o menu compacto quando o ícone não está visível no celular. Não são abertas telas fictícias nem exigidas ações perigosas. Escape não pula silenciosamente o tutorial.

A conta guarda tutorialCompleted, tutorialCompletedAt e tutorialStep. Interrupção retoma a última etapa; concluir ou pular vale para todos os personagens da conta. Configurações → Dados e conta permite Rever tutorial, Trocar personagem e Sair da conta. A revisão não apaga conclusão nem data. A simulação e as regras de combate/progressão/movimentação não foram alteradas.

## Contador e mural

GET /api/entrada retorna a contagem real de jogadores com SSE ativo no mundo, deduplicados por personagem, além de notícias e links. Cadastro, seleção e contas salvas não entram na contagem. O frontend consulta a cada 10 segundos enquanto a entrada estiver visível; em falha mostra Indisponível.

Conteúdo oficial é lido do backend em data/entrada-conteudo.json. Sem esse arquivo, o mural fica vazio e os links informam que ainda não foram configurados. Não existem notícias ou números fictícios no jogo normal. Exibe três notícias recentes, leitura completa e Ver todas.

Estrutura inicial do arquivo:

```json
{"noticias":[],"links":{"regras":null,"termos":null,"privacidade":null,"suporte":null,"discord":null,"instagram":null,"youtube":null}}
```

Cada notícia deve ter id, titulo, descricao, conteudo opcional, data ISO e categoria (atualizacao/evento/manutencao/aviso). Textos podem ser strings ou objetos com pt-BR/en/es. Datas válidas são ordenadas no backend. Links só aceitam HTTPS. A equipe pode publicar, editar ou remover conteúdos alterando esse arquivo; não há painel administrativo público. Não foram inventadas URLs, regras oficiais, termos jurídicos ou política de privacidade.

## Arquivos

Criados:
- server/auth.mjs; server/entrada-conteudo.mjs.
- public/client/entrada.mjs; public/client/i18n.mjs; public/client/tutorial.mjs.
- public/client/locales/pt-BR.mjs, en.mjs e es.mjs.
- public/entrada.css; public/assets/login/pacote.png; public/assets/login/goku-anfitriao.png.
- tests/auth-helper.mjs; tests/auth.test.mjs; docs/LOGIN_AUTENTICACAO.md.

Modificados:
- server.mjs: cookies, rotas, validações, migração, save, contador e consultas autorizadas.
- public/index.html: estrutura da entrada e stylesheet.
- public/client/game.mjs: conexão autenticada, fluxo/loading e retorno à seleção.
- public/client/audio.mjs: preferências da entrada e mensagens traduzidas.
- public/render/teleporte.mjs: container opcional para reutilizar o loading dentro da entrada.
- public/render/abas-hud.mjs; public/render/configuracoes-hud.mjs; public/render/janelas-hud.mjs: acesso ao tutorial/troca/logout e Escape.
- package.json: novos módulos na checagem de sintaxe.
- Testes HTTP de Bestiário, Cura, Game, HUD, Loja e Mercado agora autenticam contas e selecionam seus personagens em vez de usar a rota anônima removida.

## Assets e preparação

O pacote original foi copiado integralmente para public/assets/login/pacote.png e seu cenário superior esquerdo é enquadrado por CSS. O Goku recortado está em public/assets/login/goku-anfitriao.png, derivado via ferramenta nativa imagegen e preservando alpha; não há referência a arquivos de .codex na aplicação.

Prompt usado no imagegen (modo nativo, não CLI):

“Edit target: the supplied Dragon Ball graphics pack. Extract ONLY the smiling Goku host shown in the upper-right panel below the logo. Preserve that exact character design, welcoming outstretched hand, face, clothing, pose, anime ink lines and colors. Deliver a clean transparent PNG cutout with alpha, tightly framed around the complete visible upper-body figure, cut at the waist exactly as the source; no added limbs, no redesigned artwork. Remove ALL background, including the checkerboard pattern, logo and all other graphics. No text, no new background, no mockup. This is a reusable character-host asset for a login UI.”

## Testes e comandos

- npm.cmd run check: sintaxe validada.
- npm.cmd test: 295 testes passaram.
- Testes novos verificam fechamento de API anônima, cookie, posse e seleção, hash/recuperação e revogação, cadastro concorrente, rate limit, expiração, CSRF, limite de personagens, tutorial por conta/reinício, migração com backup, contador deduplicado, mural e traduções completas.
- Navegador desktop 1400×900 e móvel 420×740: cadastro, chave, seleção vazia, criação, seleção validada, loading existente, mundo, tutorial, skip, retomada após atualizar, segundo personagem sem repetir tutorial e revisão manual. Conferidos textos em PT/EN/ES e erros traduzidos. Não surgiram erros de execução; os avisos legados de IDs ausentes da HUD continuam ignorados pelo adaptador.
- Os testes usam diretórios temporários e contas/avisos identificados de QA. Esses dados não são gravados no progresso real.

Para executar: npm.cmd start e abrir http://localhost:3000. Criar uma conta, guardar a chave, criar ou importar um personagem, selecioná-lo e entrar. Atualizar deve voltar à seleção. Nas configurações, testar revisão do tutorial, troca e logout. No login, testar recuperação com a chave. Em nova conta, o tutorial deve aparecer; em segundo personagem da conta concluída, não deve repetir.

Referências de implementação: https://nodejs.org/api/crypto.html e https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html ; cookies/sessões: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html .