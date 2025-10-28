'use client';

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface SessionData {
  date: string;
  sessions: number;
  messages: number;
  insights: number;
}

interface SessionAnalyticsProps {
  data: SessionData[];
  title?: string;
  description?: string;
}

const chartVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export function SessionAnalytics({
  data,
  title = 'Session Analytics',
  description = 'Track your therapy sessions over time',
}: SessionAnalyticsProps) {
  return (
    <motion.div variants={chartVariants} initial="hidden" animate="visible">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(var(--primary))" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="oklch(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--border))" />
                <XAxis dataKey="date" stroke="oklch(var(--muted-foreground))" />
                <YAxis stroke="oklch(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'oklch(var(--background))',
                    border: '1px solid oklch(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'oklch(var(--foreground))' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sessions"
                  stroke="oklch(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'oklch(var(--primary))', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="messages"
                  stroke="oklch(var(--accent))"
                  strokeWidth={2}
                  dot={{ fill: 'oklch(var(--accent))', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface MessageDistributionProps {
  data: Array<{ role: string; count: number }>;
  title?: string;
  description?: string;
}

export function MessageDistribution({
  data,
  title = 'Message Distribution',
  description = 'User vs AI message count',
}: MessageDistributionProps) {
  return (
    <motion.div variants={chartVariants} initial="hidden" animate="visible">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--border))" />
                <XAxis dataKey="role" stroke="oklch(var(--muted-foreground))" />
                <YAxis stroke="oklch(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'oklch(var(--background))',
                    border: '1px solid oklch(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'oklch(var(--foreground))' }}
                />
                <Bar dataKey="count" fill="oklch(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface ProgressTrendProps {
  data: SessionData[];
  title?: string;
  description?: string;
}

export function ProgressTrend({
  data,
  title = 'Progress Trend',
  description = 'Insights progress over time',
}: ProgressTrendProps) {
  return (
    <motion.div variants={chartVariants} initial="hidden" animate="visible">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorInsights" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(var(--accent))" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="oklch(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--border))" />
                <XAxis dataKey="date" stroke="oklch(var(--muted-foreground))" />
                <YAxis stroke="oklch(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'oklch(var(--background))',
                    border: '1px solid oklch(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'oklch(var(--foreground))' }}
                />
                <Area
                  type="monotone"
                  dataKey="insights"
                  stroke="oklch(var(--accent))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorInsights)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
