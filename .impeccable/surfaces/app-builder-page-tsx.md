---
version: 1
slug: "app-builder-page-tsx"
primary_target: "app/builder/page.tsx"
related_targets: ["app/page.tsx","app/analytics/page.tsx","app/deploy/page.tsx"]
---

## Direction contract

THESIS: The builder is one workspace where the document, the conversation and the evidence are on screen together. It refuses the dashboard-of-cards and the stepped wizard: knowledge comes first and is obvious, chat is the main area, settings stay out of the way.

OWN-WORLD: Operate, Restrained. Light warm-grey ground (not cream), white work surfaces, 1px hairline borders, no shadows beyond one soft panel lift. Near-black ink text. ONE accent, a deep teal, used only for the primary action, the current selection, links and focus rings. Geist throughout, tight 1.125 scale, tabular numerals for data. Lucide line icons at one stroke weight. No gradients, glass, emoji, icon tiles or eyebrow labels. Status uses text plus a small dot, never colour alone.

STORY: A visitor understands in seconds that they can drop a document and ask it questions, sees which engine answered (live AI or keyword match), and can open the exact passages used. They believe it because the tool shows its limits.

FIRST VIEWPORT: Slim top bar (wordmark left; Builder, Analytics, Export right). Below: left rail 360px holding Knowledge (drop zone with PDF, DOCX, TXT, MD, paste, URL, plus a Try the sample action) with a Settings tab; right, the chat filling the height with its composer pinned at the bottom. On phones: a three-tab switch (Knowledge, Chat, Settings) and the chat composer pinned to the bottom edge. Primary action: the file drop zone first, Send in chat after.

FORM: Two-pane workspace with tabbed side rail (Knowledge | Settings) on desktop; tabbed single pane on mobile. seed: none (pinned) "one workspace: Knowledge, Chat, Settings", "light, calm and neutral".

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
