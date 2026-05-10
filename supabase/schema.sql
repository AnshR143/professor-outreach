-- ============================================================
-- PROFESSOR OUTREACH PLATFORM — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  name TEXT, -- Keeping for compatibility
  birthday DATE,
  major TEXT, -- Single major field
  majors TEXT[] NOT NULL DEFAULT '{}', -- Multiple majors
  interests TEXT[] NOT NULL DEFAULT '{}',
  goals TEXT[] NOT NULL DEFAULT '{}',
  academic_level TEXT,
  institution TEXT,
  bio TEXT,
  resume_url TEXT,
  resume_text TEXT,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- MAJORS (Global list for search)
CREATE TABLE IF NOT EXISTS majors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RESEARCHERS
CREATE TABLE IF NOT EXISTS researchers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  university TEXT NOT NULL DEFAULT '',
  department TEXT,
  bio TEXT,
  match_score INTEGER NOT NULL DEFAULT 70,
  status TEXT NOT NULL DEFAULT 'unsorted' CHECK (status IN ('unsorted','awaiting','accepted','rejected')),
  research_areas TEXT[] NOT NULL DEFAULT '{}',
  profile_links JSONB NOT NULL DEFAULT '{}',
  semantic_scholar_id TEXT,
  why_match TEXT,
  notes TEXT,
  is_saved BOOLEAN NOT NULL DEFAULT FALSE,
  email_status TEXT NOT NULL DEFAULT 'not_emailed' CHECK (email_status IN ('not_emailed','emailed','replied','accepted','rejected')),
  found_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PAPERS
