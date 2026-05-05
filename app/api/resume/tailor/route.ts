import { NextRequest, NextResponse } from "next/server"
import { tailorResume } from "@/lib/ai/resume-tailor"

export async function POST(req: NextRequest) {
  try {
    const { resume, companyContext } = await req.json()
    const aiApiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY

    if (!resume) {
      return NextResponse.json({ error: "Missing resume text" }, { status: 400 })
    }

    if (!companyContext || !companyContext.name) {
      return NextResponse.json({ error: "Missing company context" }, { status: 400 })
    }

    const tailored = await tailorResume(resume, companyContext, aiApiKey)

    return NextResponse.json(tailored)
  } catch (error: any) {
    console.error("Resume Tailor API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
