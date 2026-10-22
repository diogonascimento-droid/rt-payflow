-- Lançamentos passam a ter moeda (BRL por padrão). Algumas contas de anúncio
-- (ex.: conta americana) cobram em USD no cartão; o valor fica guardado na
-- moeda original, sem conversão, e a tela deixa claro que é dólar.

alter table lancamentos
  add column if not exists moeda text not null default 'BRL'
  check (moeda ~ '^[A-Z]{3}$');
