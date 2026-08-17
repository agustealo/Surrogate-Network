'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Shield, 
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Heart,
  Briefcase
} from 'lucide-react';

type StatCard = {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
};

const mockStats: StatCard[] = [
  {
    title: 'Total Members',
    value: '1,234',
    change: '+12%',
    icon: Users,
    trend: 'up',
  },
  {
    title: 'Active Surrogacies',
    value: '89',
    change: '+8%',
    icon: Heart,
    trend: 'up',
  },
  {
    title: 'Open Reports',
    value: '7',
    change: '-2',
    icon: AlertTriangle,
    trend: 'down',
  },
  {
    title: 'Platform Health',
    value: '98%',
    change: '+2%',
    icon: Shield,
    trend: 'up',
  },
];

const mockRecentActivity = [
  {
    id: 1,
    type: 'member',
    title: 'New member joined',
    description: 'Jordan Smith completed onboarding',
    time: '2 minutes ago',
    status: 'completed',
  },
  {
    id: 2,
    type: 'report',
    title: 'New report filed',
    description: 'Inappropriate behavior reported in chat',
    time: '15 minutes ago',
    status: 'pending',
  },
  {
    id: 3,
    type: 'surrogacy',
    title: 'Surrogacy completed',
    description: 'Mindfulness session between User A and User B',
    time: '1 hour ago',
    status: 'completed',
  },
  {
    id: 4,
    type: 'moderation',
    title: 'Content moderated',
    description: 'Removed inappropriate post from public feed',
    time: '2 hours ago',
    status: 'completed',
  },
];

const mockPendingReports = [
  {
    id: 'report-1',
    type: 'harassment',
    reportedUser: 'user@example.com',
    reporter: 'moderator@example.com',
    severity: 'high',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    description: 'Repeated unwanted messages after boundaries were set',
  },
  {
    id: 'report-2',
    type: 'inappropriate_content',
    reportedUser: 'user2@example.com',
    reporter: 'user3@example.com',
    severity: 'medium',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    description: 'Inappropriate content shared in public profile',
  },
];

const StatCard = ({ stat }: { stat: StatCard }) => {
  const Icon = stat.icon;
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-muted-foreground',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stat.value}</div>
        {stat.change && (
          <p className={cn("text-xs mt-1", trendColors[stat.trend || 'neutral'])}>
            {stat.change} from last period
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const ActivityItem = ({ activity }: { activity: typeof mockRecentActivity[0] }) => {
  const icons = {
    member: Users,
    report: AlertTriangle,
    surrogacy: Heart,
    moderation: Shield,
  };

  const statusIcons = {
    completed: CheckCircle,
    pending: Clock,
    failed: XCircle,
  };

  const Icon = icons[activity.type as keyof typeof icons];
  const StatusIcon = statusIcons[activity.status as keyof typeof statusIcons];

  return (
    <div className="flex items-start gap-4 pb-4 last:pb-0 border-b last:border-0">
      <div className="p-2 bg-muted rounded-full">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium text-sm">{activity.title}</p>
          <StatusIcon className={cn(
            "h-3.5 w-3.5",
            activity.status === 'completed' ? "text-green-600" :
            activity.status === 'pending' ? "text-yellow-600" :
            "text-red-600"
          )} />
        </div>
        <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
      </div>
    </div>
  );
};

export default function AdminDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Platform overview and management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {mockStats.map(stat => (
          <StatCard key={stat.title} stat={stat} />
        ))}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="health">Platform Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest platform events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockRecentActivity.map(activity => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common admin tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Review New Members
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  View Open Reports
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Moderation Queue
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Heart className="mr-2 h-4 w-4" />
                  Review Surrogacies
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Pending Reports</CardTitle>
              <CardDescription>Reports requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              {mockPendingReports.length > 0 ? (
                <div className="space-y-4">
                  {mockPendingReports.map(report => (
                    <div key={report.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className={cn(
                            "h-5 w-5",
                            report.severity === 'high' ? "text-red-600" :
                            report.severity === 'medium' ? "text-yellow-600" :
                            "text-blue-600"
                          )} />
                          <div>
                            <h3 className="font-semibold">{report.type.replace('_', ' ')}</h3>
                            <p className="text-sm text-muted-foreground">
                              Reported: {report.reportedUser}
                            </p>
                          </div>
                        </div>
                        <Badge variant={report.severity === 'high' ? 'destructive' : 'secondary'}>
                          {report.severity}
                        </Badge>
                      </div>
                      <p className="text-sm mb-3">{report.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Reported {new Date(report.createdAt).toLocaleString()}
                        </span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Dismiss
                          </Button>
                          <Button size="sm" variant="default">
                            Take Action
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending reports</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>Comprehensive platform activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRecentActivity.map(activity => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Database</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm text-muted-foreground">Operational</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>API Services</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm text-muted-foreground">Operational</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Authentication</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm text-muted-foreground">Operational</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Media Processing</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    <span className="text-sm text-muted-foreground">Degraded</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Response Time</span>
                    <span className="font-medium">245ms</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: '75%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Uptime (30d)</span>
                    <span className="font-medium">99.9%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: '99.9%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Error Rate</span>
                    <span className="font-medium">0.1%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: '99.9%' }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}