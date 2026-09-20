"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, Mail, Lock, UserCircle2 } from "lucide-react";
import { createClient } from "@/infrastructure/supabase/browser";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { TRIAL_MINIMUM_AGE, TRIAL_POLICY_VERSION } from "@/lib/trialPolicy";

const signUpFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80, "Name is too long."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters."),
  acceptTrialPolicy: z.boolean().refine((value) => value, {
    message: `You must be at least ${TRIAL_MINIMUM_AGE} and accept the trial terms and privacy notice.`,
  }),
}).refine((data) => data.password === data.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });

type SignUpFormValues = z.infer<typeof signUpFormSchema>;

export function SignUpForm() {
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "", acceptTrialPolicy: false },
    mode: "onChange",
  });

  const handleFormSubmit = async ({ name, email, password }: SignUpFormValues) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          trial_terms_version: TRIAL_POLICY_VERSION,
          trial_privacy_version: TRIAL_POLICY_VERSION,
          trial_age_confirmed: true,
        },
      },
    });

    if (error) {
      form.setError("root", { message: error.message });
      return;
    }

    if (data.session) {
      router.replace("/profile/create");
      router.refresh();
      return;
    }

    toast({ title: "Check your email", description: "Confirm your email address to finish creating your account." });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel className="flex items-center gap-2"><UserCircle2 className="h-4 w-4" /> Full Name</FormLabel><FormControl><Input autoComplete="name" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem><FormLabel className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email Address</FormLabel><FormControl><Input type="email" autoComplete="email" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="password" render={({ field }) => (
          <FormItem><FormLabel className="flex items-center gap-2"><Lock className="h-4 w-4" /> Password</FormLabel><FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="confirmPassword" render={({ field }) => (
          <FormItem><FormLabel className="flex items-center gap-2"><Lock className="h-4 w-4" /> Confirm Password</FormLabel><FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="acceptTrialPolicy" render={({ field }) => (
          <FormItem>
            <label className="flex items-start gap-3 rounded-md border p-4 text-sm">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  className="mt-1 h-4 w-4"
                />
              </FormControl>
              <span>
                I confirm I am at least {TRIAL_MINIMUM_AGE} and agree to the <Link className="underline" href="/terms" target="_blank">Consumer Trial Terms</Link> and <Link className="underline" href="/privacy" target="_blank">Privacy Notice</Link>.
              </span>
            </label>
            <FormMessage />
          </FormItem>
        )} />
        {form.formState.errors.root?.message && <p role="alert" className="text-sm text-destructive">{form.formState.errors.root.message}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Creating account..." : "Create Account"}
          {!form.formState.isSubmitting && <UserPlus className="ml-2 h-5 w-5" />}
        </Button>
        <p className="text-center text-sm text-muted-foreground">Already have an account? <Link href="/login" className="font-semibold text-primary hover:underline">Sign in</Link></p>
      </form>
    </Form>
  );
}
