# Progressão até o nível 1.000 e balanceamento das hunts existentes

Atualizado em 12/11/2026. Esta etapa amplia a progressão das cinco hunts existentes de Vegeta até o nível 150. Não adiciona mapas, criaturas, habilidades ou transformações.

## Estado do sistema

- O servidor aceita níveis de 1 a 1.000. O God Mode local leva o personagem diretamente ao nível 1.000, aplica seus atributos, enche HP/Ki e concede Zeni/capacidade de teste. Ao desligar, restaura nível e recursos reais anteriores.
- A curva histórica de XP até o nível 100 permanece igual. Depois do 100, o requisito por nível cresce a partir do valor do nível 100 com expoente 1,5. O nível 1.000 exige 475.468 XP para avançar; o total acumulado até chegar nele é 189.987.887 XP.
- O jogador ainda é Goku. Não há desbloqueios novos nesta expansão.
- As recomendações de nível não bloqueiam os portais. Mobs abaixo do jogador continuam dando XP, com redução gradual e piso de 20%.

## Faixas recomendadas

Namekusei mantém as quatro hunts e seus atributos atuais: Planícies 1–10, Campo de Batalha 10–20, Planalto do Porunga 20–30 e Cratera de Nail 30–40.

As faixas das cinco hunts de Vegeta foram estendidas em sequência, aproveitando os mesmos mobs e mapas:

| Hunt | Faixa | Níveis dos mobs existentes |
|---|---:|---|
| Planícies Vermelhas | 40–62 | Tsufurujin Guerreiro 40, General 51, Hatchiyack 62 |
| Cânions | 62–72 | Dodoria 62, Zarbon 68 |
| Floresta Seca | 72–106 | Nappa 84, Raditz 95, Bardock 106 |
| Campos de Lava | 106–128 | Oozaru 106, Oozaru Guerreiro 128, Oozaru Dourado BOSS 128 |
| Grande Cratera | 128–150 | Rei Vegeta 128, Broly 150, Porunga BOSS 150, Freeza BOSS raro 150 |

Os níveis originais de referência ficam registrados em `nivelBase` em `public/shared/enemies.mjs`. A escala compara os atributos de Goku no nível-base e no novo nível recomendado: HP acompanha o ataque do personagem, ataque acompanha sua vida e defesa; a defesa base do mob fica preservada para manter proporções de golpes e não transformar a mitigação em resistência crescente duas vezes. XP acompanha a curva por nível. Velocidade, tamanho, aggro, identidade, quantidade e comportamento dos mobs não são alterados. Namekusei permanece sem escala.

Essa extensão fornece progressão planejada até 150 com o conteúdo atual. O suporte técnico até 1.000 não significa que as hunts atuais devam carregar o jogador sozinho por todos esses níveis: acima de 150 ainda serão necessários novos conteúdos e balanceamento.

## XP e compatibilidade

`xpForLevel(n)` é o XP para avançar do nível `n` ao próximo:

- Níveis 1–100: `round(30 × n^1,35)`, preservada exatamente.
- Níveis 101–1.000: curva contínua ancorada no nível 100, com expoente 1,5.
- XP, inventário, Zeni e progresso salvo são preservados. O XP excedente já acumulável no teto antigo de nível 100 não é descartado.
- Ao atingir o nível máximo, o XP deixa de crescer. O God Mode não altera o XP salvo: ao desligar, o personagem volta ao progresso anterior.
- A penalidade por diferença de nível usa `max(20%, 1 / √(1 + diferença/60))`. Assim, mobs de hunts antigas permanecem úteis, com retorno menor.

## Arquivos

- `public/shared/config.mjs`: teto, curva, penalidade de XP e faixas recomendadas.
- `public/shared/progressao.mjs`: cálculo de requisito e ajuste de XP.
- `public/shared/enemies.mjs`: níveis-base e calibração proporcional dos mobs de Vegeta.
- `public/shared/characters.mjs`: atributos e ativação/restauração do God Mode.
- `public/shared/game.mjs`: progressão autoritativa e mensagem do God Mode.
- `LEIA_PRIMEIRO.md`: resumo visível das regras atuais.

Os números de combate devem continuar sendo ajustados com simulações de duelo, sobrevivência e Auto Hunt, além de dados de sessões reais. A experiência do jogador de chegar ao nível 100 em poucas horas é evidência de que as faixas antigas não aproveitavam o potencial das hunts; as estimativas de amostras curtas anteriores não devem ser tratadas como medida confiável de tempo real.
