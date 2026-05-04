import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual env loading
const envPath = 'C:/Users/kiron/OneDrive/Desktop/professor-outreach/.env.local';
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) envVars[key.trim()] = value.trim();
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const MAJORS = [
  { name: "Artificial Intelligence", category: "Computer Science" },
  { name: "Computer Science", category: "Computer Science" },
  { name: "Data Science", category: "Computer Science" },
  { name: "Machine Learning", category: "Computer Science" },
  { name: "Software Engineering", category: "Engineering" },
  { name: "Electrical Engineering", category: "Engineering" },
  { name: "Mechanical Engineering", category: "Engineering" },
  { name: "Civil Engineering", category: "Engineering" },
  { name: "Chemical Engineering", category: "Engineering" },
  { name: "Biology", category: "Science" },
  { name: "Chemistry", category: "Science" },
  { name: "Physics", category: "Science" },
  { name: "Mathematics", category: "Science" },
  { name: "Biotechnology", category: "Science" },
  { name: "Environmental Science", category: "Science" },
  { name: "Economics", category: "Social Science" },
  { name: "Psychology", category: "Social Science" },
  { name: "Sociology", category: "Social Science" },
  { name: "Political Science", category: "Social Science" },
  { name: "History", category: "Humanities" },
  { name: "English Literature", category: "Humanities" },
  { name: "Philosophy", category: "Humanities" },
  { name: "Art History", category: "Humanities" },
  { name: "Business Administration", category: "Business" },
  { name: "Finance", category: "Business" },
  { name: "Marketing", category: "Business" },
  { name: "Accounting", category: "Business" },
  { name: "International Relations", category: "Social Science" },
  { name: "Neuroscience", category: "Science" },
  { name: "Public Health", category: "Medical" },
  { name: "Nursing", category: "Medical" },
  { name: "Pre-Med", category: "Medical" },
  { name: "Architecture", category: "Arts" },
  { name: "Graphic Design", category: "Arts" },
  { name: "Music", category: "Arts" },
  { name: "Film & Media", category: "Arts" },
];

async function seedMajors() {
  console.log(`Seeding ${MAJORS.length} majors...`);
  const { error } = await supabase
    .from('majors')
    .upsert(MAJORS, { onConflict: 'name' });

  if (error) {
    console.error('Error seeding majors:', error.message);
  } else {
    console.log('Majors seeded successfully.');
  }
}

seedMajors();
