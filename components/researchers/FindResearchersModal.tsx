"use client"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader9 } from "@/components/ui/loader-9"

interface Props {
  onClose: () => void
  initialKeyword?: string
}

// Full academic disciplines database (1074 fields from all disciplines)
const FIELD_SUGGESTIONS = [
  "Abnormal psychology", "Accelerator physics", "Accompanying", "Accounting", "Acoustical engineering", "Acoustics",
  "Acting", "Actuarial science", "Administrative law", "Admiralty law", "Advertising", "Aerobiology",
  "Aerodynamics", "Aeronautics", "Aerospace engineering", "Aesthetics", "Affine geometry", "African history",
  "African studies", "Agricultural economics", "Agricultural education", "Agricultural engineering", "Agricultural policy", "Agriculture",
  "Agroecology", "Agronomy", "Agrophysics", "AI ethics", "AI safety", "Algebra",
  "Algebraic geometry", "Algebraic number theory", "Algebraic topology", "Algorithms", "Alternative medicine", "American history",
  "American politics", "American studies", "Analysis", "Analytic number theory", "Analytical chemistry", "Analytical sociology",
  "Anatomy", "Ancient Chinese history", "Ancient Egypt", "Ancient Greek history", "Ancient history", "Ancient Roman history",
  "Animal husbandry", "Animal rights", "Animation", "Anthropological linguistics", "Anthropology", "Anthropology of Religion",
  "API design", "Applied arts", "Applied ethics", "Applied linguistics", "Applied mathematics", "Applied philosophy",
  "Applied physics", "Applied psychology", "Applied sociology", "Approximation theory", "Aquaculture", "Arcade game",
  "Archaeoastronomy", "Archaeogenetics", "Archaeological theory", "Archaeology", "Archaeometry", "Architectural analytics",
  "Architecture", "Architecture and design", "Archival science", "Area studies", "Arithmetic", "Art education",
  "Art History", "Artificial intelligence", "Artificial neural networks", "Asian history", "Asian studies", "Astrobiology",
  "Astrochemistry", "Astrometry", "Astronautics", "Astronomy", "Astrophysics", "Athletic training",
  "Atmospheric chemistry", "Atmospheric science", "Atomic physics", "Audio game", "Audio processing", "Audiology",
  "Augmented reality", "Australian history", "Automata theory", "Automated reasoning", "Automotive engineering", "Bacteriology",
  "Bariatric surgery", "Behavioral economics", "Behavioral neuroscience", "Behavioral sociology", "Behavioural geography", "Bibliometrics",
  "Bilingual education", "Bioarchaeology", "Biochemical engineering", "Biochemistry", "Biocultural anthropology", "Bioeconomics",
  "Bioengineering", "Bioethics", "Biogeography", "Bioinformatics", "Biological anthropology", "Biological psychology",
  "Biology", "Biomaterials", "Biomechanical engineering", "Biomechanics", "Biomedical engineering", "Biomolecular engineering",
  "Bionics", "Biophysics", "Biopolitics", "Biostatistics", "Biotechnology", "Blockchain",
  "Botany", "Brazilian history", "British history", "Broadcast journalism", "Business", "Business administration",
  "Business analysis", "Business ethics", "Business intelligence", "Business law", "Calculus", "Calligraphy",
  "Canadian history", "Canon law", "Cardiac surgery", "Cardiology", "Cartography", "Cataloging",
  "Catalysts", "Category theory", "Celestial mechanics", "Cell biology", "Ceramic engineering", "Chamber music",
  "Chaos theory", "Chemical biology", "Chemical engineering", "Chemical physics", "Chemistry", "Chemistry education",
  "Child welfare", "Chinese history", "Choral conducting", "Choreography", "Chronobiology", "Church music",
  "Citation analysis", "Civics", "Civil engineering", "Civil law", "Civil service", "Classical physics",
  "Classification", "Climate science", "Climatology", "Clinical pathology", "Clinical physiology", "Clinical psychology",
  "Cloud computing", "Coastal engineering", "Coastal geography", "Coastal management", "Coding theory", "Cognitive anthropology",
  "Cognitive biology", "Cognitive psychology", "Cognitive science", "Collections care", "Combinatorics", "Communication design",
  "Communication studies", "Community organizing", "Community psychology", "Commutative algebra", "Comparative anatomy", "Comparative education",
  "Comparative law", "Comparative politics", "Comparative psychology", "Comparative religion", "Complex analysis", "Complex systems",
  "Complexity economics", "Composition studies", "Computability theory", "Computational archaeology", "Computational astrophysics", "Computational biology",
  "Computational chemistry", "Computational complexity theory", "Computational economics", "Computational geometry", "Computational linguistics", "Computational mathematics",
  "Computational Neuroscience", "Computational physics", "Computational sociology", "Computer architecture", "Computer engineering", "Computer graphics",
  "Computer networking", "Computer science", "Computer vision", "Computer-aided design", "Computer-aided engineering", "Condensed matter physics",
  "Conducting", "Conservation biology", "Conservation science", "Constitutional law", "Construction", "Consumer economics",
  "Consumer education", "Consumer psychology", "Control engineering", "Control systems engineering", "Control theory", "Convex geometry",
  "Cooking", "Corporate governance", "Corporate law", "Corrosion engineering", "Cosmetology", "Cosmology",
  "Counseling psychology", "Craft", "Criminal justice", "Criminal law", "Criminal psychology", "Criminology",
  "Cryogenics", "Cryptanalysis", "Cryptocurrency", "Cryptography", "Crystallography", "Cuisine",
  "Culinary Arts", "Cultural anthropology", "Cultural geography", "Cultural history", "Cultural policy", "Cultural psychology",
  "Cultural sociology", "Cultural studies", "Curriculum and instruction", "Cybernetics", "Cytology", "Dance",
  "Dance notation", "Data engineering", "Data mining", "Data science", "Data storage", "Data structures",
  "Data visualization", "Database", "Database management", "Decision science", "Decision theory", "Decorative arts",
  "Deep learning", "Demography", "Dendrochronology", "Dental surgery", "Dentistry", "Dermatology",
  "Design of experiments", "Development economics", "Development geography", "Developmental biology", "Developmental psychology", "DevOps",
  "Differential algebra", "Differential psychology", "Differential topology", "Diffusion models", "Digital anthropology", "Digital archaeology",
  "Digital art", "Digital humanities", "Digital journalism", "Digital preservation", "Digital sociology", "Directing",
  "Disaster research", "Discourse analysis", "Discrete geometry", "Distance education", "Distributed algorithms", "Distributed computing",
  "Distributed systems", "Dramaturgy", "Drawing", "Drug discovery", "Dynamical systems", "E-Business",
  "Early childhood education", "Early music", "Earth science", "Earthquake engineering", "East Asian studies", "Ecological anthropology",
  "Ecological economics", "Ecological engineering", "Ecological psychology", "Ecology", "Econometrics", "Economic anthropology",
  "Economic geography", "Economic history", "Economic sociology", "Economics", "Education", "Education economics",
  "Education policy", "Educational psychology", "Educational sociology", "Educational technology", "Electrical engineering", "Electrochemistry",
  "Electromagnetism", "Electronic engineering", "Electronic game", "Electronics", "Elementary education", "Elementary particle physics",
  "Embryology", "Emergency management", "Emergency medicine", "Endocrinology", "Endodontics", "Energy economics",
  "Energy policy", "Engineering physics", "English studies", "Entomology", "Entrepreneurial economics", "Entrepreneurship",
  "Environmental anthropology", "Environmental archaeology", "Environmental chemistry", "Environmental economics", "Environmental engineering", "Environmental ethics",
  "Environmental geography", "Environmental history", "Environmental law", "Environmental management", "Environmental policy", "Environmental psychology",
  "Environmental science", "Environmental sociology", "Environmental studies", "Epidemiology", "Epigenetics", "Epistemology",
  "Ergodic theory", "Ergonomics", "Espionage", "Ethics", "Ethnic studies", "Ethnobotany",
  "Ethnochoreology", "Ethnography", "Ethnohistory", "Ethnolinguistics", "Ethnology", "Ethnomusicology",
  "Ethology", "Etymology", "Euclidean geometry", "European history", "European studies", "Evolutionary biology",
  "Evolutionary economics", "Evolutionary psychology", "Exercise physiology", "Exoplanetology", "Experimental economics", "Experimental psychology",
  "Explainable AI", "Extragalactic astronomy", "Fairness in AI", "Family and consumer science", "Family law", "Fashion",
  "Fashion design", "Federated learning", "Feminist anthropology", "Feminist economics", "Feminist sociology", "Field theory",
  "Film", "Film criticism", "Film studies", "Film theory", "Filmmaking", "Finance",
  "Financial economics", "Fine arts", "Fisheries management", "Fluid dynamics", "Fluid mechanics", "Food design",
  "Food engineering", "Food science", "Food studies", "Foreign policy", "Forensic anthropology", "Forensic archaeology",
  "Forensic biology", "Forensic chemistry", "Forensic pathology", "Forensic psychiatry", "Forensic psychology", "Forensic science",
  "Forestry", "Formal methods", "Fourier analysis", "Fractal geometry", "French history", "Functional analysis",
  "Futures studies", "Galactic astronomy", "Galaxy formation", "Game studies", "Game theory", "Gastroenterology",
  "Gastronomy", "Gemology", "Gender studies", "General relativity", "General systems theory", "General topology",
  "Generative AI", "Genetics", "Genomics", "Geoarchaeology", "Geobiology", "Geochemistry",
  "Geodesy", "Geographic information systems", "Geography", "Geology", "Geomatics", "Geometry",
  "Geomorphology", "Geophysics", "Geopolitics", "Geotechnical engineering", "Geriatrics", "German history",
  "Gerontology", "Glaciology", "Governmental affairs", "Grammar", "Grand strategy", "Graph neural networks",
  "Graph theory", "Graphic arts", "Graphic design", "Green chemistry", "Green economics", "Grid computing",
  "Group theory", "Growth economics", "Gynaecology", "Harmonic analysis", "Health economics", "Health geography",
  "Health informatics", "Health policy", "Health psychology", "Heat transfer", "Hematology", "Hepatology",
  "Herpetology", "High-energy astrophysics", "High-performance computing", "Higher education", "Histology", "Historic preservation",
  "Historical geography", "Historical linguistics", "Historical musicology", "Historical sociology", "History", "History of dance",
  "History of Religion", "History of theatre", "Holistic medicine", "Homological algebra", "Horticulture", "Housing",
  "Housing policy", "Human anatomy", "Human behavioral ecology", "Human biology", "Human ecology", "Human evolution",
  "Human geography", "Human physiology", "Human resources", "Human-computer interaction", "Humanistic psychology", "Hydraulic engineering",
  "Hydrodynamics", "Hydrology", "Hydroponics", "Ichthyology", "Image processing", "Immigration policy",
  "Immunology", "Indian history", "Indology", "Industrial design", "Industrial engineering", "Industrial organization",
  "Industrial relations", "Industrial sociology", "Infectious disease", "Information architecture", "Information economics", "Information literacy",
  "Information retrieval", "Information science", "Information systems", "Information technology", "Information theory", "Inorganic chemistry",
  "Instrumentation engineering", "Intellectual history", "Intensive care medicine", "Interaction design", "Interior architecture", "Interior design",
  "Interlinguistics", "Internal medicine", "International affairs", "International economics", "International law", "International relations",
  "International trade", "Internet", "Intuitionistic logic", "Japanese history", "Japanese studies", "Jazz studies",
  "Jewish studies", "Journalism", "Jurisprudence", "Kinematics", "Kinesiology", "Knowledge graphs",
  "Knowledge management", "Korean history", "Korean studies", "Labor economics", "Labor law", "Land management",
  "Landscape archaeology", "Landscape architecture", "Landscape design", "Landscape ecology", "Language education", "Large language models",
  "Laser physics", "Latin American history", "Law", "Law and economics", "Law enforcement", "Legal anthropology",
  "Legal education", "Legal psychology", "Leisure studies", "Lexicology", "Library science", "Limnology",
  "Linear algebra", "Linguistic typology", "Linguistics", "Literary journalism", "Live action", "Logic",
  "Logic in computer science", "Logic programming", "Logistics", "Machine learning", "Macroeconomics", "Mammalogy",
  "Management", "Management information systems", "Managerial economics", "Manufacturing engineering", "Marine biology", "Marine chemistry",
  "Marine engineering", "Marine transportation", "Maritime archaeology", "Marketing", "Marxian economics", "Mass communication",
  "Mass media", "Mass transit", "Materials engineering", "Materials science", "Mathematical biology", "Mathematical chemistry",
  "Mathematical economics", "Mathematical logic", "Mathematical physics", "Mathematical statistics", "Mathematics", "Mathematics education",
  "Measure theory", "Mechanical engineering", "Mechanics", "Mechatronics", "Media psychology", "Media studies",
  "Medical anthropology", "Medical education", "Medical imaging", "Medical physics", "Medical social work", "Medical sociology",
  "Medical toxicology", "Medicinal chemistry", "Medieval history", "Mental health", "Meta-ethics", "Metaphysics",
  "Meteorology", "Microbiology", "Microeconomics", "Microservices", "Middle Eastern studies", "Military engineering",
  "Military intelligence", "Military law", "Military medicine", "Military policy", "Military science", "Military sociology",
  "Mineral physics", "Mineralogy", "Mining engineering", "Mixed media", "Mixed reality", "Modal logic",
  "Model theory", "Modern history", "Molecular anthropology", "Molecular biology", "Molecular engineering", "Molecular genetics",
  "Molecular pathology", "Molecular physics", "Molecular virology", "Monetary economics", "Morphology", "Multilinear algebra",
  "Multivariate analysis", "Museology", "Music", "Music education", "Music genre", "Music theory",
  "Music therapy", "Musical composition", "Musical theatre", "Musicology", "Mycology", "Mythology and Folklore",
  "Nanoengineering", "Nanomaterials", "Nanotechnology", "Narratology", "Nationalism studies", "Natural language processing",
  "Natural resource management", "Naval architecture", "Naval engineering", "Naval science", "Navigation", "Nephrology",
  "Network science", "Neural engineering", "Neuroanthropology", "Neurochemistry", "Neuroeconomics", "Neurology",
  "Neurophysics", "Neuropsychology", "Neuroscience", "Neurosurgery", "Newspaper", "Non-Euclidean geometry",
  "Nuclear chemistry", "Nuclear engineering", "Nuclear physics", "Number theory", "Numerical analysis", "Nursing",
  "Nursing education", "Nutrition", "Nutritional anthropology", "Obstetrics", "Occupational psychology", "Occupational therapy",
  "Ocean engineering", "Oceanography", "Oncology", "Ontology", "Operating systems", "Operations management",
  "Operations research", "Ophthalmology", "Optical engineering", "Optics", "Optometry", "Orbital mechanics",
  "Orchestral conducting", "Orchestral studies", "Ordinary differential equations", "Organic chemistry", "Organizational communication", "Organizational psychology",
  "Organizational studies", "Organizational theory", "Organology", "Organometallic chemistry", "Ornithology", "Orthodontics",
  "Orthopedic surgery", "Osteopathy", "Otolaryngology", "Painting", "Paleoanthropology", "Paleobiology",
  "Paleoecology", "Paleontology", "Parallel algorithms", "Parallel computing", "Parasitology", "Partial differential equations",
  "Particle physics", "Pathology", "Peace and conflict studies", "Pediatrics", "Performance poetry", "Periodontics",
  "Personality psychology", "Petroleum engineering", "Petrology", "Pharmacology", "Pharmacy", "Philology",
  "Philosophical logic", "Philosophy", "Philosophy of art", "Philosophy of artificial intelligence", "Philosophy of economics", "Philosophy of education",
  "Philosophy of engineering", "Philosophy of history", "Philosophy of language", "Philosophy of law", "Philosophy of mathematics", "Philosophy of mind",
  "Philosophy of music", "Philosophy of psychology", "Philosophy of religion", "Philosophy of sciences", "Phonetics", "Phonology",
  "Photochemistry", "Photography", "Photonics", "Physical chemistry", "Physical cosmology", "Physical education",
  "Physical fitness", "Physical geography", "Physical therapy", "Physics", "Physics education", "Physiology",
  "Physiotherapy", "Phytopathology", "Piano", "Planetary geology", "Planetary science", "Plant science",
  "Plasma physics", "Plastic surgery", "Playwrighting", "Podiatry", "Police science", "Policy studies",
  "Political anthropology", "Political behavior", "Political culture", "Political economy", "Political geography", "Political history",
  "Political philosophy", "Political psychology", "Political science", "Political sociology", "Polymer chemistry", "Polymer engineering",
  "Polymer physics", "Polymer science", "Population genetics", "Population geography", "Positive psychology", "Power engineering",
  "Pragmatics", "Predictive analytics", "Prehistory", "Preventive medicine", "Primary care", "Primatology",
  "Print journalism", "Printmaking", "Probability theory", "Programming languages", "Projective geometry", "Proof theory",
  "Property law", "Proteomics", "Psychiatry", "Psychoanalysis", "Psychobiology", "Psycholinguistics",
  "Psychology", "Psychology of Religion", "Psychometrics", "Psychotherapy", "Public administration", "Public economics",
  "Public finance", "Public health", "Public history", "Public law", "Public policy", "Public relations",
  "Public safety", "Public speaking", "Pulmonology", "Puppetry", "Quality control", "Quantum chemistry",
  "Quantum computing", "Quantum field theory", "Quantum gravity", "Quantum information", "Quantum mechanics", "Quantum physics",
  "Quantum technology", "Quaternary science", "Radio", "Radiochemistry", "Radiology", "Randomized algorithms",
  "Real analysis", "Real estate economics", "Recommender systems", "Recording", "Records management", "Recursion theory",
  "Reference management", "Regression", "Regulation", "Rehabilitation medicine", "Rehabilitation psychology", "Reinforcement learning",
  "Relativity", "Reliability theory", "Religious studies", "Remote sensing", "Representation theory", "Research methods",
  "Resource economics", "Respiratory therapy", "Rhetoric", "Rheumatology", "Ring theory", "Risk management",
  "Robotics", "Russian history", "Sampling theory", "Scenography", "School psychology", "Science and technology studies",
  "Science education", "Science policy", "Science studies", "Scientific computing", "Scientific history", "Scientific visualization",
  "Sculpture", "Secondary education", "Seismology", "Semantics", "Semiconductors", "Semiotics",
  "Set theory", "Sex education", "Sexology", "Signal processing", "Simulation", "Singing",
  "Sinology", "Site reliability engineering", "Sleep medicine", "Social anthropology", "Social capital", "Social choice theory",
  "Social engineering", "Social network analysis", "Social policy", "Social psychology", "Social stratification", "Social theory",
  "Social work", "Sociocultural anthropology", "Sociolinguistics", "Sociology", "Sociology of aging", "Sociology of art",
  "Sociology of culture", "Sociology of deviance", "Sociology of education", "Sociology of gender", "Sociology of globalization", "Sociology of health",
  "Sociology of knowledge", "Sociology of law", "Sociology of music", "Sociology of organizations", "Sociology of race", "Sociology of Religion",
  "Sociology of science", "Sociology of technology", "Software engineering", "Soil chemistry", "Solid state physics", "South Asian studies",
  "Space architecture", "Spatial analysis", "Special education", "Special relativity", "Speech communication", "Speech recognition",
  "Speleology", "Spintronics", "Spoken word", "Sport psychology", "Sports biomechanics", "Sports journalism",
  "Sports medicine", "Stage design", "Star formation", "Statistical mechanics", "Statistical modelling", "Statistics",
  "Steganography", "Stochastic process", "Storytelling", "Strategic Management", "String theory", "Structural Biology",
  "Structural engineering", "Studio art", "Support vector machine", "Surgery", "Survey methodology", "Surveying",
  "Sustainability studies", "Sustainable development", "Synchronic linguistics", "Syntax", "Synthetic biology", "System dynamics",
  "Systematic musicology", "Systematics", "Systems analysis", "Systems biology", "Systems engineering", "Systems neuroscience",
  "Systems science", "Tax law", "Taxonomy", "Technical drawing", "Technical writing", "Technological history",
  "Technology policy", "Tectonics", "Telecommunications engineering", "Television", "Television studies", "Textile arts",
  "Textile design", "Textiles", "Theatre", "Theology", "Theoretical chemistry", "Theoretical computer science",
  "Theoretical physics", "Thermochemistry", "Thermodynamics", "Time series", "Topology", "Tort law",
  "Toxicology", "Traditional medicine", "Transfer learning", "Transformers", "Translation", "Transport geography",
  "Transportation", "Transportation engineering", "Trauma surgery", "Trigonometry", "Ubiquitous computing", "Universal algebra",
  "Urban geography", "Urban planning", "Urban sociology", "Urology", "User experience design", "User interface design",
  "Veterinary medicine", "Victimology", "Video games", "Virology", "Virtual reality", "Virtue ethics",
  "Visual arts", "Visual communication", "Viticulture", "VLSI design", "Vocational education", "Volcanology",
  "Waste management", "Welfare economics", "Wind ensemble conducting", "Wireless computing", "World history", "Zoology",
]

