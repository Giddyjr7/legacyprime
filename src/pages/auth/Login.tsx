import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { APIError } from "@/utils/api";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [serverErrors, setServerErrors] = useState<{
    email?: string | null;
    password?: string | null;
    non_field_errors?: string | null;
  }>({});
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Clear any previous server errors
    setServerErrors({});
    const startTime = Date.now();

    try {
      await login(email, password);

      // Ensure minimum 10 seconds loading time
      const timeElapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, 10000 - timeElapsed);
      await new Promise(resolve => setTimeout(resolve, remainingTime));

      toast({
        title: "Success",
        description: `Welcome back ${email}!`,
      });
      navigate("/dashboard");
    } catch (error) {
      // If the API returned structured validation errors, display them inline
      if (error instanceof APIError && error.status === 400 && error.data) {
        const data = error.data as any;
        const nextErrors: any = {};
        // Common Django-rest-framework validation shape: { field: ["msg"] }
        for (const key of Object.keys(data)) {
          const val = data[key];
          if (Array.isArray(val)) {
            nextErrors[key] = val.join(" ");
          } else if (typeof val === 'string') {
            nextErrors[key] = val;
          } else {
            nextErrors[key] = JSON.stringify(val);
          }
        }
        setServerErrors(nextErrors);
        // Also show a toast summary
        toast({
          variant: "destructive",
          title: "Login failed",
          description: nextErrors.non_field_errors || nextErrors.detail || "Please check your input and try again",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Login failed",
        });
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const [showPassword, setShowPassword] = useState(false);

  // If redirected here with a flash message (e.g. after verifying email), show
  // a success toast so the user isn't confused by being sent to login.
  useEffect(() => {
    const state = (location.state as any) || {};
    if (state.flashMessage) {
      toast({ title: 'Success', description: state.flashMessage });
      // Clear the history state so the message doesn't reappear on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-muted-foreground">Logging you in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <Card className="w-full max-w-md bg-card text-card-foreground shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">Login</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                // clear server error for this field while user edits
                if (serverErrors.email) setServerErrors((s) => ({ ...s, email: null }));
              }}
              className="bg-input text-foreground border border-border"
              required
            />
            {serverErrors.email && (
              <p className="text-sm text-destructive">{serverErrors.email}</p>
            )}
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (serverErrors.password) setServerErrors((s) => ({ ...s, password: null }));
                }}
                className="bg-input text-foreground border border-border"
                required
              />
              {serverErrors.password && (
                <p className="text-sm text-destructive mt-2">{serverErrors.password}</p>
              )}
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Forgot password link */}
            <div className="text-right">
              <Link
                to="/reset-password"
                className="text-primary text-sm hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/80"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3">
          <p className="text-sm text-muted-foreground text-center">
            Don’t have an account?{" "}
            <Link to="/auth/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

export default Login
