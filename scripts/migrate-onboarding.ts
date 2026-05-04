import fs from 'fs';
import { createClient } from "@supabase/supabase-js";

// Manual env loading
const envPath = 'C:/Users/kiron/OneDrive/Desktop/professor-outreach/.env.local';
const envContent = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = match[2];
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log("Applying onboarding schema changes...");
  
  const sql = `
    -- Update profiles table
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birthday DATE;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS majors TEXT[] DEFAULT '{}';
    
    -- Create majors table
    CREATE TABLE IF NOT EXISTS majors (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      category TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- RLS for majors
    ALTER TABLE majors ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Anyone can read majors" ON majors;
    CREATE POLICY "Anyone can read majors" ON majors FOR SELECT USING (true);
  `;

  const { error } = await supabase.rpc('exec_sql', { sql });

  if (error) {
    console.error("Error applying migration:", error.message);
  } else {
    console.log("Migration applied successfully.");
  }
}

main().catch(console.error);
