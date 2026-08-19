"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { PlusCircle, MinusCircle, Loader2, Heart, MapPin, Clock, Shield, Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SurrogateCategory, Boundary, Offer } from '@/domain/types';

const surrogateCategories: [SurrogateCategory, ...SurrogateCategory[]] = ['personal', 'utilitarian_business', 'casual'];
const boundaries: [Boundary, ...Boundary[]] = ['platonic', 'romantic', 'physical', 'virtual', 'one-off', 'recurring'];

const offerFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters.").max(100, "Title too long."),
  description: z.string().min(10, "Description must be at least 10 characters.").max(500, "Description too long."),
  category: z.enum(surrogateCategories, { required_error: "Please select a category." }),
  locationMode: z.enum(['remote', 'local', 'either'], { required_error: "Please select location preference." }),
  timing: z.string().optional(),
  boundaries: z.array(z.enum(boundaries)).min(1, "Select at least one boundary."),
  capacity: z.number().min(1).max(50).optional(),
  tokenReward: z.number().min(0).max(1000).optional(),
});

export type OfferFormValues = z.infer<typeof offerFormSchema>;

const defaultValues: OfferFormValues = {
  title: "",
  description: "",
  category: 'personal',
  locationMode: 'either',
  timing: "",
  boundaries: ['platonic'],
  capacity: undefined,
  tokenReward: undefined,
};

interface OfferFormProps {
  onSuccess?: (offerId: string) => void;
  onCancel?: () => void;
  userId?: string;
  userName?: string;
}

export function OfferForm({ onSuccess, onCancel, userId = 'current-user', userName = 'You' }: OfferFormProps) {
  const { toast } = useToast();
  const form = useForm<OfferFormValues>({
    resolver: zodResolver(offerFormSchema),
    defaultValues,
    mode: "onChange",
  });

  async function onSubmit(data: OfferFormValues) {
    try {
      const offerData: Omit<Offer, 'id' | 'createdAt'> = {
        title: data.title,
        description: data.description,
        category: data.category,
        locationMode: data.locationMode,
        timing: data.timing || undefined,
        boundaries: data.boundaries,
        capacity: data.capacity || undefined,
        currentCapacity: 0,
        status: 'active',
        userId,
        userName,
        userAvatar: undefined,
        rating: undefined,
        reviewCount: undefined,
      };

      // TODO: Implement Offer creation service
      const offerId = `offer-${Date.now()}`;
      
      toast({
        title: "Offer Created!",
        description: `Your offer "${data.title}" is now visible to others looking for connections.`,
        variant: "default",
      });
      
      form.reset(defaultValues);
      onSuccess?.(offerId);
    } catch (error: any) {
      console.error("Error creating offer:", error);
      toast({
        title: "Offer Creation Failed",
        description: `There was an error creating your offer: ${error.message || "Please try again."}`,
        variant: "destructive",
      });
    }
  }

  const categoryDisplayMap: Record<SurrogateCategory, { label: string; icon: React.ElementType }> = {
    personal: { label: "Personal", icon: Heart },
    utilitarian_business: { label: "Utilitarian/Business", icon: MapPin },
    casual: { label: "Casual", icon: Clock },
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="text-primary h-6 w-6" />
              What I Offer
            </CardTitle>
            <CardDescription>Describe what you can offer to others in a surrogate connection.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Offer Title</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., Empathetic Listening, Web Design Help" {...field} />
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
                      placeholder="Describe what you're offering in detail. Be specific about your skills, experience, and what makes your offering valuable." 
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>Help others understand the value you provide.</FormDescription>
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
                  <FormDescription>What type of offering is this?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="locationMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Mode</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location mode" />
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
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="text-primary h-6 w-6" />
              Boundaries & Capacity
            </CardTitle>
            <CardDescription>Set boundaries and manage your capacity for this offering.</CardDescription>
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
                  <FormDescription>Select the boundaries that apply to this offering.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1" 
                      max="50"
                      placeholder="Maximum number of concurrent connections"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormDescription>How many people can you serve simultaneously? Leave empty for unlimited.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="text-yellow-600 h-6 w-6" />
              Token & Timing Settings
            </CardTitle>
            <CardDescription>Optional settings for token rewards and timing preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="tokenReward"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token Reward (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      max="1000"
                      placeholder="Tokens to reward per successful connection"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormDescription>Set a token reward (0-1000) for recipients of this offering. Leave empty for no reward.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  <FormDescription>When are you typically available for this offering?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                Creating Offer...
              </>
            ) : (
              <>
                <Heart className="h-5 w-5" />
                Create Offer
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