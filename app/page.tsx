"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/BackButton";
import { useState } from "react";

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 backdrop-blur-sm bg-white/5 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs sm:text-sm">🤖</span>
              </div>
              <span className="text-white font-semibold text-sm sm:text-base">Conversational Agent Builder</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center gap-4 sm:gap-6">
              <Link href="#features" className="text-gray-300 hover:text-white transition-colors text-sm">
                Features
              </Link>
              <Link href="#templates" className="text-gray-300 hover:text-white transition-colors text-sm">
                Templates
              </Link>
              <Link href="/analytics" className="text-gray-300 hover:text-white transition-colors text-sm">
                Analytics
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="sm:hidden flex flex-col gap-1 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <span className={`w-5 h-0.5 bg-white transition-transform ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
              <span className={`w-5 h-0.5 bg-white transition-opacity ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`w-5 h-0.5 bg-white transition-transform ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="sm:hidden mt-4 pt-4 border-t border-white/10">
              <div className="flex flex-col gap-3">
                <Link 
                  href="#features" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-300 hover:text-white transition-colors text-base py-2 block"
                >
                  Features
                </Link>
                <Link 
                  href="#templates" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-300 hover:text-white transition-colors text-base py-2 block"
                >
                  Templates
                </Link>
                <Link 
                  href="/analytics" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-300 hover:text-white transition-colors text-base py-2 block"
                >
                  Analytics
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <Badge className="mb-3 sm:mb-4 bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs sm:text-sm">
            🚀 New: Knowledge Base Integration
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent leading-tight">
            Build AI Agents That
            <br />
            Actually Understand Your Business
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-6 sm:mb-8 max-w-2xl sm:max-w-3xl mx-auto leading-relaxed px-2">
            Create intelligent AI agents with your own knowledge base. Upload documents, configure behavior in 4 simple steps, 
            and deploy anywhere. No coding required.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
            <Link href="/builder">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 sm:px-8 py-3 text-sm sm:text-base lg:text-lg w-full sm:w-auto">
                Start Building Free
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 sm:px-8 py-3 text-sm sm:text-base lg:text-lg w-full sm:w-auto">
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-12 lg:mb-16">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">10K+</div>
            <div className="text-gray-400 text-xs sm:text-sm">AI Agents Created</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">80%</div>
            <div className="text-gray-400 text-xs sm:text-sm">Cost Reduction</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">5M+</div>
            <div className="text-gray-400 text-xs sm:text-sm">Messages Processed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">99.9%</div>
            <div className="text-gray-400 text-xs sm:text-sm">Uptime</div>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8 sm:mb-12">
            Everything You Need to Build Powerful AI Agents
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <CardHeader>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                  <span className="text-xl sm:text-2xl">🤖</span>
                </div>
                <CardTitle className="text-base sm:text-lg">Intelligent Configuration</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  4-step setup with use case, tone, goal, and industry selection
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <CardHeader>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                  <span className="text-xl sm:text-2xl">🧠</span>
                </div>
                <CardTitle className="text-base sm:text-lg">Knowledge Base</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Upload PDFs, TXT, DOCX files to ground AI responses
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <CardHeader>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                  <span className="text-xl sm:text-2xl">📊</span>
                </div>
                <CardTitle className="text-base sm:text-lg">Real-time Analytics</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Track performance, satisfaction, and ROI metrics
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
        <div id="templates" className="mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8 sm:mb-12">
            Start with Proven Templates
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all cursor-pointer group">
              <CardHeader>
                <div className="text-2xl sm:text-3xl mb-3">💼</div>
                <CardTitle className="text-base sm:text-lg">Sales Assistant</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Convert leads and boost sales with intelligent product recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm sm:text-base">
                  Use Template
                </Button>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all cursor-pointer group">
              <CardHeader>
                <div className="text-2xl sm:text-3xl mb-3">❓</div>
                <CardTitle className="text-base sm:text-lg">FAQ Bot</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Answer common questions with knowledge-based responses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm sm:text-base">
                  Use Template
                </Button>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all cursor-pointer group">
              <CardHeader>
                <div className="text-2xl sm:text-3xl mb-3">🎓</div>
                <CardTitle className="text-base sm:text-lg">Support Agent</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  24/7 customer support with intelligent ticket routing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm sm:text-base">
                  Use Template
                </Button>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all cursor-pointer group">
              <CardHeader>
                <div className="text-2xl sm:text-3xl mb-3">📚</div>
                <CardTitle className="text-base sm:text-lg">Knowledge Base</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Document-based Q&A with smart search capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm sm:text-base">
                  Use Template
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mb-12 lg:mb-16 px-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            Conversational Agent Builder
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl sm:max-w-3xl mx-auto">
            Build AI Agents That Actually Understand Your Business
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base lg:text-lg w-full sm:w-auto">
              🎬 Watch Demo
            </Button>
            <Button variant="outline" size="lg" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base lg:text-lg w-full sm:w-auto">
              View Documentation
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
