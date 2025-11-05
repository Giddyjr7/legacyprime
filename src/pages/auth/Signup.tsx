import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupFormData } from "@/lib/validation";
import { APIError } from "@/utils/api";

const Signup = () => {
  const navigate = useNavigate();
  const { register: authRegister } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const [serverErrors, setServerErrors] = useState<Partial<Record<keyof SignupFormData | 'non_field_errors', string | null>>>({});

  const handleCreateAccount = async (data: SignupFormData) => {
    // Clear previous server errors
    setServerErrors({});

    try {
      await authRegister({
        email: data.email,
        username: data.username,
        password: data.password,
        password2: data.password2,
        first_name: data.first_name,
        last_name: data.last_name,
      });

      // Redirect to OTP verification with email in query params
      navigate(`/verify-otp?email=${encodeURIComponent(data.email)}`);
    } catch (error) {
      // If server returned validation errors, map them to the form
      if (error instanceof APIError && error.status === 400 && error.data) {
        const dataErr = error.data as any;
        const nextErrors: any = {};
        for (const key of Object.keys(dataErr)) {
          const val = dataErr[key];
          if (Array.isArray(val)) nextErrors[key] = val.join(' ');
          else if (typeof val === 'string') nextErrors[key] = val;
          else nextErrors[key] = JSON.stringify(val);
        }
        setServerErrors(nextErrors);
      } else {
        console.error('Registration error:', error);
      }
      // Let AuthContext already show a toast; rethrow for upstream logic if needed
      throw error;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <Card className="w-full max-w-md bg-card text-card-foreground shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">Create Account</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(handleCreateAccount)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Input
                  {...register("first_name", {
                    onChange: () => {
                      if (serverErrors.first_name) setServerErrors((s) => ({ ...s, first_name: null }));
                    },
                  })}
                  placeholder="First Name"
                  className={`bg-input text-foreground border ${
                    (serverErrors.first_name || errors.first_name) ? "border-destructive" : "border-border"
                  }`}
                />
                {(serverErrors.first_name || errors.first_name) && (
                  <p className="text-sm text-destructive">{serverErrors.first_name ?? errors.first_name?.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Input
                  {...register("last_name", {
                    onChange: () => {
                      if (serverErrors.last_name) setServerErrors((s) => ({ ...s, last_name: null }));
                    },
                  })}
                  placeholder="Last Name"
                  className={`bg-input text-foreground border ${
                    (serverErrors.last_name || errors.last_name) ? "border-destructive" : "border-border"
                  }`}
                />
                {(serverErrors.last_name || errors.last_name) && (
                  <p className="text-sm text-destructive">{serverErrors.last_name ?? errors.last_name?.message}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Input
                {...register("username", {
                  onChange: () => {
                    if (serverErrors.username) setServerErrors((s) => ({ ...s, username: null }));
                  },
                })}
                placeholder="Username"
                className={`bg-input text-foreground border ${
                  (serverErrors.username || errors.username) ? "border-destructive" : "border-border"
                }`}
              />
              {(serverErrors.username || errors.username) && (
                <p className="text-sm text-destructive">{serverErrors.username ?? errors.username?.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Input
                {...register("email", {
                  onChange: () => {
                    if (serverErrors.email) setServerErrors((s) => ({ ...s, email: null }));
                  },
                })}
                type="email"
                placeholder="Email"
                className={`bg-input text-foreground border ${
                  (serverErrors.email || errors.email) ? "border-destructive" : "border-border"
                }`}
              />
              {(serverErrors.email || errors.email) && (
                <p className="text-sm text-destructive">{serverErrors.email ?? errors.email?.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Input
                  {...register("password", {
                    onChange: () => {
                      if (serverErrors.password) setServerErrors((s) => ({ ...s, password: null }));
                    },
                  })}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className={`bg-input text-foreground border ${
                    (serverErrors.password || errors.password) ? "border-destructive" : "border-border"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {(serverErrors.password || errors.password) && (
                <p className="text-sm text-destructive">{serverErrors.password ?? errors.password?.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Input
                  {...register("password2", {
                    onChange: () => {
                      if (serverErrors.password2) setServerErrors((s) => ({ ...s, password2: null }));
                    },
                  })}
                  type={showPassword2 ? "text" : "password"}
                  placeholder="Confirm Password"
                  className={`bg-input text-foreground border ${
                    (serverErrors.password2 || errors.password2) ? "border-destructive" : "border-border"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword2((s) => !s)}
                  aria-label={showPassword2 ? "Hide confirm password" : "Show confirm password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword2 ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {(serverErrors.password2 || errors.password2) && (
                <p className="text-sm text-destructive">{serverErrors.password2 ?? errors.password2?.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/80"
            >
              {isSubmitting ? "Creating..." : "Create Account"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already registered? <a href="/auth/login" className="text-primary hover:underline">Sign in</a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Signup;
