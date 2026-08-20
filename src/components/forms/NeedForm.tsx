"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, type FieldPath } from "react-hook-form";
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
import { PlusCircle, MinusCircle, Loader2, Coffee, MapPin, Clock, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SurrogateCategory, Boundary, Need } from '@/domain/types';

const surrogateCategories: [SurrogateCategory, ...SurrogateCategory[]] = ['personal', 'utilitarian_business', 'casual'];
const boundaries: [Boundary, ...Boundary[]] = ['platonic', 'romantic', 'physical', 'virtual', 'one-off', 'recurring'];

const needFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters.").max(100, "Title too long."),
  description: z.string().min(10, "Description must be at least 10 characters.").max(500, "Description too long."),
  category: z.enum(surrogateCategories, { required_error: "Please select a category." }),
  locationMode: z.enum(['remote', 'local', 'either'], { required_error: "Please select location preference." }),
  timing: z.string().optional(),
  boundaries: z.array(z.enum(boundaries)).min(1, "Select at least one boundary."),
  urgency: z.enum(['low', 'medium', 'high']).optional(),
  tags: z.array(z.string().min(1).max(30)).max(10, "Maximum 10 tags allowed"),
});

export type NeedFormValues = z.infer<typeof needFormSchema>;

const defaultValues: NeedFormValues = {
  title: "",
  description: "",
  category: 'personal',
  locationMode: 'either',
  timing: "",
  boundaries: ['platonic'],
  urgency: 'medium',
  tags: [],
};

interface NeedFormProps {
  onSuccess?: (needId: string) => void;
  onCancel?: () => void;
  userId?: string;
  userName?: string;
}

export function NeedForm({ onSuccess, onCancel, userId = 'current-user', userName = 'You' }: NeedFormProps) {
  const { toast } = useToast();
  const form = useForm<NeedFormValues>({
    resolver: zodResolver(needFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const { fields: tagFields, append: appendTag, remove: removeTag } = useFieldArray({
    control: form.control,
    name: 'tags',
  } as any);

  async function onSubmit(data: NeedFormValues) {
    try {
      const needData: Omit<Need, 'id' | 'createdAt'> = {
        title: data.title,
        description: data.description,
        category: data.category,
        tags: data.tags,
        locationMode: data.locationMode,
        timing: data.timing || undefined,
        boundaries: data.boundaries,
        urgency: data.urgency || undefined,
        status: 'active',
        userId,
        userName,
        userAvatar: undefined,
        expiresAt: undefined,
      };

      // TODO: Implement Need creation service
      const needId = `need-${Date.now()}`;
      
      toast({
        title: "Need Created!",
        description: `Your need "${data.title}" has been created and is now visible to others.`,
        variant: "default",
      });
      
      form.reset(defaultValues);
      onSuccess?.(needId);
    } catch (error: any) {
      console.error("Error creating need:", error);
      toast({
        title: "Need Creation Failed",
        description: `There was an error creating your need: ${error.message || "Please try again."}`,
        variant: "destructive",
      });
    }
  }

  const categoryDisplayMap: Record<SurrogateCategory, { label: string; icon: React.ElementType }> = {
    personal: { label: "Personal", icon: Coffee },
    utilitarian_business: { label: "Utilitarian/Business", icon: MapPin },
    casual: { label: "Casual", icon: Clock },
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coffee className="text-accent h-6 w-6" />
              What I Need
            </CardTitle>
            <CardDescription>Describe what you're looking for in a surrogate connection.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Need Title</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., Occasional Companionship, Help with Moving" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detailed Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe what you're looking for in detail. Be specific about your expectations and what would make this connection meaningful for you." 
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>Help others understand if they can meet your needs.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
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
                  <FormDescription>What type of connection are you seeking?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="locationMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Preference</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location preference" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="remote">Remote (Online)</SelectItem>
                      <SelectItem value="local">In-Person (Local)</SelectItem>
                      <SelectItem value="either">Either (Flexible)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="urgency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Urgency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="How urgent is this need?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low - No immediate rush</SelectItem>
                      <SelectItem value="medium">Medium - Somewhat time-sensitive</SelectItem>
                      <SelectItem value="high">High - Need this soon</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="text-primary h-6 w-6" />
              Boundaries & Safety
            </CardTitle>
            <CardDescription>Set clear boundaries to ensure safe, respectful connections.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="boundaries"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Boundaries</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {boundaries.map((boundary) => (
                        <label
                          key={boundary}
                          className={`
                            flex items-center gap-2 p-3 border rounded-md cursor-pointer transition-colors
                            ${field.value.includes(boundary) 
                              ? "bg-primary/10 border-primary text-primary" 
                              : "hover:bg-muted/50"
                            }
                          `}
                        >
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={field.value.includes(boundary)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                field.onChange([...field.value, boundary]);
                              } else {
                                field.onChange(field.value.filter((b) => b !== boundary));
                              }
                            }}
                          />
                          <span className="capitalize">{boundary.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </FormControl>
                  <FormDescription>Select the boundaries that apply to this need.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="text-muted-foreground h-6 w-6" />
              Additional Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="timing"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timing Preferences</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="E.g., Weekend mornings, Weekday evenings, Flexible schedule" 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>When would work best for this connection?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Tags (Optional)</FormLabel>
              <div className="mt-2 space-y-2">
                {tagFields.map((field: { id: string }, index: number) => (
                  <div key={field.id} className="flex gap-2">
                    <Input 
                      placeholder="Add a tag (e.g., Companionship, Support)"
                      {...form.register(`tags.${index}` as const)}
                    />
                    {tagFields.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTag(index)}
                      >
                        <MinusCircle className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
                {tagFields.length < 10 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendTag('')}
                    className="mt-2"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Tag
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button 
            type="submit" 
            size="lg" 
            className="flex-1 flex items-center gap-2" 
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Creating Need...
              </>
            ) : (
              <>
                <Coffee className="h-5 w-5" />
                Create Need
              </>
            )}
          </Button>
          
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              size="lg"
              onClick={onCancel}
              disabled={form.formState.isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}