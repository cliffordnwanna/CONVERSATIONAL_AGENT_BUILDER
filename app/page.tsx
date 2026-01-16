import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/BackButton";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 backdrop-blur-sm bg-white/5">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">🤖</span>
            </div>
            <span className="text-white font-semibold">Conversational Agent Builder</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="#features" className="text-gray-300 hover:text-white transition-colors">
              Features
            </Link>
            <Link href="#templates" className="text-gray-300 hover:text-white transition-colors">
              Templates
            </Link>
            <Link href="/analytics" className="text-gray-300 hover:text-white transition-colors">
              Analytics
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-blue-500/20 text-blue-300 border-blue-500/30">
            🚀 New: Knowledge Base Integration
          </Badge>
          <h1 className="text-6xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Build AI Agents That
            <br />
            Actually Understand Your Business
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Create intelligent AI agents with your own knowledge base. Upload documents, configure behavior in 3 simple steps, 
            and deploy anywhere. No coding required.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/builder">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-lg">
                Start Building Free
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg">
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">10K+</div>
            <div className="text-gray-400">AI Agents Created</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">95%</div>
            <div className="text-gray-400">Accuracy Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">2M+</div>
            <div className="text-gray-400">Questions Answered</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">24/7</div>
            <div className="text-gray-400">Availability</div>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Everything You Need to Build Powerful AI Agents
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🧠</span>
                </div>
                <CardTitle className="text-white">Knowledge Base Upload</CardTitle>
                <CardDescription className="text-gray-400">
                  Upload PDFs, docs, or websites to create a custom knowledge base that grounds your AI in your actual business data
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <CardTitle className="text-white">3-Step Configuration</CardTitle>
                <CardDescription className="text-gray-400">
                  Answer just 3 questions about your use case, tone, and goals to create a perfectly tailored AI agent
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🔗</span>
                </div>
                <CardTitle className="text-white">Multi-Channel Deploy</CardTitle>
                <CardDescription className="text-gray-400">
                  Embed on your website, integrate with Slack, or connect to any platform via our API
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <CardTitle className="text-white">Real Analytics</CardTitle>
                <CardDescription className="text-gray-400">
                  Track conversations, satisfaction, and ROI with our comprehensive analytics dashboard
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🛡️</span>
                </div>
                <CardTitle className="text-white">Enterprise Security</CardTitle>
                <CardDescription className="text-gray-400">
                  SOC 2 compliant, end-to-end encryption, and GDPR ready for enterprise deployment
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <CardTitle className="text-white">Smart Templates</CardTitle>
                <CardDescription className="text-gray-400">
                  Pre-built templates for customer support, sales, HR, and more specialized use cases
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Templates Section */}
        <div id="templates" className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Start with Proven Templates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all cursor-pointer group">
              <CardHeader>
                <div className="text-3xl mb-3">💼</div>
                <CardTitle className="text-white group-hover:text-blue-400 transition-colors">
                  Customer Support
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Handle tickets, FAQs, and escalation to human agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/builder?template=support">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                    Use Template
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all cursor-pointer group">
              <CardHeader>
                <div className="text-3xl mb-3">💰</div>
                <CardTitle className="text-white group-hover:text-green-400 transition-colors">
                  Sales Assistant
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Qualify leads, recommend products, and close deals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/builder?template=sales">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                    Use Template
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all cursor-pointer group">
              <CardHeader>
                <div className="text-3xl mb-3">📚</div>
                <CardTitle className="text-white group-hover:text-purple-400 transition-colors">
                  Knowledge Base
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Answer questions from your documentation and help files
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/builder?template=knowledge">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                    Use Template
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all cursor-pointer group">
              <CardHeader>
                <div className="text-3xl mb-3">👥</div>
                <CardTitle className="text-white group-hover:text-orange-400 transition-colors">
                  HR Assistant
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Company policies, benefits, and employee questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/builder?template=hr">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                    Use Template
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Conversational Agent Builder
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Build AI Agents That Actually Understand Your Business
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg">
              🎬 Watch Demo
            </Button>
            <Link href="https://github.com/cliffordnwanna/CONVERSATIONAL_AGENT_BUILDER/tree/main" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="px-8 py-4 text-lg border-2 border-gray-300 hover:border-gray-400">
                📚 View Documentation
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