// Abbreviation aliases shown in parens
const ABBR_LABELS: Record<string, string> = {
  "Artificial Intelligence": "AI",
  "Machine Learning": "ML",
  "Deep Learning": "DL",
  "Natural Language Processing": "NLP",
  "Computer Vision": "CV",
  "Reinforcement Learning": "RL",
  "Data Science": "DS",
  "Computer Science": "CS",
  "Human-Computer Interaction": "HCI",
}

function getSuggestions(rawInput: string): string[] {
  const lastToken = rawInput.split(",").pop()?.trim().toLowerCase() ?? ""
  if (lastToken.length < 2) return []

  // 1) Prefix matches (highest priority)
  const prefix = FIELD_SUGGESTIONS.filter(f => f.toLowerCase().startsWith(lastToken))
  // 2) Word-start matches (e.g. "art" matches "Artificial Intelligence")
  const wordStart = FIELD_SUGGESTIONS.filter(f =>
    !prefix.includes(f) &&
    f.toLowerCase().split(/[\s\-]/).some(w => w.startsWith(lastToken))
  )
  // 3) Substring matches (lowest priority)
  const substr = FIELD_SUGGESTIONS.filter(f =>
    !prefix.includes(f) && !wordStart.includes(f) &&
    f.toLowerCase().includes(lastToken)
  )
  // 4) Abbreviation matches
  const abbrMatch = FIELD_SUGGESTIONS.filter(f => {
    const abbr = (ABBR_LABELS[f] ?? "").toLowerCase()
    return !prefix.includes(f) && !wordStart.includes(f) && !substr.includes(f) &&
      (abbr.startsWith(lastToken) || abbr === lastToken)
  })

  return [...prefix, ...wordStart, ...substr, ...abbrMatch].slice(0, 8)
}

