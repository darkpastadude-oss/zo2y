import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gfkhjbztayjyojsgdpgk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Rw-VlOLSWfzsycF4JMFUvg_vNlaMwVd';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
    try {
        console.log('Fetching user profiles...');
        const { data: profiles, error: err } = await supabase
            .from('user_profiles')
            .select('*');
        if (err) throw err;

        console.log(`Found ${profiles?.length || 0} user profiles.`);
        for (const p of (profiles || [])) {
            console.log(`\n--- Profile: ${p.username} (${p.id}) ---`);
            console.log(`Bio: ${p.bio || 'none'}`);
            console.log(`Location: ${p.location || 'none'}`);
            
            // Fetch movie favorites
            const { data: movieItems } = await supabase
                .from('movie_list_items')
                .select('*')
                .eq('user_id', p.id);
            console.log(`Movie list items:`, movieItems);

            // Fetch TV favorites
            const { data: tvItems } = await supabase
                .from('tv_list_items')
                .select('*')
                .eq('user_id', p.id);
            console.log(`TV list items:`, tvItems);

            // Fetch profile showcase settings
            const { data: showcase } = await supabase
                .from('profile_showcase')
                .select('*')
                .eq('user_id', p.id);
            console.log(`Profile showcase:`, showcase);
        }
    } catch (e) {
        console.error('Error in run:', e);
    }
}

run();
