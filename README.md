# RT PayFlow

Controle de investimento em mídia paga da RT Publicity — substitui a planilha
`RT PayFlow.xlsx`. Next.js + TypeScript + Tailwind, dados no Supabase.

## Rodando local

```bash
npm install
cp .env.local.example .env.local   # preencha com os dados do seu projeto Supabase
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Banco de dados (Supabase)

O schema fica em [`supabase/migrations/`](supabase/migrations). Pra aplicar:
abra o SQL Editor do seu projeto no painel do Supabase e rode, **nessa
ordem**:

1. `0001_init.sql` — cria as tabelas (`lancamentos`, `lotes_importacao`,
   `contas`, `cartoes`, `plataformas`), ativa RLS com política aberta (sem
   login no MVP) e faz o seed dos cadastros reais (contas e cartões atuais).
2. `0002_seed_lancamentos.sql` — backfill dos 261 lançamentos históricos
   (dez/2025–jan/2026) que já existiam na planilha, pra não começar do zero.

## Telas

- `/` — Visão geral (dashboard, fechamento por cartão, investimento por conta)
- `/lancamentos` — tabela de lançamentos com filtros e edição
- `/novo-lancamento` — lançamento manual rápido
- `/importar-csv` — importação do Resumo de Fatura da Meta, com deduplicação por ID de transação
- `/cadastros` — plataformas, contas de anúncio e cartões
- `/relatorio` — relatório do período pronto para impressão/PDF
