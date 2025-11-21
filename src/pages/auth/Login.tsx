import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Logo from "@/assets/LEGACYPRIME-LOGO-WEB-ICON.png";
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
    setServerErrors({});

    try {
      await login(email, password);

      toast({
        title: "Success",
        description: `Welcome back ${email}!`,
      });
      navigate("/dashboard");
    } catch (error) {
      // Generic helper to extract message(s) from backend response
      const extractMessages = (data: any) => {
        const out: any = {};
        if (!data) return out;

        // If backend returned a simple string or detail field
        if (typeof data === 'string') {
          out.non_field_errors = data;
          return out;
        }

        if (data.detail) {
          out.non_field_errors = data.detail;
          return out;
        }

        if (data.message) {
          out.non_field_errors = data.message;
          return out;
        }

        // Otherwise, try to flatten object fields
        for (const key of Object.keys(data)) {
          const val = data[key];
          if (Array.isArray(val)) out[key] = val.join(' ');
          else if (typeof val === 'string') out[key] = val;
          else out[key] = JSON.stringify(val);
        }
        return out;
      };

      if (error instanceof APIError) {
        const data = (error as any).data;
        const nextErrors = extractMessages(data);
        setServerErrors(nextErrors);

        const errorDescription = nextErrors.email || nextErrors.password || nextErrors.non_field_errors || error.message || 'Please check your input and try again.';

        toast({
          variant: 'destructive',
          title: 'Login failed',
          description: errorDescription,
        });
      } else if (error instanceof Error) {
        // Non-API error (network, unexpected)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Login failed',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'An unknown error occurred. Please try again.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const state = (location.state as any) || {};
    if (state.flashMessage) {
      toast({ title: 'Success', description: state.flashMessage });
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero hero-glow text-foreground">
      <Card className="w-full max-w-md bg-card text-card-foreground shadow-xl shadow-primary/10 border border-border/40">
        <CardHeader>
          <div className="flex flex-col items-center gap-3 py-4">
            <img src={Logo} alt="LegacyPrime logo" className="w-12 h-12" />
            <CardTitle className="text-2xl font-semibold text-center">Login</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 py-6 px-4">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  // Clear email error when user starts typing
                  if (serverErrors.email) setServerErrors((s) => ({ ...s, email: null }));
                }}
                className="bg-input text-foreground border border-border"
                required
              />
              {serverErrors.email && (
                <p className="text-sm text-destructive mt-2">{serverErrors.email}</p>
              )}
            </div>
            
            <div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    // Clear password error when user starts typing
                    if (serverErrors.password) setServerErrors((s) => ({ ...s, password: null }));
                  }}
                  className="bg-input text-foreground border border-border"
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {serverErrors.password && (
                <p className="text-sm text-destructive mt-2">{serverErrors.password}</p>
              )}
            </div>

            <div className="text-right">
              <Link
                to="/auth/reset-password"
                className="text-primary text-sm hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/80 hover:scale-[1.02] transition-transform duration-150"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3">
          <p className="text-sm text-muted-foreground text-center">
            Don't have an account?{" "}
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