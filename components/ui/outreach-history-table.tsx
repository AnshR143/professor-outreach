"use client"
import * as React from "react"
import { motion, type Variants } from "framer-motion"
import Link from "next/link"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"

export type ActivityKind =
  | "email_sent"
  | "researcher_found"
  | "contact_added"
  | "status_changed"
  | "note_added"
  | "profile_updated"
  | "internship_email_sent"
  | "internship_status_changed"

export interface OutreachActivityRow {
  id: string
  /** Subject of the activity — researcher name or company name */
  subject: string
  /** Optional link target — clicking the row goes here */
  href: string | null
  /** Secondary identifier — university for research, role/contact for internship */
  context: string
  /** Activity description (already humanized) */
  description: string
  /** ISO timestamp */
  createdAt: string
  /** "Research" or "Internship" — which tab generated this row */
  category: "research" | "internship"
  /** Kind tag — drives the badge variant */
  kind: ActivityKind
}

export type OutreachColumn = "subject" | "context" | "category" | "kind" | "description" | "date"

interface Props {
  rows: OutreachActivityRow[]
  visibleColumns: Set<OutreachColumn>
}

// Tag → palette badge variant. Greens for outreach progress, navy for discovery,
// amber for status pivots. Keep this list in sync with ActivityKind.
const kindBadge = cva("capitalize", {
  variants: {
    kind: {
      email_sent: "bg-[#dcfce7] text-[#15803d]",
      internship_email_sent: "bg-[#dcfce7] text-[#15803d]",
      researcher_found: "bg-[#d8e1e8] text-[#304674]",
      contact_added: "bg-[#fef3c7] text-[#b45309]",
      status_changed: "bg-[#fef9c3] text-[#854d0e]",
      internship_status_changed: "bg-[#fef9c3] text-[#854d0e]",
      note_added: "bg-[#f3e8ff] text-[#7c3aed]",
      profile_updated: "bg-[#f1f5f9] text-[#475569]",
    },
  },
  defaultVariants: { kind: "profile_updated" },
})

const KIND_LABEL: Record<ActivityKind, string> = {
  email_sent: "Email Sent",
  internship_email_sent: "Email Sent",
  researcher_found: "Researcher Found",
  contact_added: "Contact Added",
  status_changed: "Status Changed",
  internship_status_changed: "Status Changed",
  note_added: "Note Added",
  profile_updated: "Profile Updated",
}

const HEADERS: { key: OutreachColumn; label: string }[] = [
  { key: "subject", label: "Subject" },
  { key: "context", label: "Context" },
  { key: "category", label: "Category" },
  { key: "kind", label: "Activity" },
  { key: "description", label: "Description" },
  { key: "date", label: "Date" },
]

function initials(name: string) {
  return name
    .split(/\s+/)
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?"
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

const rowMotion: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: Math.min(i * 0.03, 0.4), duration: 0.25, ease: "easeOut" },
  }),
}

export function OutreachHistoryTable({ rows, visibleColumns }: Props) {
  const cols = HEADERS.filter(h => visibleColumns.has(h.key))

  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white shadow-sm">
      <div className="relative w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {cols.map(h => (
                <TableHead key={h.key}>{h.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((r, i) => (
                <motion.tr
                  key={r.id}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={rowMotion}
                  className="border-b border-[#e2e8f0] transition-colors hover:bg-[#f8f9fb]"
                >
                  {visibleColumns.has("subject") && (
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{initials(r.subject)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          {r.href ? (
                            <Link
                              href={r.href}
                              className="flex items-center gap-1 truncate font-semibold text-[#0f172a] hover:text-[#304674]"
                            >
                              <span className="truncate">{r.subject}</span>
                              <ExternalLink className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                            </Link>
                          ) : (
                            <span className="truncate font-semibold text-[#0f172a]">{r.subject}</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  )}

                  {visibleColumns.has("context") && (
                    <TableCell className="text-[#64748b]">
                      <span className="block max-w-[220px] truncate">{r.context || "—"}</span>
                    </TableCell>
                  )}

                  {visibleColumns.has("category") && (
                    <TableCell>
                      <Badge variant={r.category === "research" ? "secondary" : "outline"}>
                        {r.category === "research" ? "Research" : "Internship"}
                      </Badge>
                    </TableCell>
                  )}

                  {visibleColumns.has("kind") && (
                    <TableCell>
                      <Badge className={cn(kindBadge({ kind: r.kind }), "border-transparent")}>
                        {KIND_LABEL[r.kind] ?? r.kind.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                  )}

                  {visibleColumns.has("description") && (
                    <TableCell className="text-[#64748b]">
                      <span className="block max-w-[360px] truncate">{r.description || "—"}</span>
                    </TableCell>
                  )}

                  {visibleColumns.has("date") && (
                    <TableCell className="whitespace-nowrap text-[#94a3b8]">
                      {formatDate(r.createdAt)}
                    </TableCell>
                  )}
                </motion.tr>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={cols.length || 1} className="h-24 text-center text-[#94a3b8]">
                  No activity yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export const ALL_OUTREACH_COLUMNS: OutreachColumn[] = [
  "subject",
  "context",
  "category",
  "kind",
  "description",
  "date",
]
