import { createClient } from "@/lib/supabase/server"
import { isGeminiKey } from "@/lib/ai/detect-key"
import { getAiKey } from "@/lib/ai/key-pool"
import { callAI } from "@/lib/ai/call"
import {
  pickBestProfessorEmail,
  verifyWithAI,
  isUniversityEmail,
  isGenericInbox,
  computeGroundedConfidence,
  type PageInput,
} from "@/lib/email/professor-extractor"
import { domainAcceptsMail, patternGuess } from "@/lib/email/verify"

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Fetch a page and return its full HTML (or "" on any failure). */
async function fetchPage(url: string, timeoutMs = 8000): Promise<string> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        // A realistic browser UA matters: Bing/DDG serve empty pages or
        // captchas to anything that self-identifies as a bot from a
        // datacenter IP — which is exactly where this code runs.
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Upgrade-Insecure-Requests": "1",
      },
    })
    clearTimeout(t)
    if (!res.ok) return ""
    return await res.text()
  } catch {
    clearTimeout(t)
    return ""
  }
}

/** Build university domain from name for directory searches */
function guessUniversityDomain(university: string): string {
  const uLow = university.toLowerCase().trim()
  // Order matters: longer / more specific keys must come first so e.g.
  // "university of california, san diego" hits "san diego" before "california".
  const domainMap: Array<[string, string]> = [
    // ── Ivy / top private US ──
    ["mit", "mit.edu"], ["harvard", "harvard.edu"], ["stanford", "stanford.edu"],
    ["princeton", "princeton.edu"], ["yale", "yale.edu"], ["columbia", "columbia.edu"],
    ["cornell", "cornell.edu"], ["dartmouth", "dartmouth.edu"], ["brown", "brown.edu"],
    ["duke", "duke.edu"], ["caltech", "caltech.edu"], ["california institute of technology", "caltech.edu"],
    ["carnegie mellon", "cmu.edu"], ["cmu", "cmu.edu"],
    ["johns hopkins", "jhu.edu"], ["jhu", "jhu.edu"],
    ["northwestern", "northwestern.edu"], ["rice", "rice.edu"],
    ["vanderbilt", "vanderbilt.edu"], ["emory", "emory.edu"], ["georgetown", "georgetown.edu"],
    ["tufts", "tufts.edu"], ["notre dame", "nd.edu"], ["nyu", "nyu.edu"],
    ["new york university", "nyu.edu"],
    ["upenn", "upenn.edu"], ["penn state", "psu.edu"],
    ["university of pennsylvania", "upenn.edu"], ["wharton", "upenn.edu"],
    ["uchicago", "uchicago.edu"], ["university of chicago", "uchicago.edu"],

    // ── UC system (specific campuses BEFORE "california") ──
    ["ucla", "ucla.edu"], ["university of california, los angeles", "ucla.edu"],
    ["ucsd", "ucsd.edu"], ["uc san diego", "ucsd.edu"], ["university of california, san diego", "ucsd.edu"],
    ["ucsb", "ucsb.edu"], ["uc santa barbara", "ucsb.edu"], ["university of california, santa barbara", "ucsb.edu"],
    ["uci", "uci.edu"], ["uc irvine", "uci.edu"], ["university of california, irvine", "uci.edu"],
    ["ucsc", "ucsc.edu"], ["uc santa cruz", "ucsc.edu"], ["university of california, santa cruz", "ucsc.edu"],
    ["ucdavis", "ucdavis.edu"], ["uc davis", "ucdavis.edu"], ["university of california, davis", "ucdavis.edu"],
    ["ucr", "ucr.edu"], ["uc riverside", "ucr.edu"], ["university of california, riverside", "ucr.edu"],
    ["ucsf", "ucsf.edu"], ["uc san francisco", "ucsf.edu"],
    ["ucmerced", "ucmerced.edu"], ["uc merced", "ucmerced.edu"],
    ["berkeley", "berkeley.edu"], ["uc berkeley", "berkeley.edu"], ["university of california, berkeley", "berkeley.edu"],

    // ── UT system ──
    ["ut austin", "utexas.edu"], ["university of texas at austin", "utexas.edu"],
    ["ut dallas", "utdallas.edu"], ["utd", "utdallas.edu"],
    ["ut arlington", "uta.edu"], ["ut san antonio", "utsa.edu"],

    // ── Big public US ──
    ["michigan", "umich.edu"], ["umich", "umich.edu"],
    ["michigan state", "msu.edu"], ["msu", "msu.edu"],
    ["uiuc", "illinois.edu"], ["illinois urbana", "illinois.edu"], ["university of illinois", "illinois.edu"],
    ["purdue", "purdue.edu"],
    ["georgia tech", "gatech.edu"], ["gatech", "gatech.edu"],
    ["georgia state", "gsu.edu"], ["university of georgia", "uga.edu"],
    ["unc chapel hill", "unc.edu"], ["unc", "unc.edu"], ["north carolina", "unc.edu"],
    ["nc state", "ncsu.edu"], ["ncsu", "ncsu.edu"],
    ["virginia tech", "vt.edu"], ["vt ", "vt.edu"],
    ["virginia commonwealth", "vcu.edu"],
    ["virginia", "virginia.edu"], ["uva", "virginia.edu"],
    ["arizona state", "asu.edu"], ["asu", "asu.edu"],
    ["arizona", "arizona.edu"],
    ["texas a&m", "tamu.edu"], ["texas am", "tamu.edu"], ["tamu", "tamu.edu"],
    ["texas tech", "ttu.edu"],
    ["texas", "utexas.edu"],
    ["usc", "usc.edu"], ["southern california", "usc.edu"],
    ["umass amherst", "umass.edu"], ["umass", "umass.edu"],
    ["northeastern", "northeastern.edu"],
    ["boston university", "bu.edu"], ["boston college", "bc.edu"],
    ["wisconsin madison", "wisc.edu"], ["wisconsin", "wisc.edu"], ["uw madison", "wisc.edu"],
    ["minnesota", "umn.edu"], ["umn", "umn.edu"],
    ["iowa state", "iastate.edu"], ["iowa", "uiowa.edu"],
    ["ohio state", "osu.edu"], ["osu", "osu.edu"],
    ["penn state", "psu.edu"],
    ["maryland college park", "umd.edu"], ["umd", "umd.edu"], ["maryland", "umd.edu"],
    ["florida state", "fsu.edu"], ["fsu", "fsu.edu"],
    ["florida international", "fiu.edu"], ["fiu", "fiu.edu"],
    ["central florida", "ucf.edu"], ["ucf", "ucf.edu"],
    ["florida", "ufl.edu"], ["ufl", "ufl.edu"],
    ["uw seattle", "washington.edu"], ["uw", "washington.edu"], ["washington", "washington.edu"],
    ["washington state", "wsu.edu"], ["wsu", "wsu.edu"],
    ["colorado boulder", "colorado.edu"], ["colorado", "colorado.edu"],
    ["colorado state", "colostate.edu"],
    ["oregon state", "oregonstate.edu"], ["oregon", "uoregon.edu"],
    ["utah", "utah.edu"], ["byu", "byu.edu"], ["brigham young", "byu.edu"],
    ["pittsburgh", "pitt.edu"], ["pitt", "pitt.edu"],
    ["rochester", "rochester.edu"],
    ["case western", "case.edu"],
    ["rensselaer", "rpi.edu"], ["rpi", "rpi.edu"],
    ["lehigh", "lehigh.edu"],
    ["stony brook", "stonybrook.edu"], ["sunysb", "stonybrook.edu"],
    ["buffalo", "buffalo.edu"], ["suny buffalo", "buffalo.edu"],
    ["binghamton", "binghamton.edu"], ["albany", "albany.edu"],
    ["rutgers", "rutgers.edu"],
    ["temple", "temple.edu"],
    ["george mason", "gmu.edu"], ["gmu", "gmu.edu"],
    ["george washington", "gwu.edu"], ["gwu", "gwu.edu"],
    ["american university", "american.edu"],
    ["howard", "howard.edu"],
    ["miami", "miami.edu"],
    ["clemson", "clemson.edu"],
    ["auburn", "auburn.edu"],
    ["alabama", "ua.edu"],
    ["kentucky", "uky.edu"],
    ["tennessee", "utk.edu"], ["utk", "utk.edu"],
    ["delaware", "udel.edu"],
    ["connecticut", "uconn.edu"], ["uconn", "uconn.edu"],
    ["hawaii", "hawaii.edu"], ["alaska fairbanks", "uaf.edu"],
    ["kansas state", "ksu.edu"], ["kansas", "ku.edu"],
    ["nebraska", "unl.edu"], ["missouri", "missouri.edu"],
    ["oklahoma state", "okstate.edu"], ["oklahoma", "ou.edu"],
    ["arkansas", "uark.edu"], ["mississippi state", "msstate.edu"],
    ["mississippi", "olemiss.edu"], ["lsu", "lsu.edu"], ["louisiana state", "lsu.edu"],
    ["nevada las vegas", "unlv.edu"], ["unlv", "unlv.edu"],
    ["nevada reno", "unr.edu"], ["nevada", "unr.edu"],
    ["new mexico", "unm.edu"],
    ["wyoming", "uwyo.edu"], ["montana", "umontana.edu"],
    ["north dakota", "und.edu"], ["south dakota", "usd.edu"],
    ["vermont", "uvm.edu"], ["new hampshire", "unh.edu"],
    ["maine", "maine.edu"], ["rhode island", "uri.edu"],
    ["drexel", "drexel.edu"], ["villanova", "villanova.edu"],
    ["fordham", "fordham.edu"], ["syracuse", "syr.edu"],
    ["wake forest", "wfu.edu"], ["baylor", "baylor.edu"], ["smu", "smu.edu"],
    ["wesleyan", "wesleyan.edu"], ["williams", "williams.edu"], ["amherst", "amherst.edu"],
    ["swarthmore", "swarthmore.edu"], ["bowdoin", "bowdoin.edu"], ["middlebury", "middlebury.edu"],
    ["pomona", "pomona.edu"], ["claremont", "cmc.edu"], ["harvey mudd", "hmc.edu"],
    ["olin", "olin.edu"], ["rose-hulman", "rose-hulman.edu"],
    ["rit", "rit.edu"], ["rochester institute", "rit.edu"],
    ["wpi", "wpi.edu"], ["worcester polytechnic", "wpi.edu"],
    ["stevens institute", "stevens.edu"],
    ["njit", "njit.edu"],
    ["howard hughes", "hhmi.org"],

    // ── Canada ──
    ["toronto", "utoronto.ca"], ["uoft", "utoronto.ca"],
    ["mcgill", "mcgill.ca"], ["waterloo", "uwaterloo.ca"],
    ["ubc", "ubc.ca"], ["british columbia", "ubc.ca"],
    ["alberta", "ualberta.ca"], ["mcmaster", "mcmaster.ca"],
    ["queen's", "queensu.ca"], ["queens", "queensu.ca"],
    ["western", "uwo.ca"], ["simon fraser", "sfu.ca"],
    ["montréal", "umontreal.ca"], ["montreal", "umontreal.ca"],
    ["concordia", "concordia.ca"], ["york", "yorku.ca"],
    ["ottawa", "uottawa.ca"], ["dalhousie", "dal.ca"],

    // ── UK / Europe ──
    ["oxford", "ox.ac.uk"], ["cambridge", "cam.ac.uk"],
    ["imperial college", "imperial.ac.uk"], ["imperial", "imperial.ac.uk"],
    ["ucl", "ucl.ac.uk"], ["university college london", "ucl.ac.uk"],
    ["king's college london", "kcl.ac.uk"], ["kings college london", "kcl.ac.uk"],
    ["lse", "lse.ac.uk"], ["london school of economics", "lse.ac.uk"],
    ["edinburgh", "ed.ac.uk"], ["manchester", "manchester.ac.uk"],
    ["bristol", "bristol.ac.uk"], ["warwick", "warwick.ac.uk"],
    ["southampton", "soton.ac.uk"], ["leeds", "leeds.ac.uk"],
    ["sheffield", "sheffield.ac.uk"], ["birmingham", "bham.ac.uk"],
    ["glasgow", "gla.ac.uk"], ["nottingham", "nottingham.ac.uk"],
    ["durham", "durham.ac.uk"], ["york uk", "york.ac.uk"],
    ["liverpool", "liverpool.ac.uk"], ["cardiff", "cardiff.ac.uk"],
    ["queen mary", "qmul.ac.uk"], ["st andrews", "st-andrews.ac.uk"],

    ["eth zurich", "ethz.ch"], ["eth", "ethz.ch"],
    ["epfl", "epfl.ch"],
    ["tu munich", "tum.de"], ["technical university of munich", "tum.de"], ["tum", "tum.de"],
    ["lmu", "lmu.de"], ["heidelberg", "uni-heidelberg.de"],
    ["max planck", "mpg.de"],
    ["delft", "tudelft.nl"], ["tu delft", "tudelft.nl"],
    ["amsterdam", "uva.nl"], ["leiden", "leidenuniv.nl"],
    ["utrecht", "uu.nl"], ["eindhoven", "tue.nl"],
    ["ku leuven", "kuleuven.be"], ["leuven", "kuleuven.be"],
    ["sorbonne", "sorbonne-universite.fr"], ["paris-saclay", "universite-paris-saclay.fr"],
    ["ecole polytechnique", "polytechnique.fr"],
    ["politecnico di milano", "polimi.it"], ["bocconi", "unibocconi.it"],
    ["karolinska", "ki.se"], ["kth", "kth.se"], ["chalmers", "chalmers.se"],
    ["copenhagen", "ku.dk"], ["aarhus", "au.dk"],
    ["helsinki", "helsinki.fi"], ["aalto", "aalto.fi"],
    ["trinity college dublin", "tcd.ie"], ["tcd", "tcd.ie"],

    // ── Asia / Oceania ──
    ["tsinghua", "tsinghua.edu.cn"], ["peking", "pku.edu.cn"], ["pku", "pku.edu.cn"],
    ["fudan", "fudan.edu.cn"], ["shanghai jiao tong", "sjtu.edu.cn"], ["sjtu", "sjtu.edu.cn"],
    ["zhejiang", "zju.edu.cn"], ["zju", "zju.edu.cn"],
    ["ustc", "ustc.edu.cn"], ["nanjing", "nju.edu.cn"], ["nju", "nju.edu.cn"],
    ["hkust", "ust.hk"], ["hku", "hku.hk"], ["chinese university of hong kong", "cuhk.edu.hk"], ["cuhk", "cuhk.edu.hk"],
    ["nus", "nus.edu.sg"], ["national university of singapore", "nus.edu.sg"],
    ["ntu singapore", "ntu.edu.sg"], ["nanyang", "ntu.edu.sg"],
    ["tokyo", "u-tokyo.ac.jp"], ["kyoto", "kyoto-u.ac.jp"],
    ["osaka", "osaka-u.ac.jp"], ["tohoku", "tohoku.ac.jp"],
    ["tit", "titech.ac.jp"], ["tokyo institute of technology", "titech.ac.jp"],
    ["seoul national", "snu.ac.kr"], ["snu", "snu.ac.kr"],
    ["kaist", "kaist.ac.kr"], ["postech", "postech.ac.kr"],
    ["yonsei", "yonsei.ac.kr"], ["korea university", "korea.ac.kr"],
    ["iit bombay", "iitb.ac.in"], ["iit delhi", "iitd.ac.in"],
    ["iit madras", "iitm.ac.in"], ["iit kanpur", "iitk.ac.in"],
    ["iit kharagpur", "iitkgp.ac.in"], ["iisc", "iisc.ac.in"], ["indian institute of science", "iisc.ac.in"],
    ["technion", "technion.ac.il"], ["tel aviv", "tau.ac.il"],
    ["hebrew university", "huji.ac.il"], ["weizmann", "weizmann.ac.il"],
    ["melbourne", "unimelb.edu.au"], ["sydney", "sydney.edu.au"],
    ["unsw", "unsw.edu.au"], ["anu", "anu.edu.au"],
    ["monash", "monash.edu"], ["queensland", "uq.edu.au"],
    ["auckland", "auckland.ac.nz"],
  ]
  for (const [key, d] of domainMap) {
    if (uLow.includes(key)) return d
  }
  // Fallback: try a smarter construction. Drop "the", "of", commas,
  // "university", "college", "institute", strip diacritics-ish, and
  // join remaining words. Examples:
  //   "University of Vermont"         -> vermont.edu
  //   "Stony Brook University"        -> stonybrook.edu
  //   "Indiana University Bloomington" -> indianabloomington.edu (best-effort)
  const stop = new Set([
    "the", "of", "at", "in", "and", "a", "an",
    "university", "universities", "college", "institute", "institution",
    "school", "campus",
  ])
  const tokens = uLow
    .replace(/[,.()&]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !stop.has(t))
  if (tokens.length === 0) {
    return uLow.replace(/[^a-z]/g, "").slice(0, 16) + ".edu"
  }
  const joined = tokens.join("").replace(/[^a-z0-9]/g, "")
  return joined.slice(0, 20) + ".edu"
}

