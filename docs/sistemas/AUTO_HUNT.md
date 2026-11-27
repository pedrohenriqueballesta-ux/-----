# HUD Auto Hunt

Pedido de 07/11/2026. Branch `feature/hud-auto-hunt`, criada da `origin/main` após
o merge da Cura de Vida.

## Painel

O canto inferior direito agora tem um único botão **Auto Hunt**, com estado ON/OFF
da caça. Clicar abre ou fecha um painel não modal no estilo da Mochila. Abrir não
inicia a caça. O painel tem botão de fechar e aceita Escape, sem pausar o jogo ou
bloquear os atalhos quando o foco não está editando um campo. H continua ligando
ou pausando a caça; o botão dentro do painel faz a mesma ação.

Controles reunidos:

- Caça automática, com local atual e indicação de área onde não pode iniciar.
- Ataque automático e técnicas automáticas, independentes após iniciar a caça.
- Cura de Vida automática e limite de HP (padrão 70%).
- Poção de Ki automática e limite de Ki (padrão 25%).
- Semente automática e limite de HP (padrão 30%), com seleção de potência.
- Comida automática durante a caça.
- Estoque e recarga da poção e da semente selecionada.

As porcentagens aceitam inteiros de 1 a 100. Disparam **abaixo** do valor escolhido;
o valor exato não ativa. Continua valendo a lógica existente: caça liga ataque e
técnicas ao iniciar; a autocura roda durante caça ou técnicas automáticas; comida
é renovada na caça; poções e sementes não são consumidas dentro de área segura.
O painel pode rolar verticalmente em janelas menores e não escurece o mapa.
Após revisão do usuário, foi reduzido para até 340 px de largura e 380 px de altura.
Ao abrir ou redimensionar a janela, mede minimapa/zoom e barra de habilidades para
caber no espaço entre eles. Só o corpo rola; cabeçalho e fechamento ficam visíveis.
Novo ajuste solicitado: cabeçalho permite arrastar a janela com mouse ou toque.
Botões e campos não iniciam arrasto. A posição final e a altura compacta são
guardadas no navegador (`dbi-auto-hunt-posicao`), preservadas ao fechar, reabrir
e recarregar a página. Depois do primeiro arrasto, o encaixe automático respeita
essa preferência; redimensionar limita a janela à tela sem apagar a posição salva.
Testes específicos conferem captura do ponteiro, persistência, restauração e limites.

## Combo de técnicas

Com recarga normal, inclusive no God Mode, o Auto Hunt verifica a lista a partir
da primeira posição e usa a técnica disponível de maior prioridade. Com a recarga
rápida do God Mode, continua a lista a partir da posição seguinte ao último uso
bem-sucedido e volta ao início ao completar a volta. Nos dois modos, técnicas
indisponíveis por recarga, alcance, forma ou Ki são puladas naquela tentativa.
Salvar o combo, iniciar a caça ou mudar o modo de recarga reinicia a sequência.

O seletor Mobs próximos define o mínimo para cada técnica (1, 2+, 3+ ou 4+).
Na Angry Explosion, a contagem usa o raio real em torno do Boo. Na Supernova,
usa o raio real em torno do alvo marcado. Para as outras técnicas, 2+ ou mais
exige o grupo a até quatro tiles do personagem. Só entram na conta inimigos
vivos que o personagem pode enfrentar na mesma área, fora da zona segura.
Configurações anteriores mantêm os padrões de 3 para Angry Explosion, 2 para
Supernova e 1 para as demais técnicas.

## Servidor e persistência

`automationThreshold` valida chave e valor no servidor. A ação anterior
`healThreshold` continua compatível. O cliente mostra o snapshot, sem decidir uso,
HP, Ki ou estoque. Custo e cooldown dos itens e habilidades permanecem iguais.

Preferências de cura, comida, poção e semente, os três limites e a potência da
semente são persistidos. Saves antigos recebem os padrões atuais. Caça, ataque e
técnicas continuam desligados ao reconectar; sessão desconectada não consome itens.

## Validação

Testes cobrem limites padrão/personalizados, validação, estoque, recarga compartilhada
das sementes, repetição sem desconto duplicado, área segura, desconexão, persistência,
migração de saves e abertura/fechamento não modal com estado acessível.
`npm test`: 197 testes passaram; `npm run check`: passou.
Conferência visual com captura ainda pendente por indisponibilidade do acesso ao
navegador nesta sessão. Servidor reiniciado para teste do usuário.
Usuário revisou e aprovou o painel móvel, autorizando o commit em 07/11/2026.
Push e merge aguardam autorização.
