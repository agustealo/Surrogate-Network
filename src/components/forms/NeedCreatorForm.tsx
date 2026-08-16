
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, type Dispatch, type SetStateAction } from "react";
import { generateNeedTags, type GenerateNeedTagsInput, type GenerateNeedTagsOutput } from "@/ai/flows/generate-need-tags";
import { TagBadge } from "@/components/common/TagBadge";

const needCreatorFormSchema = z.object({
  needDescription: z.string().min(20, "Please describe your need in at least 20 characters.").max(1000, "Description is too long."),
});

type NeedCreatorFormValues = z.infer<typeof needCreatorFormSchema>;

interface NeedCreatorFormProps {
  onTagsGenerated?: (tags: string[]) => void; // Callback for when tags are finalized
  initialDescription?: string;
  setFinalTags?: Dispatch<SetStateAction<string[]>>; // Optional: if form is part of larger flow
}

export function NeedCreatorForm({ onTagsGenerated, initialDescription = "", setFinalTags }: NeedCreatorFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]); // Corrected this line
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const form = useForm<NeedCreatorFormValues>({
    resolver: zodResolver(needCreatorFormSchema),
    defaultValues: { needDescription: initialDescription },
    mode: "onChange",
  });

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  async function onSubmit(data: NeedCreatorFormValues) {
    setIsLoading(true);
    setSuggestedTags([]);
    setSelectedTags([]);
    try {
      const input: GenerateNeedTagsInput = { needDescription: data.needDescription };
      const result: GenerateNeedTagsOutput = await generateNeedTags(input);
      
      if (result.suggestedTags && result.suggestedTags.length > 0) {
        setSuggestedTags(result.suggestedTags);
        setSelectedTags(result.suggestedTags); // Auto-select all initially
        toast({
          title: "Tags Suggested!",
          description: "AI has suggested some tags for your need. Review and adjust them below.",
        });
      } else {
        toast({
          title: "No Tags Suggested",
          description: "The AI couldn't suggest tags for this description. Try rephrasing or adding more detail.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating tags:", error);
      toast({
        title: "Error Generating Tags",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleFinalizeTags = () => {
    if (selectedTags.length === 0) {
      toast({
        title: "No Tags Selected",
        description: "Please select or confirm at least one tag.",
        variant: "destructive"
      });
      return;
    }
    if (onTagsGenerated) {
      onTagsGenerated(selectedTags);
    }
    if (setFinalTags) {
        setFinalTags(selectedTags);
    }
    toast({
        title: "Tags Confirmed!",
        description: `You've confirmed ${selectedTags.length} tags for your need.`,
        action: <CheckCircle className="text-green-500" />
    });
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          AI-Powered Need Definition
        </CardTitle>
        <CardDescription>
          Describe what you're looking for, and our AI will help you categorize it with relevant tags.
          This helps in finding the best matches.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="needDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">Describe Your Need</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="E.g., 'I need someone to help me with weekly grocery shopping as I have mobility issues.' or 'I'm looking for a study buddy for advanced calculus.'"
                      className="min-h-[150px] text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide as much detail as possible for better tag suggestions.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Tags...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Need Tags
                </>
              )}
            </Button>
          </form>
        </Form>

        {(suggestedTags.length > 0) && (
          <div className="mt-8 space-y-4">
            <div>
                <h3 className="text-lg font-semibold">Suggested Tags</h3>
                <p className="text-sm text-muted-foreground">Click tags to select or deselect them. These will help others find your request.</p>
            </div>
            <div className="flex flex-wrap gap-2 p-4 border rounded-md bg-background/50 min-h-[60px]">
              {suggestedTags.map((tag) => (
                <TagBadge
                  key={tag}
                  tag={tag}
                  interactive
                  isSelected={selectedTags.includes(tag)}
                  onClick={handleTagToggle}
                />
              ))}
            </div>
             <Button onClick={handleFinalizeTags} disabled={selectedTags.length === 0} className="w-full sm:w-auto">
                <CheckCircle className="mr-2 h-5 w-5" />
                Confirm Selected Tags ({selectedTags.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