// ─── Scraper ──────────────────────────────────────────────────────────────────

/**
 * Build a set of likely faculty-directory URLs and fetch them.
 * Returns the (url, html) pairs that succeeded — these are then passed
 * wholesale to the rule + AI pipeline so it can see surrounding text.
 */
async function scrapeUniversityPages(
  name: string,
  university: string
): Promise<PageInput[]> {
  const domain = guessUniversityDomain(university)
  const nameParts = name.trim().split(/\s+/)
  const lastName = nameParts[nameParts.length - 1]
  const firstName = nameParts[0]
  const nameQuery = encodeURIComponent(name)

  // Google blocks server-side scraping (returns CAPTCHA), so we use Bing's
  // HTML SERP instead — it's the most reliable thing we can hit unauthenticated.
  const bingQ = encodeURIComponent(`"${name}" "${university}" email site:${domain}`)
  const bingQ2 = encodeURIComponent(`"${name}" ${university} email`)
  const fLow = firstName.toLowerCase()
  const lLow = lastName.toLowerCase()
  const urls = [
    `https://www.bing.com/search?q=${bingQ}`,
    `https://www.bing.com/search?q=${bingQ2}`,
    `https://www.${domain}/search?q=${nameQuery}`,
    `https://directory.${domain}/search?q=${nameQuery}`,
    `https://search.${domain}/?q=${nameQuery}+email`,
    `https://www.${domain}/people/${fLow}-${lLow}`,
    `https://www.${domain}/faculty/${fLow}-${lLow}`,
    `https://www.${domain}/people/${fLow}_${lLow}`,
    `https://www.${domain}/~${lLow}`,
    `https://scholar.google.com/citations?view_op=search_authors&mauthors=${nameQuery}+${encodeURIComponent(university)}`,
  ]

  const results = await Promise.allSettled(urls.map((u) => fetchPage(u)))
  const out: PageInput[] = []
  results.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value) {
      out.push({ url: urls[i], html: r.value })
    }
  })
  return out
}

