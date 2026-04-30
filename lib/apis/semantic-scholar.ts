const BASE = "https://api.semanticscholar.org/graph/v1"

export interface SSAuthor {
  authorId: string
  name: string
  affiliations: string[]
  homepage?: string
  paperCount?: number
  hIndex?: number
  url?: string
}

export interface SSPaper {
  paperId: string
  title: string
  abstract?: string
  year?: number
  url?: string
  authors: Array<{ authorId: string; name: string }>
}

const AUTHOR_FIELDS = "authorId,name,affiliations,homepage,paperCount,hIndex,url"
const PAPER_FIELDS = "paperId,title,abstract,year,url,authors"

async function ssGet(path: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${BASE}${path}`, {
        headers: { "Accept": "application/json" },
        next: { revalidate: 3600 },
      })
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 2000 * (i + 1)))
        continue
      }
      if (!res.ok) throw new Error(`SS API error: ${res.status}`)
      return res.json()
    } catch (e) {
      if (i === retries - 1) throw e
      await new Promise(r => setTimeout(r, 1000))
    }
  }
}

export async function searchAuthors(query: string, limit = 10): Promise<SSAuthor[]> {
  try {
    const data = await ssGet(
      `/author/search?query=${encodeURIComponent(query)}&fields=${AUTHOR_FIELDS}&limit=${limit}`
    )
    return data.data || []
  } catch {
    return []
  }
}

export async function getAuthorPapers(authorId: string, limit = 5): Promise<SSPaper[]> {
  try {
    const data = await ssGet(
      `/author/${authorId}/papers?fields=${PAPER_FIELDS}&limit=${limit}&sort=citationCount`
    )
    return data.data || []
  } catch {
    return []
  }
}

export async function getAuthorDetails(authorId: string): Promise<SSAuthor | null> {
  try {
    return await ssGet(`/author/${authorId}?fields=${AUTHOR_FIELDS}`)
  } catch {
    return null
  }
}

export async function searchProfessorsByField(
  field: string,
  university: string,
  limit = 20
): Promise<SSAuthor[]> {
  const query = university ? `${field} ${university}` : field
  return searchAuthors(query, limit)
}
