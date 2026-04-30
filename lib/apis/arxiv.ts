const ARXIV_BASE = "https://export.arxiv.org/api/query"

export interface ArxivPaper {
  id: string
  title: string
  abstract: string
  published: string
  authors: string[]
  link: string
}

export async function searchArxiv(query: string, maxResults = 5): Promise<ArxivPaper[]> {
  try {
    const url = `${ARXIV_BASE}?search_query=au:${encodeURIComponent(query)}&max_results=${maxResults}&sortBy=submittedDate`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    const text = await res.text()

    const entries = text.match(/<entry>([\s\S]*?)<\/entry>/g) || []
    return entries.map(entry => {
      const get = (tag: string) => {
        const m = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
        return m ? m[1].trim() : ""
      }
      const authors = [...entry.matchAll(/<name>([\s\S]*?)<\/name>/g)].map(m => m[1].trim())
      const id = get("id").split("/abs/").pop() || ""
      return {
        id,
        title: get("title").replace(/\s+/g, " "),
        abstract: get("summary").replace(/\s+/g, " "),
        published: get("published").slice(0, 10),
        authors,
        link: get("id"),
      }
    })
  } catch {
    return []
  }
}
