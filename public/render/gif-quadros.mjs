// Decodifica os quadros completos dos GIFs da Store e do Battle Pass quando
// WebCodecs/ImageDecoder não está disponível (por exemplo, no Safari estável).
const palavra=(bytes,i)=>bytes[i]|bytes[i+1]<<8;

function descompactarLzw(bytes,minimo,total){
 const limpar=1<<minimo,fim=limpar+1,prefixos=new Uint16Array(4096),sufixos=new Uint8Array(4096),pilha=new Uint8Array(4096),saida=new Uint8Array(total);
 let bits=0,tamanho=minimo+1,proximo=fim+1,anterior=-1,primeiro=0,escritos=0;
 const ler=()=>{
  if(bits+tamanho>bytes.length*8)return -1;
  const indice=bits>>3,valor=(bytes[indice]|(bytes[indice+1]||0)<<8|(bytes[indice+2]||0)<<16)>>(bits&7)&((1<<tamanho)-1);
  bits+=tamanho;return valor;
 };
 while(escritos<total){
  let codigo=ler();if(codigo<0)break;
  if(codigo===limpar){tamanho=minimo+1;proximo=fim+1;anterior=-1;continue;}
  if(codigo===fim)break;
  const atual=codigo;let topo=0;
  if(codigo===proximo&&anterior>=0){pilha[topo++]=primeiro;codigo=anterior;}
  else if(codigo>=proximo)throw Error('GIF LZW inválido');
  while(codigo>=fim+1){
   if(topo>=4095)throw Error('GIF LZW excedeu o dicionário');
   pilha[topo++]=sufixos[codigo];codigo=prefixos[codigo];
  }
  if(codigo>=limpar)throw Error('GIF LZW inválido');
  primeiro=codigo;pilha[topo++]=primeiro;
  while(topo&&escritos<total)saida[escritos++]=pilha[--topo];
  if(anterior>=0&&proximo<4096){
   prefixos[proximo]=anterior;sufixos[proximo]=primeiro;proximo++;
   if(proximo===(1<<tamanho)&&tamanho<12)tamanho++;
  }
  anterior=atual;
 }
 if(escritos!==total)throw Error('Quadro GIF incompleto');
 return saida;
}

export function decodificarGif(fonte){
 const bytes=fonte instanceof Uint8Array?fonte:new Uint8Array(fonte);
 const assinatura=String.fromCharCode(...bytes.subarray(0,6));
 if(assinatura!=='GIF89a'&&assinatura!=='GIF87a')throw Error('Arquivo GIF inválido');
 const largura=palavra(bytes,6),altura=palavra(bytes,8);if(!largura||!altura)throw Error('Dimensões GIF inválidas');
 let pos=13,controle={duracao:100,transparente:-1};
 const paleta=quantidade=>{const fim=pos+quantidade*3;if(fim>bytes.length)throw Error('Paleta GIF incompleta');const cores=bytes.subarray(pos,fim);pos=fim;return cores;};
 const global=bytes[10]&128?paleta(2<<(bytes[10]&7)):null;
 const blocos=()=>{
  const partes=[];let total=0;
  while(true){if(pos>=bytes.length)throw Error('Dados GIF incompletos');const n=bytes[pos++];if(!n)break;
   const fim=pos+n;if(fim>bytes.length)throw Error('Dados GIF incompletos');partes.push(bytes.subarray(pos,fim));total+=n;pos=fim;}
  const unido=new Uint8Array(total);let i=0;for(const parte of partes){unido.set(parte,i);i+=parte.length;}return unido;
 };
 const frames=[];
 while(pos<bytes.length){
  const tipo=bytes[pos++];if(tipo===0x3b)break;
  if(tipo===0x21){
   const extensao=bytes[pos++];
   if(extensao===0xf9){
    if(bytes[pos++]!==4)throw Error('Controle GIF inválido');
    const flags=bytes[pos++],centimos=palavra(bytes,pos);pos+=2;
    const indice=bytes[pos++];if(bytes[pos++]!==0)throw Error('Controle GIF inválido');
    controle={duracao:Math.max(20,centimos*10),transparente:flags&1?indice:-1};
   }else blocos();
   continue;
  }
  if(tipo!==0x2c)throw Error('Bloco GIF inválido');
  const x=palavra(bytes,pos),y=palavra(bytes,pos+2),w=palavra(bytes,pos+4),h=palavra(bytes,pos+6),flags=bytes[pos+8];pos+=9;
  if(x||y||w!==largura||h!==altura)throw Error('GIF com quadro parcial');
  const cores=flags&128?paleta(2<<(flags&7)):global;if(!cores)throw Error('GIF sem paleta');
  const minimo=bytes[pos++],indices=descompactarLzw(blocos(),minimo,w*h);
  const rgba=new Uint8ClampedArray(largura*altura*4);
  const linhas=[];
  if(flags&64){for(const [inicio,passo] of [[0,8],[4,8],[2,4],[1,2]])for(let linha=inicio;linha<h;linha+=passo)linhas.push(linha);}
  else for(let linha=0;linha<h;linha++)linhas.push(linha);
  for(let i=0;i<indices.length;i++){
   const indice=indices[i];if(indice===controle.transparente)continue;
   const origem=indice*3,destino=(linhas[Math.floor(i/w)]*w+i%w)*4;
   if(origem+2>=cores.length)throw Error('Índice de paleta GIF inválido');
   rgba[destino]=cores[origem];rgba[destino+1]=cores[origem+1];rgba[destino+2]=cores[origem+2];rgba[destino+3]=255;
  }
  frames.push({rgba,duracao:controle.duracao});controle={duracao:100,transparente:-1};
 }
 if(!frames.length)throw Error('GIF sem quadros');
 return {largura,altura,frames};
}
