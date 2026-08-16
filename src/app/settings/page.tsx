
import { PageWrapper } from '@/components/layout/PageWrapper';
import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserCog, Bell, ShieldCheck, Palette, Star, Sparkles, CheckCircle } from 'lucide-react'; 
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Settings - Surrogate Network',
  description: 'Manage your account settings and preferences on Surrogate Network.',
};

export default function SettingsPage() {
  return (
    <PageWrapper title="Account Settings" className="max-w-4xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Manage Your Preferences</CardTitle>
          <CardDescription>
            Adjust your account details, notification settings, privacy options, and app appearance for Surrogate Network.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-6">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <UserCog className="h-4 w-4" /> Profile
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" /> Notifications
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Privacy
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Palette className="h-4 w-4" /> Appearance
              </TabsTrigger>
               <TabsTrigger value="premium" className="flex items-center gap-2 font-bold text-primary border-primary/50 border">
                <Star className="h-4 w-4" /> Premium
              </TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>Update your public profile information. This includes your bio, multimedia links, and what you offer or seek.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">Your main profile editing form (similar to profile creation) would be here. You could update your name, bio, portfolio/video links, offerings, and requests.</p>
                  {/* Placeholder for ProfileForm or similar in "edit mode" */}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>Choose how you receive notifications about new messages, match updates, feed activity, and more.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">Notification preferences will be here. (e.g., toggles for email notifications for new messages, new matches, new feed interactions; push notification settings if applicable).</p>
                  {/* Placeholder for notification toggles */}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="privacy">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                  <CardDescription>Control your data visibility and sharing preferences within Surrogate Network.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">Privacy controls will be here. (e.g., options for profile visibility - public, connections only; block list management; data export request; account deactivation/deletion).</p>
                  {/* Placeholder for privacy options */}
                </CardContent>
              </Card>
            </TabsContent>
             <TabsContent value="appearance">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance Settings</CardTitle>
                  <CardDescription>Customize the look and feel of the Surrogate Network application.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">Theme options will appear here, such as a Light/Dark mode toggle. You might also find options for adjusting text size or choosing from a few pre-defined color accents if the app supports it.</p>
                  {/* Placeholder for appearance options */}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="premium">
                <Card className="bg-gradient-to-br from-primary/10 via-background to-background">
                    <CardHeader className="text-center">
                        <div className="mx-auto bg-primary/20 p-3 rounded-full w-fit mb-2">
                          <Sparkles className="h-10 w-10 text-primary" />
                        </div>
                        <CardTitle className="text-3xl">Surrogate Network Premium</CardTitle>
                        <CardDescription className="text-base max-w-xl mx-auto">
                            Become a super-connector and power-contributor. Enhance your visibility, access exclusive tools, and deepen your influence in the relational economy.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6 text-sm">
                        <div className="p-6 rounded-lg border bg-card/80 shadow-md">
                           <h3 className="font-bold text-lg mb-2">Visibility & Reach</h3>
                           <ul className="space-y-2 text-muted-foreground">
                            <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-1 text-green-500 shrink-0"/><span><span className="font-semibold text-foreground">Surrogacy Boost:</span> Pin your needs/offers to the top of feeds.</span></li>
                            <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-1 text-green-500 shrink-0"/><span><span className="font-semibold text-foreground">Priority Matching:</span> Get suggested earlier and more often to others.</span></li>
                            <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-1 text-green-500 shrink-0"/><span><span className="font-semibold text-foreground">Unlimited Pods:</span> Join and create as many interest groups as you want.</span></li>
                           </ul>
                        </div>
                        <div className="p-6 rounded-lg border bg-card/80 shadow-md">
                           <h3 className="font-bold text-lg mb-2">Identity & Tools</h3>
                            <ul className="space-y-2 text-muted-foreground">
                            <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-1 text-green-500 shrink-0"/><span><span className="font-semibold text-foreground">Profile Customization:</span> Unlock exclusive themes, banners, and premium badges.</span></li>
                            <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-1 text-green-500 shrink-0"/><span><span className="font-semibold text-foreground">Advanced Scheduling:</span> Sync availability with your personal calendar automatically.</span></li>
                            <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-1 text-green-500 shrink-0"/><span><span className="font-semibold text-foreground">Enhanced Token Economy:</span> Earn token multipliers and access exclusive "Care Gem" fusion.</span></li>
                           </ul>
                        </div>
                    </CardContent>
                    <CardFooter>
                      <Button size="lg" className="w-full text-lg">
                        Upgrade to Premium
                      </Button>
                    </CardFooter>
                </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
