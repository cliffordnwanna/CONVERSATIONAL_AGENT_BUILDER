import Link from "next/link";
import { Button } from "@/components/ui/button";

const steps = [
  { title: "Add knowledge", detail: "Drop in a PDF, Word file, text or Markdown file, paste text, or import a public web page. Or use the built-in sample." },
  { title: "Ask a question", detail: "The assistant answers only from your sources, and declines questions they do not cover." },
  { title: "Check the evidence", detail: "Open the exact passages behind each answer and see whether it came from live AI or from keyword matching." },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 lg:px-6">
      <section className="max-w-3xl py-12 sm:py-20">
        <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-balance sm:text-5xl">Ask your documents questions. See exactly what answered.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          A small document-grounded assistant you can try in a minute. Upload a file or use the sample, chat with it, and inspect the source passages behind every reply.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg"><Link href="/builder">Open the builder</Link></Button>
          <Button asChild size="lg" variant="outline"><Link href="#how-it-works">How it works</Link></Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">An engineering demo, not a hosted agent service. Six messages per session.</p>
      </section>

      <section id="how-it-works" aria-labelledby="how-heading" className="border-t py-12">
        <h2 id="how-heading" className="text-2xl font-semibold tracking-tight">How it works</h2>
        <ol className="mt-6 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="space-y-2">
              <p className="tnum text-sm font-medium text-primary">Step {index + 1}</p>
              <h3 className="text-base font-semibold">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="modes-heading" className="border-t py-12">
        <h2 id="modes-heading" className="text-2xl font-semibold tracking-tight">What it supports</h2>
        <dl className="mt-6 grid gap-x-12 gap-y-6 md:grid-cols-2">
          <div>
            <dt className="text-sm font-semibold">Sources</dt>
            <dd className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">PDF, Word (DOCX), TXT and Markdown files up to 5 MB each, pasted text, and public web pages. Scanned or image-only PDFs may contain no readable text. Up to 20 sources per session.</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold">Live mode</dt>
            <dd className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">Semantic retrieval and AI-written answers with citations, using an external AI provider. Answers can still be wrong, so check the sources.</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold">Offline mode</dt>
            <dd className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">If no key is configured, or the AI service is unavailable, it falls back to keyword matching and shows the matching excerpts. It is labelled as such and does not generate answers.</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold">Starting points</dt>
            <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
              <Link href="/builder?template=faq" className="text-primary underline underline-offset-4">FAQ and support</Link>
              <span aria-hidden="true"> · </span>
              <Link href="/builder?template=sales" className="text-primary underline underline-offset-4">Sales assistant</Link>
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="limits-heading" className="border-t py-12">
        <h2 id="limits-heading" className="text-2xl font-semibold tracking-tight">Limits</h2>
        <ul className="mt-4 max-w-3xl list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>Knowledge and metrics live in server memory for about 10 minutes of inactivity. Your settings, source copies and recent chat stay in this browser.</li>
          <li>There is no sign-in, permanent storage, billing or public agent hosting.</li>
          <li>In live mode, your document text and questions are sent to the AI provider. Do not upload sensitive or personal data.</li>
        </ul>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/builder" className="text-primary underline underline-offset-4">Open the builder</Link>
          <Link href="/analytics" className="text-primary underline underline-offset-4">Session analytics</Link>
          <Link href="/deploy" className="text-primary underline underline-offset-4">Export configuration</Link>
        </div>
      </section>
    </main>
  );
}
