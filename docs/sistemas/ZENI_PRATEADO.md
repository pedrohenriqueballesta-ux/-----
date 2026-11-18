# Ícone de Zeni prateado

- Branch: feature/zeni-moeda-prateada, baseada em origin/main (merge #66).
- Arte: public/assets/hud/personagem/zeni-prateado.png (PNG RGBA transparente).
- Origem: Moeda Prateada com Símbolo Z.png, fornecida pelo usuário.
- Tratamento: ferramenta integrada imagegen, modo background-extraction; não foi usado CLI.
- Aplicado à HUD do personagem, mochila e recompensas individuais de Zeni do Passe, incluindo prévia. Moedas premium, pacotes e ilustração da Aura Dourada VIP mantêm suas artes douradas. Baús continuam com sua própria arte composta.
- Verificação: sintaxe do módulo; navegador com 19 recompensas de Zeni prateadas, 8 de moedas premium douradas, alfa zero no fundo e moeda da mochila carregada.

Prompt usado:
Use case: background-extraction. Edit target: provided silver Zeni coin game icon. Remove only the black background outside the coin and make it genuinely transparent alpha. Preserve the exact silver/white/cool gray pixel art coin, dark engraved Z symbol, dark outline, white sparkle, proportions and shading. No redesign, no extra objects, no text, no halo, no ground shadow, no background color or checkerboard. Center the whole intact coin in a square transparent canvas, fill about 90% of canvas height with a small even transparent margin. Output ready-to-use game icon PNG.
