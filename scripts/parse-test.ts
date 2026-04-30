import fs from "fs"

const text = fs.readFileSync("data.txt", "utf-8")
const lines = text.split("\n").filter(l => l.trim().length > 0)

const results = []
for (const line of lines) {
  // Format: University NameProfessor NameResearch Areas__url__ or similar
  let url = ""
  let rest = line
  const urlMatch = line.match(/__(https?:\/\/[^_]+)__/)
  if (urlMatch) {
    url = urlMatch[1]
    rest = line.replace(urlMatch[0], "")
  } else if (line.includes("__http")) {
    const parts = line.split("__http")
    url = "http" + parts[1].replace(/__/g, "")
    rest = parts[0]
  } else {
    const parts = line.split("http")
    if (parts.length > 1) {
      url = "http" + parts.slice(1).join("http").replace(/__/g, "")
      rest = parts[0]
    }
  }

  // Heuristic: boundary between lower case letter (or ',') and upper case letter
  // Example: "University of PittsburghLiang ZhanComputational neuroimaging..."
  
  // Let's find boundaries
  let university = ""
  let name = ""
  let research = ""
  
  // Split by lower-case followed by upper-case
  // We can do this with a regex with capture groups, but it's tricky because there are multiple such boundaries.
  // We know "University" ends with some character. 
  // Let's just find the first Lower->Upper transition for University -> Name
  // And the second Lower->Upper transition for Name -> Research Area
  const boundaries = [...rest.matchAll(/([a-z\),])([A-Z])/g)]
  
  if (boundaries.length >= 2) {
    // 1st boundary is end of university, start of name
    const b1 = boundaries[0]
    university = rest.substring(0, b1.index + 1)
    
    // We need to be careful, sometimes the name has a middle initial "Yi R. (May) FungLanguage" -> multiple boundaries!
    // Let's look for known keywords if possible, or use a better heuristic
    
    // Actually, name is usually 2 or 3 words.
    // Let's just send chunks to Groq via the Groq SDK already in the project!
    // We can do it!
  }
}
