---
name: Conversational Agent Builder
description: A calm, light, document-first workspace for building and inspecting a grounded assistant.
colors:
  background: "#f6f6f3"
  card: "#ffffff"
  foreground: "#15191e"
  muted-foreground: "#54585f"
  secondary: "#ededea"
  border: "#dfdeda"
  input-border: "#c5c4bf"
  primary: "#00615f"
  accent-surface: "#e0f5f4"
  accent-foreground: "#003837"
  destructive: "#b7191c"
  warn: "#6c4302"
  warn-surface: "#fef4df"
typography:
  display:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  heading:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  caption:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.card}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "8px 16px"
  button-outline:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    height: "40px"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    height: "40px"
  panel:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
---

# Design System: Conversational Agent Builder

## Overview

An **Operate** surface: the visitor completes a task (add a document, ask questions, check the evidence). The look is ink on warm-grey paper, white work surfaces, hairline borders and one deep-teal accent. It stays quiet so the content (documents, answers, source passages) is the loudest thing on screen. Familiar patterns beat novelty: top bar, tabs, a drop zone, a chat with a pinned composer.

It replaces an earlier purple-gradient, glass-card, emoji-branded look. Do not reintroduce gradients, blur, gradient text, emoji, or icon-tile card grids.

## Colors

Restrained strategy: neutrals plus one accent.

- **Paper** `background` (#f6f6f3) is the page; **Card** (#ffffff) is for work surfaces (chat, source lists, forms).
- **Ink** `foreground` (#15191e) for text; `muted-foreground` (#54585f) for secondary text (about 6:1 on paper).
- **Teal** `primary` (#00615f) is for the one primary action per view, the current selection and tab underline, links and focus rings. `accent-surface` (#e0f5f4) is the selected-state fill. Never use teal as decoration.
- **Amber-brown** `warn` (#6c4302) on `warn-surface` for cautions and the offline/degraded status. **Red** `destructive` (#b7191c) only for errors.
- Status is always text plus a small dot, never colour alone.

Source of truth: CSS variables in `app/globals.css` (oklch). The hex values above are conversions for tooling.

## Typography

One family, Geist, for everything. Fixed rem scale, no fluid sizing. Display 3rem only on the home page; page titles 1.5rem; panel headings 1rem semibold; body 0.875rem; captions and helper text 0.75rem. Tabular numerals (`.tnum`) for counts, limits, timestamps and metrics. Prose measure stays under 65 to 75 characters. No kickers or eyebrow labels above headings.

## Layout

- Max content width 1400px with 16px (mobile) or 24px (desktop) gutters.
- Builder: a 380px left rail (Knowledge | Settings tabs) beside the chat on screens 1024px and wider, filling the viewport height with the chat scrolling internally and the composer pinned. Below 1024px it is a three-tab switch (Knowledge, Chat, Settings) and the chat gets a fixed viewport-relative height so the composer stays reachable.
- Panels stay mounted and are hidden with CSS so state (uploads, drafts) survives tab switches.
- Responsive behavior is structural (rail to tabs), not fluid type.

## Elevation & Depth

Flat. Depth comes from 1px borders and the paper/white contrast. No shadows, blur, or glass.

## Shapes

Radius 8px for controls and 10px for panels. The drop zone uses a dashed 1px border. No pill-shaped buttons.

## Components

- **Button:** primary (teal), outline (white with border), ghost (text, accent-surface on hover), icon buttons 36px. Heights 40px by default, 44px large. Visible 2px teal focus outline.
- **Tabs:** underlined text tabs for sub-navigation (Files, Text, Website); a segmented control for the workspace panels.
- **Drop zone:** dashed border, upload icon, "Drop files here, or choose files", states for drag-over and disabled.
- **Source row:** type icon, title with expandable preview, character count, remove icon button.
- **Chat:** user messages as a muted bubble on the right; assistant replies as plain text with a small label, retrieval mode, an expandable "matched source preview(s)" list and thumbs feedback. Composer is a textarea plus Send, pinned to the bottom of the chat.
- **Status line:** coloured dot plus text for the runtime mode (Live, Offline, Offline fallback).
- Icons are Lucide line icons at one stroke weight.

## Do's and Don'ts

- Do keep one primary action per view and put the file drop zone first.
- Do show the retrieval mode and matched passages with every answer.
- Do use tabular numerals for any number a person compares.
- Do keep every interactive control at least 40px tall on touch screens.
- Don't add gradients, glass, shadows, gradient text, emoji, or decorative motion.
- Don't use colour alone for status, and don't use the accent on inactive states.
- Don't claim evaluation results or prompt-injection resistance anywhere in the UI.
