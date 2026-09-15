-- O relatório de cobrança do Meta pode trazer linhas de reembolso
-- ("Reembolso de Anúncios da Meta") com valor negativo. A tabela só
-- aceitava valor > 0, então a importação inteira falhava quando o CSV
-- tinha uma dessas linhas. Passa a aceitar qualquer valor diferente de
-- zero (negativo = reembolso/estorno, reduz o total do cartão).

alter table lancamentos drop constraint lancamentos_valor_check;
alter table lancamentos add constraint lancamentos_valor_check check (valor <> 0);
