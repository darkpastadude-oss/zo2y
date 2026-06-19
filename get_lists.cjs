const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Rw-VlOLSWfzsycF4JMFUvg_vNlaMwVd';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const { data, error } = await supabase
    .from('user_lists')
    .select('id, type, name, category, user_id')
    .eq('user_id', 'a574a616-87f1-4bc7-83bc-355af4bda301')
    .eq('category', 'movie');
  
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}

run();