async function scrapeDuckDuckGo(
  name: string,
  university: string,
  universityDomain: string
): Promise<PageInput[]> {
  const query = encodeURIComponent(`${name} ${university} email`)
  // html.duckduckgo.com rate-limits hard; lite.duckduckgo.com is a simpler
  // endpoint that often still answers when the html one refuses.
  let seedUrl = `https://html.duckduckgo.com/html/?q=${query}`
  let seedHtml = await fetchPage(seedUrl)
  if (!seedHtml) {
    seedUrl = `https://lite.duckduckgo.com/lite/?q=${query}`
    seedHtml = await fetchPage(seedUrl)
  }
  if (!seedHtml) return []

  // Extract result links and follow the few that point at an academic-looking
  // domain. We accept the guessed university domain, ANY .edu / .ac.* /
  // .edu.* domain, plus a couple of common research-institute TLDs.
  const academicHints = [
    universityDomain,
    ".edu/", ".edu?", ".edu#",
    ".ac.uk", ".ac.jp", ".ac.in", ".ac.kr", ".ac.il", ".ac.at", ".ac.nz",
    ".edu.cn", ".edu.au", ".edu.sg", ".edu.hk",
    ".uni-", ".ethz.ch", ".epfl.ch", ".mpg.de", ".inria.fr",
  ]
  const urlMatches = seedHtml.match(/href="(https?:\/\/[^"]+)"/g) || []
  const resultUrls = Array.from(
    new Set(
      urlMatches
        .map((m) => m.replace('href="', "").replace('"', ""))
        // DDG wraps real links in /l/?uddg=...; decode if present.
        .map((u) => {
          try {
            const url = new URL(u, "https://duckduckgo.com")
            const u2 = url.searchParams.get("uddg")
            return u2 ? decodeURIComponent(u2) : u
          } catch {
            return u
          }
        })
        .filter(
          (u) =>
            !u.includes("duckduckgo.com") &&
            !u.includes("google.com") &&
            !u.includes("bing.com") &&
            academicHints.some((h) => u.includes(h))
        )
    )
  ).slice(0, 5)

  const pages = await Promise.allSettled(resultUrls.map((u) => fetchPage(u)))
  const out: PageInput[] = [{ url: seedUrl, html: seedHtml }]
  pages.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value) {
      out.push({ url: resultUrls[i], html: r.value })
    }
  })
  return out
}

