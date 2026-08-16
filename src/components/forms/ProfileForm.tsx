
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
import { PlusCircle, MinusCircle, Send, Link as LinkIcon, Video, Loader2, Briefcase, User, Zap as ZapIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addProfile } from '@/services/profileService';
import type { NewProfileData, SurrogateCategory } from '@/lib/types';

const surrogateCategories: [SurrogateCategory, ...SurrogateCategory[]] = ['personal', 'utilitarian_business', 'casual'];

const offeringSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "Title must be at least 3 characters.").max(100, "Title too long."),
  description: z.string().min(10, "Description must be at least 10 characters.").max(500, "Description too long."),
  category: z.enum(surrogateCategories, { required_error: "Please select a category." }),
});

const requestSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "Title must be at least 3 characters.").max(100, "Title too long."),
  description: z.string().min(10, "Description must be at least 10 characters.").max(500, "Description too long."),
  category: z.enum(surrogateCategories, { required_error: "Please select a category." }),
});

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(50, "Name too long."),
  bio: z.string().min(10, "Bio must be at least 10 characters.").max(1000, "Bio too long."),
  portfolioUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  videoIntroUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  offerings: z.array(offeringSchema).min(1, "Please add at least one offering.").max(5, "You can add up to 5 offerings."),
  requests: z.array(requestSchema).min(1, "Please add at least one request.").max(5, "You can add up to 5 requests."),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

const defaultValues: ProfileFormValues = {
  name: "",
  bio: "",
  portfolioUrl: "",
  videoIntroUrl: "",
  offerings: [{ title: "", description: "", category: 'personal' }],
  requests: [{ title: "", description: "", category: 'personal' }],
};

export function ProfileForm() {
  const { toast } = useToast();
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const { fields: offeringFields, append: appendOffering, remove: removeOffering } = useFieldArray({
    control: form.control,
    name: "offerings",
  });

  const { fields: requestFields, append: appendRequest, remove: removeRequest } = useFieldArray({
    control: form.control,
    name: "requests",
  });

  async function onSubmit(data: ProfileFormValues) {
    form.control.handleSubmit(async (formData) => {
      try {
        // Ensure offerings and requests have unique-enough IDs if not provided by DB yet
        const profileDataForDb: NewProfileData = {
          ...formData,
          offerings: formData.offerings.map((o, idx) => ({ ...o, id: o.id || `offering-${idx}-${Date.now()}` })),
          requests: formData.requests.map((r, idx) => ({ ...r, id: r.id || `request-${idx}-${Date.now()}`, tags: r.tags || [] })),
          // Ensure badges and other optional fields are handled if not in form
          badges: formData.badges || [],
          matchScore: formData.matchScore || undefined,
        };
        const profileId = await addProfile(profileDataForDb);
        toast({
          title: "Profile Created!",
          description: `Your new profile has been saved with ID: ${profileId}. You can now find it on the Matches page.`,
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
    })(data);
  }

  const categoryDisplayMap: Record<SurrogateCategory, { label: string; icon: React.ElementType }> = {
    personal: { label: "Personal", icon: User },
    utilitarian_business: { label: "Utilitarian/Business", icon: Briefcase },
    casual: { label: "Casual", icon: ZapIcon },
  };


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

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Offerings</CardTitle>
            <CardDescription>What can you offer? Categorize each offering. Add at least one.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {offeringFields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-md space-y-4 relative shadow-sm bg-card">
                <FormField
                  control={form.control}
                  name={`offerings.${index}.title`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Offering Title #{index + 1}</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., Empathetic Listening, Web Design Help" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`offerings.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Offering Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe this offering in detail." {...field} className="min-h-[80px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`offerings.${index}.category`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {surrogateCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              <div className="flex items-center gap-2">
                                {React.createElement(categoryDisplayMap[category].icon, {className: "h-4 w-4"})}
                                {categoryDisplayMap[category].label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {offeringFields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-destructive hover:text-destructive/80"
                    onClick={() => removeOffering(index)}
                  >
                    <MinusCircle className="h-5 w-5" />
                    <span className="sr-only">Remove offering</span>
                  </Button>
                )}
              </div>
            ))}
            {offeringFields.length < 5 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => appendOffering({ title: "", description: "", category: 'personal' })}
                className="flex items-center gap-2"
              >
                <PlusCircle className="h-5 w-5" /> Add Another Offering
              </Button>
            )}
             {(form.formState.errors.offerings?.message || form.formState.errors.offerings?.root?.message) && (
                <FormMessage>{form.formState.errors.offerings?.message || form.formState.errors.offerings?.root?.message}</FormMessage>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Requests</CardTitle>
            <CardDescription>What are you looking for? Categorize each request. Add at least one.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {requestFields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-md space-y-4 relative shadow-sm bg-card">
                <FormField
                  control={form.control}
                  name={`requests.${index}.title`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Request Title #{index + 1}</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., Occasional Companionship, Help with Moving" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`requests.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Request Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe this request in detail." {...field} className="min-h-[80px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`requests.${index}.category`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {surrogateCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              <div className="flex items-center gap-2">
                                {React.createElement(categoryDisplayMap[category].icon, {className: "h-4 w-4"})}
                                {categoryDisplayMap[category].label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 {requestFields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-destructive hover:text-destructive/80"
                    onClick={() => removeRequest(index)}
                  >
                    <MinusCircle className="h-5 w-5" />
                     <span className="sr-only">Remove request</span>
                  </Button>
                 )}
              </div>
            ))}
            {requestFields.length < 5 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => appendRequest({ title: "", description: "", category: 'personal' })}
                className="flex items-center gap-2"
              >
                <PlusCircle className="h-5 w-5" /> Add Another Request
              </Button>
            )}
            {(form.formState.errors.requests?.message || form.formState.errors.requests?.root?.message) && (
                <FormMessage>{form.formState.errors.requests?.message || form.formState.errors.requests?.root?.message}</FormMessage>
            )}
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full sm:w-auto flex items-center gap-2" disabled={form.formState.isSubmitting}>
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
      </form>
    </Form>
  );
}
