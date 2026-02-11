---
name: planning-models
description: "Comprehensive analysis of human planning frameworks, methodologies, and mental models across domains and complexity levels."
---

# How Humans Plan: Frameworks, Methodologies, and Mental Models

A comprehensive analysis of how humans plan actions to achieve goals across domains, timescales, and complexity levels.

## Part 1: Cognitive Foundations of Planning

### What Actually Happens When Humans Plan

Planning is fundamentally **mental simulation**—the ability to construct and manipulate representations of possible futures. This capacity depends on several cognitive systems working together.

**Prospective Memory and Mental Time Travel**

The hippocampus, which encodes episodic memories, also enables "episodic future thinking"—the ability to project yourself into imagined scenarios. Planning literally reuses the machinery of memory to simulate futures. This is why people with hippocampal damage struggle both to remember the past and to imagine detailed futures.

**Working Memory as a Constraint**

Human working memory holds roughly 4±1 chunks simultaneously. This hard limit shapes all planning: we can only consciously manipulate a few elements at once. Effective planning frameworks essentially work around this constraint through:

- **Externalization**: Writing things down
- **Chunking**: Grouping elements into meaningful units
- **Sequential processing**: Handling complexity in stages

**The Prefrontal Cortex as Executive**

The dorsolateral prefrontal cortex maintains goals across time and inhibits immediate responses in favor of planned action. Damage here produces "dysexecutive syndrome"—people can articulate goals but cannot organize action toward them. This suggests planning isn't just knowing what to do but maintaining the goal representation while executing.

### Expert vs. Novice Planning

Research across chess, medicine, firefighting, and software development reveals consistent patterns.

**Novices** tend to:
- Plan forward from current state
- Consider options serially
- Focus on surface features
- Create detailed step-by-step plans
- Struggle when plans fail

**Experts** tend to:
- Recognize patterns and apply known solutions
- Work backward from goal states
- Focus on deep structure
- Create flexible plans with contingencies
- Adapt fluidly when conditions change

The key insight: experts don't plan more—they plan differently. They've internalized so many patterns that much of what looks like intuition is actually rapid pattern-matching against a vast library of situations and responses.

### Common Planning Failures

| Failure Mode             | Description                                         | Root Cause                                                       |
| ------------------------ | --------------------------------------------------- | ---------------------------------------------------------------- |
| **Planning Fallacy**     | Systematically underestimating time, cost, and risk | Inside view: focusing on specific case rather than base rates    |
| **Scope Creep**          | Gradual expansion of goals during execution         | Failure to define success criteria; optimism about capacity      |
| **Analysis Paralysis**   | Inability to act due to excessive planning          | Perfectionism; uncertainty aversion; unclear decision criteria   |
| **Sunk Cost Trap**       | Continuing failed plans due to prior investment     | Loss aversion; identity attachment to original plan              |
| **Tunneling**            | Ignoring relevant information outside plan focus    | Cognitive load; confirmation bias                                |
| **Coordination Failure** | Misalignment between multiple agents                | Implicit assumptions; communication gaps; conflicting incentives |

## Part 2: Foundational Planning Frameworks

### Means-End Analysis

**Origin**: Cognitive science (Newell & Simon, 1963), derived from studying human problem-solving

**Core Mechanism**:
1. Identify current state
2. Identify goal state
3. Find largest difference between them
4. Find operator that reduces that difference
5. If operator can be applied, do so; if not, create subgoal
6. Recurse until current state equals goal state

**Assumptions**:
- States can be meaningfully compared
- Differences can be identified and prioritized
- Operators exist that reduce differences
- Subproblems are more tractable than the whole

**Failure Modes**:
- Gets stuck in local optima
- Struggles when you must temporarily move away from goal
- Assumes you can decompose problems meaningfully
- Doesn't handle uncertainty or changing goals

**Complementary Approaches**: Backward chaining, analogical reasoning

