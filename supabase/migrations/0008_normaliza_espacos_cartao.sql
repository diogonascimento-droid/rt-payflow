-- O Meta às vezes exporta a "Forma de pagamento" com espaço sem quebra
-- (NBSP, chr(160)) em vez de espaço normal ao redor dos "····"
-- (ex.: "Visa␠····␠9437" onde ␠ = NBSP). Visualmente idêntico a um espaço
-- normal, mas quebra qualquer comparação exata de string — inclusive o
-- filtro de cartão em Lançamentos, que compara com o rótulo gerado no
-- cadastro (que usa espaço normal). O parser do CSV já foi corrigido pra
-- nunca mais gravar isso; esta migration limpa o que já está salvo.

update lancamentos
set cartao = replace(cartao, chr(160), ' ')
where cartao like '%' || chr(160) || '%';

update lancamentos
set cartao = regexp_replace(trim(cartao), '\s+', ' ', 'g')
where cartao <> regexp_replace(trim(cartao), '\s+', ' ', 'g');
