---
name: social-network-design
description: Design and build social networking sites and community platforms. Use this skill when the user asks to create a social network, community platform, forum, feed-based app, or any site centered on user profiles, social interactions, content sharing, or community engagement. Covers UX architecture, visual design, engagement systems, moderation, and frontend implementation. Applies to full platforms, individual features (feeds, profiles, chat), or redesigns of existing social products.
---

# Social Network Design Skill

This skill guides the design and implementation of social networking sites — from full platforms to individual social features. It encodes principles drawn from the best-designed social platforms (Instagram, Reddit, Discord, Pinterest, LinkedIn, Snapchat, Dribbble) and translates them into actionable steps for building community-driven products.

The user provides requirements for a social platform, community feature, or social UI component. They may specify a niche, audience, content type, or technical stack.

---

## Step 1: Define the Social Architecture

Before any visual work, answer these foundational questions. Push the user to clarify if they haven't:

### Platform Identity
- **Niche & Audience**: Who is this for? Niche communities (anglers, designers, parents) consistently outperform generic "social networks." Define the audience precisely.
- **Core Content Type**: What do people share? Images (Instagram/Pinterest), text discussions (Reddit), short video (TikTok), professional profiles (LinkedIn), real-time chat (Discord), ephemeral media (Snapchat), portfolio work (Dribbble). The content type dictates the entire layout.
- **Interaction Model**: How do users relate to each other? Followers (asymmetric), friends (symmetric), server members (group-based), anonymous (forum-style). This determines the social graph and feed logic.
- **Unique Value Proposition**: What makes this platform worth leaving an established one for? If you can't answer this clearly, stop and figure it out before designing anything.

### Community Structure
Choose a primary structure (hybrids are fine but one should dominate):

| Structure | Best For | Examples |
|-----------|----------|----------|
| **Feed-centric** | Content discovery, visual media | Instagram, TikTok, Pinterest |
| **Thread/forum-based** | Deep discussion, Q&A, knowledge | Reddit, Discourse, Stack Overflow |
| **Server/channel-based** | Real-time community, teams | Discord, Slack |
| **Profile-centric** | Professional networking, dating | LinkedIn, Dribbble |
| **Ephemeral/story-based** | Casual, spontaneous sharing | Snapchat, Instagram Stories |

---

## Step 2: Design the Core Feature Set

Every social network needs a subset of these features. Prioritize ruthlessly — launch with the minimum that makes the interaction model work, then layer in the rest.

### Must-Have Foundation
- **User Profiles**: Customizable identity expression. Include avatar, display name, bio, and content relevant to the niche (portfolio for creatives, stats for gamers, credentials for professionals). Allow users to control privacy granularly.
- **Content Creation**: The post composer is the most important UI on the platform. Make it frictionless. Support the primary content type natively (rich text, image upload, video, links) and make it accessible from every screen.
- **Feed / Discovery**: The main content consumption surface. Choose between chronological, algorithmic, or hybrid. Algorithmic feeds boost engagement but chronological builds trust. Consider offering both.
- **Social Interactions**: Reactions (likes/upvotes), comments (flat or threaded), sharing/reposting, and direct messaging. Each interaction type shapes community culture — upvote/downvote systems (Reddit) produce different dynamics than like-only systems (Instagram).
- **Notifications**: Clear, organized, and non-overwhelming. Group related notifications. Let users control granularity. Poorly designed notifications are the #1 reason users disable them entirely, which kills retention.
- **Search**: Users need to find people, content, and communities. Invest in this early — it's consistently underbuilt on new platforms.

### Engagement Amplifiers (add strategically)
- **Stories / Ephemeral Content**: Low-pressure sharing that drives daily opens.
- **Groups / Communities / Servers**: Sub-communities within the platform for niche interests.
- **Events & Activities**: Online events, challenges, contests that create temporal urgency.
- **Live Features**: Streaming, live chat, real-time collaboration.
- **Gamification**: Badges, streaks, levels, leaderboards. Powerful but can feel cheap if overdone.
- **Creator Tools**: Analytics, monetization, scheduling. Essential if creators drive your content.

### Trust & Safety (non-negotiable)
- **Content Moderation**: Combine automated filters (ML-based detection of harmful content) with human review and user reporting systems. Community-led moderation (Reddit's mod system, Discord's role permissions) scales better than centralized moderation.
- **Blocking & Muting**: Users must be able to remove people from their experience instantly.
- **Privacy Controls**: Account visibility (public/private), data export, content deletion. Comply with GDPR/CCPA from day one — retrofitting is painful.
- **Verification / Identity**: Decide early whether you're anonymous-first (Reddit), real-identity (LinkedIn), or hybrid (Discord). This fundamentally shapes community culture.