**Example**: Debugging code—identify the bug (difference), find what could cause it, narrow down, apply fix.

### Backward Chaining

**Origin**: AI/Logic (production systems, expert systems), also ancient in rhetoric and military planning

**Core Mechanism**:
1. Start with goal state
2. Ask: "What must be true immediately before?"
3. Those preconditions become subgoals
4. Recurse until you reach current state or known operations
5. Execute forward

**Assumptions**:
- Goal state is clearly defined
- Preconditions can be identified
- Causal relationships are known and stable
- Actions have predictable effects

**Failure Modes**:
- Requires clear goal specification
- Doesn't work when you don't know what you want
- Assumes deterministic or near-deterministic causation
- Can miss creative solutions that don't follow logical chains

**Complementary Approaches**: Forward planning for exploration; scenario planning for uncertainty

**Example**: Planning a product launch—what must be true on launch day? Work backward through milestones: manufacturing complete → production started → design finalized → specifications locked → requirements gathered.

### PDCA (Plan-Do-Check-Act) / Deming Cycle

**Origin**: Walter Shewhart and W. Edwards Deming, manufacturing quality control (1930s-1950s)

**Core Mechanism**:
1. **Plan**: Identify problem, analyze root causes, develop hypothesis for improvement
2. **Do**: Implement change on small scale; collect data
3. **Check**: Analyze results against expectations
4. **Act**: If successful, standardize; if not, learn and repeat

**Assumptions**:
- Reality can be experimented upon safely
- Effects can be measured
- Learning can be captured and applied
- Small changes are representative of large changes

**Failure Modes**:
- Too slow for rapidly changing environments
- Overhead not justified for simple problems
- Can become bureaucratic ritual
- Assumes ability to run controlled experiments

**Complementary Approaches**: A3 thinking, root cause analysis, statistical process control

**Example**: Improving customer support response time—hypothesize templates help, test with one agent, measure impact, roll out if effective.

### Theory of Constraints (TOC)

**Origin**: Eliyahu Goldratt, manufacturing (The Goal, 1984)

**Core Mechanism**:
1. **Identify** the constraint (bottleneck limiting throughput)
2. **Exploit** the constraint (maximize its utilization)
3. **Subordinate** everything else (non-constraints should serve the constraint)
4. **Elevate** the constraint (invest to increase its capacity)
5. **Repeat** (find the new constraint)

**Assumptions**:
- Systems have constraints
- Constraints can be identified
- Local optimization is often counterproductive
- Throughput matters more than efficiency

**Failure Modes**:
- Constraint may be hard to identify (could be policy, market, or mindset)
- Elevation may create new problems
- Requires systems thinking most people lack
- Political resistance to subordination

**Complementary Approaches**: Lean thinking, value stream mapping, drum-buffer-rope scheduling

**Example**: Software team with QA as bottleneck—don't hire more developers; instead, add QA automation, have developers write better tests, and batch QA reviews.

### OODA Loop

**Origin**: John Boyd, military strategy (1970s-1980s), derived from air combat analysis

**Core Mechanism**:
1. **Observe**: Gather information from environment
2. **Orient**: Analyze and synthesize; update mental models; recognize patterns
3. **Decide**: Select course of action
4. **Act**: Execute; action changes environment, creating new observations

The critical insight: **Orient** is the center of gravity. It's where previous experience, cultural traditions, genetic heritage, and new information synthesize into understanding. The side that can complete the loop faster gains the advantage.

**Assumptions**:
- Faster adaptation beats better planning
- Confusion and disruption of opponent's OODA loop is valid strategy
- Mental models can be updated quickly enough to matter
- Action generates information

**Failure Modes**:
- Speed can degrade quality of orientation
- Works best in adversarial/competitive contexts
- Assumes the ability to observe and act quickly
- Can lead to tactical thrashing without strategic coherence

**Complementary Approaches**: Red teaming, wargaming, reconnaissance pull

