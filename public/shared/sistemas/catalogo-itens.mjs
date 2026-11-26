import { CONSUMIVEIS_LOOT } from '../tecnicas/consumiveis-loot.mjs';

// Percentuais independentes por abate. Fontes futuras têm chance proposta e não são sorteadas.
const recursos = [
  // Materiais temáticos e recompensas de chefes usam os itens e ícones do catálogo.
  ["minerio","Aglomerado de Minério",0.22,27,"comum",{"guerreiro":0.22,"veterano":0.26,"ranged":0.22,"subboss":0.4,"broly":0.35,"tsufuruGuerreiro":0.27,"tsufuruGeneral":0.32,"roboMai":0.3,"roboShu":0.34,"roboPilaf":0.42,"maquinaPilaf":1,"androide18":0.43,"androide17":0.5,"androide16":0.6,"cellJr":0.3,"cellImperfeito":0.38,"c20":1,"cellSemiperfeito":0.6,"cellPerfeito":0.8,"androide17Pos":0.38,"androide18Pos":0.32}],
  // Saga do Cell (25/11/2026): o C20 derruba o Bilhete de Ouro do Dr. Gero (50%), que libera a primeira task. Leve e sem valor de venda alto.
  ["bilhete-laboratorio","Bilhete de Ouro do Dr. Gero",0.01,5,"raro",{"c20":0.5}],
  ["antenas-namek","Antenas Namekuseijins",0.05,13,"comum",{"guerreiro":0.33,"veterano":0.34,"nail":0.42,"piccoloDaimaoh":0.38}],
  ["asas-namek","Asas de Inseto de Namek",0.03,6,"comum",{"inseto":0.36}],
  ["carne-oozaru","Carne de Oozaru",0.44,30,"comum",{"oozaru":0.48,"oozaruGuerreiro":0.6,"oozaruDourado":0.9}],
  // Dinossauros do Vale da Cachoeira (primeira hunt, 25/11/2026): peso, preço e chances PROVISÓRIOS; ícone provisório
  // recortado da folha do T-Rex.
  ["carne-dinossauro","Carne de Dinossauro",0.4,6,"comum",{"estegossauro":0.3,"triceratops":0.32,"espinossauro":0.36,"tiranossauro":0.42}],
  ["circuito-tsufu","Circuito Tsufu",0.08,56,"incomum",{"tsufuruGuerreiro":0.27,"tsufuruGeneral":0.33,"hatchiyack":0.45}],
  ["cristal-azul","Cristal Azul",0.09,21,"comum",{}],
  ["cristal-esmeralda","Cristal Esmeralda",0.1,112,"incomum",{"piccoloDaimaoh":0.23,"neva":1,"boss":1,"porunga":0.16,"nail":0.16,"androide18":0.18,"androide17":0.24,"androide16":0.3,"cellImperfeito":0.13}],
  ["cristal-vermelho","Cristal Vermelho",0.13,210,"raro",{"hatchiyack":0.035,"oozaruDourado":1,"freezaBoss":1,"oozaru":0.035,"oozaruGuerreiro":0.1,"boss":0.42,"neva":0.52,"maquinaPilaf":0.12,"c20":0.25,"androide16":0.12,"reiVegeta":0.17,"broly":0.24,"cellPerfeito":1}],
  ["ferrao-namek","Ferrão de Inseto de Namek",0.07,9,"comum",{"inseto":0.24}],
  ["fragmento-saiyajin","Fragmento de Armadura Saiyajin",0.23,72,"comum",{"nappa":0.32,"raditz":0.36,"bardock":0.42,"reiVegeta":0.62,"broly":0.57,"dodoria":0.24,"zarbon":0.3,"freezaBoss":0.74,"oozaru":0.2,"oozaruGuerreiro":0.34,"oozaruDourado":0.82}],
  ["fruta-namek","Fruta de Namek",0.08,7,"comum",{"passaro":0.36,"inseto":0.15,"guerreiro":0.22}],
  ["manto-rasgado","Manto Branco Rasgado",0.18,144,"raro",{"piccoloDaimaoh":0.07,"nail":0.03,"neva":0.72}],
  ["pele-oozaru","Pele de Oozaru",0.31,118,"incomum",{"oozaru":0.31,"oozaruGuerreiro":0.46,"oozaruDourado":1}],
  ["carne-porunga","Carne de Porunga",0.24,19,"comum",{"porunga":0.34,"boss":0.9}],
  ["garra-porunga","Garra de Porunga",0.12,102,"incomum",{"porunga":0.24,"boss":1}],
  // Yamcha (Vale da Cachoeira, 25/11/2026): drop PROVISÓRIO.
  ["pocao-energia","Poção de Energia",0.10,25,"incomum",{"yamcha":0.2,"veterano":0.11,"tsufuruGeneral":0.16,"subboss":0.24,"dodoria":0.12,"zarbon":0.19}],
  ["presa-oozaru","Presa de Oozaru",0.2,255,"raro",{"oozaru":0.085,"oozaruGuerreiro":0.15,"oozaruDourado":1}],
  ["scouter-danificado","Scouter Saiyajin Danificado",0.08,96,"incomum",{"raditz":0.21,"bardock":0.25,"reiVegeta":0.3,"dodoria":0.13,"zarbon":0.18,"freezaBoss":0.48,"oozaruGuerreiro":0.13,"oozaruDourado":0.44}],
];

