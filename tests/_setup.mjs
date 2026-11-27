// Setup carregado antes de tudo na suíte (via `node --import ./tests/_setup.mjs`).
// Garante um ambiente de teste determinístico, imune a variáveis de dev da máquina de quem roda.
//
// DBI_GODMODE=1 é uma conveniência de desenvolvimento (liga o God Mode por padrão). Se ela estiver
// no ambiente — como está, de forma persistente, na máquina do Pedro — TODO player criado nos testes
// nasce em God Mode (nível/dano/stats trocados) e centenas de testes de gameplay falham por engano.
// Aqui apagamos a variável ANTES de qualquer módulo (config.mjs lê DBI_GODMODE no carregamento), para
// a suíte local bater com a do CI/colegas. Testes que precisam de God Mode o ligam explicitamente.
delete process.env.DBI_GODMODE;
