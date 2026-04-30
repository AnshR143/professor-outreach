import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function formatTime(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
}

export function timeAgo(date: string | Date): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + "..." : str
}

export function getMatchColor(score: number): string {
  if (score >= 85) return "#22c55e"
  if (score >= 70) return "#f97316"
  if (score >= 55) return "#f59e0b"
  return "#94a3b8"
}

export function getStatusColor(status: string): { bg: string; text: string } {
  switch (status) {
    case "accepted": return { bg: "#dcfce7", text: "#16a34a" }
    case "awaiting": return { bg: "#fff7ed", text: "#ea580c" }
    case "rejected": return { bg: "#fee2e2", text: "#dc2626" }
    default: return { bg: "#f1f5f9", text: "#475569" }
  }
}

export const RESEARCH_FIELDS = [
  "Artificial Intelligence", "Machine Learning", "Computer Science",
  "Mathematics", "Statistics", "Economics", "Finance",
  "Quantitative Finance", "Operations Research", "Biomedical Engineering",
  "Physics", "Chemistry", "Biology", "Neuroscience",
  "Political Science", "Psychology", "Sociology", "Environmental Science",
  "Data Science", "Robotics", "Natural Language Processing",
  "Computer Vision", "Cybersecurity", "Blockchain",
]

export const ACADEMIC_LEVELS = [
  "High School (9th Grade / Freshman)",
  "High School (10th Grade / Sophomore)",
  "High School (11th Grade / Junior)",
  "High School (12th Grade / Senior)",
  "Undergraduate (Freshman)",
  "Undergraduate (Sophomore)",
  "Undergraduate (Junior)",
  "Undergraduate (Senior)",
  "Graduate (Master's Student)",
  "Graduate (PhD Student)",
  "Other",
]

export const TOP_UNIVERSITIES = [
  "MIT", "Stanford University", "Harvard University", "Princeton University",
  "Yale University", "Columbia University", "University of Chicago",
  "University of Pennsylvania", "Cornell University", "Duke University",
  "Northwestern University", "Johns Hopkins University", "Caltech",
  "UC Berkeley", "UCLA", "University of Michigan", "Carnegie Mellon",
  "NYU", "Georgetown University", "Boston University",
  "University of Pittsburgh", "Arizona State University", "Chinese University of Hong Kong",
  "City University of Hong Kong", "Clemson University", "Florida State University",
  "Texas A&M University", "University of Arizona", "University of Central Florida",
  "University of Connecticut", "University of Georgia", "University of Southern California",
  "University of Illinois Urbana-Champaign", "Purdue University", "University of Florida"
]