**Example**: Startup competing with incumbents—rapid iteration, customer feedback loops, and pivots beat detailed long-range planning.

### Wardley Mapping

**Origin**: Simon Wardley, technology strategy (2005-present)

**Core Mechanism**:
1. Map value chain: What user needs → What capabilities deliver that → What components enable capabilities
2. Plot each component on evolution axis: Genesis → Custom-built → Product → Commodity
3. Analyze movement: Everything evolves toward commodity
4. Strategic plays: Build differentiators on evolved infrastructure; commoditize what competitors differentiate on

**Assumptions**:
- All components evolve predictably
- Position in value chain affects strategic options
- Situational awareness precedes strategy
- Maps are communication tools as much as analysis tools

**Failure Modes**:
- Requires significant expertise to create good maps
- Evolution pace can be misjudged
- Focuses on technology components; less clear for other domains
- Can become analysis tool rather than action driver

**Complementary Approaches**: Porter's Five Forces, business model canvas, tech radar

**Example**: Deciding build vs. buy—map your architecture; anything that's commodity (compute, storage, auth) should be bought; invest in things still in product/custom phases that differentiate you.

### Effectuation

**Origin**: Saras Sarasvathy, entrepreneurship research (2001)

**Core Mechanism**:
Five principles:
1. **Bird in Hand**: Start with what you have (who you are, what you know, whom you know)
2. **Affordable Loss**: Commit what you can afford to lose, not what you need to gain
3. **Lemonade Principle**: Leverage surprises rather than avoiding them
4. **Crazy Quilt**: Build partnerships that commit stakeholders and shape goals
5. **Pilot in the Plane**: Focus on controllable aspects; don't predict the unpredictable

**Assumptions**:
- Future is unknowable but shapeable
- Prediction is often impossible in nascent markets
- Co-creation with stakeholders generates outcomes
- Commitment drives opportunity

**Failure Modes**:
- Doesn't work when prediction is possible (established markets)
- Can justify aimlessness
- Requires entrepreneurial agency
- Partnership dependency can dilute vision

**Complementary Approaches**: Lean startup, customer development, bricolage

**Example**: Rather than researching the perfect business idea, talk to your network, find a paying customer for something you can already do, and let the business evolve from there.

## Part 3: Domain-Specific Frameworks

### Military/Strategic Planning

**Campaign Planning (Military Decision-Making Process)**

A structured methodology for military operations involving mission analysis, course of action development, comparison and selection, and orders production. Key insight: the "commander's intent" allows distributed decision-making when plans fail.

**Key Techniques**:
- **Red Teaming**: Dedicated adversarial analysis
- **Wargaming**: Simulating courses of action against reactive opponents
- **Branch and Sequel Planning**: Contingency plans for likely deviations
- **Center of Gravity Analysis**: Identifying critical sources of power

**When to Use**: High-stakes, adversarial, uncertain environments where coordination across many agents is required.

### Business/Operations Planning

**OKRs (Objectives and Key Results)**

**Origin**: Andy Grove at Intel, popularized by Google

**Mechanism**: 
- Objectives: Qualitative, inspirational direction
- Key Results: Quantitative measures of progress (3-5 per objective)
- Typically set quarterly with annual strategic objectives

**Key Insight**: Separates direction (objective) from measurement (key results), allowing clear success criteria while maintaining meaning.

**Failure Modes**: Becomes bureaucratic; key results gamed; objectives too vague to guide; cascade creates misalignment.

**Roadmapping**

Visual representation of planned deliverables over time. Types include:
- **Feature roadmaps**: What we'll build when
- **Technology roadmaps**: Platform evolution
- **Market roadmaps**: Customer and segment evolution
- **Strategy roadmaps**: Initiative phasing

**Key Insight**: The map is a communication tool; the planning process builds alignment.

**Failure Modes**: Treated as commitment rather than plan; dates become promises; sequence becomes rigid.

### Software/Systems Planning

