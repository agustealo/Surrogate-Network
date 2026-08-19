
"use client";

import * as React from "react"; // Added React import
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Link as LinkIcon, Video, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addProfile } from '@/services/profileService';
import type { LegacyProfile, SurrogateCategory, NewProfileData } from '@/domain/types';

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(50, "Name too long."),
  bio: z.string().min(10, "Bio must be at least 10 characters.").max(1000, "Bio too long."),
  portfolioUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  videoIntroUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

const defaultValues: ProfileFormValues = {
  name: "",
  bio: "",
  portfolioUrl: "",
  videoIntroUrl: "",
};

export function ProfileForm() {
  const { toast } = useToast();
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange",
  });

  async function onSubmit(data: ProfileFormValues) {
    try {
      const profileDataForDb: NewProfileData = {
        name: data.name,
        bio: data.bio,
        email: 'user@example.com',
        verificationStatus: 'unverified',
        updatedAt: new Date().toISOString(),
        offerings: [],
        requests: [],
        portfolioUrl: data.portfolioUrl || undefined,
        videoIntroUrl: data.videoIntroUrl || undefined,
      };
      const profileId = await addProfile(profileDataForDb);
      toast({
        title: "Profile Created!",
        description: `Your new profile has been saved with ID: ${profileId}. You can now add needs and offers separately.`,
        variant: "default",
      });
      form.reset(defaultValues);
    } catch (error: any) {
      console.error("Error creating profile:", error);
      toast({
        title: "Profile Creation Failed",
        description: `There was an error saving your profile: ${error.message || "Please check the console and try again."}`,
        variant: "destructive",
      });
    }
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Tell us a bit about yourself. This information will be publicly visible on Surrogate Network.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., Alex Doe" {...field} />
                  </FormControl>
                  <FormDescription>Your publicly visible name on the platform.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share your story, interests, and what makes you unique. What are you hoping to find or offer in a surrogate connection?"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>A brief introduction to who you are. Make it engaging!</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="shadow-md">
            <CardHeader>
                <CardTitle>Multimedia Links (Optional)</CardTitle>
                <CardDescription>Share links to your portfolio or a video introduction to help others get to know you better.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField
                control={form.control}
                name="portfolioUrl"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex items-center gap-2"><LinkIcon className="h-4 w-4" /> Portfolio URL</FormLabel>
                    <FormControl>
                        <Input type="url" placeholder="https://yourportfolio.com" {...field} />
                    </FormControl>
                    <FormDescription>Link to your personal website, LinkedIn, or online portfolio.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="videoIntroUrl"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex items-center gap-2"><Video className="h-4 w-4" /> Video Introduction URL</FormLabel>
                    <FormControl>
                        <Input type="url" placeholder="https://youtube.com/yourvideo" {...field} />
                    </FormControl>
                    <FormDescription>A link to a short video introducing yourself (e.g., YouTube, Vimeo).</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" size="lg" className="flex-1 flex items-center gap-2" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Saving Profile...
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              Save Profile
            </>
          )}
        </Button>
        </div>
      </form>
    </Form>
  );
}
