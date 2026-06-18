const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Rw-VlOLSWfzsycF4JMFUvg_vNlaMwVd';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log('Checking if "title" exists on movie_reviews...');
  const { error: colError } = await supabase
    .from('movie_reviews')
    .select('title')
    .limit(1);
    
  if (colError) {
    console.log('  ❌ Column "title" does not exist on movie_reviews:', colError.message);
  } else {
    console.log('  ✅ Column "title" EXISTS on movie_reviews!');
  }

  console.log('Testing review insert with media_type and title...');
  const { data, error } = await supabase
    .from('movie_reviews')
    .insert({
      media_id: 550, // Fight Club tmdb id
      user_id: 'a574a616-87f1-4bc7-83bc-355af4bda301', // existing user jnn
      rating: 5,
      review_text: 'Fabulous test review with media_type and title!',
      media_type: 'movie',
      title: 'Fight Club'
    });
    
  if (error) {
    console.error('Insert failed:', error.message);
  } else {
    console.log('Insert succeeded!', data);
  }
}

run();
