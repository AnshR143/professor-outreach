export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile>
        Update: Partial<Profile>
      }
      researchers: {
        Row: Researcher
        Insert: Partial<Researcher>
        Update: Partial<Researcher>
      }
      papers: {
        Row: Paper
        Insert: Partial<Paper>
        Update: Partial<Paper>
      }
      emails: {
        Row: Email
        Insert: Partial<Email>
        Update: Partial<Email>
      }
      templates: {
        Row: Template
        Insert: Partial<Template>
        Update: Partial<Template>
      }
      activities: {
        Row: Activity
        Insert: Partial<Activity>
        Update: Partial<Activity>
      }
      internship_contacts: {
        Row: InternshipContact
        Insert: Partial<InternshipContact>
        Update: Partial<InternshipContact>
      }
      internship_emails: {
        Row: InternshipEmail
        Insert: Partial<InternshipEmail>
        Update: Partial<InternshipEmail>
      }
    }
  }
}

export interface Profile {
  id: string
  user_id: string
  name: string
  email: string
  institution: string
  academic_level: string
  interests: string[]
  goals: string[]
  resume_text: string | null
  resume_url: string | null
  ai_api_key: string | null
  apollo_api_key: string | null
  onboarding_complete: boolean
  created_at: string
  updated_at: string
}

export interface Researcher {
  id: string
  user_id: string
  name: string
  university: string
  department: string | null
  bio: string | null
  match_score: number
  status: "unsorted" | "awaiting" | "accepted" | "rejected"
  research_areas: string[]
  profile_links: Record<string, string>
  semantic_scholar_id: string | null
  why_match: string | null
  notes: string | null
  is_saved: boolean
  email_status: "not_emailed" | "emailed" | "replied" | "accepted" | "rejected"
  found_at: string
  created_at: string
}

export interface Paper {
  id: string
  researcher_id: string
  title: string
  abstract: string | null
  url: string | null
  published_date: string | null
  relevance_score: number | null
  source: "semantic_scholar" | "arxiv"
  created_at: string
}

export interface Email {
  id: string
  user_id: string
  researcher_id: string
  subject: string
  body: string
  template_id: string | null
  status: "draft" | "sent" | "opened" | "replied"
  tone: string
  sent_at: string | null
  created_at: string
}

export interface Template {
  id: string
  user_id: string | null
  name: string
  subject_line: string
  body: string
  description: string
  type: "general" | "personal"
  is_default: boolean
  created_at: string
}

export interface Activity {
  id: string
  user_id: string
  type: string
  category: "research" | "internship"
  researcher_id: string | null
  researcher_name: string | null
  university: string | null
  description: string
  created_at: string
}

export interface InternshipContact {
  id: string
  user_id: string
  company: string
  contact_name: string
  role: string
  department: string | null
  email: string | null
  linkedin_url: string | null
  website: string | null
  bio: string | null
  notes: string | null
  status: "unsorted" | "awaiting" | "accepted" | "rejected"
  email_status: "not_emailed" | "emailed" | "replied" | "accepted" | "rejected"
  why_apply: string | null
  created_at: string
}

export interface InternshipEmail {
  id: string
  user_id: string
  contact_id: string
  subject: string
  body: string
  status: "draft" | "sent" | "opened" | "replied"
  tone: string
  sent_at: string | null
  created_at: string
}
