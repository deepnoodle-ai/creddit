---
name: prd
description: "Use this skill whenever the user wants to create, write, review, or improve a Product Requirements Document (PRD). Also use when the user asks to document product goals, user stories, acceptance criteria, or feature scope — or says things like 'write a spec', 'define requirements'. Use for both new PRDs and reviews/critiques of existing ones."
---

# PRD Skill

Create concise, high-quality PRDs that align teams on **what** to build and **why**. A PRD is an alignment tool, not a bureaucratic artifact. Every section should earn its place by reducing ambiguity or enabling better decisions.

**Important:** This skill produces PRDs. Do NOT start implementing.

## The Workflow

### Step 1: Clarify

Before writing, ask 3-5 essential clarifying questions where the user's prompt is ambiguous. Provide lettered options so users can respond quickly (e.g., "1A, 2C, 3B").

Focus questions on:
- **Problem/Goal:** What problem does this solve? Why now?
- **Target users:** Who is this for?
- **Core functionality:** What are the key actions?
- **Scope/Boundaries:** What should it NOT do?
- **Success criteria:** How do we know it worked?

Format:
```
1. What is the primary goal?
   A. Improve onboarding experience
   B. Increase retention
   C. Reduce support burden
   D. Other: [please specify]

2. Who is the target user?
   A. New users only
   B. All users
   C. Admin/power users
   D. Other: [please specify]
```

Skip this step if the user provides enough detail upfront or explicitly asks to skip it.

### Step 2: Generate the PRD

Use the structure below. Adapt section depth to the size of the effort — a small feature gets a 1-2 page PRD, a new product gets 3-5 pages. Cut sections that don't apply rather than filling them with filler.

### Step 3: Save

- **Format:** Markdown (`.md`)
- **Location:** `tasks/prd-[feature-name].md` (kebab-case)
- If a different output format or location is requested, use that instead.

## Core Principles

These guide every PRD this skill produces:

1. **Concise over comprehensive** — A PRD that gets read beats one that covers everything.
2. **Problems over solutions** — Lead with user pain and business context, not implementation.
3. **Evidence over assertions** — "Users struggle with X" is weak; "43% of support tickets cite X" is strong.
4. **Living over locked** — Mark incomplete sections `[WIP]` rather than filling them with platitudes.
5. **Exciting over exhaustive** — The best PRDs make the team *want* to build this.

## PRD Structure

### 1. Header

| Field | Content |
|-------|---------|
| Title | Descriptive name for the initiative |
| Author | PRD owner |
| Status | Draft / In Review / Approved |
| Last Updated | Date |
| Stakeholders | Key reviewers and sign-off status |

### 2. Problem & Opportunity

The most important section — it justifies the entire effort.

- What problem are you solving? For whom? Why now?
- Back it with evidence: support tickets, usage data, user interviews, competitive pressure
- What happens if you do nothing?

Don't describe the feature here — describe the world without it.

### 3. Goals & Success Metrics

Specific, measurable objectives. Not aspirations.

- **Primary metric:** The single number that tells you this worked
- **Secondary metrics:** Supporting indicators
- **Guardrail metrics:** Things that must NOT get worse

**Bad:** "Improve engagement." **Good:** "Increase weekly active usage by 15% within 90 days of launch."

### 4. Target Users

- Primary persona (optimized for when tradeoffs arise)
- Secondary personas (supported but not prioritized)

### 5. User Stories

Each story should be small enough to implement in one focused session.

Format:
```markdown
### US-001: [Short Title]
**Description:** As a [user], I want [feature] so that [benefit].

**Acceptance Criteria:**
- [ ] Specific, verifiable criterion
- [ ] Another criterion
```

Acceptance criteria must be testable. "Works correctly" is bad. "Button shows confirmation dialog before deleting" is good.

### 6. Functional Requirements

Numbered list of specific capabilities:

```
- FR-1: The system must allow users to [action]
- FR-2: When a user clicks X, the system must [response]
```

Be explicit and unambiguous. Write for the implementer — they may be a junior developer or an AI agent. Avoid jargon or explain it. Use concrete examples where helpful.

### 7. Non-Goals (Out of Scope)

What this feature will NOT include and why. This prevents scope creep and manages expectations. Also note future considerations — things intentionally deferred but worth designing for.

### 8. Dependencies & Risks

| Risk / Dependency | Impact | Mitigation |
|-------------------|--------|------------|
| Concrete example | What it blocks | How to address it |

Be honest about what could go wrong. Include both technical and business risks.

### 9. Assumptions & Constraints

- **Assumptions:** Things believed true but unverified (e.g., "Users have internet connectivity")
- **Constraints:** Hard limits on the solution space (budget, timeline, platform, regulatory)

### 10. Design Considerations *(optional)*

- UI/UX direction, rough wireframes, or key flows if they clarify intent
- Existing components to reuse
- Don't abdicate UX thinking, but don't over-prescribe either

### 11. Technical Considerations *(optional)*

- Known constraints, integration points, performance requirements
- Include only when genuinely relevant

### 12. Open Questions

Remaining unknowns or areas needing input. Better to surface these than hide them.

## Anti-Patterns

- **The "complete" but empty PRD** — Every section filled with generic content that helps no one. A focused half-draft beats a template of platitudes.
- **The solution masquerading as requirements** — Describing database schemas instead of user outcomes.
- **The novel** — 20+ pages no one reads. Break large efforts into a parent PRD and child specs.
- **Missing the other side** — Only presenting upside without tradeoffs or risks.
- **Delegating all thinking** — "Design: TBD" with no direction whatsoever.
- **No competitive context** — Building without understanding what alternatives users have today.

## Review Checklist

Before saving, verify:

- [ ] Could someone outside the planning meetings understand WHY we're building this?
- [ ] Are success metrics specific and measurable?
- [ ] Is scope clearly bounded (in and out)?
- [ ] Are user stories small, specific, and verifiable?
- [ ] Are functional requirements numbered and unambiguous?
- [ ] Does it address risks and tradeoffs honestly?
- [ ] Is it backed by evidence where possible?
- [ ] Would you be excited to build this after reading it?
- [ ] Is every section earning its place?

## When NOT to Write a PRD

- **Write a strategy doc / 1-pager instead** when still exploring the opportunity space and validating hypotheses.
- **Write a design/technical doc instead** when the problem is understood but you need to work through the approach.