// ID, nome, kg, preço base, raridade, slot, nível, defesa, Ki/s, ataque, fonte.
const equipamentos = [
  ["armadura-saiyajin","Armadura Saiyajin",5.8,430,"raro","peito",65,12,0.7,0,{"nappa":0.0135,"raditz":0.011,"bardock":0.0085,"reiVegeta":0.021}],
  ["faixa-treino","Faixa de Treino",0.18,35,"comum","cinto",8,1,0.2,0,{"guerreiro":0.015,"veterano":0.021}],
  ["armadura-bardock","Armadura de Bardock",6.2,1000,"raro","peito",96,20,1.4,0,{"bardock":0.0085,"reiVegeta":0.0014}],
  ["bandana-bardock","Bandana de Bardock",0.22,480,"raro","cabeca",86,4,1.1,0,{"bardock":0.0135,"raditz":0.003}],
  ["botas-bardock","Botas de Bardock",2.02,690,"raro","botas",90,8,0.75,0,{"bardock":0.0105,"raditz":0.0026,"nappa":0.0014}],
  ["calca-bardock","Calça de Bardock",1.9,560,"raro","calca",90,9,1.25,0,{"bardock":0.012,"raditz":0.0032}],
  ["botas-broly","Botas de Broly",2.35,1550,"epico","botas",135,15,1.6,0,{"broly":0.0065}],
  ["calca-broly","Calça de Broly",2.7,1280,"epico","calca",132,15,1.4,0,{"broly":0.0078}],
  ["traje-broly-super","Traje de Broly Super",5.35,2850,"epico","peito",145,27,2.3,0,{"broly":0.0035}],
  ["bastao-magico","Bastão Mágico",1.35,135,"incomum","arma",22,1,0.38,7,{"nail":0.013,"neva":0.07,"boss":0.24}],
  ["botas-blindadas-roxas","Botas Blindadas Roxas",2.82,620,"raro","botas",72,9,0.56,0,{"zarbon":0.0135,"dodoria":0.006,"freezaBoss":0.08}],
  ["botas-brancas","Botas Brancas de Treino",1.03,72,"comum","botas",12,2,0.27,0,{"veterano":0.017,"subboss":0.045}],
  ["botas-faixas-azuis","Botas de Faixas Azuis",1.34,210,"incomum","botas",34,5,0.58,0,{"nail":0.018,"piccoloDaimaoh":0.0135,"neva":0.075}],
  ["botas-vegeta","Botas de Vegeta",2.36,2200,"epico","botas",120,17,2.15,0,{"reiVegeta":0.0062,"oozaruDourado":0.31}],
  ["botas-treino","Botas de Prática",0.88,45,"comum","botas",7,1,0.22,0,{"guerreiro":0.018,"veterano":0.024}],
  ["brincos-potara","Brincos Potara",0.12,20000,"lendario","colar",240,5,5.7,0,"@Shin e fusões"],
  ["armadura-c17","Armadura do Androide 17",4.15,2600,"epico","peito",155,19,3.2,0,{"androide17":0.009,"androide17Pos":0.004}],
  ["armadura-cell","Armadura de Cell",6.85,7500,"lendario","peito",210,29,3.9,0,{"cellPerfeito":0.29}],
  ["botas-cell","Botas de Cell",2.53,4100,"epico","botas",195,16,2.65,0,{"cellSemiperfeito":0.17,"cellPerfeito":0.26}],
  ["calca-cell","Calça de Cell",2.26,4600,"epico","calca",199,17,2.75,0,{"cellSemiperfeito":0.22,"cellPerfeito":0.32}],
  ["capacete-cell","Capacete de Cell",1.64,4950,"epico","cabeca",205,13,2.6,0,{"cellPerfeito":0.3}],
  ["calca-artes-marciais","Calça de Artes Marciais",0.95,115,"incomum","calca",18,4,0.34,0,{"guerreiro":0.0115,"veterano":0.0165,"subboss":0.04}],
  ["calca-gohan","Calça Roxa de Gohan",1.14,640,"raro","calca",62,7,1.35,0,"@Gohan"],
  ["calca-roxa","Calça Roxa de Treino",0.93,115,"incomum","calca",18,3,0.51,0,{"nail":0.0155,"piccoloDaimaoh":0.012}],
  ["calca-saiyajin","Calça Saiyajin Azul",1.53,250,"incomum","calca",48,5,0.52,0,{"nappa":0.023,"raditz":0.031,"bardock":0.037}],
  ["capacete-chifres","Capacete de Chifres Roxos",1.56,850,"raro","cabeca",96,11,0.8,0,{"zarbon":0.0052,"freezaBoss":0.075}],
  ["armadura-shin-elite","Armadura Celestial de Elite",4.75,24000,"lendario","peito",245,35,6.4,0,"@Shin de Elite"],
  ["calca-shin-elite","Calça Celestial de Elite",1.45,11000,"epico","calca",230,13,3.9,0,"@Shin de Elite"],
  ["espada-janemba","Espada de Janemba",5.7,29000,"lendario","arma",265,5,4.5,49,"@Janemba"],
  ["armadura-freeza","Armadura da Força Freeza",6.71,4600,"epico","peito",140,26,2.55,0,{"freezaBoss":0.2}],
  ["botas-freeza","Botas da Força Freeza",2.31,2250,"epico","botas",122,14,1.8,0,{"freezaBoss":0.24}],
  ["capacete-freeza","Capacete da Força Freeza",1.78,2150,"epico","cabeca",121,13,1.72,0,{"freezaBoss":0.25}],
  ["saia-freeza","Proteção de Cintura da Força Freeza",1.37,1560,"raro","calca",116,10,1.32,0,{"freezaBoss":0.22,"zarbon":0.0055,"dodoria":0.003}],
  ["colete-fusao","Colete Metamoru",2.85,14000,"epico","peito",220,21,5.4,0,"@Gogeta ou Gotenks"],
  ["calca-fusao","Calça Metamoru",1.48,14500,"epico","calca",222,19,4.8,0,"@Gogeta ou Gotenks"],
  ["botas-futuro","Botas do Futuro",1.76,1750,"raro","botas",123,11,2.05,0,"@Trunks do Futuro"],
  ["botas-gogeta","Botas de Gogeta",1.55,15500,"lendario","botas",245,20,5.0,0,"@Gogeta"],
  ["traje-gohan","Traje de Gohan",2.45,1200,"raro","peito",72,11,1.7,0,"@Gohan"],
  ["gi-goku","Gi de Goku",2.62,1080,"raro","peito",75,9,1.95,0,"@Goku"],
  ["gi-goku-costas","Gi de Goku com Kanji",2.73,3200,"epico","peito",155,18,3.4,0,"@Goku"],
  ["botas-goku","Botas de Goku",1.48,750,"raro","botas",70,6,1.38,0,"@Goku"],
  ["calca-goku","Calça de Goku",1.42,19000,"lendario","calca",235,23,4.55,0,"@Goku"],
  ["traje-saiyaman","Traje do Grande Saiyaman",2.98,3800,"epico","peito",175,23,2.9,0,"@Grande Saiyaman"],
  ["capacete-saiyaman","Capacete do Grande Saiyaman",1.12,1800,"raro","cabeca",125,10,1.9,0,"@Grande Saiyaman"],
  ["armadura-hatchiyack","Armadura de Hatchiyack",6.82,460,"raro","peito",52,14,0.72,0,{"hatchiyack":0.0095}],
  ["luvas-hatchiyack","Luvas de Hatchiyack",0.89,445,"raro","braco",52,3,0.83,4,{"hatchiyack":0.0135,"tsufuruGeneral":0.0027}],
  ["capacete-hatchiyack","Capacete de Hatchiyack",1.49,395,"raro","cabeca",51,7,0.65,0,{"hatchiyack":0.012,"tsufuruGeneral":0.0032}],
  ["gi-goku-crianca","Gi de Goku Criança",1.56,164,"incomum","peito",20,4,0.58,0,"@Goku Criança"],
  ["calca-goku-crianca","Calça de Goku Criança",0.73,110,"incomum","calca",16,3,0.4,0,"@Goku Criança"],
  ["kimono-piccolo","Kimono de Piccolo",2.32,460,"raro","peito",38,7,1.1,0,{"nail":0.0045,"piccoloDaimaoh":0.0083,"neva":0.05}],
  ["botas-buu","Botas de Majin Buu",1.92,5700,"epico","botas",208,12,3.25,0,"@Majin Buu"],
  ["capacete-buu","Capuz de Majin Buu",0.85,5150,"epico","cabeca",205,9,3.1,0,"@Majin Buu"],
  ["jaqueta-buu","Jaqueta de Majin Buu",2.95,8200,"lendario","peito",219,23,4.6,0,"@Majin Buu"],
  ["calca-buu","Calça de Majin Buu",1.48,5950,"epico","calca",212,15,3.7,0,"@Majin Buu"],
  ["botas-piccolo","Botas de Piccolo",1.5,265,"incomum","botas",32,4,0.68,0,{"nail":0.016,"piccoloDaimaoh":0.022,"neva":0.07}],
  ["capa-piccolo","Manto de Piccolo",2.95,700,"raro","peito",40,9,1.3,0,{"nail":0.0033,"piccoloDaimaoh":0.0058,"neva":0.04,"boss":0.14}],
  ["capa-daimaoh","Manto de Piccolo Daimaoh",3.35,960,"raro","peito",45,12,1.12,0,{"piccoloDaimaoh":0.0057,"neva":0.022}],
  ["turbante-piccolo","Turbante de Piccolo",0.54,290,"incomum","cabeca",32,3,0.8,0,{"nail":0.0135,"piccoloDaimaoh":0.021,"neva":0.06,"boss":0.27}],
  ["calca-piccolo","Calça de Piccolo",1.31,350,"raro","calca",36,5,0.91,0,{"nail":0.011,"piccoloDaimaoh":0.0165,"neva":0.055}],
  ["armadura-raditz","Armadura de Raditz",6.4,820,"raro","peito",84,17,1.03,0,{"raditz":0.0125,"nappa":0.0024,"bardock":0.0045}],
  ["botas-saiyajin","Botas Saiyajins",1.83,320,"incomum","botas",60,7,0.58,0,{"nappa":0.0265,"raditz":0.0315,"bardock":0.031,"reiVegeta":0.046}],
  ["scouter-bardock","Scouter Azul de Bardock",0.38,720,"raro","cabeca",102,7,1.53,0,{"bardock":0.007,"reiVegeta":0.0026}],
  ["scouter-raditz","Scouter Verde de Raditz",0.24,610,"raro","cabeca",82,5,1.22,0,{"raditz":0.0125,"nappa":0.0035,"bardock":0.003}],
  ["armadura-shin","Armadura Celestial de Shin",3.3,12000,"epico","peito",210,20,5.15,0,"@Shin"],
  ["botas-shin","Botas Celestiais de Shin",1.28,7850,"epico","botas",201,11,3.8,0,"@Shin"],
  ["calca-shin","Calça Celestial de Shin",1.12,7200,"epico","calca",198,10,3.45,0,"@Shin"],
  ["jaqueta-trunks","Jaqueta de Trunks",2.41,3400,"epico","peito",145,17,3.03,0,"@Trunks do Futuro"],
  ["calca-trunks","Calça de Trunks",1.6,1420,"raro","calca",120,11,1.9,0,"@Trunks do Futuro"],
  ["armadura-vegeta","Armadura de Vegeta",6.91,2850,"epico","peito",125,22,1.85,0,{"reiVegeta":0.0058,"oozaruDourado":0.22}],
  ["calca-vegeta","Calça de Vegeta",1.67,1710,"raro","calca",112,11,1.2,0,{"reiVegeta":0.013,"bardock":0.003,"nappa":0.0017,"oozaruDourado":0.34}],
  ["traje-vegetto","Traje de Vegetto",3.05,19900,"lendario","peito",235,25,6.1,0,"@Vegetto"],
  ["calca-vegetto","Calça de Vegetto",1.58,14000,"epico","calca",223,18,4.6,0,"@Vegetto"],
  ["espada-z","Espada Z",8.15,32000,"lendario","arma",268,8,3.15,53,"@Treino no Mundo dos Kaioshins"],
  ["bracadeiras-iniciais","Braçadeiras de Iniciante",0.22,2,"comum","braco",1,0,0.09,0,"#inicial"],
  ["calca-inicial","Calça de Iniciante",0.61,4,"comum","calca",1,1,0.1,0,"#inicial"],
  ["botas-iniciais","Botas de Iniciante",0.7,4,"comum","botas",1,0,0.1,0,"#inicial"],
  ["camisa-inicial","Camisa de Iniciante",0.48,5,"comum","peito",1,1,0.14,0,"#inicial"],
  ["manoplas-fronteira","Manoplas da Fronteira",1.05,5500,"epico","braco",295,21,3.4,15,"#task-vegeta-floresta","luvas-hatchiyack"],
  ["botas-batedor","Botas do Batedor",2.2,6800,"epico","botas",380,28,4.3,0,"#task-terra-floresta","botas-vegeta"],
  ["couraca-vulcanica","Couraça Vulcânica",6.8,9600,"epico","peito",470,42,5.2,0,"#task-vegeta-lava","armadura-freeza"],
  ["calca-guardiao-cratera","Calça do Guardião da Cratera",1.94,13000,"epico","calca",570,32,5.9,0,"#task-norte","calca-shin-elite"],
  ["botas-montanhista","Botas do Montanhista",2.6,16500,"lendario","botas",690,37,6.6,0,"#task-terra-neve","botas-brancas"],
  ["lamina-grande-cratera","Lâmina da Grande Cratera",7.8,26000,"lendario","arma",830,24,6.4,80,"#task-vegeta-cratera","espada-z"],
  ["botas-missao","Botas de Patrulha",0.85,38,"comum","botas",5,1,0.24,0,"#patrulha-inicial"],
  ["armadura-missao","Armadura de Patrulha Saiyajin",2.4,85,"incomum","peito",5,4,0.32,0,"#patrulha-inicial"],
];

