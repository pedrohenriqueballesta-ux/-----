# Cura de Vida universal

Pedido e esclarecimento do usuário em 07/11/2026: cura **HP**, gastando Ki.
Nome inicial do pedido: Cura de Ki; nome na HUD: **Cura de Vida**.
Branch `feature/cura-de-vida`, criada da `origin/main` após o merge dos TPs.

## Regras confirmadas

| Nível da habilidade | Nível do personagem | HP máximo recuperado | Ki | Recarga |
| --- | --- | --- | --- | --- |
| 1 | 1–19 | 2% | 10 | 0,7 s |
| 2 | 20–49 | 2,5% | 12 | 0,7 s |
| 3 | 50–99 | 3% | 14 | 0,7 s |
| 4 | 100–149 | 3,5% | 16 | 0,7 s |
| 5 | 150+ | 4% | 18 | 0,7 s |

Evolução automática pelos mesmos marcos do Kamehameha. O limite atual de criação
e carregamento do personagem continua em 100; o estágio 150+ já está definido e
testado, sem elevar esse limite nesta entrega.

Cura instantânea, limitada ao HP máximo. Os percentuais são exatos, sem multiplicador
de cura da comida, transformação ou arredondamento para inteiro. Vida cheia, Ki
insuficiente, recarga, morte e desconexão não consomem recursos. Não ressuscita,
não cura terceiros e não exige alvo. Pode ser usada em área segura.

O servidor executa a mesma habilidade `heal` para uso manual e automático. Reserva
recarga e desconta Ki no mesmo fluxo síncrono; cliques, teclas e pedidos concorrentes
não duplicam o uso. Não muda alvo, direção, movimento, ataques ou cargas de técnicas.

## Autocura e HUD

A opção **Cura auto na caça / técnicas** vem habilitada. Executa durante caça
automática ou técnicas automáticas, abaixo de 70% de HP por padrão. O usuário pode
desligar a opção e configurar um limite inteiro de 1% a 100%; a comparação é estrita
(70% exatos não ativam o limite de 70%). Não cura automaticamente quando ambos os
modos estão desligados. Não depende de haver inimigo selecionado.

Limite, opção e prazo de recarga ficam no save, impedindo reiniciar a recarga ao
reconectar. Saves antigos recebem as opções padrão. Os demais cooldowns não mudam.

O ícone original fornecido, `Ícone de Cura Verde Radiante.png`, foi copiado sem edição
para `public/assets/skills/cura/icone.png`. O primeiro slot segue o tamanho dos demais
ícones e mostra somente o nome abaixo (ajuste solicitado pelo usuário). Custo, nível
e percentual de HP ficam no tooltip. A sobreposição central mostra a recarga restante.

| Tecla | Habilidade/item |
| --- | --- |
| 1 | Cura de Vida |
| 2 | Kamehameha |
| 3 | Kaioken |
| 4 | Barreira de Ki |
| 5 / T | Super Saiyajin |
| 6 | Genki Dama |
| 7 / R | Semente |
| 8 / Q | Poção de Ki |

## Arquitetura e validação

`shared/cura.mjs` guarda a configuração universal; `Game.cast` encaminha para
`curarVida`, e `updatePlayer` solicita o uso automático. O navegador envia apenas
intenções; percentuais, custo, HP e recarga são calculados pelo servidor e exibidos
na HUD por snapshot. A lógica não consulta o nome/classe do personagem.

Testes específicos: todos os marcos e limites, custo, HP máximo, repetição a cada
0,7 s, preferência e validação do limite, migração e persistência, isolamento entre
jogadores/lugares, movimento e ataque simultâneos, classe futura e oito requisições
concorrentes pela API. As regras das outras técnicas foram mantidas.

## Animação simplificada

Integração de `cura_de_ki_simplificada.zip`: PNG RGBA original em
`assets/skills/cura/spritesheet.png`, grade 8×3, 24 células de 256×256.
Reprodução única a 40 FPS, 0,6 s, independente do nível. Escala visual provisória
de 0,34 (aproximadamente 87×87 unidades) e opacidade 0,55, sobre o corpo para
envolver o personagem (ajuste solicitado pelo usuário). Base do anel ligada aos pés interpolados.

O arquivo contém números de quadro nos cantos; uma cópia em canvas, preparada uma
única vez, limpa somente a região de 52×24 no canto superior esquerdo de cada célula.
Não modifica a imagem original, as cores nem a transparência restante.

Somente uma cura aceita grava `healStarted` no servidor. O snapshot transmite esse
timestamp para os jogadores do mesmo lugar. O renderer calcula o frame pela idade,
sem criar listas de efeitos a cada snapshot. A próxima cura substitui o timestamp;
após 0,6 s o efeito termina. A recomposição do corpo pelo Kame não redesenha essa
aura, evitando duplicação. Nenhuma regra de cura ou de outra técnica foi alterada
ao integrar a animação.

Validação: `npm test` passou com 190 testes; `npm run check` passou. Testes novos
cobrem duração, cada frame, RGBA, acompanhamento, estado do canvas, reutilização
da imagem, remoção dos números, snapshots repetidos, ativações consecutivas,
isolamento e cura automática em movimento junto ao ataque.

Revisão visual da HUD com captura pendente: o host de acesso ao navegador está
indisponível nesta sessão. Servidor local reiniciado para teste do usuário.
Usuário testou e aprovou o resultado, autorizando o commit em 07/11/2026.
Push e merge aguardam autorização.
