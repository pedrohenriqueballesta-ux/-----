# Novidades das abas da HUD

O envelope foi substituído pela arte fornecida, sem o alerta vermelho embutido. O novo selo de exclamação só aparece quando existem novidades não lidas para aquela aba e jogador.

Correio e Missões ainda não possuem sistemas completos de conteúdo nesta versão. Nenhum aviso fictício é gerado ao entrar, passar de nível ou atacar. Avisos de combate e o chat do sistema continuam separados.

Os sistemas do servidor podem publicar conteúdo com:

```js
game.notificarNovidade(jogador, {
  id: 'identificador-estavel-e-unico',
  aba: 'correio', // ou missoes, ajustes e demais abas existentes
  titulo: 'Título da novidade',
  texto: 'Conteúdo que o jogador poderá ler.'
});
```

Uma atualização de conteúdo deve usar um ID novo. IDs repetidos não recriam alertas já lidos. Não há endpoint para o cliente publicar conteúdo. O snapshot contém somente as novidades do próprio jogador.

Ao clicar em uma aba com novidades, o jogador pode ler o conteúdo e escolher **Marcar como lidas**. Fechar sem marcar mantém o alerta. Sem novidades, o clique conserva o funcionamento anterior da aba. O estado de leitura é salvo no progresso e restaurado ao reconectar. São mantidas as últimas 100 entradas por jogador; as próximas fontes de missões/correio devem integrar essa API ao publicar conteúdo real.

Validação: testes cobrem abas inicialmente limpas, isolamento entre jogadores/abas, duplicação, leitura, persistência e entrada inválida. Conferência no navegador deve usar servidor temporário sem save, sem inserir conteúdo de teste na entrega.