**Agile Planning**

**Core Principles**:
- Working software over comprehensive documentation
- Responding to change over following a plan
- Individuals and interactions over processes and tools
- Customer collaboration over contract negotiation

**Mechanisms**:
- **Sprint Planning**: 1-4 week iterations with defined scope
- **Backlog Refinement**: Continuous prioritization and estimation
- **Retrospectives**: Learning loops after each iteration
- **Daily Standups**: Coordination and impediment identification

**Key Insight**: Embrace that requirements will change; make small bets frequently; learn from delivery.

**Failure Modes**: Used as micromanagement tool; "agile theater" without substance; technical debt accumulation.

**Architecture Decision Records (ADRs)**

Lightweight documentation of significant architectural decisions.

**Format**:
- Context: What's the situation?
- Decision: What are we going to do?
- Consequences: What results from this decision?

**Key Insight**: Decision rationale matters as much as the decision; future readers (including yourself) need to understand why.

### Personal/Productivity Planning

**Getting Things Done (GTD)**

**Origin**: David Allen (2001)

**Core Mechanism**:
1. **Capture**: Get everything out of your head into a trusted system
2. **Clarify**: Process each item: Is it actionable? If so, what's the next action?
3. **Organize**: Put items in appropriate lists (projects, waiting, someday/maybe, reference)
4. **Reflect**: Weekly review to keep system current
5. **Engage**: Do work from your lists based on context, time, energy, priority

**Key Insight**: Your mind is for having ideas, not holding them. The "next action" question cuts through overwhelm.

**Failure Modes**: System maintenance becomes work itself; captures too much; weekly review skipped.

**Time-Boxing**

Allocating fixed time blocks to activities, with work expanding or contracting to fit.

**Key Insight**: Parkinson's Law in reverse—constraints force efficiency and prioritization.

**Variations**:
- Pomodoro Technique (25-minute focused blocks)
- Day theming (Mondays for meetings, Tuesdays for deep work)
- Calendar blocking (protecting time for important work)

### Scientific/Research Planning

**Hypothesis-Driven Development**

Apply scientific method to product/business decisions.

**Mechanism**:
1. Observe phenomenon or problem
2. Form hypothesis (If we do X, we expect Y because Z)
3. Design experiment to test hypothesis
4. Run experiment; collect data
5. Analyze results; accept, reject, or refine hypothesis
6. Iterate

**Key Insight**: Forces explicit statement of beliefs and success criteria before action.

**Failure Modes**: Experiments too slow for business pace; confirmation bias in interpretation; hypothesis can't be tested.

### Creative/Design Planning

**Design Thinking**

**Origin**: IDEO, Stanford d.school

**Phases**:
1. **Empathize**: Understand users deeply
2. **Define**: Frame the problem to solve
3. **Ideate**: Generate many possible solutions
4. **Prototype**: Build quick representations of ideas
5. **Test**: Get feedback; iterate

**Key Insight**: Divergent and convergent thinking alternate; prototype to think, not just to validate.

**Failure Modes**: Becomes theater; empathy phase skipped; prototypes too polished; testing not rigorous.

## Part 4: Planning Under Different Conditions

### By Uncertainty Level

**Deterministic Environments**

When cause and effect are clear and predictable.

**Appropriate Approaches**:
- Critical Path Method: Identify longest sequence of dependent tasks
- Gantt Charts: Visual timeline of activities and dependencies
- Resource Leveling: Smooth resource usage across time
- Optimization: Mathematical methods to find best solution

**Example**: Construction project sequencing, manufacturing scheduling

**Probabilistic Environments**

When outcomes have known or estimable probability distributions.

**Appropriate Approaches**:
- Monte Carlo Simulation: Run thousands of scenarios; analyze distribution
- Decision Trees: Map choices and chance outcomes; calculate expected values
- PERT (Program Evaluation and Review Technique): Optimistic, likely, and pessimistic estimates
- Real Options: Value flexibility; defer commitment where possible

