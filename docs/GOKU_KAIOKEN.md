# Goku Kaioken e regra das transformações — 09/11/2026

Decisão do Pedro implementada no ramo `feature/goku-kaioken`, a partir da
`origin/main` com o PR #74 (`71104d0`). Desenvolvimento e servidor em worktree
separado. Pedro autorizou commit e push em 09/11/2026 após revisar a prévia.
PR e merge aguardam pedido específico.

## Seis folhas do Pedro

Originais do ZIP `Goku_Kaioken_6_Folhas.zip`, sem redesenho ou recoloração.
PNG 1024×1536, fundo verde, cinco direções × quatro colunas.
Recorte em modo `conectado verde`, preservando o vermelho/rosa da Kaioken:
o modo halo contém uma remoção de tons rosados própria do fundo magenta.

```sh
python ferramentas/fatiar_caminhada.py <original.png> public/assets/goku/kaioken/<estado>.png public/assets/goku/kaioken/<estado>.json 5 4 conectado verde
python ferramentas/gerar_modulo.py public/assets/goku/kaioken/<estado>.json public/art/goku-kaioken-<estado>.mjs GOKU_KAIOKEN_<ESTADO> /assets/goku/kaioken/<estado>.png 0 "poses da forma Kaioken fornecidas pelo Pedro"
```

| Folha | Estado/chave | Altura de referência recortada |
| --- | --- | --- |
| 01_parado | parado | 250 |
| 02_andar | andar | 252 |
| 03_soco | soco | 251 |
| 04_rajada_ki | rajada | 250 |
| 05_kamehameha | kamehameha | 252 |
| 06_genki_dama | genki | 254 |

`FOLHAS_GOKU_KAIOKEN` usa as mesmas seis chaves da base. `drawGoku` compartilha
estados e prioridades: morte > Genki > Kamehameha > rajada > soco > andar > parado.
Escala comum a todas as poses e à base: `70 / 253`. A caminhada compartilha
distância percorrida, balanço e seleção de coluna existentes. Âncora nos pés;
somente Sudoeste/Oeste/Noroeste espelham por `drawSheet`/`SHEET_VIEWS`.
SSJ conserva as folhas anteriores. Nenhum PNG espelhado foi criado.

Apenas o fundo é removido; os pixels opacos mantêm as cores dos originais.
Auditoria dos seis atlas: zero pixels opacos com verde predominante
(`G > 100`, `G > R + 40` e `G > B + 40`).
O círculo vermelho da Kaioken foi removido a pedido do Pedro após a revisão
visual (09/11/2026), tanto no próprio jogador quanto nos observadores.
Não foi criada aura nova nem usado o ramo `efeitos-skills`.

## Regra autoritativa nova

- **DECIDIDO:** ativação com custo zero, sem recarga, sem duração fixa;
  repetir a técnica desliga, ativar outra substitui. Só uma forma por vez.
- **VALOR PROVISÓRIO:** `CONFIG.transformacao.drenoKi = 3.5`, comum às formas.
  Níveis preservados: Kaioken 2 e SSJ 5, ainda provisórios.
- Ki chega a zero: forma base e aviso **“Ki esgotado. Forma base.”**
  Isso também vale ao gastar o último Ki em uma técnica. Na base, a recuperação
  natural segue suas condições anteriores; em qualquer forma ela fica bloqueada.
- Morte, `levar` (portal/viagem/renascimento) e desconexão limpam a forma.
  O save não inclui forma, duração ou recargas de transformação.
- `p.forma` é a fonte única (`base`, `kaioken`, `ssj`); `transformed` é um alias
  de acesso para SSJ, preservando consumidores existentes sem duplicar estado.
- Kaioken: dano ×1,4 em soco, rajada, Kamehameha e Genki; SSJ mantém
  soco ×1,5, rajada ×2,1, Kamehameha ×6 e Genki ×14. Bônus não acumulam.
  Técnicas lançadas preservam o dano calculado no lançamento, como antes.
- A Auto Hunt atual não ativa transformações; isso foi preservado. Se uma chamada
  automática solicitar uma forma, só entra a partir da base com **mais de 50% Ki**
  (limite provisório configurado). Não desliga nem troca uma forma ativa.
- God Mode não drena Ki e mantém a forma até desligamento manual ou eventos
  de término, como morte/viagem/desconexão.
- Snapshots de todos os jogadores do mesmo lugar incluem `forma`; `self` mantém
  `kaiokenActive` e recargas zero por compatibilidade. Outras hunts ficam excluídas.
- Os dois botões atuais continuam presentes. A forma ativa exibe **ATIVO** sobre
  o ícone e continua clicável. Detalhes informam custo zero, ausência de recarga,
  drenagem e término ao zerar Ki. Perfil reconhece Kaioken e seu bônus exclusivo.

## Como testar

1. Criar worktree e iniciar o servidor nele, sem copiar o save principal.
2. Criar conta/personagem de teste. Para liberar todas as poses, usar nível 60
   apenas no progresso descartável da prévia, ou ligar God Mode pela HUD.
3. Tecla 3 alterna Kaioken; 5/T alterna SSJ. Repetir volta à base; alternar entre
   as duas conserva posição e não consome Ki de ativação. Observar drenagem.
4. Desligar God Mode para conferir Ki esgotando e aviso de retorno à base.
5. Entrar com outra conta/navegador no mesmo lugar e observar a forma do outro.
6. `/kaioken.html` permite comparar seis ações nas oito direções, pausar, escolher
   fase e alternar base/Kaioken/SSJ com âncoras fixas. Não usa o save.
7. Executar `npm run check` e `npm test`. Ferramenta de prints existente agora
   encontra Chrome/Edge no Windows; `DBI_CHROME` permite indicar outro executável.

Os testes antigos de custo, duração e acumulação foram atualizados pela decisão
do Pedro de 09/11/2026. A prévia foi revisada, incluindo a remoção do círculo
vermelho; commit e push autorizados pelo Pedro. A mensagem da entrega registra
a mudança da regra de transformação.

## Resultado da conferência

- `npm run check` aprovado; **466 testes passaram**, zero falhas (442 anteriores
  mais 24 testes de regra, arte e espelhamento). `git diff --check` sem erros.
- Chrome com prints: parado, caminhada, soco, rajada, Kamehameha e Genki nas oito
  direções; poses de carga/lançamento, base/Kaioken/SSJ sobre as mesmas âncoras.
- Jogo com login: conta nível 60, formas alternadas sem mover o personagem,
  ATIVO visível e clicável, detalhes novos para as duas formas, Ki esgotando
  com retorno à base e aviso. Soco, rajada, carga/feixe e Genki conferidos na hunt.
- Segundo Chrome com outra conta: snapshot e desenho da Kaioken do primeiro
  jogador confirmados, mantendo a forma base do observador.
- Prints e controles descartáveis ficam fora do ramo, em `.previas/` do clone
  principal; não entram na entrega. Ex.: `kaioken-tooltip-kaioken.png`,
  `kaioken-final-ki-esgotado.png` e `kaioken-observador-final-outro-ve-kaioken.png`.
- SHA-256 do save principal antes/depois idêntico:
  `dba119a323d0328e694504974d6e52423123a2effca765672f41a1abee74fe32`.
- Servidor normal reiniciado no worktree em `http://localhost:3002`, com galeria
  em `/kaioken.html`. Dados de teste só nessa cópia; God Mode disponível na HUD.
- Commit e push autorizados pelo Pedro em 09/11/2026. Sem PR ou merge autorizado.