CREATE TABLE IF NOT EXISTS papers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  researcher_id UUID REFERENCES researchers(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  abstract TEXT,
  url TEXT,
  published_date TEXT,
  relevance_score REAL,
  source TEXT NOT NULL DEFAULT 'semantic_scholar',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- EMAILS
CREATE TABLE IF NOT EXISTS emails (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  researcher_id UUID REFERENCES researchers(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  template_id UUID,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','opened','replied')),
  tone TEXT NOT NULL DEFAULT 'formal',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TEMPLATES
CREATE TABLE IF NOT EXISTS templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject_line TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('general','personal')),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ACTIVITIES
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  researcher_id UUID REFERENCES researchers(id) ON DELETE SET NULL,
  researcher_name TEXT,
  university TEXT,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GLOBAL PROFESSORS (Global pool for discovery)
CREATE TABLE IF NOT EXISTS global_professors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  university TEXT NOT NULL DEFAULT '',
  research_areas TEXT[] NOT NULL DEFAULT '{}',
  bio TEXT,
  profile_url TEXT,
  source TEXT NOT NULL DEFAULT 'api',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, university)
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE researchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_professors ENABLE ROW LEVEL SECURITY;

-- Policies: users can only see their own data
CREATE POLICY "Users can manage own profile" ON profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own researchers" ON researchers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own papers" ON papers FOR ALL USING (
  researcher_id IN (SELECT id FROM researchers WHERE user_id = auth.uid())
);
CREATE POLICY "Users can manage own emails" ON emails FOR ALL USING (auth.uid() = user_id);
-- Allow users to read all templates (including global ones where user_id IS NULL)
CREATE POLICY "Users can read templates" ON templates FOR SELECT USING (
  user_id IS NULL OR auth.uid() = user_id
);
-- Only allow insert/update/delete on user-owned templates (not global ones)
CREATE POLICY "Users can manage own templates" ON templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates" ON templates FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own activities" ON activities FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can read global professors" ON global_professors FOR SELECT USING (true);
CREATE POLICY "Only service role can manage global professors" ON global_professors FOR ALL USING (true); -- Usually restricted to service role in practice

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_researchers_user_id ON researchers(user_id);
CREATE INDEX IF NOT EXISTS idx_researchers_status ON researchers(status);
CREATE INDEX IF NOT EXISTS idx_papers_researcher_id ON papers(researcher_id);
CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_researcher_id ON emails(researcher_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_global_professors_name ON global_professors(name);
CREATE INDEX IF NOT EXISTS idx_global_professors_university ON global_professors(university);

-- Seed general templates
INSERT INTO templates (user_id, name, subject_line, body, description, type, is_default) VALUES
(NULL, 'Research Internship Outreach (Advanced)', 'Research Internship Opportunity',
'Hi Professor [Last Name],

My name is [Your Name], and I’m a [year/major] student at [School]. I recently came across your work on [topic/project], and I found it really interesting.

I’m reaching out to ask if there might be any opportunities to assist with research in your lab or group, either during the semester or over the summer. I’m especially interested in [specific interest].

I’d love the chance to learn more and contribute however I can. Thank you for your time, and I’d be happy to share my resume or additional information.

Best,
[Your Name]',
'Personalized outreach for research positions in labs.', 'general', TRUE),

(NULL, 'Paper Collaboration Request', 'Interest in Collaborating on Research',
'Hi [Name],

I hope you’re doing well. My name is [Your Name], and I’ve been following your work on [topic]. I really enjoyed reading your recent paper/project about [specific detail].

I’m reaching out because I’d love the opportunity to collaborate or contribute to future work in this area. I have experience with [skill/topic], and I’m eager to learn more.

If you’re open to it, I’d appreciate the chance to connect further.

Best,
[Your Name]',
'Propose a collaboration after reading a researcher''s paper.', 'general', TRUE),

(NULL, 'Research Collaboration Inquiry', 'Research Collaboration Inquiry',
'Hello [Name],

My name is [Your Name], and I’m currently working on [brief project/topic]. I came across your work in [field/topic], and I think our interests align closely.

I wanted to reach out to see if you’d be open to discussing a possible collaboration or sharing ideas. I’d really value the chance to connect and learn from your experience.

Thank you for your time, and I look forward to hearing from you.

Best regards,
[Your Name]',
'Inquire about aligning research interests for a joint project.', 'general', TRUE),

(NULL, 'Internship Outreach', 'Inquiry Regarding Internship Opportunities',
'Hi [Name],

My name is [Your Name], and I’m a [year/major] student at [School]. I’m very interested in opportunities related to [field/company focus].

I’m reaching out to ask if there are any internship openings available, or if there’s someone you’d recommend I connect with regarding opportunities at [Company/Lab].

I’d love the chance to learn, contribute, and gain hands-on experience. Thank you for your time.

Best,
[Your Name]',
'General outreach for internship openings at companies or labs.', 'general', TRUE),

(NULL, 'Startup Internship Inquiry', 'Interested in [Company Name] - Internship Inquiry',
'Hi [Name],

I hope you’re doing well. I recently came across [Company Name] and really liked what your team is building, especially [specific feature/project].

I’m a student interested in [field], and I wanted to ask if there are any internship or part-time opportunities available. I’d be excited to contribute and learn from the team.

Thank you for your time, and I’d love to connect further if possible.

Best,
[Your Name]',
'Specific outreach for startups with a focus on their features/projects.', 'general', TRUE),

(NULL, 'Cold Outreach for Internship', 'Internship Inquiry - [Your Name]',
'Hi [Name],

My name is [Your Name], and I’m currently studying [major/field] at [School]. I’m reaching out because I’m very interested in gaining experience in [industry/field].

I admire the work your team is doing at [Company], and I’d love the opportunity to contribute as an intern if there are any openings available.

Please let me know if there’s a good way to apply or connect further.

Thank you,
[Your Name]',
'Direct cold outreach for industry experience.', 'general', TRUE),

(NULL, 'Follow-Up Email', 'Following up on [Topic]',
'Hi [Name],

I hope you’re doing well. I just wanted to follow up on my previous email regarding possible research/internship opportunities.

I’m still very interested and would really appreciate the opportunity to connect if there’s availability.

Thank you again for your time.

Best,
[Your Name]',
'Polite follow-up for previous outreach.', 'general', TRUE),

(NULL, 'Coffee Chat Request', 'Coffee Chat Request - [Your Name]',
'Hi [Name],

I hope you’re doing well. My name is [Your Name], and I’m interested in learning more about your experience in [field/company].

If you have a few minutes sometime in the next couple of weeks, I’d really appreciate the chance to chat and hear more about your journey and advice.

Thank you for your time, and I completely understand if your schedule is busy.

Best,
[Your Name]',
'Request for an informal informational interview.', 'general', TRUE);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- INTERNSHIP OUTREACH — Additional Tables
-- ============================================================

-- INTERNSHIP CONTACTS
CREATE TABLE IF NOT EXISTS internship_contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company TEXT NOT NULL,
  contact_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT '',
  department TEXT,
  email TEXT,
  linkedin_url TEXT,
  website TEXT,
  bio TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'unsorted' CHECK (status IN ('unsorted','awaiting','accepted','rejected')),
  email_status TEXT NOT NULL DEFAULT 'not_emailed' CHECK (email_status IN ('not_emailed','emailed','replied','accepted','rejected')),
  why_apply TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INTERNSHIP EMAILS
CREATE TABLE IF NOT EXISTS internship_emails (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES internship_contacts(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','opened','replied')),
  tone TEXT NOT NULL DEFAULT 'formal',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add category to activities (run once if table already exists)
ALTER TABLE activities ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'research';

-- RLS
ALTER TABLE internship_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE internship_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own internship contacts" ON internship_contacts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own internship emails" ON internship_emails FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_internship_contacts_user_id ON internship_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_internship_contacts_status ON internship_contacts(status);
CREATE INDEX IF NOT EXISTS idx_internship_emails_user_id ON internship_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_internship_emails_contact_id ON internship_emails(contact_id);
CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category);

-- ============================================================
-- ADMINISTRATIVE VIEWS
-- ============================================================

-- View to see all user info at a glance
CREATE OR REPLACE VIEW user_directory AS
SELECT 
  first_name, 
  last_name, 
  email, 
  birthday, 
  institution, 
  majors, 
  interests, 
  academic_level,
  onboarding_complete,
  created_at
FROM profiles;

-- View to see resumes linked to names
CREATE OR REPLACE VIEW resume_directory AS
SELECT 
  first_name, 
  last_name, 
  email, 
  resume_url, 
  resume_text,
  created_at as uploaded_at
FROM profiles
WHERE resume_url IS NOT NULL OR resume_text IS NOT NULL;
