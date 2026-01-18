"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BackButton from "@/components/BackButton";
import Link from "next/link";

export default function DeployPage() {
  const [copied, setCopied] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("starter");
  const [customDomain, setCustomDomain] = useState("");

  const embedCode = `<script src="https://your-agent.vercel.app/embed.js" data-agent-id="your-agent-id"></script>`;
  
  const advancedEmbedCode = `<script>
  window.AgentForgeConfig = {
    agentId: "your-agent-id",
    position: "bottom-right",
    theme: "dark",
    welcomeMessage: "Hello! How can I help you today?"
  };
</script>
<script src="https://your-agent.vercel.app/embed.js"></script>`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: "$0",
      features: ["1 Agent", "1,000 msgs/month", "Basic Analytics", "Community Support"],
      recommended: true,
    },
    {
      id: "professional", 
      name: "Professional",
      price: "$49",
      features: ["5 Agents", "10,000 msgs/month", "Advanced Analytics", "Priority Support", "Custom Branding"],
      recommended: false,
    },
    {
      id: "enterprise",
      name: "Enterprise", 
      price: "$199",
      features: ["Unlimited Agents", "Unlimited Messages", "Real-time Analytics", "Dedicated Support", "White Label", "API Access"],
      recommended: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-white/10 backdrop-blur-sm bg-white/5">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Deploy Your Agent</h1>
              <p className="text-sm text-gray-300">Choose deployment option</p>
            </div>
            <div className="flex items-center gap-4">
              <BackButton href="/builder" />
              <Badge className="text-xs bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-0">
                Ready to Deploy
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Deployment Options */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Deploy */}
            <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  Quick Deploy
                  <Badge variant="secondary" className="text-xs">Recommended</Badge>
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Get your agent live in 2 minutes with our optimized embed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <h4 className="font-medium text-blue-100 mb-3">Standard Embed Code</h4>
                  <div className="relative">
                    <pre className="bg-slate-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{embedCode}</code>
                    </pre>
                    <Button
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(embedCode)}
                    >
                      {copied ? "✓ Copied" : "📋 Copy"}
                    </Button>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Auto-responsive design</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">No coding required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Works on all websites</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Plans */}
            <div className="space-y-6">
              <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">💰 Pricing Plans</CardTitle>
                  <CardDescription className="text-gray-300">
                    Choose the right plan for your needs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedPlan === plan.id
                          ? "border-blue-500 bg-blue-500/20"
                          : "border-gray-600 hover:border-gray-500"
                      } ${plan.recommended ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg text-white">{plan.name}</h3>
                          <p className="text-2xl font-bold text-blue-400">{plan.price}</p>
                          <p className="text-sm text-gray-300">/month</p>
                        </div>
                        {plan.recommended && (
                          <Badge variant="default" className="text-xs">
                            Most Popular
                          </Badge>
                        )}
                      </div>
                      
                      <ul className="space-y-2">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                            <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <Button 
                        className="w-full mt-4"
                        variant={selectedPlan === plan.id ? "default" : "outline"}
                      >
                        {selectedPlan === plan.id ? "✓ Current Plan" : "Select Plan"}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Deployment Stats */}
              <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">📈 Deployment Stats</CardTitle>
                  <CardDescription className="text-gray-300">
                    Live performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-white/10 rounded-lg">
                      <div className="text-2xl font-bold text-white">2.3K</div>
                      <p className="text-sm text-gray-300">Total Deployments</p>
                    </div>
                    <div className="text-center p-4 bg-green-500/10 rounded-lg">
                      <div className="text-2xl font-bold text-green-400">99.9%</div>
                      <p className="text-sm text-gray-300">Uptime</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Avg Response Time</span>
                      <span className="font-medium text-white">1.2s</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Success Rate</span>
                      <span className="font-medium text-green-400">98.5%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">API Calls Today</span>
                      <span className="font-medium text-white">45.2K</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Customization */}
            <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Customization Options</CardTitle>
                <CardDescription className="text-gray-300">
                  Advanced configuration for enterprise deployments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="appearance" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="appearance">Appearance</TabsTrigger>
                    <TabsTrigger value="behavior">Behavior</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="appearance" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">Widget Theme</label>
                      <select className="w-full p-3 border border-white/20 rounded-lg bg-white/10 text-white">
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto (match website)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">Position</label>
                      <select className="w-full p-3 border border-white/20 rounded-lg bg-white/10 text-white">
                        <option value="bottom-right">Bottom Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="top-right">Top Right</option>
                        <option value="custom">Custom Coordinates</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">Welcome Message</label>
                      <input
                        type="text"
                        placeholder="Hello! How can I help you?"
                        className="w-full p-3 border border-white/20 rounded-lg bg-white/10 text-white placeholder-gray-400"
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="behavior" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">Proactive Message</label>
                      <textarea
                        placeholder="Wait 10 seconds before showing..."
                        className="w-full p-3 border border-white/20 rounded-lg h-20 bg-white/10 text-white placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">Business Hours</label>
                      <input
                        type="text"
                        placeholder="9-5, Mon-Fri"
                        className="w-full p-3 border border-white/20 rounded-lg bg-white/10 text-white placeholder-gray-400"
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="advanced" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">Custom Domain</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customDomain}
                          onChange={(e) => setCustomDomain(e.target.value)}
                          placeholder="your-domain.com"
                          className="flex-1 p-3 border border-white/20 rounded-lg bg-white/10 text-white placeholder-gray-400"
                        />
                        <Button variant="outline">Verify</Button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">Webhook URL</label>
                      <input
                        type="url"
                        placeholder="https://your-domain.com/webhook"
                        className="w-full p-3 border border-white/20 rounded-lg bg-white/10 text-white placeholder-gray-400"
                      />
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-600/20 rounded-lg p-3">
                      <p className="text-sm text-yellow-200">
                        <strong>Advanced Embed:</strong> Use this for custom domains and advanced features
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="mt-8 flex justify-center gap-4">
              <Button variant="outline" asChild>
                <Link href="/">🏠 Back to Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
