import {readFileSync} from 'node:fs';
import {writeFile,rename} from 'node:fs/promises';
const repositorio='pedrohenriqueballesta-ux/-----';
const reserva=JSON.parse(readFileSync(new URL('./novidades-main.json',import.meta.url),'utf8'));
const resumir=t=>String(t||'').replace(/^(feat|fix|chore|docs|refactor|style|test|perf)(\([^)]*\))?!?:\s*/i,'').replace(/\s+/g,' ').trim();
export function noticiaDoCommit(c){
 if(!c||!/^[a-f0-9]{40}$/.test(c.sha)||!Number.isFinite(Date.parse(c.commit?.committer?.date)))return null;
 const linhas=String(c.commit.message||'').split('\n').map(l=>l.trim()).filter(Boolean),merge=/^Merge (pull request|branch)/i.test(linhas[0]||'');
 const titulo=resumir(merge?linhas[1]||'Atualização do jogo':linhas[0]);if(!titulo)return null;
 const pr=/^Merge pull request #(\d+)/i.exec(linhas[0]||'');
 const corpo=linhas.slice(merge?2:1).filter(l=>!/^Co-authored-by:/i.test(l)).map(resumir).join(' ');
 return {id:c.sha,titulo:pr?'Atualização #'+pr[1]:titulo.slice(0,140),descricao:(titulo.charAt(0).toUpperCase()+titulo.slice(1)+(corpo?' — '+corpo:'.')).slice(0,240),conteudo:(titulo+(corpo?'\n\n'+corpo:'.')).slice(0,1200),data:c.commit.committer.date,categoria:'atualizacao',url:'https://github.com/'+repositorio+'/commit/'+c.sha};
}
export class NovidadesMain{
 constructor({buscar=fetch,agora=()=>Date.now(),iniciais=reserva,cacheFile=null}={}){this.cacheFile=cacheFile;try{if(cacheFile){const salvo=JSON.parse(readFileSync(cacheFile,'utf8'));if(Array.isArray(salvo)&&salvo.length&&salvo.every(n=>n&&typeof n.id==='string'&&typeof n.titulo==='string'&&typeof n.descricao==='string'&&Number.isFinite(Date.parse(n.data))))iniciais=salvo;}}catch{}this.buscar=buscar;this.agora=agora;this.noticias=iniciais.slice(0,5);this.proxima=0;this.pendente=null;}
 async atualizar(){
  if(this.pendente)return this.pendente;
  this.pendente=(async()=>{
   try{
    const headers={Accept:'application/vnd.github+json','User-Agent':'Dragon-Ball-Idle-News','X-GitHub-Api-Version':'2022-11-28'};
    if(process.env.GITHUB_NEWS_TOKEN)headers.Authorization='Bearer '+process.env.GITHUB_NEWS_TOKEN;
    const signal=AbortSignal.timeout(4500);
    const get=async caminho=>{const r=await this.buscar('https://api.github.com/repos/'+repositorio+caminho,{headers,signal});if(!r.ok)throw Error('GitHub indisponível');return r.json();};
    const lista=await get('/commits?sha=main&per_page=100');if(!Array.isArray(lista)||!lista.length)throw Error('Histórico vazio');
    const mapa=new Map(lista.map(c=>[c.sha,c])),noticias=[];let c=lista[0];const vistos=new Set();
    // Caminha apenas pelo primeiro pai: uma publicação na main, sem duplicar commits da branch mesclada.
    while(c&&noticias.length<5){
     if(vistos.has(c.sha))throw Error('Histórico inválido');vistos.add(c.sha);const n=noticiaDoCommit(c);if(!n)throw Error('Commit inválido');noticias.push(n);
     const pai=c.parents?.[0]?.sha;if(!pai||noticias.length===5)break;if(!/^[a-f0-9]{40}$/.test(pai))throw Error('Pai inválido');c=mapa.get(pai)||await get('/commits/'+pai);
    }
    this.noticias=noticias;this.proxima=this.agora()+300000;
    if(this.cacheFile)try{await writeFile(this.cacheFile+'.tmp',JSON.stringify(noticias),'utf8');await rename(this.cacheFile+'.tmp',this.cacheFile);}catch{}
   }catch{this.proxima=this.agora()+60000;} // Conserva o último mural em falhas e limites da API.
  })().finally(()=>{this.pendente=null;});return this.pendente;
 }
 obter(){if(this.agora()>=this.proxima&&!this.pendente)void this.atualizar();return this.noticias;}
}
