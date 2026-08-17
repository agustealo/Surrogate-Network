'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Target, Calendar, Lock, Zap } from 'lucide-react';

type Rank = {
  level: number;
  title: string;
  xpRequired: number;
  unlockedFeatures: string[];
  nextUnlock?: string;
};

type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  progress: number;
  total: number;
  completed: boolean;
  unlockedAt?: string;
};

const mockRanks: Rank[] = [
  {
    level: 6,
    title: 'Connector',
    xpRequired: 5000,
    unlockedFeatures: ['Profile customization', 'Basic messaging', 'Create needs and offers'],
    nextUnlock: 'Enhanced media sharing',
  },
  {
    level: 7,
    title: 'Facilitator', 
    xpRequired: 7500,
    unlockedFeatures: ['Enhanced media sharing', 'Advanced search filters', 'Priority matching'],
    nextUnlock: 'Create Pods',
  },
  {
    level: 8,
    title: 'Curator',
    xpRequired: 10000,
    unlockedFeatures: ['Create Pods', 'Moderation tools', 'Analytics access'],
  },
];

const mockAchievements: Achievement[] = [
  {
    id: 'first-connection',
    title: 'First Connection',
    description: 'Complete your first surrogacy moment',
    icon: Star,
    progress: 1,
    total: 1,
    completed: true,
    unlockedAt: '2024-01-15',
  },
  {
    id: 'five-star-review',
    title: 'Five-Star Reviewer',
    description: 'Receive 5 five-star reviews',
    icon: Trophy,
    progress: 3,
    total: 5,
    completed: false,
  },
  {
    id: 'reliable-partner',
    title: 'Reliable Partner',
    description: 'Maintain 100% on-time arrival for 10 moments',
    icon: Target,
    progress: 7,
    total: 10,
    completed: false,
  },
  {
    id: 'week-streak',
    title: 'Week Warrior',
    description: 'Connect with someone every day for a week',
    icon: Calendar,
    progress: 5,
    total: 7,
    completed: false,
  },
];

const mockCurrentXP = 4250;
const mockCurrentRank = mockRanks[0];
const mockNextRank = mockRanks[1];

const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
  const Icon = achievement.icon;
  const progressPercentage = (achievement.progress / achievement.total) * 100;

  return (
    <Card className={cn(
      "transition-all",
      achievement.completed ? "bg-primary/5 border-primary/20" : ""
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-full",
              achievement.completed ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">{achievement.title}</CardTitle>
              {achievement.completed && achievement.unlockedAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          {achievement.completed && (
            <Badge variant="default" className="h-6 w-6 p-0 flex items-center justify-center">
              ✓
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>
        {!achievement.completed && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{achievement.progress}/{achievement.total}</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function RewardsPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Rewards & Progression</h1>
        <p className="text-muted-foreground">
          Track your growth, achievements, and unlock new capabilities
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Current Rank Progress */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Current Rank
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">Rank {mockCurrentRank.level}</div>
                  <div className="text-muted-foreground">{mockCurrentRank.title}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-mono">{mockCurrentXP.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Total XP</div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress to Rank {mockNextRank.level}</span>
                  <span className="font-medium">
                    {mockCurrentXP}/{mockNextRank.xpRequired} XP
                  </span>
                </div>
                <Progress 
                  value={(mockCurrentXP / mockNextRank.xpRequired) * 100} 
                  className="h-3"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Next unlock: {mockNextRank.nextUnlock}
                </p>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Unlocked Features
                </h3>
                <div className="flex flex-wrap gap-2">
                  {mockCurrentRank.unlockedFeatures.map(feature => (
                    <Badge key={feature} variant="secondary">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Ranks</CardTitle>
              <CardDescription>What you'll unlock next</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRanks.slice(1).map(rank => (
                  <div key={rank.level} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-semibold">Rank {rank.level} - {rank.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {rank.xpRequired.toLocaleString()} XP required
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Unlocks:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {rank.unlockedFeatures.map(feature => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Achievements */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Recent Achievements</CardTitle>
              <CardDescription>Your accomplishments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockAchievements.map(achievement => (
                <AchievementCard 
                  key={achievement.id} 
                  achievement={achievement} 
                />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Season Progress */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Season Progress</CardTitle>
          <CardDescription>Current season ends December 31, 2024</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">12</div>
              <div className="text-sm text-muted-foreground">Achievements</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">8</div>
              <div className="text-sm text-muted-foreground">Surrogacies</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">4.9</div>
              <div className="text-sm text-muted-foreground">Avg Rating</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}