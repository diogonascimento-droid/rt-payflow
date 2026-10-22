-- Apaga lançamentos importados com forma de pagamento "N/D" (Meta não
-- identificou o cartão — gasto debitado do saldo, não cobrança no cartão).
-- O importador já ignora essas linhas desde a migration/commit de moeda;
-- isto limpa o que entrou antes disso. Também remove o cadastro de cartão
-- "N/D" criado por engano numa importação, se não sobrar lançamento usando.

delete from lancamentos
where upper(trim(cartao)) = 'N/D';

delete from cartoes
where upper(trim(bandeira)) = 'N/D'
  and not exists (
    select 1 from lancamentos l
    where l.cartao = cartoes.bandeira || ' ···· ' || cartoes.final4
  );
