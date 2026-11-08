// Fronteira para um provedor futuro. Não contém cobrança, cartões ou webhooks.
export class PagamentoSimulado{
 constructor(ambiente){this.habilitado=ambiente==='development';}
 confirmar(cotacao){if(!this.habilitado)return {ok:false,reason:'Recargas simuladas disponíveis somente em desenvolvimento.'};return {ok:true,referencia:'dev-'+cotacao.id};}
}
