"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import BackButton from "@/components/BackButton";

interface AnalyticsData {
  conversations: number;
  thumbsUp: number;
  thumbsDown: number;
  avgResponseTime?: number;
  knowledgeUsage?: number;
  costSavings?: number;
}

interface SessionData {
  id: string;
  timestamp: string;
  messages: number;
  satisfaction: number;
  usedKnowledge: boolean;
}

export default function AnalyticsPage() {
  const [analytics] = useState<AnalyticsData>({
    conversations: 127,
    thumbsUp: 98,
    thumbsDown: 2,
    avgResponseTime: 1.2,
    knowledgeUsage: 73,
    costSavings: 2847.50,
  });

  const [sessions] = useState<SessionData[]>(() => [
    {
      id: crypto.randomUUID(),
      timestamp: new Date(Date.now() - 86400000).toISOString(), // 24 hours ago
      messages: 3,
      satisfaction: 1,
      usedKnowledge: true,
    },
    {
      id: crypto.randomUUID(),
      timestamp: new Date(Date.now() - 172800000).toISOString(), // 48 hours ago
      messages: 2,
      satisfaction: 1,
      usedKnowledge: false,
    },
    // Add more static sessions...
  ]);
  const [timeRange, setTimeRange] = useState("24h");
  const [barHeights] = useState<number[]>(() =>
    Array.from({ length: 24 }, () => Math.floor(Math.random() * 60 + 20))
  );

  const satisfactionRate = analytics.conversations > 0 
    ? Math.round((analytics.thumbsUp / (analytics.thumbsUp + analytics.thumbsDown)) * 100)
    : 0;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

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
                <h1 className="text-xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-sm text-gray-500">Real-time performance metrics</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <BackButton href="/" />
              <Badge variant="outline" className="text-xs">
                Live
              </Badge>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                Total Conversations
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {formatNumber(analytics.conversations)}
              </div>
              <p className="text-sm text-green-600 mt-1">
                +12% from last period
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Satisfaction Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {satisfactionRate}%
              </div>
              <p className="text-sm text-blue-600 mt-1">
                Above industry average
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Avg Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {analytics.avgResponseTime?.toFixed(1)}s
              </div>
              <p className="text-sm text-green-600 mt-1">
                -0.3s improvement
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Cost Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(analytics.costSavings || 0)}
              </div>
              <p className="text-sm text-green-600 mt-1">
                This month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Detailed Analytics */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Conversation Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Conversation Volume</CardTitle>
              <CardDescription>
                Messages per hour over the selected time range
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between px-4">
                {/* Simple bar chart visualization */}
                {barHeights.map((height, i) => (
                  <div
                    key={i}
                    className="w-8 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>12 AM</span>
                <span>6 PM</span>
              </div>
            </CardContent>
          </Card>

          {/* Knowledge Base Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Base</CardTitle>
              <CardDescription>
                How often your knowledge base is used
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {analytics.knowledgeUsage}%
                </div>
                <p className="text-sm text-gray-600">Usage Rate</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Documents</span>
                  <span className="font-medium">12</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Queries</span>
                  <span className="font-medium">{analytics.conversations}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Knowledge Hits</span>
                  <span className="font-medium text-green-600">
                    {Math.floor(analytics.conversations * ((analytics.knowledgeUsage || 0) / 100))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
            <CardDescription>
              Latest agent interactions and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No sessions recorded yet
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-lg">
                          {session.satisfaction ? "😊" : "😐"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {new Date(session.timestamp).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          {session.messages} messages • {session.usedKnowledge ? "Used KB" : "General"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={session.satisfaction ? "default" : "secondary"}>
                        {session.satisfaction ? "Satisfied" : "Neutral"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {session.usedKnowledge ? "🧠" : "💬"}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">✓</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Excellent Response Time</p>
                  <p className="text-sm text-gray-600">
                    Under 2 seconds average
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">📈</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">High Knowledge Usage</p>
                  <p className="text-sm text-gray-600">
                    {analytics.knowledgeUsage}% of queries
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ROI Calculator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency((analytics.costSavings || 0) * 12)}
                </p>
                <p className="text-sm text-gray-600">Annual Savings</p>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Human Hours Saved</span>
                  <span className="font-medium">
                    {formatNumber(Math.floor(analytics.conversations * 0.5))} hrs
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Efficiency Gain</span>
                  <span className="font-medium text-green-600">+67%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center gap-4">
          <Button asChild>
            <Link href="/builder"> Build Another Agent</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/deploy"> Deploy to Production</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/"> Export Report</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
