// Ativação explícita do ambiente local. npm start mantém o padrão seguro de produção.
process.env.NODE_ENV='development';
// Só para teste: habilita o atalho de pular login (GET /api/auth/dev + ?dev na URL). REMOVER ao desligar o atalho.
process.env.DBI_SKIP_LOGIN??='1';
