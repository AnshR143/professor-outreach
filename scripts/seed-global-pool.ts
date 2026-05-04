import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
const envPath = path.join('C:/Users/kiron/OneDrive/Desktop/professor-outreach', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) envVars[key.trim()] = value.trim();
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CLARIVATE_PATH = 'C:/Users/kiron/OneDrive/Desktop/professor-outreach/clarivate.txt';

function parseClarivate() {
  if (!fs.existsSync(CLARIVATE_PATH)) {
    console.error('Clarivate file not found at:', CLARIVATE_PATH);
    return [];
  }
  const content = fs.readFileSync(CLARIVATE_PATH, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  const dataLines = lines.slice(1);
  
  return dataLines.map(line => {
    const parts = line.split('\t');
    const name = parts[0]?.trim() || '';
    const university = parts[1]?.trim() || '';
    const field = parts[2]?.trim() || '';
    
    return {
      name,
      university,
      research_areas: field ? [field] : [],
      source: 'clarivate'
    };
  });
}

async function seedGlobalPool() {
  const profs = parseClarivate();
  console.log(`Parsed ${profs.length} professors from clarivate.txt`);

  // Batch insert to avoid rate limits/timeouts
  const batchSize = 100;
  for (let i = 0; i < profs.length; i += batchSize) {
    const batch = profs.slice(i, i + batchSize);
    const { error } = await supabase
      .from('global_professors')
      .upsert(batch, { onConflict: 'name,university' });

    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error.message);
    } else {
      console.log(`Inserted batch ${i / batchSize + 1} (${batch.length} records)`);
    }
  }

  console.log('Global pool seeding completed.');
}

seedGlobalPool().catch(console.error);
