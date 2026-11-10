-- =====================================================================
-- La torre de los patitos · Base de datos en Supabase (PostgreSQL)
-- Pega todo este archivo en Supabase → SQL Editor → Run.
-- Sin login: el juego solo puede llamar a dos funciones
--   guardar_partida(p, p_token)  → inserta o actualiza una partida
--   listar_partidas()            → devuelve las partidas para el tablero
-- Las tablas quedan cerradas al público (RLS activo y sin políticas).
-- =====================================================================

-- ---------- Tablas ----------
create table if not exists public.partidas (
  id            text primary key check (id ~ '^r[a-z0-9]{6,24}$'),
  token_hash    text not null,                       -- solo quien creó la partida puede actualizarla
  nombre        text check (nombre is null or char_length(nombre) between 2 and 14),
  dispositivo   text,
  golpe         boolean not null default true,       -- false si jugó sin el golpe secundario
  completados   smallint not null default 0 check (completados between 0 and 3),
  tiempo_total  numeric(8,2) not null default 0,
  entradas      jsonb,                               -- conteo de teclado / botones / toques
  iniciada      timestamptz not null default now(),
  actualizada   timestamptz not null default now()
);

create table if not exists public.niveles (
  partida_id  text not null references public.partidas(id) on delete cascade,
  capitulo    smallint not null check (capitulo between 1 and 3),
  tiempo      numeric(8,2) not null default 0,
  caidas      int not null default 0,
  drones      int not null default 0,
  reinicios   int not null default 0,
  pluma       boolean not null default false,
  completado  boolean not null default false,
  piso_max    smallint not null default 0,
  muertes     jsonb not null default '[]'::jsonb,    -- [[piso, columna, causa], ...] para el mapa de caídas
  primary key (partida_id, capitulo)
);

create table if not exists public.encuestas (
  partida_id  text primary key references public.partidas(id) on delete cascade,
  diversion   smallint check (diversion between 1 and 5),
  dificultad  smallint check (dificultad between 0 and 4),   -- 0 Muy fácil … 4 Muy difícil
  favorito    smallint check (favorito between 0 and 2),     -- 0 Torre del parque, 1 Vivero abandonado, 2 Antena de Entregas Ya!
  claridad    smallint check (claridad between 1 and 5),
  emocion     smallint check (emocion between 0 and 4),      -- 0 Curiosidad, 1 Tensión, 2 Satisfacción, 3 Frustración, 4 Aburrimiento
  comentario  text check (comentario is null or char_length(comentario) <= 280),
  creada      timestamptz not null default now()
);

create index if not exists partidas_record_idx on public.partidas (completados, tiempo_total);

alter table public.partidas  enable row level security;
alter table public.niveles   enable row level security;
alter table public.encuestas enable row level security;
revoke all on public.partidas, public.niveles, public.encuestas from anon, authenticated;