const chanceFutura = { comum: 0.045, incomum: 0.026, raro: 0.012, epico: 0.006, lendario: 0.0025 };
function registrar([id, nome, peso, precoBase, raridade, ...resto], tipo) {
  const [slot, nivel, defesa, kiPorSegundo, ataque, fonte, arte = id] = tipo === 'equipamento'
    ? resto : [null, 1, 0, 0, 0, resto[0]];
  const origem = typeof fonte !== 'string' ? { drops: Object.freeze(fonte) }
    : fonte.startsWith('@') ? { futura: fonte.slice(1), chanceProposta: chanceFutura[raridade] }
      : { recompensa: fonte.slice(1) };
  const consumo = CONSUMIVEIS_LOOT[id];
  return Object.freeze({
    // Equipamento é uma recompensa de progressão. O NPC paga a liquidação, e o market parte da referência.
    id, nome, peso,
    precoNpc: ['epico', 'lendario'].includes(raridade) ? null : slot && !origem.recompensa ? Math.max(1, Math.round(precoBase / 4)) : precoBase,
    precoReferencia: precoBase * (slot ? 3 : 2),
    raridade, tipo: consumo ? 'consumivel' : tipo, consumo, slot, nivel, defesa, kiPorSegundo, ataque, origem: Object.freeze(origem),
    icone: '/assets/inventario/novos/' + arte + '.png', negociavel: true
  });
}