**Example**: Financial planning, drug development pipelines

**Ambiguous Environments**

When the variables themselves are unknown or contested.

**Appropriate Approaches**:
- Scenario Planning: Develop multiple plausible futures; test strategies against each
- Assumption-Based Planning: Make assumptions explicit; identify trigger points
- Robust Decision-Making: Find strategies that perform acceptably across scenarios
- Probe and Learn: Small experiments to clarify the landscape

**Example**: Long-range corporate strategy, policy planning

**Chaotic Environments**

When cause and effect are only clear in retrospect.

**Appropriate Approaches**:
- Probe-Sense-Respond: Act first to generate data; analyze patterns; amplify what works
- Safe-to-Fail Experiments: Portfolio of small bets; expect some to fail
- Simplicity Rules: Few simple rules rather than complex plans
- Swarm Intelligence: Enable distributed decision-making with shared principles

**Example**: Crisis response, emerging markets, novel situations

### By Timescale

| Timescale                  | Planning Mode                             | Key Question                             | Tools                                     |
| -------------------------- | ----------------------------------------- | ---------------------------------------- | ----------------------------------------- |
| Reactive (seconds-minutes) | Pattern recognition; trained response     | What's the immediate right action?       | Heuristics, muscle memory, decision rules |
| Tactical (hours-days)      | Task decomposition; scheduling            | How do I get this done?                  | To-do lists, calendars, daily planning    |
| Operational (weeks-months) | Project management; milestones            | What sequence of work achieves the goal? | Project plans, sprints, OKRs              |
| Strategic (years)          | Portfolio management; capability building | What should we become?                   | Strategy maps, roadmaps, investment cases |
| Generational (decades+)    | Institution building; legacy              | What will outlast us?                    | Constitutions, endowments, culture        |

**Key Insight**: Different timescales require different planning approaches. A common error is applying tactical planning to strategic problems (too much detail) or strategic planning to tactical problems (too little action).

### By Agent Structure

**Individual Planning**

Self-regulation and personal effectiveness.

**Key Challenges**: Motivation, self-knowledge, cognitive biases, finite willpower

**Key Techniques**: Implementation intentions ("When X happens, I will do Y"), commitment devices, environment design, habit formation

**Team Coordination**

Small groups with shared goals.

**Key Challenges**: Communication overhead, role clarity, mutual adjustment, social loafing

**Key Techniques**: Shared mental models, clear ownership, regular synchronization, transparent progress

**Hierarchical/Organizational Planning**

Nested planning across organizational levels.

**Key Challenges**: Information loss in translation, incentive alignment, local vs. global optimization, pace of change vs. pace of coordination

**Key Techniques**: Commander's intent, cascading objectives, decentralized execution with centralized intent, feedback loops

**Multi-Stakeholder Negotiated Planning**

When goals must be negotiated among parties with different interests.

**Key Challenges**: Trust, information asymmetry, power imbalances, commitment credibility

**Key Techniques**: Integrative negotiation, coalition building, mechanism design, iterative commitment

**Adversarial Planning**

When others actively oppose your goals.

**Key Challenges**: Uncertainty about opponent actions, signaling and deception, escalation dynamics

**Key Techniques**: Game theory, red teaming, competitive intelligence, deterrence

## Part 5: Meta-Planning

### How to Plan the Planning Process

Before planning, answer:

1. **What type of problem is this?**
   - Simple (clear cause-effect) → Best practice
   - Complicated (cause-effect requires expertise) → Expert analysis
   - Complex (cause-effect only clear in retrospect) → Probe and sense
   - Chaotic (no clear cause-effect) → Act first, sense later

2. **What's the appropriate level of detail?**
   - High detail when: execution is delegated, coordination is complex, failure is costly, environment is stable
   - Low detail when: you'll be executing, situation is simple, rapid adaptation needed, environment is volatile

