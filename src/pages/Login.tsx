import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";

type LoginForm = { email: string; password: string };
type SignupForm = { email: string; password: string; name: string };

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");

  const loginForm = useForm<LoginForm>();
  const signupForm = useForm<SignupForm>();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: err => {
      setError(err.message);
    },
  });

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: err => {
      setError(err.message);
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>{isSignup ? "Sign Up" : "Sign In"}</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
              {error}
            </div>
          )}

          {!isSignup ? (
            <form
              onSubmit={loginForm.handleSubmit(data => {
                setError("");
                loginMutation.mutate(data);
              })}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...loginForm.register("email", { required: true })}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...loginForm.register("password", { required: true })}
                  placeholder="••••••••"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setIsSignup(true);
                  setError("");
                }}
                className="w-full text-sm text-blue-600 hover:underline"
              >
                Create an account
              </button>
            </form>
          ) : (
            <form
              onSubmit={signupForm.handleSubmit(data => {
                setError("");
                signupMutation.mutate(data);
              })}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  {...signupForm.register("name", { required: true })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  {...signupForm.register("email", { required: true })}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  {...signupForm.register("password", { required: true })}
                  placeholder="At least 8 characters"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={signupMutation.isPending}
              >
                {signupMutation.isPending ? "Creating account..." : "Sign Up"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setIsSignup(false);
                  setError("");
                }}
                className="w-full text-sm text-blue-600 hover:underline"
              >
                Already have an account? Sign in
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
