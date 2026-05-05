/**
 * Rule-based lead scoring.
 *
 * The brief calls out specific signals:
 *   - rating < 4.2  → opportunity (room to help / honest reviews)
 *   - low review count → likely early-stage
 *   - no website → high opportunity (easy to "build the missing thing")
 *   - bad reviews → extract complaints
 *
 * We blend these into a 0–100 lead score plus a categorical tier (cold/warm/hot)
 * and a list of explanation strings the UI can render as chips. Keep this
 * deterministic — the LLM-flavoured "intern fit" score lives elsewhere.
 */

export interface LeadInputs {
  rating: number | null
  reviewCount: number | null
  hasWebsite: boolean
  emailCount: number          // from website scrape
  socialCount: number         // from website scrape
  complaints?: string[]       // optional, from review-analysis
  businessStatus?: string | null  // OPERATIONAL / CLOSED_TEMPORARILY etc.
}

export interface LeadScore {
  score: number               // 0-100
  tier: "cold" | "warm" | "hot"
  reasons: string[]           // human-readable signals that moved the needle
  flags: {
    earlyStage: boolean
    hasOpportunity: boolean
    lowQualityLead: boolean
    closed: boolean
  }
}

export function scoreLead(input: LeadInputs): LeadScore {
  const reasons: string[] = []
  let score = 50

  // ── Rating signals ─────────────────────────────────────────────────────────
  if (input.rating != null) {
    if (input.rating < 3.5) {
      score += 18
      reasons.push(`Low rating (${input.rating.toFixed(1)}) — clear opportunity to help`)
    } else if (input.rating < 4.2) {
      score += 10
      reasons.push(`Moderate rating (${input.rating.toFixed(1)}) — room to improve`)
    } else if (input.rating >= 4.7) {
      score -= 5
      reasons.push(`Very high rating (${input.rating.toFixed(1)}) — already polished`)
    }
  } else {
    reasons.push("No public rating yet")
    score += 4
  }

  // ── Review count → maturity proxy ─────────────────────────────────────────
  const rc = input.reviewCount ?? 0
  if (rc === 0) {
    score += 8
    reasons.push("No reviews yet — likely brand new")
  } else if (rc < 15) {
    score += 12
    reasons.push(`Only ${rc} reviews — early-stage`)
  } else if (rc < 100) {
    score += 6
    reasons.push(`${rc} reviews — small/medium business`)
  } else if (rc > 1000) {
    score -= 10
    reasons.push(`${rc}+ reviews — large/established`)
  }

  // ── Website signals ───────────────────────────────────────────────────────
  if (!input.hasWebsite) {
    score += 15
    reasons.push("No website — high opportunity to pitch web/marketing help")
  } else if (input.emailCount === 0 && input.socialCount === 0) {
    score += 6
    reasons.push("Has website but no contact info — direct outreach gap")
  } else if (input.emailCount > 0) {
    score += 4
    reasons.push(`Public email${input.emailCount > 1 ? "s" : ""} found — reachable`)
  }

  // ── Complaints ────────────────────────────────────────────────────────────
  if (input.complaints && input.complaints.length > 0) {
    score += Math.min(input.complaints.length * 4, 12)
    reasons.push(`Reviewers complain about: ${input.complaints.slice(0, 3).join(", ")}`)
  }

  // ── Business status (closed = noise, drop hard) ───────────────────────────
  const closed =
    input.businessStatus === "CLOSED_PERMANENTLY" ||
    input.businessStatus === "CLOSED_TEMPORARILY"
  if (closed) {
    score -= 40
    reasons.push("Business is closed — not actionable")
  }

  // ── Clamp + tier ──────────────────────────────────────────────────────────
  score = Math.max(0, Math.min(100, Math.round(score)))
  const tier: LeadScore["tier"] = score >= 70 ? "hot" : score >= 50 ? "warm" : "cold"

  const flags: LeadScore["flags"] = {
    earlyStage: rc < 15,
    hasOpportunity: !input.hasWebsite || (input.rating != null && input.rating < 4.2),
    lowQualityLead: !input.hasWebsite && input.emailCount === 0 && input.socialCount === 0,
    closed,
  }

  return { score, tier, reasons, flags }
}
