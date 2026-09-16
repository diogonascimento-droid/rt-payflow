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
   `contas`, `cartoes`, `plataformas`) e faz o seed dos cadastros reais
   (contas e cartões atuais).
2. `0002_seed_lancamentos.sql` — backfill dos 261 lançamentos históricos
   (dez/2025–jan/2026) que já existiam na planilha, pra não começar do zero.
3. `0003_auth.sql` — troca o acesso aberto (chave anon) por login: só conta
   Google `@rtpublicity.com.br` lê os dados, e só quem está na tabela
   `editores` pode criar/editar/excluir/importar. **Antes de rodar este
   arquivo**, ative o login com Google no projeto (veja abaixo).
4. `0004_add_editora_giovanna.sql`, `0005_permite_valor_negativo.sql` — ajustes
   pontuais (adiciona uma editora, permite lançamento com valor negativo pra
   reembolso do Meta).
5. `0006_investimento_educacao.sql` — cria as tabelas da tela **Educação**
   (`edu_unidades`, `edu_meses`, `edu_lancamentos`) e faz o backfill dos dados
   reais da planilha "Investimento Educação UCB" (jun–set/2026).

## Login com Google (obrigatório antes de rodar 0003_auth.sql)

1. No [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
   crie um **OAuth 2.0 Client ID** do tipo "Web application":
   - Authorized redirect URI: `https://SEU-PROJETO.supabase.co/auth/v1/callback`
     (pegue a URL exata em Supabase → Authentication → Providers → Google)
   - Se quiser restringir a tela de consentimento ao workspace, configure o
     OAuth consent screen como "Internal" (só aparece se sua conta Google
     Workspace for admin do domínio rtpublicity.com.br)
2. No painel do Supabase → **Authentication → Providers → Google**: ative e
   cole o **Client ID** e o **Client Secret** gerados no passo anterior.
3. Em **Authentication → URL Configuration**, adicione
   `http://localhost:3000/auth/callback` (dev) e a URL de produção
   (`https://SEU-DOMINIO/auth/callback`) em "Redirect URLs".
4. Só então rode `0003_auth.sql` no SQL Editor.

A restrição ao domínio `@rtpublicity.com.br` é reforçada em três lugares:
o parâmetro `hd` na tela do Google (UX), o `proxy.ts` do Next.js (redireciona
e desloga quem não é do domínio) e as políticas de RLS no banco (quem manda,
mesmo se alguém pular as duas primeiras camadas).

## Telas

- `/` — Visão geral (dashboard, fechamento por cartão, investimento por conta)
- `/lancamentos` — tabela de lançamentos com filtros e edição
- `/novo-lancamento` — lançamento manual rápido
- `/importar-csv` — importação do Resumo de Fatura da Meta, com deduplicação por ID de transação
- `/cadastros` — plataformas, contas de anúncio e cartões
- `/relatorio` — relatório do período pronto para impressão/PDF
- `/investimento-educacao` — investimento e leads em educação por associação (UCB), lançamento manual mês a mês
