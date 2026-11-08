# Ajustes de login e mural automático da main

Branch reutilizada: feature/tela-login, atualizada por fast-forward para origin/main (217c277).

## Visual
- Mantida a arte original do Goku: no desktop, sua base fica encostada no rodapé da tela. No tablet/celular, a ilustração termina numa moldura para que o recorte não pareça flutuar.
- Seleção: mais espaçamento entre cards, textos e ações; ações da conta separadas por uma divisória.
- Mural: cinco atualizações, com rolagem própria e leitura completa no modal. Data de integração na main exibida no idioma/fuso do navegador.

## Atualizações automáticas
server/novidades-main.mjs consulta a API do GitHub para pedrohenriqueballesta-ux/-----, branch main, sem filtro de autor. Percorre o primeiro pai dos commits: cada merge conta uma vez, sem repetir seus commits internos. Publicações diretas na main também contam. O título do merge e seu corpo alimentam a descrição breve; por isso, mensagens claras de PR/commit produzem notícias mais úteis.

Cache de cinco minutos e uma única consulta compartilhada entre visitantes. A tela consulta o backend a cada dez segundos enquanto aberta. Falhas/limites da API conservam o mural disponível e permitem nova tentativa após um minuto. O último mural consultado fica também em data/novidades-main-cache.json para sobreviver a reinícios sem conexão. server/novidades-main.json contém cinco publicações reais da main como reserva inicial. GITHUB_NEWS_TOKEN é opcional, configurado apenas no servidor para limites de API maiores ou repositório privado; nunca é enviado ao navegador.

A fonte principal passa a ser o GitHub. entrada-conteudo.json continua configurando links; suas notícias manuais são usadas somente se não houver atualizações disponíveis da main.

## Arquivos
- Modificados: public/entrada.css, public/client/entrada.mjs, server.mjs, package.json, tests/auth.test.mjs.
- Criados: server/novidades-main.mjs, server/novidades-main.json, tests/novidades-main.test.mjs e este relatório.

## Conferência
Testes de histórico primeiro-pai, cinco publicações, autores diferentes, cache/concorrência, falha de rede, pai fora da página e endpoint anônimo. Consulta real ao GitHub conferida. Navegador em 1400×900, 900×800 e 420×740, com três personagens de teste em servidor temporário, sem alterar contas reais.
