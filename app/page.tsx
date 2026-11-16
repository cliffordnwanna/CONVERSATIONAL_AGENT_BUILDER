import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  { icon: "✦", title: "Configure and test", detail: "Choose FAQ or sales, give your assistant a name, and set its tone and goal. Every chat request includes those settings." },
  { icon: "▤", title: "Inspect the evidence", detail: "Load a fictional sample, paste text, upload TXT/PDF/DOCX, or import a public page. Inspect matched source excerpts alongside replies." },
  { icon: "↗", title: "Measure real activity", detail: "See your session’s actual messages, response time, feedback, and model usage. Export your browser-local configuration as JSON." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <main className="container mx-auto px-4 py-12 sm:py-20">
        <section className="mx-auto mb-16 max-w-4xl text-center">
          <Badge className="mb-5 border-blue-400/30 bg-blue-500/20 text-blue-200">Portfolio project · interactive demo</Badge>
          <h1 className="mb-6 bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-4xl font-bold leading-tight text-transparent sm:text-6xl">Build a small assistant.<br />See what it knows.</h1>
          <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-xl">Explore a knowledge-grounded agent workflow, from configuration to source inspection. Start with fictional sample data — no account or credentials needed in offline demo mode.</p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row"><Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"><Link href="/builder">Try the playground</Link></Button><Button asChild size="lg" variant="outline" className="border-white/20"><Link href="#how-it-works">See how it works</Link></Button></div>
          <p className="mt-5 text-xs text-slate-400">6 messages per 10-minute in-memory session. This is a demo, not a hosted production agent service.</p>
        </section>
        <section id="features" className="mb-16 grid gap-5 md:grid-cols-3" aria-label="Demo features">
          {features.map(feature => <Card key={feature.title} className="border-white/10 bg-white/5 text-white backdrop-blur-sm transition-colors hover:bg-white/10"><CardHeader><span aria-hidden="true" className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 text-2xl text-blue-200">{feature.icon}</span><CardTitle>{feature.title}</CardTitle><CardDescription className="leading-relaxed text-slate-300">{feature.detail}</CardDescription></CardHeader></Card>)}
        </section>
        <section id="how-it-works" className="mb-16 rounded-2xl border border-white/10 bg-slate-900/50 p-6 sm:p-10">
          <h2 className="mb-6 text-2xl font-bold">A three-minute walkthrough</h2>
          <ol className="grid list-inside list-decimal gap-6 text-blue-200 md:grid-cols-3"><li><span className="font-semibold text-white">Load the sample</span><p className="mt-2 text-sm leading-relaxed text-slate-300">Open the playground and add the fictional Atlas Studio knowledge. Read its short policy before asking a question.</p></li><li><span className="font-semibold text-white">Ask and inspect</span><p className="mt-2 text-sm leading-relaxed text-slate-300">Ask “What is the cancellation policy?” Expand the matched sources and mark whether the response was helpful.</p></li><li><span className="font-semibold text-white">Check your session</span><p className="mt-2 text-sm leading-relaxed text-slate-300">Visit analytics to see the request and your feedback. Download your configuration if you want a local record.</p></li></ol>
        </section>
        <section id="templates" className="mb-16">
          <h2 className="mb-6 text-center text-2xl font-bold">Choose a starting point</h2>
          <div className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-2">{[{ id: "faq", title: "FAQ & support", description: "Explore policies, opening hours, and answers grounded in your documents." }, { id: "sales", title: "Sales assistant", description: "Explore product information with a sales-oriented prompt in live AI mode." }].map(template => <Card key={template.id} className="border-white/10 bg-white/5 text-white"><CardHeader><CardTitle>{template.title}</CardTitle><CardDescription className="text-slate-300">{template.description}</CardDescription></CardHeader><CardContent><Button asChild className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white"><Link href={`/builder?template=${template.id}`}>Start {template.title.toLowerCase()}</Link></Button></CardContent></Card>)}</div>
        </section>
        <section className="mx-auto max-w-3xl space-y-4 rounded-2xl border border-amber-400/20 bg-amber-500/5 p-6">
          <h2 className="text-xl font-semibold">What this demo does — and doesn’t do</h2>
          <p className="text-sm leading-relaxed text-slate-300"><strong className="text-white">Offline demo:</strong> local keyword matching returns source excerpts. It does not generate AI answers or provide semantic understanding. The builder clearly shows which runtime mode is active.</p>
          <p className="text-sm leading-relaxed text-slate-300"><strong className="text-white">Live mode:</strong> when the operator configures an API key, embeddings and language-model responses use an external provider and may incur costs. Answers still need verification.</p>
          <p className="text-sm leading-relaxed text-slate-300">Server knowledge and metrics are temporary. Settings, source copies, and recent chat stay in your browser. Avoid sensitive data. There is no authentication, permanent hosting, public agent deployment, billing, or claimed compliance certification.</p>
          <div className="flex flex-wrap gap-4 pt-2 text-sm text-blue-200"><Link href="/builder">Open playground →</Link><Link href="/analytics">View session analytics →</Link><Link href="/deploy">Export configuration →</Link></div>
        </section>
      </main>
    </div>
  );
}
