const { createClient } = require('@supabase/supabase-js');

const url = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
const anonKey = 'sb_publishable_Rw-VlOLSWfzsycF4JMFUvg_vNlaMwVd';

const supabase = createClient(url, anonKey, { auth: { persistSession: false } });

(async () => {
  const { data, error, count } = await supabase
    .from('teams')
    .select('id,name,sport,league', { count: 'exact' })
    .order('name')
    .limit(10);

  if (error) {
    console.error('Anon query error:', error);
    return;
  }
  console.log('Anon query returned:', data?.length || 0, 'rows');
  if (data?.length) console.log('Sample:', JSON.stringify(data.slice(0, 3), null, 2));
  console.log('Count:', count);
})();