export const NOVOS_ITENS = Object.freeze(Object.fromEntries([
  ...recursos.map(item => registrar(item, 'material')),
  ...equipamentos.map(item => registrar(item, 'equipamento'))
].map(item => [item.id, item])));

export const SET_INICIAL = Object.freeze(Object.fromEntries(Object.values(NOVOS_ITENS)
  .filter(item => item.origem.recompensa === 'inicial').map(item => [item.slot, item.id])));
export const RECOMPENSA_PATRULHA = Object.freeze(Object.fromEntries(Object.values(NOVOS_ITENS)
  .filter(item => item.origem.recompensa === 'patrulha-inicial').map(item => [item.id, 1])));

const porMob = new Map();
for (const item of Object.values(NOVOS_ITENS)) {
  for (const [mob, chance] of Object.entries(item.origem.drops ?? {})) {
    if (!porMob.has(mob)) porMob.set(mob, []);
    porMob.get(mob).push(Object.freeze({ item: item.id, nome: item.nome, chance }));
  }
}
for (const drops of porMob.values()) Object.freeze(drops);
const semDrops = Object.freeze([]);
export const dropsEspecificos = mob => porMob.get(mob) ?? semDrops;

const numero = n => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
export const RARIDADES_ITENS = Object.freeze({ store: 'Store', comum: 'Comum', incomum: 'Incomum', raro: 'Raro', epico: 'Épico', lendario: 'Lendário' });
export function descricaoItem(item) {
  const dados = [RARIDADES_ITENS[item.raridade] ?? 'Item', 'Peso ' + numero(item.peso) + ' kg'];
  if (item.slot) {
    dados.push('Nível ' + item.nivel, 'Defesa +' + item.defesa, 'Ki/s +' + numero(item.kiPorSegundo));
    if (item.ataque) dados.push('Ataque +' + item.ataque);
  }
  if (Number.isFinite(item.precoNpc)) dados.push('Venda ao NPC ' + numero(item.precoNpc) + ' Z');
  return dados.join(' · ');
}