3. **Who needs to be involved?**
   - Those with critical information
   - Those who must execute
   - Those who can veto or obstruct
   - Those whose commitment strengthens the plan

4. **What's the planning horizon?**
   - Match to the decision's reversibility and the environment's predictability

5. **What's the review cadence?**
   - More frequent when: uncertainty is high, environment is changing, learning is rapid
   - Less frequent when: execution is stable, changes are costly, measurement is slow

### When NOT to Plan

**Indicators that planning is wasteful**:

- **Action is easily reversible**: Just try it
- **Thinking won't reduce uncertainty**: Only action generates needed information
- **Planning becomes procrastination**: Fear disguised as prudence
- **Environment will change faster than plan cycle**: Detailed plans obsolete before execution
- **You don't have the information**: Go gather it through action
- **The plan is for others' benefit**: Theater rather than tool

**The Action Bias Trap**: Sometimes the right answer is "stop planning, start doing." The cost of delay can exceed the benefit of better planning.

**The Analysis Paralysis Trap**: But sometimes the right answer is "stop doing, start thinking." The cost of rework can exceed the cost of more planning.

**How to tell the difference**: Ask "What would I learn from another hour of planning that I wouldn't learn from an hour of doing?" If planning produces diminishing returns, act.

### Tools and Artifacts That Aid Planning

| Tool                             | Purpose                                            | When to Use                          |
| -------------------------------- | -------------------------------------------------- | ------------------------------------ |
| Written plan document            | Clarify thinking; enable review; coordinate agents | Complex or multi-stakeholder efforts |
| Visual timeline (Gantt, roadmap) | Show sequence and dependencies                     | Time-sensitive coordination          |
| Checklist                        | Ensure nothing is forgotten                        | Repeatable processes with many steps |
| Decision log                     | Track rationale for choices                        | Complex decisions; distributed teams |
| Assumption register              | Make implicit beliefs explicit                     | Uncertain environments               |
| Risk register                    | Track potential problems and mitigations           | High-stakes efforts                  |
| RACI matrix                      | Clarify roles and responsibilities                 | Multi-person coordination            |
| Retrospective notes              | Capture learning for future                        | Iterative improvement                |

## Part 6: Universal Principles

Across all domains and frameworks, certain principles appear repeatedly.

### 1. Begin with the End in Mind

Clarity about goals precedes effective planning. This doesn't mean goals can't change—but you need to know what you're aiming at to make coherent choices.

### 2. Make Thinking Visible

Externalize plans through writing, diagrams, or discussion. This overcomes working memory limits, enables collaboration, and allows review.

### 3. Separate Divergent from Convergent Thinking

First explore options widely; then narrow to decision. Mixing these modes degrades both.

### 4. Plan to Learn, Not Just to Execute

The best plans generate information as they unfold. Build in checkpoints, metrics, and decision points.

### 5. Match Planning Detail to Uncertainty

Don't over-plan in volatile environments; don't under-plan when coordination is critical.

### 6. Account for Implementation

A plan that can't be executed is worthless. Include resource constraints, dependencies, and realistic timeframes.

### 7. Build in Feedback Loops

Plans improve through iteration. Create mechanisms to learn from execution and update the plan.

### 8. Communicate Intent, Not Just Tasks

People executing plans will face situations the planner didn't anticipate. If they understand the purpose, they can adapt intelligently.

### 9. Embrace Constraints

Constraints force creativity and focus. Don't plan as if you had unlimited resources.

### 10. Plan for Failure

Everything takes longer, costs more, and goes wrong in unexpected ways. Build slack, contingencies, and recovery procedures.

## Part 7: Decision Framework for Selecting Planning Approaches

### Quick Selection Guide

