import fs from 'fs';
import { getSupabaseAdminClient } from '../backend/lib/supabase-admin.js';

const env = fs.readFileSync('.dev.vars', 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if(k && v) process.env[k.trim()] = v.join('=').trim();
});

const LOGO_MAP = {
  "Torchy's Tacos": "https://images.squarespace-cdn.com/content/v1/5c1a79854eddecbb1b2e666a/1550508756911-3W711T6X1A9N6XZV6XZV/torchys-logo.png",
  "Little Caesars": "https://upload.wikimedia.org/wikipedia/en/5/57/Little_Caesars_logo.svg",
  "Buffalo Wild Wings": "https://upload.wikimedia.org/wikipedia/en/c/c5/Buffalo_Wild_Wings_logo.svg",
  "Carrabba's Italian Grill": "https://upload.wikimedia.org/wikipedia/en/2/2f/Carrabba%27s_Italian_Grill_logo.svg",
  "Chipotle": "https://upload.wikimedia.org/wikipedia/en/3/3b/Chipotle_Mexican_Grill_logo.svg",
  "Red Lobster": "https://upload.wikimedia.org/wikipedia/en/1/1b/Red_Lobster_logo.svg",
  "Popeyes": "https://upload.wikimedia.org/wikipedia/en/2/2e/Popeyes_logo_%282023%29.svg",
  "Panda Express": "https://upload.wikimedia.org/wikipedia/en/a/ad/Panda_Express_logo.svg",
  "Texas Roadhouse": "https://upload.wikimedia.org/wikipedia/en/5/58/Texas_Roadhouse_logo.svg",
  "White Castle": "https://upload.wikimedia.org/wikipedia/en/2/26/White_Castle_logo.svg",
  "Wingstop": "https://upload.wikimedia.org/wikipedia/en/9/91/Wingstop_logo.svg",
  "YO! Sushi": "https://upload.wikimedia.org/wikipedia/en/2/2d/YO%21_Sushi_logo.svg",
  "Zaxby's": "https://upload.wikimedia.org/wikipedia/en/8/87/Zaxby%27s_logo.svg",
  "Genesis": "https://upload.wikimedia.org/wikipedia/en/6/69/Genesis_Motor_logo.svg",
  "Jaguar": "https://upload.wikimedia.org/wikipedia/en/f/f6/Jaguar_Cars_logo.svg",
  "Lancia": "https://upload.wikimedia.org/wikipedia/en/2/2f/Lancia_logo_%282022%29.svg",
  "Dacia": "https://upload.wikimedia.org/wikipedia/en/4/4b/Dacia_logo.svg",
  "Mini": "https://upload.wikimedia.org/wikipedia/en/8/8a/Mini_logo_%282018%29.svg",
  "Proton": "https://upload.wikimedia.org/wikipedia/en/e/e0/Proton_logo.svg",
  "Subaru": "https://upload.wikimedia.org/wikipedia/en/1/19/Subaru_Corporation_logo.svg",
  "Volvo Cars": "https://upload.wikimedia.org/wikipedia/en/7/77/Volvo_Cars_logo.svg",
  "Tata Motors": "https://upload.wikimedia.org/wikipedia/en/b/b2/Tata_Motors_logo.svg",
  "VinFast": "https://upload.wikimedia.org/wikipedia/en/3/3d/VinFast_logo.svg",
  "Vauxhall": "https://upload.wikimedia.org/wikipedia/en/9/98/Vauxhall_Motors_logo_%282020%29.svg",
  "Tommy Hilfiger": "https://upload.wikimedia.org/wikipedia/commons/5/52/Tommy_Hilfiger_logo.svg"
};

async function fixLogos() {
  const supabase = getSupabaseAdminClient();
  const tables = ['food_brands', 'car_brands', 'fashion_brands'];
  
  for (const table of tables) {
    for (const [name, url] of Object.entries(LOGO_MAP)) {
      const { data, error } = await supabase
        .from(table)
        .update({ logo_url: url })
        .eq('name', name)
        .select();
        
      if (data && data.length > 0) {
        console.log(`Updated ${name} in ${table}`);
      }
    }
  }
  console.log('Finished updating broken logos.');
}

fixLogos();
