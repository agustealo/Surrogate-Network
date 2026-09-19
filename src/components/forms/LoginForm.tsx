"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, Mail, Lock } from "lucide-react";
import { createClient } from "@/infrastructure/supabase/browser";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const loginFormSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
    mode: "onChange",
  });

  const handleFormSubmit = async ({ email, password }: LoginFormValues) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      form.setError("root", { message: error.message });
      return;
    }

    toast({ title: "Welcome back", description: "You are signed in." });
    router.replace("/home");
    router.refresh();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email Address</FormLabel>
            <FormControl><Input type="email" autoComplete="email" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="password" render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2"><Lock className="h-4 w-4" /> Password</FormLabel>
            <FormControl><Input type="password" autoComplete="current-password" {...field} /></FormControl>
            <FormDescription><Link href="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link></FormDescription>
            <FormMessage />
          </FormItem>
        )} />
        {form.formState.errors.root?.message && <p role="alert" className="text-sm text-destructive">{form.formState.errors.root.message}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
          {!form.formState.isSubmitting && <LogIn className="ml-2 h-5 w-5" />}
        </Button>
        <p className="text-center text-sm text-muted-foreground">Don&apos;t have an account? <Link href="/signup" className="font-semibold text-primary hover:underline">Sign up</Link></p>
      </form>
    </Form>
  );
}
