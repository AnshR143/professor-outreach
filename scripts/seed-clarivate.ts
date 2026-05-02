import fs from 'fs';
import { createClient } from "@supabase/supabase-js";

// 1. Load environment variables
const envContent = fs.readFileSync('C:\\Users\\kiron\\OneDrive\\Desktop\\professor-outreach\\.env.local', 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = match[2];
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function getFirstUserId() {
  const { data, error } = await supabase.from('profiles').select('user_id').limit(1);
  if (error || !data || data.length === 0) {
    console.log("Error getting user or no users found.");
    process.exit(1);
  }
  return data[0].user_id;
}

async function main() {
  const USER_ID = await getFirstUserId();
  console.log("Using USER_ID:", USER_ID);

  // 2. Read the text file
  const filePath = 'C:\\Users\\kiron\\OneDrive\\Desktop\\professor-outreach\\clarivate.txt';
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    console.log("Please create this file and paste your list of professors into it.");
    return;
  }

  const rawData = fs.readFileSync(filePath, 'utf-8');
  // Unescape literal \n and \t that might have been saved if copied from JSON logs
  const data = rawData.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
  let lines = data.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  let totalAdded = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip pagination and headers
    if (line.match(/^\d+$/) || line.includes("Next »") || line.includes("« Previous") || line.includes("Full Name\tCategory")) {
      continue;
    }

    // Process lines that contain tabs or commas (the actual data lines)
    if (line.includes('\t') || line.includes(',')) {
      let parts: string[] = [];
      
      if (line.includes('\t')) {
        parts = line.split('\t');
      } else {
        // CSV parsing respecting quotes
        parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(s => s.replace(/^"|"$/g, '').trim());
      }
      
      // If we don't have enough parts, skip
      if (parts.length < 2) continue;

      const rawName = parts[0];
      let category = parts[1];
      let affiliation = parts[2] || "Unknown";
      
      // Handle "Name \t University \t Category" format instead of "Name \t Category \t University"
      const lowerP1 = (parts[1] || "").toLowerCase();
      if (lowerP1.includes('college') || lowerP1.includes('university') || lowerP1.includes('univ') || lowerP1.includes('institute') || lowerP1.includes('school')) {
        affiliation = parts[1];
        category = parts[2] || "General Research";
      }

      // Format name from "Last, First" to "First Last"
      let formattedName = rawName;
      if (rawName.includes(',')) {
        const nameParts = rawName.split(',').map(s => s.trim());
        formattedName = `${nameParts[1]} ${nameParts[0]}`;
      }

      const { data: researcher, error } = await supabase.from("researchers").insert({
        user_id: USER_ID,
        name: formattedName,
        university: affiliation || "Unknown",
        bio: `${formattedName} is a researcher at ${affiliation || "Unknown"}. Research category: ${category}.`,
        match_score: Math.round(70 + Math.random() * 25), // Random score between 70-95
        status: "unsorted",
        research_areas: [category],
        why_match: `Research strongly aligns with ${category}.`,
        email_status: "not_emailed",
      }).select().single();

      if (error) {
        console.log(`  Error adding ${formattedName}: ${error.message}`);
      } else {
        totalAdded++;
        console.log(`  Added: ${formattedName} (${affiliation})`);
      }
    }
  }

  console.log(`\nDone! Successfully added ${totalAdded} researchers to your database.`);
}

main().catch(console.error);
