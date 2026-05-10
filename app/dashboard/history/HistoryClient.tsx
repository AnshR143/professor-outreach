"use client"
import { useMemo, useState } from "react"
import type { Activity } from "@/lib/supabase/types"
import FindResearchersModal from "@/components/researchers/FindResearchersModal"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  OutreachHistoryTable,
  ALL_OUTREACH_COLUMNS,
  type OutreachActivityRow,
  type OutreachColumn,
  type ActivityKind,
} from "@/components/ui/outreach-history-table"
import { Columns3, ListFilter, Search, Trash2 } from "lucide-react"

interface Props {
  researchActivities: Activity[]
  internshipActivities: Activity[]
  userName: string
}

const KIND_OPTIONS: { value: ActivityKind | "all"; label: string }[] = [
  { value: "all", label: "All activity" },
  { value: "email_sent", label: "Email Sent" },
  { value: "researcher_found", label: "Researcher Found" },
  { value: "contact_added", label: "Contact Added" },
  { value: "status_changed", label: "Status Changed" },
  { value: "note_added", label: "Note Added" },
]

function toRow(a: Activity): OutreachActivityRow {
  const isInternship = a.category === "internship"
  // Map raw activity types onto the table's normalized ActivityKind set.
  const kind: ActivityKind = (() => {
    switch (a.type) {
      case "email_sent":
      case "internship_email_sent":
        return isInternship ? "internship_email_sent" : "email_sent"
      case "status_changed":
      case "internship_status_changed":
        return isInternship ? "internship_status_changed" : "status_changed"
      case "researcher_found":
      case "contact_added":
      case "note_added":
      case "profile_updated":
        return a.type as ActivityKind
      default:
        return "profile_updated"
    }
  })()
  return {
    id: a.id,
    subject: a.researcher_name || (isInternship ? "Unknown Contact" : "Unknown Researcher"),
    href: a.researcher_id
      ? (isInternship
          ? `/dashboard/internships/${a.researcher_id}`
          : `/dashboard/researchers/${a.researcher_id}`)
      : null,
    context: a.university || "",
    description: a.description || "",
    createdAt: a.created_at,
    category: isInternship ? "internship" : "research",
    kind,
  }
}

export default function HistoryClient({ researchActivities, internshipActivities }: Props) {
  const supabase = createClient()
  const [researchActs, setResearchActs] = useState(researchActivities)
  const [internshipActs, setInternshipActs] = useState(internshipActivities)
  const [activeTab, setActiveTab] = useState<"research" | "internships" | "all">("all")
  const [search, setSearch] = useState("")
  const [kindFilter, setKindFilter] = useState<ActivityKind | "all">("all")
  const [visibleColumns, setVisibleColumns] = useState<Set<OutreachColumn>>(
    new Set(ALL_OUTREACH_COLUMNS),
  )
  const [showFind, setShowFind] = useState(false)
  const [resetting, setResetting] = useState(false)

  const allRows = useMemo<OutreachActivityRow[]>(() => {
    const r = researchActs.map(toRow)
    const i = internshipActs.map(toRow)
    return [...r, ...i].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [researchActs, internshipActs])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allRows.filter(r => {
      if (activeTab !== "all" && r.category !== (activeTab === "research" ? "research" : "internship")) {
        return false
      }
      if (kindFilter !== "all" && r.kind !== kindFilter) return false
      if (!q) return true
      return (
        r.subject.toLowerCase().includes(q) ||
        r.context.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      )
    })
  }, [allRows, activeTab, kindFilter, search])

  async function resetHistory() {
    const scope =
      activeTab === "research" ? "research" : activeTab === "internships" ? "internship" : "all"
    if (!confirm(`Clear ${scope === "all" ? "all" : scope} activity history? This cannot be undone.`)) return
    setResetting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      let q = supabase.from("activities").delete().eq("user_id", user.id)
      if (scope === "research") q = q.or("category.eq.research,category.is.null")
      if (scope === "internship") q = q.eq("category", "internship")
      await q
      if (scope !== "internship") setResearchActs([])
      if (scope !== "research") setInternshipActs([])
    }
    setResetting(false)
  }

  function toggleColumn(c: OutreachColumn) {
    setVisibleColumns(prev => {
      const next = new Set(prev)
      next.has(c) ? next.delete(c) : next.add(c)
      return next
    })
  }

  const counts = {
    all: allRows.length,
    research: researchActs.length,
    internships: internshipActs.length,
  }

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-[#e2e8f0] bg-white px-7 py-4">
        <h1 className="m-0 text-lg font-bold text-[#0f172a]">History</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={resetHistory}
            disabled={resetting || counts.all === 0}
            title="Clear history"
            aria-label="Clear history"
            className="flex h-[30px] w-[30px] items-center justify-center rounded-md text-[#94a3b8] transition-colors hover:bg-[#fef2f2] hover:text-[#dc2626] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[#cbd5e1]"
          >
            <Trash2 className="h-[15px] w-[15px]" />
          </button>

        </div>
      </div>

      <div className="px-7 py-6">
        {/* Category toggle */}
        <div className="mb-5 inline-flex gap-1 rounded-lg bg-[#f1f5f9] p-1">
          {(["all", "research", "internships"] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex items-center gap-2 rounded-md px-4 py-1.5 text-[13px] font-semibold transition-colors ${
                activeTab === t
                  ? "bg-white text-[#0f172a] shadow-sm"
                  : "text-[#64748b] hover:text-[#0f172a]"
              }`}
            >
              {t === "all" ? "All" : t === "research" ? "Research" : "Internships"}
              <span className="rounded bg-[#e2e8f0] px-1.5 py-0.5 text-[10px] font-semibold text-[#475569]">
                {counts[t]}
              </span>
            </button>
          ))}
        </div>

        {/* Header strip */}
        <div className="mb-2">
          <h2 className="m-0 text-2xl font-bold text-[#0f172a]">Activity Timeline</h2>
          <p className="m-0 text-sm text-[#64748b]">
            Every email sent, contact added, and status change across your outreach.
          </p>
        </div>

        {/* Filter row */}
        <div className="mb-4 mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 gap-2">
            <Input
              placeholder="Search by name, university, company, or description…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-md"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <ListFilter className="h-3.5 w-3.5" />
                  {KIND_OPTIONS.find(o => o.value === kindFilter)?.label ?? "Activity"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Filter by activity</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {KIND_OPTIONS.map(opt => (
                  <DropdownMenuCheckboxItem
                    key={opt.value}
                    checked={kindFilter === opt.value}
                    onCheckedChange={() => setKindFilter(opt.value)}
                  >
                    {opt.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Columns3 className="h-3.5 w-3.5" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ALL_OUTREACH_COLUMNS.map(c => (
                <DropdownMenuCheckboxItem
                  key={c}
                  className="capitalize"
                  checked={visibleColumns.has(c)}
                  onCheckedChange={() => toggleColumn(c)}
                >
                  {c}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <OutreachHistoryTable rows={filtered} visibleColumns={visibleColumns} />
      </div>

      {showFind && <FindResearchersModal onClose={() => setShowFind(false)} />}
    </div>
  )
}