/**
 * Bing's HTML SERP is the most reliable unauthenticated search source we can
 * scrape today. We pull the result snippet HTML for emails directly, and also
 * follow the top 5 academic-looking result URLs to fetch the actual faculty
 * profile pages.
 */
async function scrapeBing(
  name: string,
  university: string,
  universityDomain: string
): Promise<PageInput[]> {
  // NOTE: don't exact-quote the university — "Harvard University" misses
  // pages that say "Harvard Graduate School of Education". The site: query
  // is the strongest one: it lands directly on the faculty profile, which
  // also covers department subdomains (gse.harvard.edu etc.).
  const queries = [
    `"${name}" ${university} email`,
    `"${name}" site:${universityDomain}`,
    `"${name}" email site:${universityDomain}`,
    `"${name}" professor email`,
  ]
  const out: PageInput[] = []
  const seenUrls = new Set<string>()

  const academicHints = [
    universityDomain,
    ".edu", ".ac.uk", ".ac.jp", ".ac.in", ".ac.kr", ".ac.il", ".ac.at", ".ac.nz",
    ".edu.cn", ".edu.au", ".edu.sg", ".edu.hk",
    ".uni-", ".ethz.ch", ".epfl.ch", ".mpg.de", ".inria.fr",
  ]

  for (const q of queries) {
    const seedUrl = `https://www.bing.com/search?q=${encodeURIComponent(q)}`
    const seedHtml = await fetchPage(seedUrl)
    if (!seedHtml) continue
    out.push({ url: seedUrl, html: seedHtml })

    // Bing puts each result link in <a href="...">; pull them out.
    const urlMatches = seedHtml.match(/href="(https?:\/\/[^"]+)"/g) || []
    const resultUrls = Array.from(
      new Set(
        urlMatches
          .map((m) => m.replace('href="', "").replace('"', ""))
          .filter(
            (u) =>
              !u.includes("bing.com") &&
              !u.includes("microsoft.com") &&
              !u.includes("microsofttranslator.com") &&
              academicHints.some((h) => u.includes(h)) &&
              !seenUrls.has(u)
          )
      )
    ).slice(0, 4)

    resultUrls.forEach((u) => seenUrls.add(u))
    const pages = await Promise.allSettled(resultUrls.map((u) => fetchPage(u)))
    pages.forEach((r, i) => {
      if (r.status === "fulfilled" && r.value) {
        out.push({ url: resultUrls[i], html: r.value })
      }
    })
  }
  return out
}

