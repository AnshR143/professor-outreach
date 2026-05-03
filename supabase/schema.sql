-- ============================================================
-- PROFESSOR OUTREACH PLATFORM — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  institution TEXT NOT NULL DEFAULT '',
  academic_level TEXT NOT NULL DEFAULT '',
  interests TEXT[] NOT NULL DEFAULT '{}',
  goals TEXT[] NOT NULL DEFAULT '{}',
  resume_text TEXT,
  resume_url TEXT,
  ai_api_key TEXT,
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
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

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE researchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_researchers_user_id ON researchers(user_id);
CREATE INDEX IF NOT EXISTS idx_researchers_status ON researchers(status);
CREATE INDEX IF NOT EXISTS idx_papers_researcher_id ON papers(researcher_id);
CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_researcher_id ON emails(researcher_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);

-- Seed general templates
INSERT INTO templates (user_id, name, subject_line, body, description, type, is_default) VALUES
(NULL, 'Research Internship Outreach', 'Your take on [researcher''s research topic]',
'Hi [Researcher Name],

I hope this email finds you well. My name is [Your Name] and I am a [Academic Level] at [Institution]. I recently came across your work on [researcher''s work], and it really stuck out to me because [short reason].

If there''s any way I can help out with (unpaid, of course), I''d be incredibly grateful. I know opportunities like this are rare, and I''m dead-set on proving my worth if given the chance.

Attached is my resume for context. Would you be open to a 10-15 minute call to see how I can contribute?

Thank you again for your time, and I hope we can connect.

Best,
[Your Name]
[Institution]',
'Outreach for Research Internships', 'general', TRUE),

(NULL, 'PhD Program Short', 'PhD Application Inquiry',
'Dear Professor/Dr/Mr/Mrs [Last Name],

I hope you''re doing well. I''m [Your Name], a [Academic Level] interested in applying for the PhD program in [Department] at [University] to work under your supervision. My research interests focus on [research interests], and I have developed skills in [skills] through recent work including [experience].

Your work on [specific research topic] strongly aligns with my interests, and I believe my background would contribute meaningfully to your research program.

I''ve attached my CV and would welcome the opportunity to discuss potential research opportunities in your lab. Would you be available for a brief conversation about the possibility of joining your research group?

Thank you for your consideration.

Best regards,
[Your Name]',
'Concise template for PhD program applications', 'general', TRUE),

(NULL, 'Coffee Chat Short', 'Brief Coffee Chat Request',
'Dear Professor/Dr/Mr/Mrs [Last Name],

I hope you''re doing well. I''m [Your Name], a [Academic Level] interested in [research interests]. I''ve been following your work on [specific topic] and would love to learn more about your research and career path.

Would you be available for a brief coffee chat? I''d greatly appreciate 20-30 minutes of your time to discuss [topic of interest].

I''m flexible with scheduling and happy to meet at your convenience.

Thank you for considering this request.

Best regards,
[Your Name]',
'Concise template for requesting informal meetings', 'general', TRUE),

(NULL, 'Research Collaboration Request', 'Interest in [professor research description]',
'Dear Professor/Dr/Mr/Mrs [Last Name],

I hope you''re doing well! I recently came across your research on [brief description], and I found it genuinely compelling - especially your work on [specific part].

As a [Academic Level] with a deep interest in [general field], I''ve been actively exploring this space through [relevant experiences]. These experiences have made me eager to gain hands-on experience in a real research setting.

I was wondering if there might be any opportunities - formal or informal - to get involved with your lab, either remotely or on-site. I''m eager to learn and very open to helping out with anything useful.

Thank you so much for your time.

Warmly,
[Your Name]',
'Use when you have strong experiences to back up your inquiry', 'general', TRUE),

(NULL, 'General Inquiry', 'Research Inquiry and Introduction',
'Dear Professor/Dr/Mr/Mrs [Last Name],

I hope this email finds you well. My name is [Your Name], and I''m a [Academic Level] with interests in [research interests].

I came across your profile and research on [specific topic], and I''m impressed by your work on [specific project].

I''m writing to inquire about [specific purpose - research opportunities, career guidance, etc.]. I would greatly appreciate any guidance you might offer. If you have a few minutes for a brief conversation, I would be very grateful for your insights.

Thank you for your time and consideration.

Best regards,
[Your Name]',
'Flexible template for general research inquiries', 'general', TRUE),

(NULL, 'Meet-up Request', 'Request for Brief Meeting',
'Dear Professor/Dr/Mr/Mrs [Last Name],

I hope this message finds you well. My name is [Your Name], and I''m a [Academic Level] with a strong interest in [research areas]. I''ve been following your work on [specific research area] and find your approach to [specific aspect] particularly innovative.

I''m reaching out to request a brief meeting to discuss [specific purpose], given my recent work on [experiences]. Even a 15-20 minute conversation would be incredibly helpful.

I would be happy to meet at your convenience, whether in person or via video call.

Thank you very much.

Best regards,
[Your Name]',
'Template for requesting an informal meeting or discussion', 'general', TRUE),

