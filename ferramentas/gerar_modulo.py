"""Gera o módulo .mjs de uma folha recortada por fatiar_caminhada.py.

Uso: python3 gerar_modulo.py <atlas.json> <saida.mjs> <CONSTANTE> <arquivo-publico> <coluna-parado> "<descrição das colunas>"
"""
import json
import sys

atlas_json, saida, nome, arquivo, parado, colunas = sys.argv[1:7]
j = json.load(open(atlas_json))
ref = round(sum(j["alturas"]) / len(j["alturas"]))
frames = json.dumps(j["frames"], separators=(",", ":"))
open(saida, "w").write(f"""// Folha desenhada quadro a quadro (ChatGPT), recortada e alinhada pela cabeça com
// ferramentas/fatiar_caminhada.py e gerada por gerar_modulo.py. Não edite à mão: gere de novo.
// Linhas: Sul, Sudeste, Leste, Nordeste, Norte. Colunas: {colunas}.
// Cada quadro: [sourceX, sourceY, largura, altura, âncoraX (centro do tronco), âncoraY (chão)].
export const {nome} = {{
  file: '{arquivo}', width: {j['cell'][0] * j['colunas']}, height: {j['cell'][1] * j['linhas']},
  rows: {j['linhas']}, columns: {j['colunas']}, referenceHeight: {ref}, idleColumn: {parado},
  frames: {frames}
}};
""")
print(saida, "referenceHeight", ref)
