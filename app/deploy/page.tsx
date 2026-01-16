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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Deploy Your Agent</h1>
                <p className="text-sm text-gray-500">Production-ready deployment options</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <BackButton href="/builder" />
              <Badge variant="outline" className="text-xs">
                Ready to Deploy
              </Badge>
              <Button variant="outline" asChild>
                <Link href="/analytics">View Analytics</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Deployment Options */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Deploy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Quick Deploy
                  <Badge variant="secondary">Recommended</Badge>
                </CardTitle>
                <CardDescription>
                  Get your agent live in 2 minutes with our optimized embed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-3">Standard Embed Code</h4>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
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
              <Card>
                <CardHeader>
                  <CardTitle>💰 Pricing Plans</CardTitle>
                  <CardDescription>
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
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      } ${plan.recommended ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{plan.name}</h3>
                          <p className="text-2xl font-bold text-blue-600">{plan.price}</p>
                          <p className="text-sm text-gray-600">/month</p>
                        </div>
                        {plan.recommended && (
                          <Badge variant="default" className="text-xs">
                            Most Popular
                          </Badge>
                        )}
                      </div>
                      
                      <ul className="space-y-2">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm">
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
              <Card>
                <CardHeader>
                  <CardTitle>📈 Deployment Stats</CardTitle>
                  <CardDescription>
                    Live performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">2.3K</div>
                      <p className="text-sm text-gray-600">Total Deployments</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">99.9%</div>
                      <p className="text-sm text-gray-600">Uptime</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Avg Response Time</span>
                      <span className="font-medium">1.2s</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Success Rate</span>
                      <span className="font-medium text-green-600">98.5%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">API Calls Today</span>
                      <span className="font-medium">45.2K</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Customization */}
            <Card>
              <CardHeader>
                <CardTitle>Customization Options</CardTitle>
                <CardDescription>
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
                      <label className="block text-sm font-medium mb-2">Widget Theme</label>
                      <select className="w-full p-3 border border-gray-300 rounded-lg">
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto (match website)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Position</label>
                      <select className="w-full p-3 border border-gray-300 rounded-lg">
                        <option value="bottom-right">Bottom Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="top-right">Top Right</option>
                        <option value="custom">Custom Coordinates</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Welcome Message</label>
                      <input
                        type="text"
                        placeholder="Hello! How can I help you?"
                        className="w-full p-3 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="behavior" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Proactive Message</label>
                      <textarea
                        placeholder="Wait 10 seconds before showing..."
                        className="w-full p-3 border border-gray-300 rounded-lg h-20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Business Hours</label>
                      <input
                        type="text"
                        placeholder="9:00 AM - 6:00 PM EST"
                        className="w-full p-3 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="escalate" className="rounded" />
                      <label htmlFor="escalate" className="text-sm">Enable human escalation</label>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="advanced" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Custom Domain</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customDomain}
                          onChange={(e) => setCustomDomain(e.target.value)}
                          placeholder="your-domain.com"
                          className="flex-1 p-3 border border-gray-300 rounded-lg"
                        />
                        <Button variant="outline">Verify</Button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Webhook URL</label>
                      <input
                        type="url"
                        placeholder="https://your-domain.com/webhook"
                        className="w-full p-3 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        <strong>Advanced Embed:</strong> Use this for custom domains and advanced features
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Analytics */}
            <div className="space-y-6">
              <Button variant="outline" asChild>
                <Link href="/analytics">View Analytics</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
