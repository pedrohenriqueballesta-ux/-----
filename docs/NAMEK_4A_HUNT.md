# Cratera de Nail — quarta hunt de Namekusei

Implementação local em `feature/namek-4a-hunt`, iniciada na `origin/main`
`71104d0` (PR #74), em 09/11/2026. Sem commit, push, PR ou merge.
O trabalho da Kaioken permanece no seu próprio ramo, fora desta base.

## Decisões do Pedro e valores provisórios

**DECIDIDO:** ilha norte, nome Cratera de Nail, oito Nails e oito Piccolos Daimaoh,
todos terrestres, com ataque curto e rajada; Neva como chefe raro terrestre.
O Ataque_Cajado do Neva é magia da mão, não pancada de cajado. As três espécies
têm altura de 105 (1,5× a referência de 70 do Goku), com corpos próprios.
Revisão do Pedro em 10/11/2026: 1,5× Goku, substituindo os 2× de 09/11; corpos
reduzidos na mesma proporção (ver "Ajustes de 10/11" no fim). Atributos mantidos.
Viagem somente por portal; chegada protegida e saída dentro dela.

**PROVISÓRIO:** faixa recomendada 30–40; atributos, XP, velocidades, raio dos
corpos, percepção, distribuição, raio/tempo de nascimento do chefe e cor roxa.
As faixas e caixas das outras hunts não mudaram.

## Área medida e portais

`namek-passagem.mjs`: 768×512 células de 6×6 px no solo de referência
4608×3072. Escala do mundo: 1,8. A máscara e o solo originais não foram alterados.
O recorte norte até a linha de células 642 px tem uma componente principal de
14.592 células, com contorno x=2058–3384 e y=72–642. A faixa de terra ao sul
liga fisicamente as ilhas: a separação é administrativa, pelo limite da área.

| Elemento | Coordenadas em px do solo | Coordenadas do mundo |
| --- | --- | --- |
| Caixa `norte` | x=2058, y=72, w=1322, h=568 | x=3704,4, y=129,6, w=2379,6, h=1022,4 |
| Chegada na margem sul | 2600, 570 | 4680, 1026 |
| Portal da Vila `vila-norte` | 600, 1050 | 1080, 1890 |
| Saída `saida-norte` | 2566,67, 536,67 | 4620, 966 |
| Círculo de Neva | centro 2730,400; raio 100 | centro 4914,720; raio 180 |

Os cortes leste/sul em **3380/640** preservam os limites atuais do Planalto e
das Planícies; não são o fim das células da medição (3384/642). A água continua
bloqueada dentro da caixa. Movimento do cliente e do servidor não atravessa
a faixa de terra nos dois sentidos, e não muda de área automaticamente.

Cor `#a35cff`; entrada em `PLANETS.namek.hunts`. Portais, menu Mapa, câmera e
minimapa usam o cadastro comum das áreas. Portal da Vila a mais de 260 unidades
das árvores e mais de 230 dos outros portais, com rota desde a chegada.
Safe zone de 180×180 unidades inteiramente caminhável, origem (4590,936).
Saída a −60/−60 da chegada, fora do gatilho de reabertura automática ao viajar.

## Nove folhas originais

ZIPs fornecidos: `Nail_Sprites.zip`, `Piccolo_Daimaoh_Sprites (1).zip` e
`Neva_Sprites.zip` em `Desktop/TUDO DO IDLE/`. SHA-256 idênticos às cópias
informadas anteriormente em Downloads. Cada um extraído em pasta própria.
Nove PNGs 1024×1536, cinco direções × quatro colunas, fundo magenta variável.
Costas sem rosto, membros e cajado dentro das células. Sem redesenho ou recoloração.

| Espécie | Andar | Ataque curto | Rajada |
| --- | --- | --- | --- |
| Nail | Nail_Andar.png | Nail_Soco.png | Nail_Rajada_de_Ki.png |
| Piccolo Daimaoh | Piccolo_Daimaoh_Andar.png | Piccolo_Daimaoh_Soco.png | Piccolo_Daimaoh_Rajada_de_Ki.png |
| Neva | Neva_Andar.png | Neva_Ataque_Cajado.png | Neva_Rajada_de_Ki.png |

Recorte por `fatiar_caminhada.py` em modo **conectado**, preservando capas roxas,
faixa e listras rosadas. A tolerância padrão deixava fundo preso entre braços
e corpo e um fio magenta no contorno; parâmetros opcionais **210/150** removem
esse fundo. Padrões 110/45 preservados para todos os consumidores antigos.
Somente alfa/posicionamento mudam; RGB dos pixels mantidos vem do original.

```sh
python ferramentas/fatiar_caminhada.py <original.png> <atlas.png> <atlas.json> 5 4 conectado magenta 210 150
python ferramentas/gerar_modulo.py <atlas.json> <modulo.mjs> <CONSTANTE> /assets/mobs/namek-norte/<especie>/<acao>.png 0 "preparação, avanço, emissão ou impacto, recuperação"
```

PNGs/JSONs em `public/assets/mobs/namek-norte/{nail,piccolo-daimaoh,neva}/`.
Nove módulos `art/{especie}-{andar,ataque,rajada}.mjs` e registro
`FOLHAS_NAMEK_NORTE` em `art/namek-norte.mjs`; registro comum de imagens,
PASSO/GOLPE e LUTADORES. Ataques usam a escala da caminhada de cada espécie
para não mudar o tamanho do corpo ao trocar de pose. `SHEET_VIEWS` espelha
somente Sudoeste/Oeste/Noroeste em torno da âncora. Textos ficam fora do espelho.
Profundidade segue os pés; jogador continua atravessando mobs, como antes.

## População, combate e chefe

| Espécie | Quantidade | HP | Ataque | Defesa | XP | Velocidade | Altura | Corpo |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Nail | 8 | 2200 | 64 | 24 | 260 | 104 | 87,5 | 20 |
| Piccolo Daimaoh | 8 | 4900 | 120 | 40 | 1100 | 100 | 87,5 | 22 |
| Neva | 1 raro | 40000 | 200 | 65 | 35000 | 85 | 87,5 | 25 |

Grade de candidatos de 120 px, com variação normal, amostrando 16 pontos
espalhados. A geração valida a margem do maior corpo comum (100 unidades
na função de pés) e afasta a população da safe zone. Os oito Piccolos ocupam
a metade norte da lista; Nails ficam mais próximos da chegada, ao sul.
Outras hunts conservam sua grade e margem anteriores.

Aggro usa a tabela de ameaça e os métodos existentes. Percepção dos comuns
provisoriamente **250 unidades**, perseguição 650. A primeira medição com
o raio automático ampliado pelo corpo atraía grupos inteiros na chegada.
Neva: percepção 570, perseguição 560; excluído dos alvos da Auto Hunt.

Todos integram `TIPOS_SOCA_E_ATIRA` e `PROJETEIS_POR_MOB`. Tons medidos nos
clarões originais: Nail 196°, Piccolo 197°, Neva 202°. Rajadas TARGET validam
mesma hunt, alvo vivo e fora da safe zone. O ataque curto de Neva usa a folha
de magia da mão com os tempos de chefe; não cria pancada ou magia nova.

Neva nasce no círculo da cratera central, avisa apenas os jogadores da hunt
e começa ausente. **45–90 minutos, provisório**, pelo mesmo cadastro de chefes
raros de Namek. Com `DBI_CHEFE_JA=1`, nasce em 10 s e volta em 60 s após morrer.
As três fichas entram no Bestiário (total 24), com retratos e atributos reais.
Recompensas padrão compartilhadas: comuns 5–9 Zeni, raro 100; sucata/cristal
dependem da chance de loot, semente 15% tem sorteio independente de 0,8%.

## Medições de equilíbrio

Reproduzir: `node ferramentas/simular_namek_norte.mjs`. Semente 12345,
Node.js 24.22.1, sem navegador ou save. Cenários únicos determinísticos,
não médias estatísticas. Nenhuma transformação, equipamento ou God Mode.

Duelo: `Game` sem população, um inimigo a 220 unidades; Goku se aproxima,
usa soco, Kamehameha/rajada quando há Ki e Cura de Vida abaixo de 70% HP.
Sem consumíveis; limite de 180 s. Na derrota, a porcentagem entre parênteses
é a vida que **restou no mob**; na vitória, é a vida que **restou no jogador**.

| Inimigo | Nível 30 | Nível 35 | Nível 40 |
| --- | --- | --- | --- |
| Nail | vence em 13,7 s (68,8% HP) | vence em 11,2 s (74,4% HP) | vence em 10,8 s (78,5% HP) |
| Piccolo Daimaoh | perde em 27,25 s (35,6% HP) | perde em 34,05 s (9,3% HP) | vence em 31,7 s (43,5% HP) |
| Neva | perde em 27 s (94% HP) | perde em 32,5 s (92,1% HP) | perde em 40,75 s (89% HP) |
| Tsufurujin Guerreiro | vence em 11,8 s (71,6% HP) | vence em 10,85 s (74,4% HP) | vence em 9,8 s (82,1% HP) |
| Tsufurujin General | vence em 19,35 s (65,3% HP) | vence em 17,1 s (68,2% HP) | vence em 15,9 s (70,4% HP) |
| Hatchiyack | vence em 30,85 s (7,5% HP) | vence em 24,35 s (63,1% HP) | vence em 21,05 s (68,7% HP) |

Caça automática: cinco minutos, início no nível 30, população restrita à hunt,
kit inicial, comida e autocura padrão, sem poção/semente automáticas. Religa a
caça ao renascer; progressão de XP permanece ativa (ambos chegaram ao nível 31).

| Hunt | Abates | Mortes |
| --- | --- | --- |
| Cratera de Nail | 17 | 8 |
| Planícies Vermelhas (Vegeta) | 16 | 5 |

Nail é vencível no mínimo, mas leva 13,7 s; Piccolo vence o jogador nos níveis
30/35 e só cai no 40; Neva conserva 89% do HP contra um nível 40 sozinho.
A Cratera é mais punitiva que as Planícies Vermelhas nesta simulação (medido de novo em 10/11 com os
corpos menores: 17 abates e 8 mortes, antes 15 e 11; os duelos não mudaram). Densidade,
atributos e faixas ficam provisórios para a revisão do Pedro.

## Testes e conferência visual

**471 testes passaram; sintaxe aprovada em 194 módulos.** Incluem caixa/chegada/portal, saída protegida, barreira
de passagem nos dois sentidos, oito Nails/oito Piccolos, corpos livres da costa,
chefe de teste nascendo e avisando a hunt, ataques curto/TARGET, distância do
Goku, isolamento, fichas/recompensas, nove folhas/âncoras/escala e espelhamento.
As hunts antigas mantêm sua própria regressão de caça; o norte tem cenário
de cinco minutos e duelos conforme seu critério 30–40, sem impor a meta 1–30.

`npm run check` usa `ferramentas/verificar_sintaxe.mjs` para descobrir todos os
módulos em public/server/ferramentas, evitando o limite de comando do Windows.
Sem pacotes novos. Ferramenta CDP encontra Chrome/Edge no Windows; Mac preservado.

Chrome com prints: portal na Vila, cartão roxo 30–40, transição de viagem,
chegada com SAFE ZONE, saída, minimapa, menu Mapa com quinta área (Vila + quatro
hunts), Bestiário com as três fichas e Neva nascendo com aviso. Nove animações
nas oito direções ao lado do Goku, com capas/faixas preservadas. No jogo,
aproximação e ataque dos três: param antes de ocupar o centro do personagem.
Os prints de combate usam God Mode para permitir a inspeção; ele não foi usado
nas simulações de equilíbrio. Prints e comandos descartáveis fora do ramo.

## Como testar a prévia

- Endereço: `http://localhost:3003`, somente no worktree da hunt.
- Conta descartável de teste já criada, personagem no nível 35. Progresso só
  nos dados dessa cópia. God Mode pode ser alternado pela HUD para inspecionar.
- Na Vila, procurar a nuvem roxa da Cratera de Nail ao norte da praça; entrar
  pelo cartão, observar a safe zone e sair dela para caçar. Volta pelo TP seguro.
- Abrir Mapa e Bestiário; buscar Cratera de Nail para ver as três fichas.
- Galeria independente: `/namek-norte.html`, espécie/ação/fase e oito direções.
- Para testar Neva rapidamente, servidor com `DBI_CHEFE_JA=1`.

Save principal não copiado ou sobrescrito; SHA-256 antes/depois:
`dba119a323d0328e694504974d6e52423123a2effca765672f41a1abee74fe32`.
Sem arte original, credenciais, save ou ajustes de personagem em commit.
Próximo passo: aprovação visual do Pedro. Commit somente depois dessa aprovação.

## Ajustes de 10/11/2026 (ramo `feature/cratera-nail-ajustes`)

Pedido do Pedro: tamanho 1,5× o Goku e corrigir a movimentação, que estava "bugada". Medido no jogo, eram três
problemas:

1. **Parado com perna de andar:** sem folha própria, o mob parado usava um quadro da caminhada. Agora há folhas
   **PARADO** (respiração em loop, pés parados) dos três: `{nail,piccolo-daimaoh,neva}/parado.png` e
   `art/{especie}-parado.mjs`, registradas em `FOLHAS_NAMEK_NORTE[tipo].parado`. `drawLutador` desenha a folha PARADO
   quando o mob não anda, a ~3 quadros/s com a fase de cada mob, na mesma escala da caminhada.
2. **Pés deslizando:** a regra geral de passo (96 × altura/70) não batia com a passada desenhada. Cada espécie tem
   `LUTADORES[tipo].passo`, medido na folha com o mesmo fator do Goku (1,25× o passo desenhado): Nail 178,
   Piccolo 120, Neva 80. Folha nova de andar = medir de novo.
3. **Travadas no passo:** as caminhadas antigas do Nail (diagonal) e do Neva tinham quadros vizinhos quase iguais.
   O Pedro refez as duas; as novas têm os 4 quadros bem diferentes em todas as linhas.

Tamanho: `ALTURA_NAMEK_NORTE = 70 × 1,5` e corpos 24/26/30 (provisórios). Recorte das folhas novas igual ao das
outras (`conectado magenta 210 150`). Galeria `/namek-norte.html` ganhou a ação Parado. 499 testes; conferido no
navegador (galeria nas 8 direções e mobs na Cratera).

**2º ajuste de 10/11 (ramo `feature/cratera-nail-tamanho`):** os três com **1,25× o Goku** (87,5), o Neva incluído.
Passo e corpo acompanham a altura (5/6 do anterior): Nail 148/20, Piccolo 100/22, Neva 67/25. Simulação refeita:
duelos iguais; caça de 5 min 17 abates e 8 mortes. No mesmo ramo, todo chefe do jogo passou a levar "BOSS" no nome
(Neva BOSS, Porunga BOSS, Comandante Sentinela BOSS, Oozaru Dourado BOSS, Freeza BOSS / Freeza BOSS (nave)).

