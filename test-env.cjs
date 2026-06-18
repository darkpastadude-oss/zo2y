console.log('Environment variables containing SUPABASE or KEY:');
Object.keys(process.env).forEach(key => {
  if (key.includes('SUPABASE') || key.includes('KEY')) {
    console.log(`  ${key}: ${process.env[key].slice(0, 10)}...`);
  }
});