```
START
│
├── Is the outcome mostly predictable?
│   ├── YES: Use deterministic methods
│   │        (Critical path, Gantt, optimization)
│   │
│   └── NO: Can you estimate probabilities?
│       ├── YES: Use probabilistic methods
│       │        (Monte Carlo, decision trees, real options)
│       │
│       └── NO: Can you identify key uncertainties?
│           ├── YES: Use scenario-based methods
│           │        (Scenario planning, assumption-based planning)
│           │
│           └── NO: Use experimental methods
│                    (Probe-sense-respond, safe-to-fail)
│
├── What's the timescale?
│   ├── < 1 day: Light or no planning; heuristics; just-in-time decisions
│   ├── 1 day - 1 month: Task decomposition; sprint planning; to-do lists
│   ├── 1-12 months: Project planning; milestones; OKRs
│   ├── 1-5 years: Strategic planning; roadmaps; portfolio management
│   └── > 5 years: Scenario planning; capability building; institution design
│
├── How many agents are involved?
│   ├── Just you: Personal productivity methods (GTD, time-boxing)
│   ├── Small team: Agile methods; shared goals; regular sync
│   ├── Organization: Hierarchical planning; cascaded objectives; governance
│   └── Multi-stakeholder: Negotiated planning; coalition building
│
├── Is there an adversary?
│   ├── YES: Game-theoretic approaches; red teams; OODA loops
│   └── NO: Cooperative optimization
│
└── What's the cost of planning failure?
    ├── HIGH: More detailed planning; risk analysis; contingencies
    └── LOW: Lighter planning; bias toward action; iterate
```

## Part 8: Personal Planning Toolkit

Based on the above analysis, here's a practical toolkit for different situations.

### For One-Time Projects

1. **Define success**: What does "done" look like? How will you know?
2. **Work backward**: What must happen right before completion? And before that?
3. **Identify uncertainties**: What don't you know? What could go wrong?
4. **Create milestones**: Break into chunks with clear completion criteria
5. **Build in review points**: When will you check progress and adjust?

### For Ongoing Work

1. **Capture everything**: Get all commitments out of your head
2. **Identify next actions**: For each project, what's the very next physical action?
3. **Review weekly**: Process inputs, update projects, plan the week
4. **Match context to work**: Right task for right time, energy, and tools

### For Strategy

1. **Clarify the situation**: Where are we? What's changing? (Wardley mapping, environmental scan)
2. **Define winning**: What does success look like? (Objectives)
3. **Make choices**: Where will we play? How will we win? Where won't we play?
4. **Build capabilities**: What must we be able to do? What must we stop doing?
5. **Create forcing functions**: What will make us revisit and adapt?

### For Uncertainty

1. **Start with what you have**: Who do you know? What can you do? (Effectuation)
2. **Make affordable bets**: What can you try without catastrophic downside?
3. **Run experiments**: Design tests with clear learning objectives
4. **Follow the information**: Let results guide next steps
5. **Build optionality**: Prefer reversible decisions; keep options open

### For Coordination

1. **Align on intent**: What are we trying to accomplish? Why?
2. **Clarify roles**: Who owns what? Who decides? Who is consulted?
3. **Create visibility**: How will we see progress? How will we know about problems?
4. **Sync regularly**: What's the right cadence for coordination?
5. **Build trust**: Do what you say; flag problems early; assume good intent

## Conclusion: The Art of Appropriate Planning

The central skill in planning is not mastering any single framework but developing the judgment to select and adapt approaches to the situation at hand.

**Overplanning** wastes effort, creates false precision, delays action, and builds attachment to approaches that may need to change.

**Underplanning** leads to coordination failures, wasted effort through rework, missed risks, and inability to learn from execution.

**Appropriate planning** matches the situation: detailed enough to guide action, loose enough to permit adaptation, shared enough to enable coordination, and humble enough to expect to be wrong.

The ultimate meta-skill is **situational awareness**—accurately perceiving what type of problem you face, what's knowable, who needs to be involved, and what planning approach fits. This comes from experience, deliberate practice, and reflection on both successes and failures.

Plan to plan less, but plan better.
