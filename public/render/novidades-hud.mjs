import { novidadesDaAba } from '../shared/novidades.mjs';

export function instalarNovidadesHud(acao) {
  let lista = [], abaAberta = null, assinatura = '';
  const janela = document.createElement('dialog'); janela.className = 'novidades-hud';
  janela.setAttribute('aria-labelledby', 'novidadesTitulo');
  const topo = document.createElement('header'), titulo = document.createElement('h2'), fechar = document.createElement('button');
  titulo.id = 'novidadesTitulo'; fechar.type = 'button'; fechar.textContent = '✕'; fechar.setAttribute('aria-label', 'Fechar novidades');
  fechar.onclick = () => janela.close(); topo.append(titulo, fechar);
  const conteudo = document.createElement('div'); conteudo.className = 'novidades-lista';
  const lidas = document.createElement('button'); lidas.type = 'button'; lidas.className = 'novidades-lidas'; lidas.textContent = 'Marcar como lidas';
  lidas.onclick = () => { acao({type:'lerNovidades',ids:novidadesDaAba(lista,abaAberta).map(n=>n.id)}); janela.close(); };
  janela.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); janela.close(); } });
  janela.append(topo, conteudo, lidas); document.body.append(janela);
  const renderizar = () => {
    const pendentes = novidadesDaAba(lista, abaAberta), nova = JSON.stringify(pendentes);
    if (nova === assinatura) return; assinatura = nova;
    const nome = document.querySelector(`.hud-menus [data-menu="${abaAberta}"] span`)?.textContent || '';
    titulo.textContent = 'Novidades · ' + nome;
    conteudo.replaceChildren(...pendentes.map(n => {
      const artigo = document.createElement('article'), h = document.createElement('h3'), p = document.createElement('p');
      h.textContent = n.titulo; p.textContent = n.texto; artigo.append(h,p); return artigo;
    }));
    lidas.disabled = pendentes.length === 0;
    if (!pendentes.length) { const p = document.createElement('p'); p.textContent = 'Nenhuma novidade pendente.'; conteudo.append(p); }
  };
  return {
    atualizar(estado) {
      lista = estado?.novidades || [];
      for (const botao of document.querySelectorAll('.hud-menus [data-menu]')) {
        const quantidade = novidadesDaAba(lista, botao.dataset.menu).length+(botao.dataset.menu==='missoes'?(estado?.missoes||[]).filter(m=>m.estado==='concluida').length:botao.dataset.menu==='guilda'?(estado?.guildasPendentes||0):botao.dataset.menu==='correio'?(estado?.guildasPendentes||0)+lista.filter(n=>n.aba!=='correio'&&!n.lida&&!n.arquivada).length:0);
        let selo = botao.querySelector('.hud-novidade');
        if (quantidade && !selo) {
          selo = document.createElement('img'); selo.className = 'hud-novidade'; selo.src = '/assets/hud/alerta-novidade.png'; selo.alt = ''; selo.setAttribute('aria-hidden','true');
          botao.querySelector('i').append(selo);
        }
        if (selo) selo.hidden = !quantidade;
        const nome = botao.querySelector('span')?.textContent || botao.dataset.menu;
        botao.setAttribute('aria-label', nome + (quantidade ? ' · ' + quantidade + (quantidade === 1 ? ' novidade' : ' novidades') : ''));
      }
      if (janela.open) renderizar();
    },
    abrir(aba) {
      if (!novidadesDaAba(lista,aba).length) return false;
      abaAberta = aba; assinatura = ''; renderizar();
      if (!janela.open) janela.show(); return true;
    }
  };
}
