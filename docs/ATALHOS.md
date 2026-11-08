# Atalhos do jogo

Branch feature/novos-atalhos, criada da main atualizada após merge #69.

| Funcionalidade | Atalho |
| --- | --- |
| Perfil / atributos | Tab |
| Mochila | I |
| Missões | J |
| Bestiário | B |
| Mapa | M |
| Store | O |
| Battle Pass | P |
| Loja / mercador | L |
| Ranking | V |
| Guilda | G |
| Caixa de mensagens | C |
| Fechar janela / abrir Configurações | Esc |
| Ligar / desligar Auto Hunt | H |
| Painel Auto Hunt e Hunt Analyzer | Y |
| Montar / desmontar Nimbus | X |
| Conversar / enviar mensagem | Enter |
| Movimento | WASD / ↑ ← ↓ → |
| Ataque básico | Espaço |
| Imagem Residual | Shift |
| Cura de Vida | 1 |
| Kamehameha | 2 |
| Kaioken | 3 |
| Barreira de Ki | 4 |
| Transformação | 5 / T |
| Genki-Dama | 6 |
| Consumível do slot 7 | 7 / R |
| Consumível do slot 8 | 8 / Q |
| Usar comida | F |
| Zoom do mapa sob o cursor / câmera | Roda do mouse |
| Navegar até um ponto pelo minimapa | Clique no minimapa |

## Comportamento
- Pressionar novamente o atalho da aba aberta fecha essa aba, inclusive M (Mapa), L (Loja) e Y (painel Auto Hunt). Atalhos de outras abas trocam a janela exibida.
- B deixou de abrir a mochila: agora é Bestiário. Mochila usa I. R/Q/T continuam reservados aos consumíveis/transformação.
- Esc fecha a janela aberta sem abrir outra no mesmo pressionamento. Sem janelas, abre Configurações. No chat, Esc apenas sai da digitação. Login e tutorial mantêm seus fluxos próprios.
- H liga/desliga Auto Hunt; Y abre/fecha suas preferências e o Hunt Analyzer. X monta/desmonta Nimbus. Repetição da tecla pressionada não gera múltiplas ativações.
- H/X preservam as teclas de movimento mantidas pressionadas. Menus/chat liberam o movimento ao abrir.
- Atalhos são ignorados em inputs, selects, textarea e conteúdo editável. Combinações com Ctrl/Alt/Cmd e Shift+Tab não são capturadas pelo novo roteador. Não foram utilizados F1/F5/F11/F12 nem atalhos do navegador.
- A Loja continua obedecendo às regras existentes do mercador/NPC.
- A tabela é gerada de public/shared/atalhos.mjs, exibida em Configurações → Jogabilidade e na última etapa do tutorial. Dicas nas etapas relevantes, rodapé da HUD e títulos dos botões foram atualizados. O tutorial e a tabela de suas dicas têm versões em português, inglês e espanhol.

## Verificação
npm run check e npm test: 350 testes passaram. No navegador: onze menus por teclado sem janelas acumuladas, Esc fechar/abrir configurações, Y para painel, H/X sem repetição, campos de texto e combinações de navegador preservados. Tutorial conferido em desktop e celular, com os trinta itens da tabela.

## Arquivos
Criados: public/shared/atalhos.mjs, public/client/atalhos.mjs, public/render/atalhos-hud.mjs, tests/atalhos.test.mjs e este documento.
Modificados: public/client/game.mjs, hud.mjs, tutorial.mjs e locales/pt-BR.mjs, en.mjs, es.mjs; public/render/configuracoes-hud.mjs, janelas-hud.mjs; public/index.html, public/style.css e package.json.
