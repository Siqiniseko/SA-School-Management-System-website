import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, ShieldAlert, BookOpen, Users, Banknote, Loader2 } from "lucide-react";

const DEMO_ACCOUNTS = [
  { role: "Admin", username: "admin", password: "admin123", icon: ShieldAlert },
  { role: "Teacher", username: "teacher1", password: "teacher123", icon: BookOpen },
  { role: "Learner", username: "learner1", password: "learner123", icon: GraduationCap },
  { role: "Parent", username: "parent1", password: "parent123", icon: Users },
  { role: "Accountant", username: "accountant1", password: "accountant123", icon: Banknote },
];

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (u: string, p: string) => {
    setIsSubmitting(true);
    try {
      const res = await login({ data: { username: u, password: p } });
      toast({
        title: `Welcome back, ${res.user.fullName}`,
        description: `Signed in as ${res.user.role}`,
      });
      window.location.href = `/dashboard/${res.user.role}`;
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error?.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    handleLogin(username, password);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <div className="mx-auto h-16 w-16 bg-primary rounded-xl flex items-center justify-center text-primary-foreground mb-4 shadow-lg">
          <span className="text-2xl font-bold">SA</span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          School Management
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to access your portal
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border-border shadow-xl">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sign In
              </Button>
            </form>
          </CardContent>
          <div className="px-6 py-4 bg-muted/50 border-t border-border">
            <p className="text-sm font-medium text-muted-foreground mb-3 text-center">
              Quick Demo Access
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {DEMO_ACCOUNTS.map((acc) => {
                const Icon = acc.icon;
                return (
                  <Button
                    key={acc.role}
                    variant="outline"
                    size="sm"
                    className="flex flex-col items-center gap-1 h-auto py-2 px-1"
                    onClick={() => handleLogin(acc.username, acc.password)}
                    disabled={isSubmitting}
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-xs">{acc.role}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
