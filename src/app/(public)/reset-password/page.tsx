"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/browser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setPending(true);
    setError(null);
    const { error: updateError } = await createClient().auth.updateUser({ password });
    setPending(false);
    if (updateError) return setError(updateError.message);
    router.replace("/home");
    router.refresh();
  }

  return (
    <main className="container mx-auto max-w-md px-4 py-16">
      <Card>
        <CardHeader><CardTitle>Choose a new password</CardTitle><CardDescription>Use at least eight characters.</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="password">New password</Label><Input id="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="confirm">Confirm password</Label><Input id="confirm" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" disabled={pending}>{pending ? "Updating..." : "Update password"}</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
