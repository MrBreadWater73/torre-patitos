-- =====================================================================
-- La torre de los patitos · Base de datos en Supabase (PostgreSQL)
-- Pega todo este archivo en Supabase → SQL Editor → Run.
-- Sirve para una base nueva y también para actualizar una que ya tiene partidas de la
-- versión 1: no borra nada y se puede correr más de una vez. Las partidas que ya
-- existían quedan marcadas como versión 1.
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
  completados   smallint not null default 0 check (completados between 0 and 7),
  tiempo_total  numeric(8,2) not null default 0,
  entradas      jsonb,                               -- conteo de teclado / botones / toques
  iniciada      timestamptz not null default now(),
  actualizada   timestamptz not null default now()
);

create table if not exists public.niveles (
  partida_id  text not null references public.partidas(id) on delete cascade,
  capitulo    smallint not null check (capitulo between 1 and 7),
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
  favorito    smallint check (favorito between 0 and 6),     -- capítulo favorito, contando desde 0
  claridad    smallint check (claridad between 1 and 5),
  emocion     smallint check (emocion between 0 and 4),      -- 0 Curiosidad, 1 Tensión, 2 Satisfacción, 3 Frustración, 4 Aburrimiento
  comentario  text check (comentario is null or char_length(comentario) <= 280),
  creada      timestamptz not null default now()
);

create index if not exists partidas_record_idx on public.partidas (completados, tiempo_total);

-- ---------- Versión 2: columnas nuevas y límites más amplios ----------
-- (en una base nueva esto no cambia nada; en una con datos de la versión 1, la actualiza)
alter table public.partidas add column if not exists version  smallint not null default 1;      -- 1 = tres capítulos, 2 = siete
alter table public.partidas add column if not exists asistido boolean  not null default false;  -- jugó con el modo asistido
alter table public.niveles  add column if not exists tiempo_subida numeric(8,2);                 -- segundos hasta tocar al hermano; el resto es la bajada
alter table public.partidas add column if not exists modo     text     not null default 'historia';  -- 'historia' o 'infinito'
alter table public.partidas add column if not exists pisos    smallint not null default 0;          -- pisos que alcanzó en el modo infinito
alter table public.partidas drop constraint if exists partidas_modo_check;
alter table public.partidas add  constraint partidas_modo_check check (modo in ('historia', 'infinito'));
alter table public.partidas drop constraint if exists partidas_pisos_check;
alter table public.partidas add  constraint partidas_pisos_check check (pisos between 0 and 5000);

alter table public.partidas  drop constraint if exists partidas_completados_check;
alter table public.partidas  add  constraint partidas_completados_check check (completados between 0 and 7);
alter table public.niveles   drop constraint if exists niveles_capitulo_check;
alter table public.niveles   add  constraint niveles_capitulo_check check (capitulo between 1 and 7);
alter table public.encuestas drop constraint if exists encuestas_favorito_check;
alter table public.encuestas add  constraint encuestas_favorito_check check (favorito between 0 and 6);

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
  v_id      text := p->>'id';
  v_hash    text;
  v_prev    text;
  v_nombre  text;
  v_version smallint;
  v_modo    text;
  v_max     smallint;   -- capítulos de esa versión
  l         jsonb;
  s         jsonb;
