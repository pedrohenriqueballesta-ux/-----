// Evita o limite de tamanho de comando do Windows e inclui módulos novos automaticamente.
import {readdir} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..'),arquivos=['server.mjs'];
async function listar(pasta) {
  for(const entrada of await readdir(join(raiz,pasta),{withFileTypes:true})) {
    const nome=join(pasta,entrada.name);
    if(entrada.isDirectory())await listar(nome);
    else if(entrada.isFile()&&nome.endsWith('.mjs'))arquivos.push(nome);
  }
}
for(const pasta of ['public','server','ferramentas'])await listar(pasta);
for(const arquivo of arquivos.sort()) {
  const resultado=spawnSync(process.execPath,['--check',arquivo],{cwd:raiz,encoding:'utf8',windowsHide:true});
  if(resultado.error||resultado.status!==0) {
    console.error('Falha de sintaxe em '+arquivo+'\n'+(resultado.error?.message||resultado.stderr));process.exitCode=1;
  }
}
if(!process.exitCode)console.log('Sintaxe aprovada em '+arquivos.length+' módulos.');