---

## Step 3: UX Architecture & Information Design

### Layout Patterns by Platform Type

**Feed-Centric (Instagram, TikTok, Pinterest)**
```
┌─────────────────────────────────┐
│  Top Bar: Logo | Search | Create│
├─────────────────────────────────┤
│                                 │
│         Content Feed            │
│   (cards, grid, or full-screen) │
│                                 │
│   Infinite scroll, pull-to-     │
│   refresh, lazy-loaded media    │
│                                 │
├─────────────────────────────────┤
│ Bottom Nav: Home|Explore|+|Mail|Me│
└─────────────────────────────────┘
```
- Grid layout for visual discovery (Pinterest masonry, Instagram 3-column)
- Full-screen for immersive video (TikTok)
- Card-based for mixed content

**Thread/Forum-Based (Reddit, Discourse)**
```
┌──────────────────────────────────┐
│ Top Bar: Logo | Search | User    │
├──────────┬───────────────────────┤
│ Sidebar  │  Content Area         │
│          │                       │
│ Communi- │  Post Title + Meta    │
│ ties /   │  ├─ Comment (nested)  │
│ Subs /   │  │  ├─ Reply          │
│ Topics   │  │  └─ Reply          │
│          │  └─ Comment           │
│ Filters  │                       │
│ Sort     │  Voting + Moderation  │
└──────────┴───────────────────────┘
```
- Threaded/nested comments are essential for discussion depth
- Sidebar navigation for community switching
- Sort controls (hot, new, top, controversial) let users choose their experience

**Server/Channel-Based (Discord, Slack)**
```
┌────┬──────────┬─────────────────┐
│Srvr│ Channels │  Chat Area      │
│List│          │                 │
│    │ #general │  Messages with  │
│    │ #help    │  rich embeds,   │
│    │ #media   │  reactions,     │
│    │          │  threads        │
│    │ Voice    │                 │
│    │ channels │  Input bar +    │
│    │          │  file upload    │
├────┴──────────┴─────────────────┤
│  Member list / sidebar toggle   │
└─────────────────────────────────┘
```
- Three-pane layout: servers → channels → content
- Voice/video integration alongside text
- Role-based permissions visible through UI cues

### Navigation Principles
- **Mobile-first, always**: Over 80% of social media usage is mobile. Design for thumb zones — primary actions at the bottom, destructive actions require reach.
- **Maximum 3 taps to any core action**: If posting content takes more than 3 taps from any screen, it's too buried.
- **Persistent navigation**: Bottom tab bar (mobile) or sidebar (desktop) with no more than 5 primary destinations.
- **Swipe gestures**: Horizontal swipes between sections (Snapchat camera → stories → chat) reduce tap targets and feel native on mobile.

### Visual Hierarchy Rules
1. **Content is king**: The user's content (posts, images, videos) should dominate the viewport. Chrome (navigation, toolbars, metadata) should be minimal and recede.
2. **Progressive disclosure**: Show summary first, expand on interaction. Don't front-load every piece of metadata.
3. **Negative space is not wasted space**: Generous spacing between posts/cards prevents the "wall of content" fatigue. Reddit's redesign improved engagement by adding breathing room.
4. **Color signals meaning**: Use color sparingly and consistently — a single accent for CTAs, muted tones for chrome, color coding for states (online/offline, read/unread).

---

## Step 4: Visual Design System

### Color Strategy
- **Define a palette of 5-7 colors**: Primary brand color, secondary accent, background, surface, text (high/medium/low emphasis), and semantic colors (success, warning, error).
- **Dark mode from day one**: Social apps are used at all hours. Dark mode isn't optional — it's expected. Design the dark palette as a first-class citizen, not an afterthought inversion.
- **Content-forward backgrounds**: Use neutral backgrounds (whites, near-blacks, soft grays) so user-generated content pops. Instagram's white frame and Pinterest's light grid exist to make photos shine.
- **Accent color with purpose**: One strong accent color for primary actions (post button, like animation, notification badge). Discord's "Blurple," Snapchat's yellow — these become brand signatures.

### Typography
- **Two fonts maximum**: A display/heading font with personality and a body font optimized for readability at small sizes.
- **Legibility over style for content**: User-generated text must be readable. Save expressive typography for branding elements, headings, and empty states.
- **Size hierarchy**: Establish a clear type scale. Post content > username > metadata > timestamps. Users should be able to scan a feed and understand the hierarchy instantly.