/**
 * Mojeek — independent index, no captcha wall, tolerant of server-side
 * fetches. A third engine matters because Bing and DDG both rate-limit
 * datacenter IPs; with three engines at least one usually answers.
 */
async function scrapeMojeek(
  name: string,
  university: string,
  universityDomain: string
): Promise<PageInput[]> {
  const query = encodeURIComponent(`"${name}" ${university} email`)
  const seedUrl = `https://www.mojeek.com/search?q=${query}`
  const seedHtml = await fetchPage(seedUrl)
  if (!seedHtml) return []

  const academicHints = [
    universityDomain,
    ".edu", ".ac.uk", ".ac.jp", ".ac.in", ".ac.kr", ".ac.il", ".ac.at", ".ac.nz",
    ".edu.cn", ".edu.au", ".edu.sg", ".edu.hk",
    ".uni-", ".ethz.ch", ".epfl.ch", ".mpg.de", ".inria.fr",
  ]
  const urlMatches = seedHtml.match(/href="(https?:\/\/[^"]+)"/g) || []
  const resultUrls = Array.from(
    new Set(
      urlMatches
        .map((m) => m.replace('href="', "").replace('"', ""))
        .filter(
          (u) =>
            !u.includes("mojeek.com") &&
            academicHints.some((h) => u.includes(h))
        )
    )
  ).slice(0, 4)

  const pages = await Promise.allSettled(resultUrls.map((u) => fetchPage(u)))
  const out: PageInput[] = [{ url: seedUrl, html: seedHtml }]
  pages.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value) {
      out.push({ url: resultUrls[i], html: r.value })
    }
  })
  return out
}

