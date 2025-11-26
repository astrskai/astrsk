import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Card } from "@/shared/ui/card";
import { LogIn } from "lucide-react";
import { useState } from "react";

/**
 * Simple sign in page
 * TODO: Implement actual authentication logic
 */
export function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Sign in attempt:", { email, password });
    // TODO: Implement actual login logic
  };

  return (
    <div className="bg-background-surface-2 flex h-full w-full items-center justify-center p-4">
      <Card className="bg-background-surface-1 w-full max-w-md space-y-6 border-0 p-8">
        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="bg-primary/10 mx-auto flex h-12 w-12 items-center justify-center rounded-full">
            <LogIn className="text-primary h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="text-text-secondary text-sm">
            Sign in to your account to continue
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" size="lg">
            Sign In
          </Button>
        </form>

        {/* Footer */}
        <div className="text-text-secondary text-center text-sm">
          Don't have an account?{" "}
          <a href="/settings/account" className="text-primary hover:underline">
            Sign Up
          </a>
        </div>
      </Card>
    </div>
  );
}
