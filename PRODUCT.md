# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: hiring managers and engineering peers evaluating the author's AI engineering work. They skim, usually in under a minute, on a laptop or a phone, and want to see a working document-grounded assistant and what it retrieved. Secondary: visitors trying the tool on their own non-sensitive documents.

## Product Purpose

A demo tool for building a small document-grounded assistant: add knowledge (PDF, DOCX, TXT, Markdown, pasted text or a public web page), set the assistant's name, tone and goal, ask questions, and inspect the exact source excerpts behind each answer. Success: a first-time visitor reaches a cited answer from their own or the sample document within a minute, and understands whether the answer came from live AI or from offline keyword matching.

## Positioning

The product shows its work. Every answer exposes its retrieval mode (semantic, keyword, inline, none) and the matched source passages, and it refuses questions its sources do not cover. It is an engineering demonstration, not a hosted agent service.

## Constraints

- Production runs in live mode with a spending-capped OpenAI key. If the key fails it degrades to labelled keyword retrieval (`mode: demo`, `degraded: true`).
- Knowledge and server metrics are in memory and temporary (10-minute idle expiry). Six user messages per session. At most 20 sources, 5 files per upload, 5 MB per file.
- No authentication, no persistent agents, no billing. Do not claim prompt-injection resistance or any evaluation results.
- Live mode sends content to OpenAI; users must be told not to upload sensitive data.
- Existing behavior, API routes, session handling and the 50 unit tests and `npm run e2e` suite must keep passing. Redesign is visual and structural in the UI layer only.

## Voice

Plain, specific and honest about limits. Controls name their action. No marketing superlatives.

## Visual commitments

Confirmed by the owner: light, calm and neutral, with one restrained accent; no AI-generic look (purple gradients, glass cards, gradient text, emoji); easy to use; optimized for desktop and mobile. Builder screen organised as one workspace: Knowledge, Chat and Settings.
