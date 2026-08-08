-- ============================================================
-- CHÁCARA ORMELEZ — estrutura no Supabase
-- ============================================================
-- Este site está usando o MESMO projeto Supabase do seu "CRM
-- Clientes" (arffptuclrrzuzdrcmuc), para não precisar de um terceiro
-- projeto no plano gratuito. As tabelas abaixo usam o prefixo
-- "ormelez_" propositalmente, para não colidir com as tabelas do
-- CRM (clientes, atendimentos, historico_atendimento) nem com as
-- do Bora Estudar (prefixo be_).
--
-- Isso já foi executado — este arquivo fica só como documentação/
-- backup, caso um dia você precise recriar tudo em outro projeto.
-- Se for recriar em um projeto novo, troque "ormelez_reservas" e
-- "ormelez_galeria" por "reservas" e "galeria" se preferir nomes
-- mais simples, e ajuste as referências em home.js e calendar.js.
-- ============================================================

create table if not exists ormelez_reservas (
  id uuid primary key default gen_random_uuid(),
  data date not null unique,
  nome_cliente text,
  status text not null default 'pre-reservado'
    check (status in ('pre-reservado','reservado','bloqueado','cancelado')),
  observacao text,
  created_at timestamptz not null default now()
);

comment on table ormelez_reservas is 'Datas do calendário da Chácara Ormelez. status: pre-reservado (cliente clicou, aguardando confirmação, expira em 48h), reservado (confirmado, indisponível), bloqueado (bloqueado manualmente), cancelado (não conta mais).';

create table if not exists ormelez_galeria (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  titulo text,
  categoria text, -- opcional: piscina, capela, refeitorio, tirolesa, skibunda, lual, dormitorios
  ordem int not null default 0,
  created_at timestamptz not null default now()
);

comment on table ormelez_galeria is 'Fotos extras exibidas na galeria do site, além das fotos padrão que já vêm no código.';

alter table ormelez_reservas enable row level security;
alter table ormelez_galeria enable row level security;

drop policy if exists "Leitura publica ormelez_reservas" on ormelez_reservas;
create policy "Leitura publica ormelez_reservas" on ormelez_reservas for select using (true);

drop policy if exists "Leitura publica ormelez_galeria" on ormelez_galeria;
create policy "Leitura publica ormelez_galeria" on ormelez_galeria for select using (true);

-- O SITE (visitante, chave anônima) só pode CRIAR pré-reservas —
-- nunca confirmar (reservado) nem bloquear datas. Isso só você faz
-- pelo painel/SQL Editor, o que ignora estas regras automaticamente.
drop policy if exists "Publico pode pre-reservar ormelez" on ormelez_reservas;
create policy "Publico pode pre-reservar ormelez"
  on ormelez_reservas for insert
  with check (status = 'pre-reservado' and data >= current_date);

-- O SITE também pode apagar SOMENTE pré-reservas já vencidas
-- (mais de 48h sem confirmação) — é assim que uma data volta a
-- ficar livre sozinha, sem precisar de nenhum robô ou cron job.
drop policy if exists "Publico pode limpar pre-reservas vencidas ormelez" on ormelez_reservas;
create policy "Publico pode limpar pre-reservas vencidas ormelez"
  on ormelez_reservas for delete
  using (status = 'pre-reservado' and created_at < now() - interval '2 days');

-- Tempo real — outros visitantes veem o calendário mudar de cor na
-- hora, sem precisar atualizar a página.
alter publication supabase_realtime add table ormelez_reservas;

-- ============================================================
-- COMO USAR NO DIA A DIA (Table Editor → tabela ormelez_reservas)
-- ============================================================
-- • CONFIRMAR uma pré-reserva: troque status de "pre-reservado"
--   para "reservado" → a data fica vermelha no site.
-- • RECUSAR ou liberar antes das 48h: troque status para
--   "cancelado", ou apague a linha.
-- • BLOQUEAR uma data por conta própria: Insert row → data +
--   status "bloqueado".
-- • Fotos da galeria: tabela ormelez_galeria → Insert row → cole
--   o link em "url" e, se quiser, a categoria (piscina, capela,
--   refeitorio, tirolesa, skibunda, lual, dormitorios).
-- ============================================================