export default function FindResearchersModal({ onClose, initialKeyword = "" }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<"config" | "loading" | "done">("config")
  const [form, setForm] = useState({
    universityText: "",
    keyword: initialKeyword,
    count: 5,
  })
  const [progress, setProgress] = useState({ found: 0, total: 0, current: "" })
  const [suggestion, setSuggestion] = useState("")
  const [error, setError] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIdx, setHighlightedIdx] = useState(-1)
  const keywordRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Close suggestions when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        keywordRef.current && !keywordRef.current.contains(e.target as Node) &&
        suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  function handleKeywordChange(value: string) {
    setForm(fm => ({ ...fm, keyword: value }))
    const s = getSuggestions(value)
    setSuggestions(s)
    setShowSuggestions(s.length > 0)
    setHighlightedIdx(-1)
  }

  function applySuggestion(suggestion: string) {
    // Replace the last token with the selected suggestion
    const parts = form.keyword.split(",")
    parts[parts.length - 1] = " " + suggestion
    const newVal = parts.join(",").replace(/^,\s*/, "")
    setForm(fm => ({ ...fm, keyword: newVal }))
    setShowSuggestions(false)
    setHighlightedIdx(-1)
    keywordRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions || suggestions.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightedIdx(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightedIdx(i => Math.max(i - 1, -1))
    } else if (e.key === "Enter" && highlightedIdx >= 0) {
      e.preventDefault()
      applySuggestion(suggestions[highlightedIdx])
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
    }
  }

  async function handleFind() {
    if (!form.keyword.trim() && !form.universityText.trim()) {
      setError("Enter at least one keyword or university to search.")
      return
    }
    setError("")
    setStep("loading")
    setSuggestion("")
    setShowSuggestions(false)
    setProgress({ found: 0, total: form.count, current: "Analyzing your profile..." })

    const universities = form.universityText
      .split(",").map(s => s.trim()).filter(Boolean)
    const keywordList = form.keyword
      .split(",").map(s => s.trim()).filter(Boolean)

    try {
      const res = await fetch("/api/professors/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: keywordList,
          universities,
          keyword: form.keyword,
          count: form.count,
        }),
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error("No response stream")

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split("\n").filter(l => l.startsWith("data: "))
        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6))
            if (data.type === "progress") setProgress(data)
            if (data.type === "done") {
              if (data.suggestion) setSuggestion(data.suggestion)
              setStep("done")
              router.refresh()
            }
            if (data.type === "error") { setError(data.message); setStep("config") }
          } catch {}
        }
      }
    } catch (e: any) {
      setError(e.message || "Failed to find researchers")
      setStep("config")
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px",
    border: "1px solid #e2e8f0", borderRadius: 10,
    fontSize: 13, color: "#0f172a", outline: "none",
    background: "#f8f9fb", boxSizing: "border-box",
    transition: "border-color 0.15s",
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 560, border: "4px solid #000",
        maxHeight: "92vh", overflow: "auto", boxShadow: "12px 12px 0px rgba(0,0,0,1)" }}>

        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "3px solid #000",
          display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: "-0.02em" }}>Find Researchers</h2>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b", fontWeight: 500 }}>
              Match scores are calculated from your resume
            </p>
          </div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "2px solid #000", borderRadius: 8, cursor: "pointer", color: "#000", padding: "6px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "2px 2px 0px #000", transition: "all 0.1s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "translate(-1px, -1px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translate(0, 0)"}>
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        <div style={{ padding: "24px" }}>
          {step === "config" && (
            <div>
              {error && (
                <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 8,
                  padding: "10px 14px", color: "#dc2626", fontSize: 13, marginBottom: 16 }}>
                  {error}
                </div>
              )}

              {/* Keywords / Fields with autocomplete */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                  Keywords or research fields
                  <span style={{ color: "#94a3b8", fontWeight: 400 }}>  separate multiple with commas</span>
                </label>
                <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 8px", lineHeight: 1.5 }}>
                  Spelling and capitalisation don&apos;t matter. "AI", "artificial intelligence", and "machien lerning" all work.
                </p>

                {/* Input + dropdown wrapper */}
                <div style={{ position: "relative" }}>
                  <input
                    ref={keywordRef}
                    value={form.keyword}
                    onChange={e => handleKeywordChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                      const s = getSuggestions(form.keyword)
                      setSuggestions(s)
                      setShowSuggestions(s.length > 0)
                    }}
                    placeholder="e.g. machine learning, NLP, computer vision"
                    style={{ ...inputStyle, borderColor: showSuggestions ? "#304674" : "#e2e8f0",
                      borderBottomLeftRadius: showSuggestions ? 0 : 10,
                      borderBottomRightRadius: showSuggestions ? 0 : 10 }}
                    autoComplete="off"
                  />

                  {/* Suggestions dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div ref={suggestionsRef} style={{
                      position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
                      background: "#fff",
                      border: "1px solid #304674", borderTop: "1px solid #e2e8f0",
                      borderRadius: "0 0 10px 10px",
                      boxShadow: "0 8px 24px rgba(48, 70, 116,0.12)",
                      overflow: "hidden",
                    }}>
                      {suggestions.map((s, i) => (
                        <button
                          key={s}
                          onMouseDown={e => { e.preventDefault(); applySuggestion(s) }}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            width: "100%", padding: "8px 14px",
                            background: i === highlightedIdx ? "#d8e1e8" : "transparent",
                            border: "none", cursor: "pointer", textAlign: "left",
                            borderBottom: i < suggestions.length - 1 ? "1px solid #f1f5f9" : "none",
                            transition: "background 0.1s",
                          }}
                          onMouseEnter={() => setHighlightedIdx(i)}
                          onMouseLeave={() => setHighlightedIdx(-1)}
                        >
                          <span style={{ fontSize: 13, color: "#0f172a", fontWeight: 500 }}>{s}</span>
                          {ABBR_LABELS[s] && (
                            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400, marginLeft: 8,
                              background: "#f1f5f9", borderRadius: 4, padding: "1px 6px" }}>
                              {ABBR_LABELS[s]}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* University */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                  University
                  <span style={{ color: "#94a3b8", fontWeight: 400 }}>  optional, leave blank to search all</span>
                </label>
                <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 8px", lineHeight: 1.5 }}>
                  Comma-separate multiple. Fuzzy-matched  "stanfrod" and "carnegie melon" still work.
                </p>
                <input
                  value={form.universityText}
                  onChange={e => setForm(fm => ({ ...fm, universityText: e.target.value }))}
                  placeholder="e.g. Stanford, MIT, Carnegie Mellon"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "#304674")}
                  onBlur={e => (e.target.style.borderColor = "#e2e8f0")}
                />
              </div>

              {/* Count */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>
                  How many? <span style={{ color: "#304674", fontWeight: 700 }}>{form.count}</span>
                </label>
                <input type="range" min={1} max={5} step={1} value={form.count}
                  onChange={e => setForm(fm => ({ ...fm, count: Number(e.target.value) }))}
                  style={{ width: "100%", accentColor: "#304674" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                  <span>1</span><span>5 (max)</span>
                </div>
              </div>

              <button onClick={handleFind}
                style={{ width: "100%", padding: "12px", background: "#304674", color: "#fff",
                  border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                {form.keyword.trim()
                  ? `Search "${form.keyword.split(",")[0].trim()}${form.keyword.includes(",") ? "…" : ""}"  Find ${form.count} Researchers`
                  : `Find ${form.count} Researchers`}
              </button>
            </div>
          )}

          {/* Loading */}
          {step === "loading" && (
            <div style={{ textAlign: "center", padding: "48px 20px" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
                <Loader9 color="#304674" size="lg" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#0f172a", margin: "0 0 8px" }}>Matching Researchers...</h3>
              <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 20px" }}>{progress.current || "Comparing fields and resume keywords..."}</p>
              <div style={{ background: "#f1f5f9", borderRadius: 20, height: 6, overflow: "hidden", maxWidth: 300, margin: "0 auto" }}>
                <div style={{ height: "100%", background: "#304674", borderRadius: 20,
                  width: `${progress.total ? Math.max(8, (progress.found / progress.total) * 100) : 8}%`,
                  transition: "width 0.4s ease" }} />
              </div>
              <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 10 }}>{progress.found} / {progress.total || form.count} added</p>
            </div>
          )}

          {/* Done */}
          {step === "done" && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0fdf4",
                border: "2px solid #bbf7d0", display: "flex", alignItems: "center",
                justifyContent: "center", margin: "0 auto 20px" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>
                {progress.found === 0 ? "Search Complete" : `${progress.found} Researcher${progress.found !== 1 ? "s" : ""} Added`}
              </h3>
              <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 8px" }}>
                {progress.found === 0
                  ? (suggestion || "All matching professors are already in your list, or none were found. Try different keywords or clear university filters.")
                  : `${progress.found} new researcher${progress.found !== 1 ? "s" : ""} matched and added  ranked by field + resume fit.`}
              </p>
              {progress.found > 0 && (
                <p style={{ color: "#94a3b8", fontSize: 12, margin: "0 0 24px" }}>
                  Match scores reflect how closely each professor&apos;s work aligns with your keywords and resume.
                </p>
              )}
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button onClick={onClose}
                  style={{ padding: "10px 24px", background: "#304674", color: "#fff",
                    border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  View Researchers
                </button>
                <button onClick={() => { setStep("config"); setProgress({ found: 0, total: 0, current: "" }) }}
                  style={{ padding: "10px 24px", background: "#f1f5f9", color: "#475569",
                    border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  Search Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
