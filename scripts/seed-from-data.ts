import fs from 'fs';
import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";

const envContent = fs.readFileSync('C:\\Users\\kiron\\OneDrive\\Desktop\\professor-outreach\\.env.local', 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = match[2];
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY!;
const GROQ_API_KEY = env.GROQ_API_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const groqClient = new Groq({ apiKey: GROQ_API_KEY });

async function getFirstUserId() {
  const { data, error } = await supabase.from('profiles').select('user_id').limit(1);
  if (error || !data || data.length === 0) {
    console.log("Error getting user or no users found.");
    process.exit(1);
  }
  return data[0].user_id;
}

async function parseBatchWithGroq(lines: string[]) {
  const prompt = `Parse the following lines into a JSON array of objects. 
Each line contains a University, Professor Name, Research Areas, and a Website URL. 
Some words are squished together, like "University of PittsburghLiang ZhanComputational neuroimaging". 
Please carefully separate them. 

Output format MUST be EXACTLY a valid JSON array of objects:
[
  {
    "university": "University Name",
    "name": "Professor Name",
    "research_areas": ["Area 1", "Area 2"],
    "website": "URL"
  }
]
Do not output anything else, no markdown formatting.

Lines to parse:
${lines.join("\n")}
`;

  const completion = await groqClient.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
  });

  const raw = completion.choices[0].message.content || "";
  const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    return JSON.parse(clean);
  } catch (e) {
    console.error("Failed to parse JSON for batch:");
    console.log(clean);
    return [];
  }
}

async function main() {
  const USER_ID = await getFirstUserId();
  console.log("Using USER_ID:", USER_ID);

  const data = fs.readFileSync('C:\\Users\\kiron\\OneDrive\\Desktop\\professor-outreach\\data.txt', 'utf-8');
  let lines = data.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  console.log(`Total lines: ${lines.length}`);

  const BATCH_SIZE = 20;
  let totalAdded = 0;

  for (let i = 0; i < lines.length; i += BATCH_SIZE) {
    const batch = lines.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${i / BATCH_SIZE + 1} / ${Math.ceil(lines.length / BATCH_SIZE)}...`);
    
    const parsed = await parseBatchWithGroq(batch);
    
    for (const prof of parsed) {
      const profileLinks: any = {};
      if (prof.website) {
        profileLinks["Homepage"] = prof.website;
      }
      
      const { data: researcher, error } = await supabase.from("researchers").insert({
        user_id: USER_ID,
        name: prof.name || "Unknown",
        university: prof.university || "Unknown",
        bio: `${prof.name} is a researcher at ${prof.university}. Research areas include ${(prof.research_areas || []).join(", ")}.`,
        match_score: Math.round(75 + Math.random() * 20),
        status: "unsorted",
        research_areas: prof.research_areas || [],
        profile_links: profileLinks,
        why_match: `Research strongly aligns with areas: ${(prof.research_areas || []).join(", ")}.`,
        email_status: "not_emailed",
      }).select().single();

      if (error) {
        console.log(`  Error adding ${prof.name}: ${error.message}`);
      } else {
        totalAdded++;
        console.log(`  Added: ${prof.name} (${prof.university})`);
      }
    }
  }

  console.log(`Done! Added ${totalAdded} researchers.`);
}

main().catch(console.error);