// ─── AI search fallback (Gemini with grounding, or Groq) ──────────────────────

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g

async function aiSearchEmail(
  apiKey: string,
  name: string,
  university: string,
  areas?: string[]
): Promise<{ email: string; snippet: string }> {
  const prompt = `Find the official faculty email for the professor below.

Professor: ${name}
University: ${university}
${areas && areas.length > 0 ? `Research areas: ${areas.join(", ")}\n` : ""}
Instructions:
1. Search the web (e.g. "${name}" "${university}" email OR contact OR site:.edu).
2. Prefer the email shown on the professor's own faculty / lab / departmental
   profile page. Cross-check that the page calls the person Professor /
   Associate Professor / Assistant Professor / Faculty / Researcher.
3. It MUST be a personal university address (e.g. ending in .edu, .ac.uk,
   .edu.cn, .ac.jp, an institute domain like ist.ac.at, etc.).
   It must NOT be a department/admin mailbox (info@, contact@, admissions@,
   cs@, eecs@ ...), a personal Gmail/Yahoo/Outlook, an alumni/student
   subdomain, or another person who appears on the same page.
4. If you find multiple candidates, pick the one whose local part most
   plausibly matches the professor's name.
5. If you genuinely cannot find a verified personal email, output exactly: NONE

Output format:
EMAIL: <the email or NONE>
SOURCE: <the page URL where you found it, or "n/a">`

  // Helper: extract email even if the model wrapped it in markdown / mailto:.
  const pickEmail = (raw: string): string => {
    const cleaned = raw.replace(/mailto:/gi, "").replace(/[`*]/g, "")
    const m = cleaned.match(EMAIL_RE)
    return m ? m[0].toLowerCase() : ""
  }

  if (isGeminiKey(apiKey)) {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
        apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0, maxOutputTokens: 400 },
        }),
      }
    )
    if (!res.ok) return { email: "", snippet: "" }
    const data = await res.json()
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || ""
    return { email: pickEmail(raw), snippet: raw }
  } else {
    // Universal fallback — routes to Groq, OpenAI, OpenRouter, Cerebras, xAI, etc.
    try {
      const raw = await callAI(apiKey, prompt, { temperature: 0, maxTokens: 200 })
      return { email: pickEmail(raw), snippet: raw }
    } catch {
      return { email: "", snippet: "" }
    }
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (!user) return new Response("Unauthorized", { status: 401 })

  const { researcherName, university, areas } = await req.json()
  if (!researcherName || !university) {
    return new Response(JSON.stringify({ error: "Missing name or university" }), {
      status: 400,
    })
  }

  const aiKey = getAiKey()
  if (!aiKey) {
    return new Response(
      JSON.stringify({ error: "AI service is temporarily unavailable. Please try again in a moment." }),
      { status: 503 }
    )
  }

  try {
    const expectedDomain = guessUniversityDomain(university)

    // Step 1+2+3: Fetch directory pages, DuckDuckGo results, and Bing results
    // in parallel. Bing is the most reliable SERP we can scrape; we also
    // follow its top academic-looking results to load the actual profile
    // pages where the email lives.
    const [uniPages, ddgPages, bingPages, mojeekPages] = await Promise.all([
      scrapeUniversityPages(researcherName, university),
      scrapeDuckDuckGo(researcherName, university, expectedDomain),
      scrapeBing(researcherName, university, expectedDomain),
      scrapeMojeek(researcherName, university, expectedDomain),
    ])
    const pages: PageInput[] = [...uniPages, ...ddgPages, ...bingPages, ...mojeekPages]

    // Step 3: Run the rule-based + AI verification pipeline.
    const pick = await pickBestProfessorEmail({
      pages,
      name: researcherName,
      university,
      expectedDomain,
      apiKey: aiKey,
      verifyTopN: 3,
    })

    if (pick.email && pick.source === "scraped+verified") {
      return new Response(
        JSON.stringify({
          email: pick.email,
          source: pick.source,
          confidence: pick.confidence,
          evidence: pick.evidence,
          alternatives: pick.alternatives,
          score: pick.score,
        }),
        { headers: { "Content-Type": "application/json" } }
      )
    }

    // Step 4: AI search fallback. The LLM gets to use Google grounding, so its
    // answer may come from a domain that doesn't match our guessed
    // expectedDomain (especially when the guess was wrong). We only require
    // that the email be a *plausible* university address and not a generic
    // mailbox — then defer to the AI verifier for the final yes/no.
    const ai = await aiSearchEmail(aiKey, researcherName, university, areas)
    // Reject hallucinated addresses on domains that can't even receive mail.
    if (ai.email && !(await domainAcceptsMail(ai.email.split("@")[1] || ""))) {
      ai.email = ""
    }
    if (ai.email) {
      const lower = ai.email.toLowerCase()
      // Try strict check first; if that fails, fall back to the looser one
      // that only requires the address to look like a university domain.
      const passesStrict =
        isUniversityEmail(lower, { expectedDomain }) && !isGenericInbox(lower)
      const passesLoose =
        isUniversityEmail(lower) && !isGenericInbox(lower)

      if (passesStrict || passesLoose) {
        const verdict = await verifyWithAI({
          email: lower,
          name: researcherName,
          university,
          url: "ai-search",
          title: "",
          snippet: ai.snippet || "",
          apiKey: aiKey,
        })
        // When the email passed the *strict* domain check we accept at the
        // normal threshold; when it only passed the loose check we require a
        // slightly higher AI confidence to compensate.
        const threshold = passesStrict ? 60 : 70
        if (verdict.is_professor && verdict.confidence >= threshold) {
          return new Response(
            JSON.stringify({
              email: lower,
              source: "ai_search+verified",
              confidence: computeGroundedConfidence({
                email: lower,
                name: researcherName,
                expectedDomain,
                source: "ai_search",
                aiVerified: true,
              }),
              evidence: verdict.evidence,
              alternatives: pick.alternatives,
              score: 0,
              domainMatch: passesStrict,
            }),
            { headers: { "Content-Type": "application/json" } }
          )
        }
        // Even if AI verification didn't pass the threshold, surface the
        // candidate as a low-confidence suggestion instead of falling all the
        // way through to "none". This is what users mean by "the email is
        // right there on Google".
        if (passesStrict) {
          return new Response(
            JSON.stringify({
              email: lower,
              source: "ai_search",
              confidence: computeGroundedConfidence({
                email: lower,
                name: researcherName,
                expectedDomain,
                source: "ai_search",
                aiVerified: false,
              }),
              evidence: verdict.evidence || ai.snippet?.slice(0, 200) || "",
              alternatives: pick.alternatives,
              score: 0,
              domainMatch: true,
            }),
            { headers: { "Content-Type": "application/json" } }
          )
        }
      }
    }

    // Step 5: If we have a rule-only pick, return it with lower confidence.
    if (pick.email) {
      return new Response(
        JSON.stringify({
          email: pick.email,
          source: pick.source,
          confidence: pick.confidence,
          alternatives: pick.alternatives,
          score: pick.score,
        }),
        { headers: { "Content-Type": "application/json" } }
      )
    }

    // Step 6: last resort — pattern guess on the university's domain.
    // Only fires when the domain actually accepts mail (MX check), and is
    // clearly labelled so the UI shows it as a guess, never a verified find.
    if (expectedDomain) {
      const guess = await patternGuess(researcherName, expectedDomain, { academic: true })
      if (guess) {
        return new Response(
          JSON.stringify({
            email: guess.best,
            source: "pattern_guess",
            confidence: 20,
            evidence: `No published address found; this is the most common .edu pattern for ${expectedDomain} (domain verified to accept mail).`,
            alternatives: guess.alternatives,
            score: 0,
          }),
          { headers: { "Content-Type": "application/json" } }
        )
      }
    }

    return new Response(
      JSON.stringify({
        email: "",
        source: "none",
        confidence: 0,
        alternatives: [],
      }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 })
  }
}