(NULL, 'Masters Program Short', 'Master''s Program Application Inquiry',
'Dear Professor/Dr/Mr/Mrs [Last Name],

I hope this message finds you well. I''m [Your Name], a [Academic Level] interested in applying for the Master''s program in [Department] at [University] to work with your research group.

My background includes [skills]. Your research on [specific topic] aligns well with my interests.

I''ve attached my CV. Would you be open to discussing potential research opportunities for incoming Master''s students?

Thank you for your consideration.

Best regards,
[Your Name]',
'Concise template for Master''s program applications', 'general', TRUE),

(NULL, 'Lab Collaboration', 'Research Lab Collaboration Opportunity',
'Dear Professor/Dr/Mr/Mrs [Last Name],

I hope this email finds you well. My name is [Your Name], and I''m a [Academic Level] with research experience in [skills/research interests].

I''ve been following your work on [specific research area], particularly your recent publication on [specific paper]. I''m writing to explore potential collaboration opportunities. My current work focuses on [research areas], and I believe there''s significant potential for synergy with your expertise in [their expertise].

Would you be available for a brief call to explore these possibilities?

Best regards,
[Your Name]',
'Template for exploring collaboration opportunities', 'general', TRUE),

(NULL, 'Paper Collaboration', 'Collaborative Publication Opportunity',
'Dear Professor/Dr/Mr/Mrs [Last Name],

I hope you''re doing well. I''ve been following your excellent work on [specific research area]. Your recent paper on [specific paper title] aligns closely with research I''ve been conducting.

I''m reaching out because I believe there''s an opportunity for a collaborative publication that could advance our understanding of [shared research area].

Would you be interested in discussing this collaboration further?

Thank you for considering this opportunity.

Best regards,
[Your Name]',
'Template for proposing joint research publications', 'general', TRUE),

(NULL, 'Coffee Chat Long', 'Informal Coffee Chat Request',
'Dear Professor/Dr/Mr/Mrs [Last Name],

I hope you''re having a good week. My name is [Your Name], and I''m a [Academic Level] with a growing interest in [research interests].

I''ve been following your work on [specific research area] and am particularly intrigued by your approach to [specific aspect]. I have had experience with [skills] and have worked on projects such as [experiences].

I''m reaching out to ask if you might have time for an informal coffee chat to discuss your research and insights about the field. I''m particularly curious about [specific topics] and would greatly value the opportunity to learn from your experience.

Even 30 minutes of your time would be incredibly valuable. I''m flexible with timing and happy to meet at a location convenient for you, or via video call.

Thank you so much for considering this request.

Best regards,
[Your Name]',
'Template for requesting informal meetings and networking', 'general', TRUE),

(NULL, 'PhD Program Long', 'PhD Application and Research Interest',
'Dear Professor/Dr/Mr/Mrs [Last Name],

I hope this email finds you well. My name is [Your Name], and I am writing to express my strong interest in pursuing doctoral studies under your supervision in [Department] at [University].

Your research on [specific research area] aligns perfectly with my academic interests in [research interests] and career aspirations. I am currently a [Academic Level] at [Institution], where I have developed expertise in [skills]. My academic journey has been shaped by hands-on experience with several significant projects: [experiences].

Your recent publication on [specific paper] particularly resonated with me because [specific reason]. My research interests center on [specific research questions], and I am eager to contribute to advancing knowledge in this field.

I have attached my CV, transcripts, and a research statement outlining my specific interests. I would welcome the opportunity to discuss how my background and interests align with your research program.

Thank you for your time and consideration.

Sincerely,
[Your Name]',
'Comprehensive template for PhD program applications', 'general', TRUE),

(NULL, 'Masters Program Long', 'Master''s Program Application and Research Interest',
'Dear Professor/Dr/Mr/Mrs [Last Name],

I hope you are well. My name is [Your Name], and I am writing to express my interest in pursuing a Master''s degree in [Program] at [University], with the hope of conducting research under your guidance.

I am currently a [Academic Level] with a background in [research interests/skills]. Your research on [specific topic] particularly interests me because [specific reason].

My recent academic and project experiences include [projects]. These experiences have led me to focus on [research skills/interests], and I believe that your expertise in [their research area] would provide excellent guidance for my graduate studies.

I am especially interested in [specific aspect of their research] and how it relates to [broader applications].

I have attached my academic transcripts, CV, and a statement of purpose. I would be honored to discuss how my background aligns with the graduate opportunities available in your lab.

Thank you very much for your time and consideration.

Sincerely,
[Your Name]',
'Comprehensive template for Master''s program applications', 'general', TRUE);

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
