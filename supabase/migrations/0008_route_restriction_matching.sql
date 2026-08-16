-- Montague: geospatial matching between a decoded route path and stored
-- restrictions. The route path is supplied as a JSON array of [lng, lat]
-- points (decoded from the Google polyline server-side). Distance buffer is
-- configurable per-call so it can track ROUTE_RESTRICTION_BUFFER_METRES.

create or replace function restrictions_near_route(
  route_points jsonb,
  buffer_metres integer default 30
)
returns setof road_restrictions
language sql
stable
security definer
set search_path = public
as $$
  with pts as (
    select
      ord,
      ST_MakePoint(
        (pt ->> 0)::double precision,
        (pt ->> 1)::double precision
      ) as geom
    from jsonb_array_elements(route_points) with ordinality as t(pt, ord)
  ),
  route_line as (
    select ST_SetSRID(ST_MakeLine(array_agg(geom order by ord)), 4326)::geography as line
    from pts
  )
  select r.*
  from road_restrictions r, route_line
  where ST_DWithin(r.geom, route_line.line, buffer_metres);
$$;