### Component Design Patterns
- **Cards**: The fundamental unit of social content. Include: author avatar + name, content area, interaction bar (like/comment/share), timestamp. Round corners and subtle shadows create separation without hard borders.
- **Avatars**: Circular is standard. Size variations: small (comment lists, 24-32px), medium (post headers, 40-48px), large (profile pages, 80-120px). Add presence indicators (online dot) and story rings where applicable.
- **Buttons & CTAs**: Primary action (filled, accent color), secondary (outlined or ghost), destructive (red, requires confirmation). The "compose" or "create" button should be the most prominent interactive element on screen.
- **Input Fields**: The post composer, comment box, and chat input are used constantly. Make them generous, support rich input (emoji, mentions, media), and show character counts where limits exist.
- **Empty States**: When a feed is empty, a profile has no posts, or search returns nothing — these are opportunities, not dead ends. Use illustrations, prompts, and CTAs to guide users toward meaningful actions.

### Animation & Micro-interactions
- **Like/reaction animations**: Heart burst, upvote bounce, emoji float. These small dopamine hits reinforce engagement. Keep them under 300ms for responsiveness.
- **Pull-to-refresh**: Custom branded animations during refresh (Twitter's old bird, Reddit's alien).
- **Skeleton screens**: Show content placeholders while loading instead of spinners. This reduces perceived load time and prevents layout shift.
- **Page transitions**: Smooth crossfades or slides between views. Avoid jarring full-page reloads.
- **Scroll-triggered reveals**: Stagger content appearance as the user scrolls for a polished feel.

---

## Step 5: Engagement & Retention Design

These patterns are drawn from the psychology behind the most engaging social platforms. Apply them thoughtfully — the line between "engaging" and "manipulative" matters.

