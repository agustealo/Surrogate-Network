// Profile reputation component
// Displays strength matrix and review summary with visualizations

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, TrendingUp } from 'lucide-react';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import type { StrengthMatrixPoint, ReviewSummaryPoint } from '@/domain/types';
import { cn } from '@/lib/utils';

interface ProfileReputationProps {
  strengthMatrix?: StrengthMatrixPoint[];
  reviewSummary?: ReviewSummaryPoint[];
  className?: string;
}

const strengthChartConfig = {
  proficiency: {
    label: "Proficiency",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const reviewChartConfig = {
  count: {
    label: "Review Count",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function ProfileReputation({ 
  strengthMatrix, 
  reviewSummary,
  className 
}: ProfileReputationProps) {
  const hasReputationData = (strengthMatrix && strengthMatrix.length > 0) || 
                            (reviewSummary && reviewSummary.length > 0);

  if (!hasReputationData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="text-primary h-5 w-5" />
            Reputation & Skills
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Reputation data is not available yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {strengthMatrix && strengthMatrix.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="text-primary h-5 w-5" />
              Strength Matrix
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer config={strengthChartConfig} className="mx-auto aspect-square max-h-[300px]">
              <RadarChart data={strengthMatrix} margin={{ top: 10, right: 30, left: 30, bottom: 0 }}>
                <CartesianGrid className="stroke-border/50" />
                <PolarAngleAxis 
                  dataKey="attribute" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                />
                <PolarRadiusAxis 
                  angle={30} 
                  domain={[0, 100]} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} 
                />
                <Radar 
                  name="Proficiency" 
                  dataKey="proficiency" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))" 
                  fillOpacity={0.6} 
                />
                <ChartTooltip content={<ChartTooltipContent />} />
              </RadarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {reviewSummary && reviewSummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="text-green-600 h-5 w-5" />
              Review Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer config={reviewChartConfig} className="mx-auto aspect-[16/9] max-h-[300px]">
              <BarChart data={reviewSummary} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid vertical={false} className="stroke-border/50" />
                <XAxis 
                  dataKey="rating" 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={8} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={8} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}