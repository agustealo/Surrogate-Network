
"use client";

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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Star, Send, Award } from "lucide-react"; // Added Award icon
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";

const feedbackFormSchema = z.object({
  punctuality: z.number().min(1).max(5),
  reliability: z.number().min(1).max(5),
  communicationClarity: z.number().min(1).max(5),
  skillEndorsements: z.string().max(500, "Skill endorsements are too long.").optional().or(z.literal('')),
  comments: z.string().max(1000, "Comments too long.").optional().or(z.literal('')),
});

type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

const defaultValues: FeedbackFormValues = {
  punctuality: 3,
  reliability: 3,
  communicationClarity: 3,
  skillEndorsements: "",
  comments: "",
};

interface FeedbackFormProps {
  companionName?: string; // Name of the person being reviewed
  onFeedbackSubmit?: (data: FeedbackFormValues) => void;
}

export function FeedbackForm({ companionName = "your companion", onFeedbackSubmit }: FeedbackFormProps) {
  const { toast } = useToast();
  const [punctuality, setPunctuality] = useState(defaultValues.punctuality);
  const [reliability, setReliability] = useState(defaultValues.reliability);
  const [communication, setCommunication] = useState(defaultValues.communicationClarity);

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues,
    mode: "onChange",
  });

  function onSubmit(data: FeedbackFormValues) {
    const finalData = {
      ...data,
      punctuality,
      reliability,
      communicationClarity: communication,
    };
    console.log("Feedback submitted:", finalData); 
    if (onFeedbackSubmit) {
      onFeedbackSubmit(finalData);
    }
    toast({
      title: "Feedback Submitted!",
      description: `Thank you for your valuable feedback on ${companionName}.`,
    });
    form.reset(defaultValues); // Reset all fields including new ones
    setPunctuality(defaultValues.punctuality);
    setReliability(defaultValues.reliability);
    setCommunication(defaultValues.communicationClarity);
    // No need to reset skillEndorsements or comments separately as form.reset() handles it.
  }
  
  const RatingDisplay = ({ value }: { value: number }) => (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-5 w-5 ${star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`}
        />
      ))}
      <span className="ml-2 text-sm font-medium text-foreground">{value}/5</span>
    </div>
  );


  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg">
      <CardHeader>
        <CardTitle>Provide Feedback</CardTitle>
        <CardDescription>
          Rate your experience with {companionName} on the following criteria. 
          Your honest feedback helps improve our community.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="punctuality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Punctuality</FormLabel>
                  <FormControl>
                     <Slider
                        defaultValue={[punctuality]}
                        max={5}
                        min={1}
                        step={1}
                        onValueChange={(value) => {
                            setPunctuality(value[0]);
                            field.onChange(value[0]);
                        }}
                        className="py-2"
                      />
                  </FormControl>
                  <RatingDisplay value={punctuality} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reliability"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reliability</FormLabel>
                  <FormControl>
                     <Slider
                        defaultValue={[reliability]}
                        max={5}
                        min={1}
                        step={1}
                        onValueChange={(value) => {
                            setReliability(value[0]);
                            field.onChange(value[0]);
                        }}
                        className="py-2"
                      />
                  </FormControl>
                  <RatingDisplay value={reliability} />
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="communicationClarity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Communication Clarity</FormLabel>
                   <FormControl>
                     <Slider
                        defaultValue={[communication]}
                        max={5}
                        min={1}
                        step={1}
                        onValueChange={(value) => {
                            setCommunication(value[0]);
                            field.onChange(value[0]);
                        }}
                        className="py-2"
                      />
                  </FormControl>
                  <RatingDisplay value={communication} />
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="skillEndorsements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Skill Endorsements (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={`Were there any specific skills ${companionName} demonstrated exceptionally well? E.g., "Excellent listener", "Great problem-solver", "Very patient".`}
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Highlight positive skills or qualities observed.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Comments (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share any other thoughts or details about your experience, positive or constructive."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" size="lg" className="w-full flex items-center gap-2" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Submitting..." : "Submit Feedback"}
              {!form.formState.isSubmitting && <Send className="h-5 w-5" />}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
