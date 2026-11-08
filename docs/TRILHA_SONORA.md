# Trilha sonora por ambiente

Branch feature/trilha-sonora, criada a partir de origin/main fe4f02a após procurar branches e PRs abertas de áudio.

## Funcionamento

- Login: login.mp3 toca em loop enquanto a tela de entrada/criação atual (welcomeDialog) estiver aberta. Se o personagem for recuperado diretamente, sem tela de entrada, não toca a música de login. O seletor ambienteMusical aceita explicitamente o estado de tela de login/seleção; uma futura tela separada de seleção deverá usar o mesmo sinal.
- Cidades: cidades.mp3 toca na Terra/lobby e nas áreas marcadas como seguras (Vila Namekiana e Cidade dos Saiyajins). Cidade → cidade ou troca de planeta entre cidades mantém a faixa e sua posição, sem reiniciar.
- Hunts: hunts.mp3 toca nas áreas de caça, inclusive dentro do pequeno quadrado seguro de chegada. Ao sair da hunt para uma cidade, a faixa muda para cidades; ao abrir a entrada, muda para login.
- Trocas seguem a localização confirmada no snapshot do servidor. A animação de teleporte e as regras de combate/renascimento permanecem existentes. Se o servidor levar o jogador morto a uma cidade, toca cidades; quando ele reaparece na própria hunt (comportamento atual), mantém a trilha de hunt.

Há um único elemento de áudio por cliente, sem músicas simultâneas. A faixa anterior é pausada e reposicionada antes de trocar a origem. Snapshots repetidos não reiniciam a música. A reprodução usa HTMLAudioElement com loop nativo; somente a faixa necessária é carregada. Promessas de reprodução antigas são ignoradas após troca de contexto, desativação ou encerramento.

Navegadores podem exigir interação para permitir som. O primeiro clique/toque ou tecla reais tenta iniciar a música; na tela de login aparece uma orientação discreta quando o autoplay foi bloqueado. Erros de áudio não interrompem o jogo. Sair e retornar pelo histórico suspende/retoma o mesmo reprodutor; o encerramento explícito remove os listeners.

## Configurações e persistência

Configurações → Áudio tem Ativar músicas de ambiente e Volume da música. Padrão: habilitado, volume 40%. Volume zero pausa. A opção vale para todas as faixas, inclusive login. Preferências são validadas e salvas no perfil pelo mecanismo existente; um cache local somente destas preferências aplica a última escolha antes de o perfil chegar na tela de entrada. Restaurar preferências padrão também restaura a música.

Nenhum controle fictício de efeitos sonoros foi adicionado; estes continuam indisponíveis.

## Arquivos

Novos:
- public/client/audio.mjs: seleção de ambiente, reprodução e ciclo de vida.
- public/assets/audio/login.mp3, cidades.mp3 e hunts.mp3: cópias integrais dos arquivos fornecidos, com SHA-256 igual aos originais.
- tests/audio.test.mjs.
- docs/TRILHA_SONORA.md.

Modificados:
- public/client/game.mjs: conexão ao snapshot e à tela de entrada.
- public/shared/preferencias.mjs: ativação e volume validados.
- public/render/configuracoes-hud.mjs: controles de áudio funcionais.
- server.mjs: Content-Type audio/mpeg e tamanho dos arquivos estáticos.
- package.json: verificação de sintaxe do módulo.

## Validação

npm.cmd run check passou. npm.cmd test: 283 testes passaram, incluindo oito testes novos de seleção de ambiente, loop sem reiniciar, desativação/volume, autoplay e repetição por interação, promessas antigas, persistência, MP3 por HTTP/HEAD e saída/retorno da página.

No Edge: reprodução efetiva dos três MP3 com tempo avançando; loop real ao alcançar o fim da faixa; continuidade entre cidades/planetas; troca cidade → hunt → cidade e retorno ao login; somente um reprodutor; desativação e retorno após recarregar; volume pela interface e pausa em zero. Sem novos erros no console. Os avisos antigos de IDs de HUD ausentes continuam ignorados pelo adaptador existente.

Os cenários de QA usaram servidor temporário sem salvar progresso. O servidor principal permanece com os dados reais. Não foi criado commit, push ou merge.

## Como testar

Abra http://localhost:3000 e atualize a página. Na primeira entrada, clique/toque na tela se o navegador bloquear som. Entre no jogo: na Terra e nas cidades toca a trilha de cidades. Viaje para uma hunt e volte pelo portal para ouvir as trocas. Abra Configurações → Áudio, ajuste o volume ou desative as músicas e recarregue para confirmar persistência.
## Recuperação e diagnóstico de áudio

Após relato de silêncio, foi confirmado que o servidor entrega os MP3 e que o perfil consultado estava com música ativada e volume 66%; isso não determina se o navegador/Windows estava silenciado. Corrigida uma falha de recuperação: um erro de mídia anterior impedia novas tentativas por interação. Agora é possível recarregar a faixa correta e reproduzi-la novamente.

Configurações → Áudio exibe o estado (desativado, volume zero, carregando, autoplay bloqueado, falha ou reproduzindo) e oferece Iniciar / testar música. O teste respeita música desativada e volume zero. Cliques e fim de toque também podem desbloquear a reprodução, além de pointerdown e teclado. Se o estado indicar reprodução com tempo avançando, mas não houver som audível, verificar o mute da aba/site e a saída/volume do navegador no Windows.

Validação: falha real de arquivo simulada no servidor temporário e recuperada pelo botão, com música de cidades avançando novamente. npm.cmd run check passou; suíte completa atual: 284 testes. Para receber a correção em uma aba que já estava aberta, atualizar com Ctrl+F5.
## Saída de som padrão

O player reaplica setSinkId('') quando disponível ao iniciar a reprodução, receber devicechange e retornar o foco à janela. Nenhum ID de hardware é persistido; não são solicitados microfone ou permissões de enumeração. Navegadores sem a API ou com política restritiva continuam usando a saída nativa. O listener de dispositivos é removido ao encerrar.

A string vazia representa a saída padrão do navegador. Uma saída por aplicativo fixada no Windows pode prevalecer; o jogo não consegue alterar essa preferência do sistema. Para seguir a saída atual do usuário, configurar a saída do navegador como Padrão no mixer do Windows e o dispositivo desejado como padrão do sistema. A aba Áudio informa essa condição.

Testes: 287 passaram. No navegador, sinkId vazio confirmado com reprodução avançando após eventos simulados de mudança de dispositivo/foco. Não houve teste físico de alternância dos alto-falantes/fones do usuário.

Referências: https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/sinkId e https://support.microsoft.com/en-us/windows/hardware/audio/fix-app-audio-not-working-while-system-sounds-work-in-windows .