### Dopamine Loop Architecture
- **Variable reward schedules**: Feeds that surface different content each refresh create anticipation (like slot machines). This is the core mechanic of infinite scroll.
- **Social validation**: Likes, comments, follows, and shares are social proof. Show counts but consider hiding them below thresholds to reduce anxiety (Instagram's hidden likes experiment).
- **Streaks & consistency rewards**: Snapchat's streak system drove daily opens. Use sparingly — streaks can create obligation rather than enjoyment.
- **Progress indicators**: Profile completeness bars, achievement unlocks, level progression. These work especially well during onboarding.

### Infinite Scroll & Content Loading
- **Eliminate stopping points**: Content loads seamlessly as the user scrolls. No pagination buttons, no "load more." But consider ethical checkpoints ("You've been scrolling for 30 minutes" — TikTok's approach).
- **Lazy load media**: Images and videos load as they enter the viewport, not before. Use blur-up placeholders (Medium's technique) or dominant-color placeholders for a polished loading experience.
- **Pull-to-refresh at top**: Universal mobile pattern. Fresh content on demand creates a sense of control.

### Onboarding Flow
1. **Sign up** (minimal friction — email/OAuth, no more than 2 fields)
2. **Choose interests** (seed the algorithm — show 8-12 categories with visual previews)
3. **Follow suggestions** (pre-populate with popular accounts in chosen interests)
4. **First action prompt** ("Create your first post" or "Join a community")
5. **Progressive profile completion** (don't require everything upfront; prompt over time)

The goal is to get the user to a populated, personalized feed within 60 seconds of signing up.

### Notification Strategy
- **Hierarchy**: Direct interactions (replies, DMs) > Social (follows, likes) > Promotional (features, suggestions).
- **Batching**: Group "5 people liked your post" instead of 5 separate notifications.
- **Smart timing**: Don't notify at 3 AM. Queue for reasonable hours.
- **Re-engagement**: "You haven't posted in a while" or "Your friend just joined" — use sparingly or users will mute everything.

---

## Step 6: Performance & Technical Standards

### Performance Targets
- **First Contentful Paint**: Under 1.5 seconds on 4G mobile.
- **Time to Interactive**: Under 3 seconds.
- **Image optimization**: WebP/AVIF with responsive srcsets. Thumbnails for feeds, full resolution on tap.
- **Infinite scroll performance**: Virtualize long lists (render only visible items + buffer). Memory leaks from unbounded DOM growth are the #1 performance killer in feed-based apps.

### Responsive & Mobile-First
- **Breakpoints**: Mobile (< 640px), Tablet (640-1024px), Desktop (> 1024px). Design mobile first, then expand.
- **Touch targets**: Minimum 44x44px for all interactive elements.
- **Bottom sheet patterns**: Use bottom sheets instead of modals on mobile for options, comments, sharing.
- **Thumb zone design**: Critical actions in the bottom 40% of the screen where thumbs naturally rest.

### Accessibility
- **Contrast ratios**: WCAG AA minimum (4.5:1 for text, 3:1 for large text and UI components).
- **Alt text on all images**: User-uploaded images should prompt for alt text; platform images must include it.
- **Keyboard navigation**: Every interactive element must be reachable and operable via keyboard.
- **Screen reader support**: Semantic HTML, ARIA labels on icons and interactive elements, live regions for real-time content updates.
- **Reduced motion**: Respect `prefers-reduced-motion` and provide static alternatives for all animations.

---

## Step 7: Implementation Approach

When building the frontend, follow this order:

### Phase 1 — Skeleton & Layout
1. Establish the shell: navigation structure, responsive grid, theme/color variables.
2. Build the page-level layout (feed, profile, settings, messaging).
3. Implement routing and transitions between views.

### Phase 2 — Core Components
4. User profile card and avatar system.
5. Post/content card component with interaction bar.
6. Feed component with infinite scroll and skeleton loading.
7. Post composer / content creation flow.
8. Comment system (flat or threaded depending on platform type).

### Phase 3 — Social Features
9. Notification system and badge counts.
10. Direct messaging / chat interface.
11. Search with filters (people, posts, communities).
12. Follow/friend/join mechanics.

### Phase 4 — Polish & Engagement
13. Micro-interactions and animations (like bursts, transitions, pull-to-refresh).
14. Dark mode and theme switching.
15. Empty states and onboarding flows.
16. Performance optimization (virtualization, lazy loading, caching).

---

## Design Checklist

Before shipping, verify:

- [ ] **Content is the star** — UI chrome recedes, user content dominates viewport
- [ ] **Core loop is frictionless** — Browse → Engage → Create takes minimal taps
- [ ] **Feed loads fast** — Skeleton screens, lazy images, virtualized lists
- [ ] **Mobile-first** — Thumb-zone navigation, touch targets ≥ 44px, bottom sheets
- [ ] **Dark mode** — Full dark palette, not just inverted colors
- [ ] **Notifications aren't annoying** — Grouped, hierarchical, user-controllable
- [ ] **Moderation exists** — Report, block, mute available on every piece of content
- [ ] **Privacy controls** — Account visibility, data controls, clear settings
- [ ] **Accessibility** — Contrast, keyboard nav, screen readers, reduced motion
- [ ] **Empty states guide action** — No blank screens, always a CTA
- [ ] **Onboarding personalizes** — Users reach a useful feed within 60 seconds
- [ ] **Consistent visual language** — Colors, type, spacing follow the design system

---

## Anti-Patterns to Avoid

- **Feature overload at launch**: Ship the core interaction loop, nothing more. Every extra feature dilutes focus and delays feedback.
- **Copying incumbents literally**: Pinterest's masonry grid works for Pinterest. Understand *why* a pattern works before adopting it.
- **Notification spam**: Aggressive notifications boost short-term engagement and destroy long-term retention.
- **Engagement metrics as the only goal**: Time-on-site and DAU are important, but user satisfaction and healthy community dynamics matter more for longevity.
- **Ignoring moderation**: Communities without moderation tools become toxic fast. Build these before you need them.
- **Generic "social network" positioning**: "A social network for everyone" is a social network for no one. Define the niche.
- **Desktop-first responsive**: If your social network is designed desktop-first and adapted to mobile, the mobile experience will always feel like an afterthought.
- **Infinite scroll without ethical guardrails**: Consider session time reminders, usage dashboards, or "you're all caught up" markers. Users increasingly value platforms that respect their time.

---

## Reference: Platform Design DNA

Quick reference for what makes each exemplary platform's design work:

| Platform | Core Strength | Key Pattern | Why It Works |
|----------|--------------|-------------|--------------|
| **Instagram** | Visual immersion | Minimal chrome, content-forward grid | Photos/videos fill the viewport; UI disappears |
| **Pinterest** | Discovery | Masonry grid, infinite scroll, boards | Encourages "just one more pin" browsing |
| **Reddit** | Discussion depth | Nested threads, voting, subreddits | Content quality is community-curated |
| **LinkedIn** | Professional trust | Resume-like profiles, endorsements | Every element reinforces credibility |
| **Discord** | Flexible community | Servers → channels → threads, roles | Scales from 5 friends to 500K members |
| **Snapchat** | Spontaneity | Ephemeral content, AR filters, camera-first | Lowers the bar for sharing; everything is temporary |
| **Dribbble** | Creative showcase | Portfolio shots, curated grid, hiring tools | Quality over quantity; every post is polished |
