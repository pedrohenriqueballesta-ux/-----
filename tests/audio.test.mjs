import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {criarTrilhaSonora,ambienteMusical,TRILHAS,seguirSaidaPadrao} from '../public/client/audio.mjs';
import {Game} from '../public/shared/game.mjs';
import {preferenciasValidas} from '../public/shared/preferencias.mjs';
import {createGameServer} from '../server.mjs';
const cidade={self:{planet:'namek',area:'vila'}},hunt={self:{planet:'namek',area:'inicial'}};
class AudioTeste{
 constructor(){this.paused=true;this.currentTime=0;this.tocadas=0;this.pausas=0;this.eventos=new Map();}
 pause(){this.paused=true;this.pausas++;}
 play(){this.tocadas++;this.paused=false;return Promise.resolve();}
 addEventListener(k,f){this.eventos.set(k,f);}removeEventListener(k){this.eventos.delete(k);}
 removeAttribute(k){if(k==='src')this.src='';}load(){}
}
const esperar=()=>new Promise(ok=>setImmediate(ok));
test('música acompanha telas e áreas reais, incluindo safe zone da hunt e respawn em cidade',()=>{
 assert.equal(ambienteMusical(null,true),'login');assert.equal(ambienteMusical(hunt,true),'login');assert.equal(ambienteMusical(null),null);
 assert.equal(ambienteMusical({self:{planet:'terra',area:null}}),'cidades');assert.equal(ambienteMusical(cidade),'cidades');assert.equal(ambienteMusical({self:{planet:'vegeta',area:'vegeta-cidade'}}),'cidades');
 assert.equal(ambienteMusical({...hunt,self:{...hunt.self,naZonaSegura:true,hp:0}}),'hunts');assert.equal(ambienteMusical({self:{planet:'vegeta',area:'vegeta-lava'}}),'hunts');assert.equal(ambienteMusical(cidade),'cidades');assert.equal(ambienteMusical({self:{planet:'namek',area:'inexistente'}}),null);
});
test('um reprodutor faz loop, troca faixa sem sobreposição e não reinicia com snapshots ou cidade diferente',async()=>{
 const a=new AudioTeste(),p=criarTrilhaSonora({audio:a});p.atualizar(null,true);await esperar();assert.equal(a.src,TRILHAS.login);assert.equal(a.loop,true);assert.equal(a.tocadas,1);
 p.atualizar(cidade);await esperar();assert.equal(a.src,TRILHAS.cidades);a.currentTime=23;p.atualizar(cidade);p.atualizar({self:{planet:'vegeta',area:'vegeta-cidade'}});assert.equal(a.currentTime,23);assert.equal(a.tocadas,2);
 p.atualizar(hunt);await esperar();assert.equal(a.src,TRILHAS.hunts);assert.equal(a.currentTime,0);assert.equal(a.tocadas,3);p.atualizar(cidade);await esperar();assert.equal(a.src,TRILHAS.cidades);p.atualizar(hunt,true);await esperar();assert.equal(a.src,TRILHAS.login);p.destruir();assert.equal(a.paused,true);
});
test('desativar e volume zero pausam; alterações de volume não reiniciam uma música ativa',async()=>{
 const a=new AudioTeste(),p=criarTrilhaSonora({audio:a});p.atualizar(cidade,false,{volumeMusica:.25});await esperar();a.currentTime=10;p.atualizar(cidade,false,{volumeMusica:.7});assert.equal(a.volume,.7);assert.equal(a.currentTime,10);assert.equal(a.tocadas,1);
 p.atualizar(cidade,false,{musicaAtiva:false});assert.equal(a.paused,true);p.desbloquear();p.atualizar(hunt,false,{musicaAtiva:false});assert.equal(a.tocadas,1);p.atualizar(hunt,false,{musicaAtiva:true});await esperar();assert.equal(a.tocadas,2);
 p.atualizar(hunt,false,{volumeMusica:0});assert.equal(a.paused,true);p.atualizar(hunt,false,{volumeMusica:.3});await esperar();assert.equal(a.tocadas,3);p.destruir();
});
test('bloqueio de autoplay é recuperado pela interação sem tentativas por snapshot',async()=>{
 const a=new AudioTeste(),estados=[];let bloquear=true;a.play=()=>{a.tocadas++;if(bloquear)return Promise.reject(Object.assign(new Error('autoplay'),{name:'NotAllowedError'}));a.paused=false;return Promise.resolve();};
 const p=criarTrilhaSonora({audio:a,aoEstado:s=>estados.push(s)});p.atualizar(null,true);await esperar();assert.equal(estados.at(-1).bloqueado,true);for(let i=0;i<20;i++)p.atualizar(null,true);assert.equal(a.tocadas,1);bloquear=false;p.desbloquear();await esperar();assert.equal(a.paused,false);assert.equal(estados.at(-1).bloqueado,false);p.destruir();
});
test('promessa antiga rejeitada não altera a faixa nova e destruir impede novas reproduções',async()=>{
 const a=new AudioTeste(),estados=[];let rejeitar;a.play=()=>{a.tocadas++;if(a.tocadas===1)return new Promise((_,falha)=>{rejeitar=falha;});a.paused=false;return Promise.resolve();};
 const p=criarTrilhaSonora({audio:a,aoEstado:s=>estados.push(s)});p.atualizar(null,true);p.atualizar(hunt);await esperar();rejeitar(Object.assign(new Error(),{name:'NotAllowedError'}));await esperar();assert.equal(estados.at(-1).ambiente,'hunts');assert.equal(estados.at(-1).bloqueado,false);p.destruir();p.desbloquear();p.atualizar(cidade);assert.equal(a.tocadas,2);assert.equal(a.paused,true);assert.equal(a.eventos.size,0);
});
test('preferências de áudio são validadas e permanecem no save',()=>{
 const g=new Game({populate:false}),p=g.addPlayer('p');assert.equal(p.preferencias.musicaAtiva,true);assert.equal(p.preferencias.volumeMusica,.4);
 g.action(p.id,{type:'preferencias',valor:{musicaAtiva:false,volumeMusica:.15}});const r=g.addPlayer('r','Teste',g.exportPlayer(p));assert.equal(r.preferencias.musicaAtiva,false);assert.equal(r.preferencias.volumeMusica,.15);assert.equal(preferenciasValidas({volumeMusica:20}).volumeMusica,1);assert.equal(preferenciasValidas({volumeMusica:NaN,musicaAtiva:'false'}).volumeMusica,.4);assert.equal(preferenciasValidas({volumeMusica:0}).volumeMusica,0);
});
test('servidor entrega os três MP3 com tipo, tamanho e conteúdo corretos',async()=>{
 const app=await createGameServer({port:0,dataDir:null});try{for(const path of Object.values(TRILHAS)){const r=await fetch('http://127.0.0.1:'+app.port+path),arquivo=await readFile(new URL('../public'+path,import.meta.url));assert.equal(r.headers.get('content-type'),'audio/mpeg');assert.equal(Number(r.headers.get('content-length')),arquivo.length);assert.deepEqual(Buffer.from(await r.arrayBuffer()),arquivo);const h=await fetch('http://127.0.0.1:'+app.port+path,{method:'HEAD'});assert.equal(h.status,200);assert.equal(Number(h.headers.get('content-length')),arquivo.length);assert.equal((await h.arrayBuffer()).byteLength,0);}}finally{await app.close();}
});
test('saída e retorno de página suspendem e retomam sem criar outro reprodutor',async()=>{const a=new AudioTeste(),p=criarTrilhaSonora({audio:a});p.atualizar(cidade);await esperar();p.suspender();assert.equal(a.paused,true);p.atualizar(hunt);p.desbloquear();assert.equal(a.tocadas,1);p.retomar();await esperar();assert.equal(a.tocadas,2);assert.equal(a.src,TRILHAS.hunts);p.destruir();});
test('botão de teste recupera erro de carregamento e restaura a faixa esperada sem ignorar música desativada',async()=>{const a=new AudioTeste(),p=criarTrilhaSonora({audio:a});a.play=()=>Promise.reject(Object.assign(new Error('falhou'),{name:'NotSupportedError'}));p.atualizar(cidade);await esperar();assert.equal(p.estado().erro,true);a.src='/arquivo-errado.mp3';a.play=()=>{a.tocadas++;a.paused=false;return Promise.resolve();};assert.equal(p.testar(),true);await esperar();assert.equal(a.src,TRILHAS.cidades);assert.equal(p.estado().erro,false);assert.equal(a.paused,false);p.atualizar(cidade,false,{musicaAtiva:false});assert.equal(p.testar(),false);assert.equal(a.paused,true);p.destruir();});
test('saída segue o padrão do navegador no início e após devicechange sem fixar dispositivo',async()=>{const eventos=new Map(),chamadas=[],a={setSinkId:async id=>{chamadas.push(id);}},d={addEventListener:(k,f)=>eventos.set(k,f),removeEventListener:k=>eventos.delete(k)};const c=seguirSaidaPadrao({audio:a,dispositivos:d});await esperar();assert.deepEqual(chamadas,['']);eventos.get('devicechange')();await esperar();assert.deepEqual(chamadas,['','']);c.destruir();assert.equal(eventos.size,0);assert.equal(await c.sincronizar(),false);assert.equal(chamadas.length,2);});
test('navegador sem seleção de saída ou com permissão negada mantém reprodução nativa',async()=>{const a=new AudioTeste(),c=seguirSaidaPadrao({audio:a,dispositivos:null});assert.equal(await c.sincronizar(),false);c.destruir();a.setSinkId=()=>Promise.reject(Object.assign(new Error('negado'),{name:'NotAllowedError'}));const d=seguirSaidaPadrao({audio:a,dispositivos:null});assert.equal(await d.sincronizar(),false);const p=criarTrilhaSonora({audio:a,antesDeTocar:()=>d.sincronizar()});p.atualizar(cidade);await esperar();assert.equal(a.paused,false);assert.equal(p.estado().erro,false);p.destruir();d.destruir();});
test('atualizações simultâneas da saída compartilham a mesma solicitação',async()=>{let finalizar,vezes=0;const c=seguirSaidaPadrao({audio:{setSinkId:()=>{vezes++;return new Promise(ok=>finalizar=ok);}},dispositivos:null});const a=c.sincronizar(),b=c.sincronizar();assert.equal(a,b);assert.equal(vezes,1);finalizar();assert.equal(await a,true);c.destruir();});