begin
  if p is null or jsonb_typeof(p) <> 'object' then raise exception 'partida inválida'; end if;
  if octet_length(p::text) > 60000 then raise exception 'partida demasiado grande'; end if;
  if p_token is null or p_token !~ '^[a-f0-9]{32}$' then raise exception 'token inválido'; end if;

  v_hash := encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
  select token_hash, version, modo into v_prev, v_version, v_modo from partidas where id = v_id;
  if v_prev is not null and v_prev <> v_hash then raise exception 'sin permiso para esta partida'; end if;

  -- La versión se fija al crear la partida y ya no cambia
  if v_version is null then
    v_version := case when jsonb_typeof(p->'v') = 'number' and (p->>'v')::numeric >= 2 then 2 else 1 end;
  end if;
  -- El modo también se fija al crear la partida
  if v_modo is null then v_modo := case when p->>'mode' = 'endless' then 'infinito' else 'historia' end; end if;
  v_max := case when v_version = 2 then 7 else 3 end;

  v_nombre := nullif(left(regexp_replace(coalesce(p->>'nick', ''), '\s+', ' ', 'g'), 14), '');
  if v_nombre is not null and char_length(trim(v_nombre)) < 2 then v_nombre := null; end if;

  insert into partidas (id, token_hash, nombre, dispositivo, golpe, completados, tiempo_total, entradas, iniciada, actualizada, version, asistido, modo, pisos)
  values (
    v_id, v_hash, trim(v_nombre), left(p->>'device', 20),
    coalesce((p->>'combat')::boolean, true),
    least(greatest(coalesce((p->>'completed')::int, 0), 0), v_max),
    least(greatest(coalesce((p->>'totalTime')::numeric, 0), 0), 99999),
    case when jsonb_typeof(p->'input') = 'object' then p->'input' end,
    coalesce((p->>'startedAt')::timestamptz, now()), now(),
    v_version, coalesce((p->>'assist')::boolean, false), v_modo,
    case when v_modo = 'infinito' then least(greatest(coalesce((p->>'floors')::int, 0), 0), 5000) else 0 end
  )
  on conflict (id) do update set
    nombre = coalesce(excluded.nombre, partidas.nombre),
    golpe = excluded.golpe,
    completados = greatest(partidas.completados, excluded.completados),
    tiempo_total = excluded.tiempo_total,
    entradas = excluded.entradas,
    asistido = partidas.asistido or excluded.asistido,
    pisos = greatest(partidas.pisos, excluded.pisos),
    actualizada = now();

  for l in select value from jsonb_array_elements(coalesce(p->'levels', '[]'::jsonb)) loop
    continue when jsonb_typeof(l) <> 'object' or coalesce((l->>'n')::int, 0) not between 1 and v_max;
    insert into niveles (partida_id, capitulo, tiempo, caidas, drones, reinicios, pluma, completado, piso_max, muertes, tiempo_subida)
    values (
      v_id, (l->>'n')::int,
      least(greatest(coalesce((l->>'time')::numeric, 0), 0), 99999),
      least(greatest(coalesce((l->>'falls')::int, 0), 0), 9999),
      least(greatest(coalesce((l->>'kills')::int, 0), 0), 999),
      least(greatest(coalesce((l->>'restarts')::int, 0), 0), 999),
      coalesce((l->>'feather')::boolean, false),
      coalesce((l->>'done')::boolean, false),
      least(greatest(coalesce((l->>'best')::int, 0), 0), 40),
      coalesce((select jsonb_agg(e) from (select e from jsonb_array_elements(case when jsonb_typeof(l->'deaths') = 'array' then l->'deaths' else '[]'::jsonb end) e limit 80) t), '[]'::jsonb),
      case when jsonb_typeof(l->'upTime') = 'number' then least(greatest((l->>'upTime')::numeric, 0), 99999) end
    )
    on conflict (partida_id, capitulo) do update set
      tiempo = excluded.tiempo, caidas = excluded.caidas, drones = excluded.drones, reinicios = excluded.reinicios,
      pluma = niveles.pluma or excluded.pluma, completado = niveles.completado or excluded.completado,
      piso_max = greatest(niveles.piso_max, excluded.piso_max), muertes = excluded.muertes,
      tiempo_subida = coalesce(excluded.tiempo_subida, niveles.tiempo_subida);
  end loop;

  s := p->'survey';
  if jsonb_typeof(s) = 'object' then
    insert into encuestas (partida_id, diversion, dificultad, favorito, claridad, emocion, comentario)
    values (
      v_id, (s->>'fun')::smallint, (s->>'difficulty')::smallint,
      case when (s->>'favorite')::int between 0 and v_max - 1 then (s->>'favorite')::smallint end,
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
      'id', p.id, 'v', p.version, 'assist', p.asistido, 'mode', case when p.modo = 'infinito' then 'endless' else 'story' end, 'floors', p.pisos, 'nick', p.nombre, 'device', p.dispositivo, 'combat', p.golpe,
      'completed', p.completados, 'totalTime', p.tiempo_total,
      'startedAt', p.iniciada, 'updatedAt', p.actualizada,
      'levels', coalesce((
        select jsonb_agg(jsonb_build_object(
          'n', n.capitulo, 'time', n.tiempo, 'falls', n.caidas, 'kills', n.drones, 'restarts', n.reinicios,
          'feather', n.pluma, 'done', n.completado, 'best', n.piso_max, 'deaths', n.muertes, 'upTime', n.tiempo_subida) order by n.capitulo)
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

-- Se vuelven a crear porque en la versión 2 cambian sus columnas
drop view if exists analisis.caidas_por_lugar;
drop view if exists analisis.caidas;
drop view if exists analisis.records;
drop view if exists analisis.resumen_capitulos;
drop view if exists analisis.encuesta;
drop view if exists analisis.antes_despues;
drop view if exists analisis.infinito;

create view analisis.records as
  select version, row_number() over (partition by version order by tiempo_total) as lugar, nombre, tiempo_total,
         (select sum(caidas) from public.niveles n where n.partida_id = p.id) as caidas,
         (select count(*) filter (where pluma) from public.niveles n where n.partida_id = p.id) as plumas,
         asistido, actualizada
  from public.partidas p
  where completados = (case when version = 2 then 7 else 3 end) and nombre is not null and modo = 'historia'
  order by version, tiempo_total;

create view analisis.resumen_capitulos as
  select p.version, n.capitulo,
         count(*) as partidas,
         count(*) filter (where n.completado) as completadas,
         round(100.0 * count(*) filter (where n.completado) / nullif(count(*), 0), 1) as pct_completado,
         round((percentile_cont(.5) within group (order by n.tiempo) filter (where n.completado))::numeric, 1) as tiempo_mediano_s,
         round((percentile_cont(.5) within group (order by n.tiempo_subida) filter (where n.completado))::numeric, 1) as subida_mediana_s,
         round(avg(n.caidas), 2) as caidas_promedio,
         round(avg(n.reinicios), 2) as reinicios_promedio,
         round(100.0 * count(*) filter (where n.pluma) / nullif(count(*) filter (where n.completado), 0), 1) as pct_pluma,
         round(avg(n.drones), 2) as drones_promedio
  from public.niveles n join public.partidas p on p.id = n.partida_id
  group by p.version, n.capitulo order by p.version, n.capitulo;

create view analisis.caidas as
  select p.version, n.partida_id, n.capitulo, (m->>0)::numeric as piso, (m->>1)::numeric as columna, m->>2 as causa,
         coalesce(m->>3, '') = 'd' as en_bajada
  from public.niveles n join public.partidas p on p.id = n.partida_id cross join lateral jsonb_array_elements(n.muertes) m;

create view analisis.caidas_por_lugar as
  select version, capitulo, round(piso)::int as piso, (round(columna * 2) / 2)::numeric(3,1) as columna, causa, count(*) as caidas
  from analisis.caidas group by 1, 2, 3, 4, 5 order by caidas desc;

create view analisis.encuesta as
  select p.version, p.nombre, e.diversion, e.claridad,
         (array['Muy fácil','Fácil','Justa','Difícil','Muy difícil'])[e.dificultad + 1] as dificultad,
         case when p.version = 2
           then (array['Torre del parque','Vivero abandonado','Antena de Entregas Ya!','Almacén de Entregas Ya!','Cámara fría','Centro de datos','Central de Entregas Ya!'])[e.favorito + 1]
           else (array['Torre del parque','Vivero abandonado','Antena de Entregas Ya!'])[e.favorito + 1] end as capitulo_favorito,
         (array['Curiosidad','Tensión','Satisfacción','Frustración','Aburrimiento'])[e.emocion + 1] as emocion,
         e.comentario, e.creada
  from public.encuestas e join public.partidas p on p.id = e.partida_id
  order by e.creada desc;

-- Comparación antes / después: una fila por versión
create view analisis.antes_despues as
  select p.version,
         count(*) as partidas,
         round(100.0 * count(*) filter (where p.completados = (case when p.version = 2 then 7 else 3 end)) / nullif(count(*), 0), 1) as pct_terminaron,
         round((percentile_cont(.5) within group (order by p.tiempo_total) filter (where p.completados = (case when p.version = 2 then 7 else 3 end)))::numeric, 1) as tiempo_mediano_total_s,
         round(avg(t.caidas), 2) as muertes_por_partida,
         round(avg(t.drones), 2) as drones_golpeados_por_partida,
         round(avg(e.diversion), 2) as diversion, round(avg(e.claridad), 2) as claridad
  from public.partidas p
  left join lateral (select sum(n.caidas) as caidas, sum(n.drones) as drones from public.niveles n where n.partida_id = p.id) t on true
  left join public.encuestas e on e.partida_id = p.id
  where p.modo = 'historia'
  group by p.version order by p.version;

-- Tablero del modo infinito: el mejor intento de cada nombre, más pisos primero
create view analisis.infinito as
  select row_number() over (order by pisos desc, tiempo_total) as lugar, nombre, pisos, tiempo_total, asistido, actualizada
  from (select distinct on (lower(nombre)) * from public.partidas where modo = 'infinito' and nombre is not null order by lower(nombre), pisos desc, tiempo_total) mejores
  order by pisos desc, tiempo_total;
