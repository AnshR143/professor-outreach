import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())

    // pdf-parse workaround: it tries to read test/version.info at init time.
    // We patch the require path by loading it with require (not dynamic import)
    // and the serverExternalPackages config keeps it out of the webpack bundle.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse")
    const parsed = await pdfParse(buffer, { max: 0 })
    const text = (parsed.text as string)
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 4000)

    if (!text || text.length < 10) {
      return NextResponse.json({ error: "Could not extract text from PDF. Make sure it is not a scanned image." }, { status: 422 })
    }

    return NextResponse.json({ text, pages: parsed.numpages })
  } catch (e: any) {
    console.error("PDF parse error:", e)
    return NextResponse.json({ error: "Could not parse PDF: " + e.message }, { status: 500 })
  }
}
