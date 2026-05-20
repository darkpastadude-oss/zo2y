-- Deduplicate national football teams from the teams table.
-- Keeps one row per country, deletes the rest.
-- Also sets missing sport/league fields on national team rows.
--
-- Run in Supabase SQL editor.

-- Step 1: Delete exact duplicate rows (same name, same sport, same league)
-- Keeps the one with the most recent updated_at
delete from public.teams t
using (
  select id
  from (
    select id,
      row_number() over (
        partition by lower(trim(name)), lower(trim(coalesce(sport,''))), lower(trim(coalesce(league,'')))
        order by updated_at desc nulls last, id asc
      ) as rn
    from public.teams
  ) dupes
  where rn > 1
) d on t.id = d.id;

-- Step 2: Delete near-duplicate national team rows (same country name resolved by common patterns)
-- Handles cases like "Brazil" and "Brazil National Team" being duplicates
delete from public.teams t
using (
  with resolved as (
    select
      id, name, sport, league, updated_at,
      case
        when lower(name) in (
          'algeria','argentina','australia','belgium','brazil','cameroon','canada','chile',
          'colombia','croatia','czech republic','denmark','ecuador','egypt','england',
          'france','germany','ghana','iran','iraq','italy','japan','mexico','morocco',
          'netherlands','nigeria','norway','peru','poland','portugal','qatar',
          'republic of ireland','romania','russia','saudi arabia','scotland','senegal',
          'serbia','south africa','south korea','spain','sweden','switzerland','tunisia',
          'turkey','ukraine','united states','uruguay','uae','usa','wales'
        ) then lower(name)
        when lower(name) like '%brazil%' then 'brazil'
        when lower(name) like '%argentina%' then 'argentina'
        when lower(name) like '%germany%' or lower(name) like '%german%' then 'germany'
        when lower(name) like '%france%' or lower(name) like '%french%' then 'france'
        when lower(name) like '%spain%' or lower(name) like '%spanish%' then 'spain'
        when lower(name) like '%england%' or lower(name) like '%english%' then 'england'
        when lower(name) like '%italy%' or lower(name) like '%italian%' then 'italy'
        when lower(name) like '%portugal%' or lower(name) like '%portuguese%' then 'portugal'
        when lower(name) like '%netherland%' or lower(name) like '%dutch%' or lower(name) like '%holland%' then 'netherlands'
        when lower(name) like '%belgium%' or lower(name) like '%belgian%' then 'belgium'
        when lower(name) like '%croatia%' or lower(name) like '%croatian%' then 'croatia'
        when lower(name) like '%mexico%' or lower(name) like '%mexican%' then 'mexico'
        when lower(name) like '%japan%' then 'japan'
        when lower(name) like '%korea%' then 'south korea'
        when lower(name) like '%australia%' then 'australia'
        when lower(name) like '%united states%' or lower(name) like '%usa%' or lower(name) like '%america%' then 'united states'
        when lower(name) like '%canada%' then 'canada'
        when lower(name) like '%morocco%' then 'morocco'
        when lower(name) like '%senegal%' then 'senegal'
        when lower(name) like '%nigeria%' then 'nigeria'
        when lower(name) like '%egypt%' then 'egypt'
        when lower(name) like '%tunisia%' then 'tunisia'
        when lower(name) like '%algeria%' then 'algeria'
        when lower(name) like '%cameroon%' then 'cameroon'
        when lower(name) like '%ghana%' then 'ghana'
        when lower(name) like '%ivory%' or lower(name) like '%cote%' then 'ivory coast'
        when lower(name) like '%south africa%' then 'south africa'
        when lower(name) like '%uruguay%' then 'uruguay'
        when lower(name) like '%colombia%' then 'colombia'
        when lower(name) like '%chile%' then 'chile'
        when lower(name) like '%peru%' then 'peru'
        when lower(name) like '%ecuador%' then 'ecuador'
        when lower(name) like '%saudi%' then 'saudi arabia'
        when lower(name) like '%iran%' then 'iran'
        when lower(name) like '%qatar%' then 'qatar'
        when lower(name) like '%switzerland%' or lower(name) like '%swiss%' then 'switzerland'
        when lower(name) like '%sweden%' or lower(name) like '%swedish%' then 'sweden'
        when lower(name) like '%poland%' or lower(name) like '%polish%' then 'poland'
        when lower(name) like '%denmark%' or lower(name) like '%danish%' then 'denmark'
        when lower(name) like '%norway%' or lower(name) like '%norwegian%' then 'norway'
        when lower(name) like '%austria%' or lower(name) like '%austrian%' then 'austria'
        when lower(name) like '%hungary%' or lower(name) like '%hungarian%' then 'hungary'
        when lower(name) like '%serbia%' or lower(name) like '%serbian%' then 'serbia'
        when lower(name) like '%turkey%' or lower(name) like '%turkish%' or lower(name) like '%turkiye%' then 'turkey'
        when lower(name) like '%greece%' or lower(name) like '%greek%' then 'greece'
        when lower(name) like '%russia%' or lower(name) like '%russian%' then 'russia'
        when lower(name) like '%ukraine%' then 'ukraine'
        when lower(name) like '%wales%' or lower(name) like '%welsh%' then 'wales'
        when lower(name) like '%scotland%' or lower(name) like '%scottish%' then 'scotland'
        when lower(name) like '%paraguay%' then 'paraguay'
        when lower(name) like '%bolivia%' then 'bolivia'
        when lower(name) like '%venezuela%' then 'venezuela'
        when lower(name) like '%costa rica%' then 'costa rica'
        when lower(name) like '%panama%' then 'panama'
        when lower(name) like '%jamaica%' then 'jamaica'
        when lower(name) like '%china%' then 'china'
        when lower(name) like '%india%' then 'india'
        when lower(name) like '%indonesia%' then 'indonesia'
        when lower(name) like '%thailand%' then 'thailand'
        when lower(name) like '%vietnam%' then 'vietnam'
        when lower(name) like '%malaysia%' then 'malaysia'
        when lower(name) like '%philippines%' then 'philippines'
        when lower(name) like '%iraq%' then 'iraq'
        when lower(name) like '%jordan%' then 'jordan'
        when lower(name) like '%oman%' then 'oman'
        when lower(name) like '%bahrain%' then 'bahrain'
        when lower(name) like '%kuwait%' then 'kuwait'
        when lower(name) like '%lebanon%' then 'lebanon'
        when lower(name) like '%syria%' then 'syria'
        when lower(name) like '%palestine%' then 'palestine'
        when lower(name) like '%uzbekistan%' then 'uzbekistan'
        when lower(name) like '%kazakhstan%' then 'kazakhstan'
        when lower(name) like '%new zealand%' then 'new zealand'
        when lower(name) like '%czech%' then 'czech republic'
        when lower(name) like '%romania%' then 'romania'
        when lower(name) like '%uae%' or lower(name) like '%united arab emirates%' then 'uae'
        when lower(name) like '%congo%' then 'dr congo'
        when lower(name) like '%ireland%' then 'republic of ireland'
        else lower(regexp_replace(name, '[^a-zA-Z0-9]+', ' ', 'g'))
      end as country_key
    from public.teams
    where
      lower(coalesce(league,'')) = 'national team'
      or lower(name) in (
        'algeria','argentina','australia','belgium','brazil','cameroon','canada','chile',
        'colombia','croatia','czech republic','denmark','ecuador','egypt','england',
        'france','germany','ghana','iran','iraq','italy','japan','mexico','morocco',
        'netherlands','nigeria','norway','peru','poland','portugal','qatar',
        'republic of ireland','romania','russia','saudi arabia','scotland','senegal',
        'serbia','south africa','south korea','spain','sweden','switzerland','tunisia',
        'turkey','ukraine','united states','uruguay','uae','usa','wales'
      )
      or lower(name) like any(array[
        '%brazil%','%argentina%','%germany%','%france%','%spain%','%england%','%italy%',
        '%portugal%','%netherland%','%belgium%','%croatia%','%mexico%','%japan%','%korea%',
        '%australia%','%united states%','%canada%','%morocco%','%senegal%','%nigeria%',
        '%egypt%','%tunisia%','%algeria%','%cameroon%','%ghana%','%ivory%','%south africa%',
        '%uruguay%','%colombia%','%chile%','%peru%','%ecuador%','%saudi%','%iran%','%qatar%',
        '%switzerland%','%sweden%','%poland%','%denmark%','%norway%','%austria%','%hungary%',
        '%serbia%','%turkey%','%greece%','%russia%','%ukraine%','%wales%','%scotland%',
        '%paraguay%','%bolivia%','%venezuela%','%costa rica%','%panama%','%jamaica%',
        '%china%','%india%','%indonesia%','%thailand%','%vietnam%','%malaysia%','%philippines%',
        '%iraq%','%jordan%','%oman%','%bahrain%','%kuwait%','%lebanon%','%syria%','%palestine%',
        '%uzbekistan%','%kazakhstan%','%new zealand%','%czech%','%romania%','%usa%','%america%',
        '%uae%','%congo%','%ireland%'
      ])
  ),
  ranked as (
    select id, country_key,
      row_number() over (
        partition by country_key
        order by
          case when logo_url is not null then 1 else 0 end +
          case when banner_url is not null then 1 else 0 end +
          case when stadium is not null then 1 else 0 end +
          case when fanart_url is not null then 1 else 0 end desc,
          updated_at desc nulls last,
          name asc
      ) as rn
    from resolved
    where country_key is not null
  )
  select id from ranked where rn > 1
) d on t.id = d.id;

-- Step 3: Set missing sport/league on remaining national team rows
update public.teams
set
  sport = case when sport is null or sport = '' then 'Football' else sport end,
  league = case when league is null or league = '' then 'National Team' else league end,
  updated_at = now()
where
  lower(coalesce(league,'')) = 'national team'
  or lower(name) in (
    'algeria','argentina','australia','belgium','brazil','cameroon','canada','chile',
    'colombia','croatia','czech republic','denmark','ecuador','egypt','england',
    'france','germany','ghana','iran','iraq','italy','japan','mexico','morocco',
    'netherlands','nigeria','norway','peru','poland','portugal','qatar',
    'republic of ireland','romania','russia','saudi arabia','scotland','senegal',
    'serbia','south africa','south korea','spain','sweden','switzerland','tunisia',
    'turkey','ukraine','united states','uruguay','uae','usa','wales'
  );
