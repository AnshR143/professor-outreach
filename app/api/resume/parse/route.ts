import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/** Extract text from a .docx file (which is a ZIP of XML files) */
async function parseDocx(buffer: Buffer): Promise<{ text: string; pages: number }> {
  // docx files are ZIP archives containing word/document.xml
  // We use the built-in DecompressionStream or manual ZIP parsing
  const JSZip = (await import("jszip")).default
  const zip = await JSZip.loadAsync(buffer)
  const docXml = await zip.file("word/document.xml")?.async("string")
  if (!docXml) throw new Error("Invalid DOCX file — missing document.xml")

  // Strip XML tags, keep text content
  const text = docXml
    .replace(/<w:br[^>]*\/>/gi, "\n")     // line breaks
    .replace(/<w:tab[^>]*\/>/gi, "\t")     // tabs
    .replace(/<\/w:p>/gi, "\n")            // paragraph ends
    .replace(/<[^>]+>/g, "")               // strip all remaining XML tags
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim()

  // Rough page estimate: ~3000 chars per page
  const pages = Math.max(1, Math.ceil(text.length / 3000))
  return { text, pages }
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

  const name = file.name.toLowerCase()
  const isPdf = name.endsWith(".pdf")
  const isDocx = name.endsWith(".docx")
  const isDoc = name.endsWith(".doc")

  if (!isPdf && !isDocx && !isDoc) {
    return NextResponse.json({ error: "Supported formats: PDF, DOCX, DOC" }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())

    let text: string
    let pages: number

    if (isDocx) {
      const result = await parseDocx(buffer)
      text = result.text
      pages = result.pages
    } else if (isDoc) {
      // .doc (legacy binary format) — extract any readable ASCII text
      const raw = buffer.toString("utf-8", 0, Math.min(buffer.length, 500000))
      text = raw.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ").trim()
      pages = Math.max(1, Math.ceil(text.length / 3000))
      if (text.length < 50) {
        return NextResponse.json({ error: "Could not extract text from .doc file. Try saving as .docx or .pdf." }, { status: 422 })
      }
    } else {
      // PDF
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse")
      const parsed = await pdfParse(buffer, { max: 0 })
      text = (parsed.text as string).replace(/\s+/g, " ").trim()
      pages = parsed.numpages
    }

    text = text.slice(0, 4000)

    if (!text || text.length < 10) {
      return NextResponse.json({ error: "Could not extract text from the file. Make sure it contains selectable text (not a scanned image)." }, { status: 422 })
    }

    return NextResponse.json({ text, pages })
  } catch (e: any) {
    console.error("Resume parse error:", e)
    return NextResponse.json({ error: "Could not parse file: " + e.message }, { status: 500 })
  }
}
