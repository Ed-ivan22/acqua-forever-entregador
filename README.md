# Acqua Forever — App do Entregador

App do entregador do **Acqua Forever**. O entregador vê as entregas pendentes (agendadas e pedidos avulsos), confirma o recebimento validando a **palavra-chave** informada pelo cliente, e acompanha o próprio histórico com totais.

Parte do sistema de **3 apps** (mesmo backend Supabase):

| App | Pasta | Quem usa |
|-----|-------|----------|
| Cliente | `acqua-forever/` | Clientes |
| Admin | `acqua-forever-admin/` | Administração |
| **Entregador** (este) | `acqua-forever-entregador/` | Entregadores |

📚 Arquitetura: [`acqua-forever/ARCHITECTURE.md`](../acqua-forever/ARCHITECTURE.md) · Banco: [`acqua-forever/DATABASE.md`](../acqua-forever/DATABASE.md).

## Stack

- **React 19** + **Vite**
- **Supabase** via `@supabase/supabase-js`
- Estilo **100% inline**; todo o app em `src/App.jsx` (arquivo único)

## Login e acesso

- Login por **CPF + senha** (não e-mail). Internamente o CPF vira `{cpf}@entregador.acquaforever.com` para o Supabase Auth.
- Acesso liberado só para `profiles.perfil = "entregador"` (também aceita `"admin"` para teste) e `ativo != false`.
- O cadastro do entregador é feito pelo Admin (Configurações → Entregadores).

## Configuração

```bash
npm install
cp .env.example .env   # VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
```

## Comandos

```bash
npm run dev       # desenvolvimento
npm run build     # build de produção
npm run preview   # pré-visualiza o build
```

## Deploy

**Vercel** (auto-deploy). Push na branch `master` → build e publicação automáticos.

## Confirmação de entrega (100% no servidor)

O app **não** valida a palavra-chave no cliente nem escreve direto em `deliveries`/`orders`/`estoque`. Ele:

1. Lista pendentes via funções `listar_entregas_em_rota()` / `listar_pedidos_em_entrega()` (não retornam a keyword).
2. Ao digitar a palavra-chave, chama a RPC **`confirmar_entrega(p_tipo, p_id, p_keyword)`**, que valida no servidor, grava a data em horário de Brasília, decrementa o estoque atomicamente e agenda a próxima entrega.

> Não reintroduza comparação de keyword no front nem escrita direta nessas tabelas — isso reabre furos de segurança. Ver [`DATABASE.md`](../acqua-forever/DATABASE.md).