-- ---------- Guardar (inserta o actualiza) ----------
create or replace function public.guardar_partida(p jsonb, p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id     text := p->>'id';
  v_hash   text;
  v_prev   text;
  v_nombre text;
  l        jsonb;
  s        jsonb;
begin
  if p is null or jsonb_typeof(p) <> 'object' then raise exception 'partida inválida'; end if;
  if octet_length(p::text) > 60000 then raise exception 'partida demasiado grande'; end if;
  if p_token is null or p_token !~ '^[a-f0-9]{32}$' then raise exception 'token inválido'; end if;

  v_hash := encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
  select token_hash into v_prev from partidas where id = v_id;
  if v_prev is not null and v_prev <> v_hash then raise exception 'sin permiso para esta partida'; end if;

  v_nombre := nullif(left(regexp_replace(coalesce(p->>'nick', ''), '\s+', ' ', 'g'), 14), '');
  if v_nombre is not null and char_length(trim(v_nombre)) < 2 then v_nombre := null; end if;

  insert into partidas (id, token_hash, nombre, dispositivo, golpe, completados, tiempo_total, entradas, iniciada, actualizada)
  values (
    v_id, v_hash, trim(v_nombre), left(p->>'device', 20),
    coalesce((p->>'combat')::boolean, true),
    least(greatest(coalesce((p->>'completed')::int, 0), 0), 3),
    least(greatest(coalesce((p->>'totalTime')::numeric, 0), 0), 99999),
    case when jsonb_typeof(p->'input') = 'object' then p->'input' end,
    coalesce((p->>'startedAt')::timestamptz, now()), now()
  )
  on conflict (id) do update set
    nombre = coalesce(excluded.nombre, partidas.nombre),
    golpe = excluded.golpe,
    completados = greatest(partidas.completados, excluded.completados),
    tiempo_total = excluded.tiempo_total,
    entradas = excluded.entradas,
    actualizada = now();

  for l in select value from jsonb_array_elements(coalesce(p->'levels', '[]'::jsonb)) loop
    continue when jsonb_typeof(l) <> 'object' or coalesce((l->>'n')::int, 0) not between 1 and 3;
    insert into niveles (partida_id, capitulo, tiempo, caidas, drones, reinicios, pluma, completado, piso_max, muertes)
    values (
      v_id, (l->>'n')::int,
      least(greatest(coalesce((l->>'time')::numeric, 0), 0), 99999),
      least(greatest(coalesce((l->>'falls')::int, 0), 0), 9999),
      least(greatest(coalesce((l->>'kills')::int, 0), 0), 999),
      least(greatest(coalesce((l->>'restarts')::int, 0), 0), 999),
      coalesce((l->>'feather')::boolean, false),
      coalesce((l->>'done')::boolean, false),
      least(greatest(coalesce((l->>'best')::int, 0), 0), 20),
      coalesce((select jsonb_agg(e) from (select e from jsonb_array_elements(case when jsonb_typeof(l->'deaths') = 'array' then l->'deaths' else '[]'::jsonb end) e limit 80) t), '[]'::jsonb)
    )
    on conflict (partida_id, capitulo) do update set
      tiempo = excluded.tiempo, caidas = excluded.caidas, drones = excluded.drones, reinicios = excluded.reinicios,
      pluma = niveles.pluma or excluded.pluma, completado = niveles.completado or excluded.completado,
      piso_max = greatest(niveles.piso_max, excluded.piso_max), muertes = excluded.muertes;
  end loop;

  s := p->'survey';
  if jsonb_typeof(s) = 'object' then
    insert into encuestas (partida_id, diversion, dificultad, favorito, claridad, emocion, comentario)
    values (
      v_id, (s->>'fun')::smallint, (s->>'difficulty')::smallint, (s->>'favorite')::smallint,
      (s->>'clarity')::smallint, (s->>'emotion')::smallint, nullif(left(trim(coalesce(s->>'comment', '')), 280), '')
    )
    on conflict (partida_id) do update set
      diversion = excluded.diversion, dificultad = excluded.dificultad, favorito = excluded.favorito,
      claridad = excluded.claridad, emocion = excluded.emocion, comentario = excluded.comentario;
  end if;
end;
$$;

-- ---------- Leer (para el tablero y las estadísticas) ----------
create or replace function public.listar_partidas()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(x), '[]'::jsonb) from (
    select jsonb_build_object(
      'id', p.id, 'nick', p.nombre, 'device', p.dispositivo, 'combat', p.golpe,
      'completed', p.completados, 'totalTime', p.tiempo_total,
      'startedAt', p.iniciada, 'updatedAt', p.actualizada,
      'levels', coalesce((
        select jsonb_agg(jsonb_build_object(
          'n', n.capitulo, 'time', n.tiempo, 'falls', n.caidas, 'kills', n.drones, 'restarts', n.reinicios,
          'feather', n.pluma, 'done', n.completado, 'best', n.piso_max, 'deaths', n.muertes) order by n.capitulo)
        from niveles n where n.partida_id = p.id), '[]'::jsonb),
      'survey', (
        select jsonb_build_object('fun', e.diversion, 'difficulty', e.dificultad, 'favorite', e.favorito,
          'clarity', e.claridad, 'emotion', e.emocion, 'comment', e.comentario, 'at', e.creada)
        from encuestas e where e.partida_id = p.id)
    ) as x
    from partidas p
    order by p.actualizada desc
    limit 2000
  ) t;
$$;

revoke all on function public.guardar_partida(jsonb, text) from public;
revoke all on function public.listar_partidas() from public;
grant execute on function public.guardar_partida(jsonb, text) to anon, authenticated;
grant execute on function public.listar_partidas() to anon, authenticated;

-- ---------- Vistas para tu análisis (no se exponen al público) ----------
create schema if not exists analisis;
revoke all on schema analisis from anon, authenticated;

create or replace view analisis.records as
  select row_number() over (order by tiempo_total) as lugar, nombre, tiempo_total,
         (select sum(caidas) from public.niveles n where n.partida_id = p.id) as caidas,
         (select count(*) filter (where pluma) from public.niveles n where n.partida_id = p.id) as plumas,
         actualizada
  from public.partidas p
  where completados = 3 and nombre is not null
  order by tiempo_total;

create or replace view analisis.resumen_capitulos as
  select capitulo,
         count(*) as partidas,
         count(*) filter (where completado) as completadas,
         round(100.0 * count(*) filter (where completado) / nullif(count(*), 0), 1) as pct_completado,
         round((percentile_cont(.5) within group (order by tiempo) filter (where completado))::numeric, 1) as tiempo_mediano_s,
         round(avg(caidas), 2) as caidas_promedio,
         round(avg(reinicios), 2) as reinicios_promedio,
         round(100.0 * count(*) filter (where pluma) / nullif(count(*) filter (where completado), 0), 1) as pct_pluma,
         round(avg(drones), 2) as drones_promedio
  from public.niveles group by capitulo order by capitulo;

create or replace view analisis.caidas as
  select n.partida_id, n.capitulo, (m->>0)::numeric as piso, (m->>1)::numeric as columna, m->>2 as causa
  from public.niveles n cross join lateral jsonb_array_elements(n.muertes) m;

create or replace view analisis.caidas_por_lugar as
  select capitulo, round(piso)::int as piso, (round(columna * 2) / 2)::numeric(3,1) as columna, causa, count(*) as caidas
  from analisis.caidas group by 1, 2, 3, 4 order by caidas desc;

create or replace view analisis.encuesta as
  select p.nombre, e.diversion, e.claridad,
         (array['Muy fácil','Fácil','Justa','Difícil','Muy difícil'])[e.dificultad + 1] as dificultad,
         (array['Torre del parque','Vivero abandonado','Antena de Entregas Ya!'])[e.favorito + 1] as capitulo_favorito,
         (array['Curiosidad','Tensión','Satisfacción','Frustración','Aburrimiento'])[e.emocion + 1] as emocion,
         e.comentario, e.creada
  from public.encuestas e join public.partidas p on p.id = e.partida_id
  order by e.creada desc;
