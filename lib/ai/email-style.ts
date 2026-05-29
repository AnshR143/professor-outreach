/**
 * Shared style rules for AI-generated cold emails (professor + internship).
 * Centralised so every prompt enforces the same short, human, jargon-free
 * tone — instead of the long, AI-sounding output the prompts produced before.
 */

export type EmailTone = "formal" | "casual" | "enthusiastic"

export const HUMAN_TONE_GUIDE: Record<EmailTone, string> = {
  formal: "polished and respectful, but still plain-spoken and human — not stiff or corporate",
  casual: "warm and conversational, like a real student actually wrote it — still polite",
  enthusiastic: "genuinely curious and direct — show real interest through specifics, NOT through gushing adjectives",
}

/**
 * The core "don't sound like AI" ruleset shared by every cold-email prompt.
 * Drop this into a prompt as its own block.
 */
export const EMAIL_STYLE_RULES = `WRITE LIKE A REAL HUMAN, NOT AI. This is the single most important rule.

LENGTH: Keep it SHORT — 110 to 150 words for the whole email. Busy people skim and delete long emails. Cut every sentence that doesn't carry real information.

NEVER use these AI/filler phrases (or anything close to them):
- "I hope this email finds you well", "I am reaching out", "I am writing to express my interest"
- "I am fascinated by", "I am deeply passionate about", "I have always been passionate about", "truly inspiring"
- ANY form of "passion" — "a strong passion for", "passionate about", "my passion for". Cut it entirely.
- "currently pursuing my studies", "pursuing my studies at", "I am a student with"
- "your groundbreaking / pioneering / seminal / cutting-edge / revolutionary work"
- "delve", "leverage", "utilize", "synergy", "in today's ever-evolving landscape", "it would be an honor / a privilege"
- Empty flattery with no specific detail behind it ("I admire your work", "your impressive research")

PLAIN LANGUAGE — NO JARGON:
- Use simple, direct words and short sentences. Do not stack technical buzzwords to sound smart.
- Be specific instead of impressive: one concrete detail beats three adjectives.
- Contractions are fine. Read it back — if it sounds like a press release or a template, rewrite it so it sounds like a person.`

/**
 * Accuracy guardrails: the AI must use the student's REAL facts and never
 * invent a school, grade level, or background. Drop this into a prompt as its
 * own block, alongside a STUDENT block containing the actual provided facts.
 */
export const STUDENT_ACCURACY_RULES = `ACCURACY — DO NOT INVENT FACTS ABOUT THE STUDENT:
- Use ONLY the student's academic level, school, and background exactly as provided below. Never guess or make anything up.
- State the student's grade level and school accurately. If they are in high school, say so — do NOT call them a "college" or "university" student, and do NOT say "pursuing my studies at university" or "at a local university".
- Never use the words "university" or "college" unless that is literally the student's stated academic level.
- Describe the student's ACTUAL work — a real project, skill, course, or experience from their background below. If little background is given, keep the self-description brief and honest rather than inflating it.`
