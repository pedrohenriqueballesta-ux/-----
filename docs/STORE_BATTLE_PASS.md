# Store e Battle Pass — entrega

## Branch e organização

Branch usada: `feature/hud-central-superior`, criada da `origin/main` atualizada após verificar que as branches antigas da HUD superior já estavam incorporadas. Trabalho anterior preservado. Esta conclusão não cria commit, push, merge ou PR.

## Funcionalidades prontas

- Store separada do mercador: catálogo com moedas, VIP, itens especiais e passe, cards, confirmação explícita, histórico real de transações, saldo da conta e coleção.
- Moedas premium, VIP e colecionáveis pertencem à conta; BP XP, missões, passe premium e resgates pertencem ao personagem.
- Planos VIP de 30/90 dias acumulam duração e habilitam compra de cosmético exclusivo VIP. Não alteram dano, XP normal ou velocidade. Os valores iniciais são provisórios e configuráveis.
- Passe com 50 níveis configuráveis, trilhas gratuita/premium visíveis, BP XP próprio, missões diárias e semanais UTC, limite de temporada e resgates individuais. Comprar premium depois libera níveis anteriores sem comprar XP.
- Eventos de missões existentes alimentam o passe; God Mode não gera progresso/resgates de recompensas. Não há rota HTTP para o frontend definir BP XP ou saldo.
- Compra usa cotação temporária vinculada à conta/personagem, preço resolvido no servidor, confirmação idempotente e revalidação de saldo. Resgates checam nível, trilha, duplicação, peso, estoque e limites de carteira antes da entrega.
- Conta, personagem e registros são gravados juntos pelo salvamento atômico existente. Testado após reiniciar o servidor e trocar de personagem.

## Pagamentos e teste local

Não há pagamentos reais, captura de cartões ou integração externa ativa. O adaptador em `server/pagamentos.mjs` é exclusivamente simulado e recusa recargas fora de `development`. O padrão do servidor sem NODE_ENV é produção; parâmetros enviados pelo cliente não habilitam simulação.

- `npm start`: ambiente padrão seguro, sem recargas simuladas (respeita NODE_ENV se definido pelo operador).
- `npm run dev`: ambiente local explícito de desenvolvimento, permite confirmar recargas simuladas sem cobrança.

Os preços em R$ nos pacotes são referências de protótipo. Para produção será necessário um provedor com verificação de confirmação/webhook, conciliação e armazenamento adequado. Não basta habilitar o simulador.

## Artes e HUD

GIFs fornecidos copiados para:

- `public/assets/premium/store.gif` — 414×401, 9 frames.
- `public/assets/premium/battle-pass.gif` — 414×414, 9 frames.

Dois novos botões vizinhos após os ícones existentes, mantendo sua ordem. A barra foi ampliada discretamente pelas novas células, com ajustes nas ponteiras e espaçamentos, sem reduzir excessivamente os demais ícones. Menu recolhível/rolável em tablet e celular, acima das outras HUDs. As duas janelas usam os controladores existentes de exclusividade, arrasto e redimensionamento.

O preto estava embutido nos GIFs. `icones-animados.mjs` decodifica os nove frames originais, remove somente o fundo escuro conectado às bordas e renderiza com alfa, preservando pixels coloridos e preto interno. Frames são processados e compartilhados por arquivo, usando um único controlador de animação; a aba oculta pausa o desenho. Não há recriação das artes ou animações extras de CSS. Em navegadores sem ImageDecoder, o GIF nativo continua animado com composição `screen` como fallback visual; a transparência real por pixel foi validada em Edge/Chromium.

## Configuração

`public/shared/premium-config.mjs` concentra produtos, preços, duração VIP, coleção, temporada, quantidade de níveis, BP XP por nível, metas e recompensas. A temporada inicial vai de 01/11/2026 a 01/02/2027 UTC. Regras de progresso ficam em `battle-pass.mjs`; operações econômicas, em `server/premium.mjs`.

## Limitações e próximos passos

