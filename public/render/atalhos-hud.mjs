import {ATALHOS,teclasDoAtalho} from '../shared/atalhos.mjs';
import {el} from './hud-elementos.mjs';
const nomes={
 en:['Profile / stats','Backpack','Quests','Bestiary','Map','Store','Battle Pass','Merchant shop','Ranking','Guild','Messages','Close window / open Settings','Toggle Auto Hunt','Auto Hunt panel and Hunt Analyzer','Mount / dismount Nimbus','Chat / send message','Movement','Basic attack','Afterimage','Life Heal','Kamehameha','Transformation (Kaioken → Super Saiyan → Super Saiyan 2)','Ki Barrier','Spirit Bomb','Consumable slot 6','Consumable slot 7','Use food','Map under cursor / camera zoom','Navigate using minimap'],
 es:['Perfil / estadísticas','Mochila','Misiones','Bestiario','Mapa','Store','Battle Pass','Tienda del mercader','Clasificación','Gremio','Mensajes','Cerrar ventana / abrir Configuración','Activar / desactivar Auto Hunt','Panel Auto Hunt y Hunt Analyzer','Montar / desmontar Nimbus','Chat / enviar mensaje','Movimiento','Ataque básico','Imagen Residual','Cura de Vida','Kamehameha','Transformación (Kaioken → Super Saiyajin → Super Saiyajin 2)','Barrera de Ki','Genki-Dama','Consumible del slot 6','Consumible del slot 7','Usar comida','Zoom del mapa bajo cursor / cámara','Navegar usando minimapa']
};
export function tabelaAtalhos(idioma='pt-BR'){
 const headers={en:['Function','Shortcut'],es:['Función','Atajo']},extras={en:{soco:'Space',zoom:'Mouse wheel',navegar:'Click minimap'},es:{soco:'Espacio',zoom:'Rueda del ratón',navegar:'Clic en minimapa'}};
 const caixa=el('div',null,'atalhos-tabela'),tabela=el('table'),cabeca=el('thead'),linha=el('tr'),corpo=el('tbody');
 for(const titulo of (headers[idioma]||['Funcionalidade','Atalho'])){const th=el('th',titulo);th.scope='col';linha.append(th);}cabeca.append(linha);
 for(const [i,a] of ATALHOS.entries()){const tr=el('tr'),nome=el('td',nomes[idioma]?.[i]||a.nome),tecla=el('td');tecla.append(el('kbd',extras[idioma]?.[a.id]||teclasDoAtalho(a)));tr.append(nome,tecla);corpo.append(tr);}
 tabela.append(cabeca,corpo);caixa.append(tabela);return caixa;
}
