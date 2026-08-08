-- ============================================================
-- CHÁCARA ORMELEZ — Setup do Supabase
-- Copie e cole este arquivo inteiro no SQL Editor do Supabase
-- (Painel do projeto → SQL Editor → New query → Run)
-- ============================================================

-- 1) Tabela de RESERVAS
create table if not exists reservas (
  id uuid primary key default gen_random_uuid(),
  data date not null unique,
  nome_cliente text,
  status text not null default 'pre-reservado'
    check (status in ('pre-reservado','reservado','bloqueado','cancelado')),
  observacao text,
  created_at timestamptz not null default now()
);

comment on table reservas is 'Datas do calendário da Chácara Ormelez. status: pre-reservado (cliente clicou, aguardando você confirmar, expira em 48h), reservado (confirmado por você, indisponível), bloqueado (você bloqueou manualmente), cancelado (não conta mais).';

-- 2) Tabela de GALERIA
create table if not exists galeria (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  titulo text,
  ordem int not null default 0,
  created_at timestamptz not null default now()
);

comment on table galeria is 'Fotos extras exibidas na galeria do site, além das fotos padrão que já vêm no código.';

-- 3) Segurança (RLS)
alter table reservas enable row level security;
alter table galeria enable row level security;

-- Leitura pública (o site precisa ler o calendário e a galeria)
drop policy if exists "Leitura publica reservas" on reservas;
create policy "Leitura publica reservas" on reservas for select using (true);

drop policy if exists "Leitura publica galeria" on galeria;
create policy "Leitura publica galeria" on galeria for select using (true);

-- O SITE (visitante, chave anônima) só pode CRIAR pré-reservas —
-- nunca confirmar (reservado) nem bloquear datas. Isso só você faz
-- pelo painel, logado, o que ignora estas regras automaticamente.
drop policy if exists "Publico pode pre-reservar" on reservas;
create policy "Publico pode pre-reservar"
  on reservas for insert
  with check (status = 'pre-reservado' and data >= current_date);

-- O SITE também pode apagar SOMENTE pré-reservas já vencidas
-- (mais de 48h sem confirmação) — é assim que uma data volta a
-- ficar livre sozinha, sem precisar de nenhum robô ou cron job.
drop policy if exists "Publico pode limpar pre-reservas vencidas" on reservas;
create policy "Publico pode limpar pre-reservas vencidas"
  on reservas for delete
  using (status = 'pre-reservado' and created_at < now() - interval '2 days');

-- 4) Tempo real — outros visitantes veem o calendário mudar de cor
-- na hora, sem precisar atualizar a página.
alter publication supabase_realtime add table reservas;

-- ============================================================
-- COMO USAR NO DIA A DIA
-- ============================================================
-- • Quando um cliente pré-reserva uma data pelo site, ela aparece
--   automaticamente na tabela `reservas` com status "pre-reservado".
--   Você recebe a mensagem dele no WhatsApp com a data.
--
-- • Para CONFIRMAR: Table Editor → reservas → ache a linha da data
--   → troque status de "pre-reservado" para "reservado"
--   → (opcional) preencha "nome_cliente"
--   A data fica vermelha e indisponível no site.
--
-- • Para RECUSAR ou liberar antes das 48h: troque o status para
--   "cancelado", ou simplesmente apague a linha.
--
-- • Para bloquear uma data por conta própria (manutenção, uso
--   pessoal etc.): Insert row → data + status "bloqueado".
--
-- • Se ninguém confirmar em 48h, a pré-reserva expira sozinha e a
--   data some do bloqueio automaticamente na próxima vez que
--   alguém abrir o calendário.
--
-- • Para adicionar uma foto na galeria: Table Editor → galeria →
--   Insert row → cole o link da imagem em "url".
-- ============================================================