Skins, auras e montarias podem ser compradas/resgatadas e constam da coleção da conta. Equipar e apresentar essas artes no personagem/movimento exige os sistemas e assets visuais correspondentes; a interface informa isso antes da compra. Os ícones de catálogo desses itens são referências existentes do projeto. Não foi implementado provedor de pagamento real.

## Validação

- `npm run check` e `npm test`: **327 testes passaram**.
- API: autenticação, isolamento de contas, saldo compartilhado, passe por personagem, concorrência/idempotência, preço não manipulável, bloqueio de simulação em produção, duplicação, períodos UTC, inventário cheio e persistência após reiniciar.
- Navegador, em servidor temporário sem saves reais: recarga 550 confirmada; missão concedendo 100 BP XP; compra do passe; resgate gratuito/premium do nível anterior; coleção/histórico; exclusividade de janelas; 50 níveis; desktop 1400×900 e celular 420×740.
- Transparência: alfa zero nos cantos, arte preservada, hashes de frames distintos confirmando animação e menu mobile realmente clicável acima das outras HUDs.

## Arquivos criados

- `public/assets/premium/store.gif`, `battle-pass.gif`
- `public/shared/premium-config.mjs`, `battle-pass.mjs`
- `server/premium.mjs`, `pagamentos.mjs`, `desenvolvimento.mjs`
- `public/render/premium-comum.mjs`, `store.mjs`, `battle-pass-hud.mjs`, `icones-animados.mjs`
- `tests/premium.test.mjs`, `premium-servidor.test.mjs`, `icones-animados.test.mjs`
- `docs/STORE_BATTLE_PASS.md`

## Arquivos modificados

- `server.mjs`: ambiente, API autenticada, serviço premium e MIME GIF.
- `public/shared/characters.mjs`: persistência do passe por personagem.
- `public/shared/missoes.mjs`: integração com os eventos confirmados já existentes.
- `public/client/hud.mjs`: abertura das duas janelas e tratamento dos ícones.
- `public/index.html`: botões animados da HUD superior.
- `public/style.css`: layout e responsividade.
- `package.json`: comando dev e verificações de sintaxe.
## Catálogo atualizado e destaque central
Store e Battle Pass agora ocupam as duas posições centrais da HUD, com cinco ícones comuns de cada lado e destaque moderado de tamanho. A ordem relativa dos ícones comuns foi preservada.

O pacote store_zeni_9_icones_1024.zip foi integrado em public/assets/premium/catalogo, preservando os PNGs originais com transparência. As margens vazias são compensadas na renderização e o recorte visual é compartilhado por arquivo.

Pacotes atuais: 50, 100, 250, 500, 1.000 e 2.500 moedas. Referências provisórias de simulação: R$ 2,49 / 4,90 / 9,90 / 19,90 / 34,90 / 79,90. Não há cobrança real. VIP: 15 dias por 150 moedas, 30 dias por 250 e 90 dias por 650. Ícones próprios para cada quantidade e duração. Valores continuam configuráveis em premium-config.mjs.

Os pacotes antigos de 550 e 1.200 saíram das ofertas; registros históricos e saldos já adquiridos permanecem. Testes atualizados para os produtos atuais, incluindo saldo e vencimento do novo VIP de 15 dias. Conferidos seis cards de moedas e três de VIP, desenhos legíveis e centro da HUD no navegador desktop/celular.
## Remoção do fundo dourado dos ícones do catálogo
As seis artes de moedas e três VIP foram limpas com a skill imagegen, removendo a mancha dourada/marrom e mantendo a transparência. Novos arquivos `*_limpo.png` em `public/assets/premium/catalogo/`; os PNGs originais foram preservados. O catálogo referencia as versões limpas. O recorte visual descarta resíduos de alfa quase zero e pequenos componentes isolados distantes da arte principal, mantendo os brilhos próximos e evitando que um ponto remoto diminua o ícone no card. Conferidos os seis pacotes e os três planos no navegador sobre o fundo azul da Store.