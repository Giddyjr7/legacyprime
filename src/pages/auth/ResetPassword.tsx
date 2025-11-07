import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from '@/utils/api';
import { ENDPOINTS } from '@/config/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Step = 'email' | 'otp' | 'password';

interface RequestResetResponse {
  message: string;
}

interface VerifyOtpResponse {
  message: string;
}

interface SetNewPasswordResponse {
  message: string;
}

const ResetPassword = () => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post<RequestResetResponse>(ENDPOINTS.REQUEST_PASSWORD_RESET, { email });
      setStep('otp');
      toast({ title: 'Code Sent', description: data.message || 'Reset code sent to your email' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to send reset code. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post<VerifyOtpResponse>(ENDPOINTS.VERIFY_PASSWORD_RESET_OTP, { email, otp });
      setStep('password');
      toast({ title: 'Verified', description: data.message || 'Reset code verified' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Invalid Code',
        description: error?.response?.data?.message || 'The code you entered is invalid or expired.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Passwords do not match.'
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Password must be at least 8 characters long.'
      });
      return;
    }

    setLoading(true);

    try {
      console.log('🔍 DEBUG - Setting new password with:', {
        email,
        otp,
        new_password: newPassword,
        confirm_password: confirmPassword
      });

      const { data } = await api.post<SetNewPasswordResponse>(ENDPOINTS.SET_NEW_PASSWORD, {
        email: email,
        otp: otp,
        new_password: newPassword,
        confirm_password: confirmPassword
      });

      console.log('🔍 DEBUG - Password reset successful:', data);
      
      toast({ 
        title: 'Success',
        description: data.message || 'Your password has been reset successfully.'
      });
      navigate('/auth/login');
    } catch (error: any) {
      console.error('🔍 DEBUG - Password reset error:', error);
      
      const errorMessage = error?.response?.data?.error || 
                        error?.response?.data?.message || 
                        'Failed to reset password. Please try again.';
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <Card className="w-full max-w-md bg-card text-card-foreground shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">
            Reset Password
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* STEP 1 — ENTER EMAIL */}
          {step === 'email' && (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center">
                  Enter your email address to receive a reset code
                </p>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-input text-foreground border border-border"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/80"
              >
                {loading ? "Sending Code..." : "Send Reset Code"}
              </Button>
            </form>
          )}

          {/* STEP 2 — VERIFY OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center">
                  Enter the code sent to your email address
                </p>
                <Input
                  type="text"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="bg-input text-foreground border border-border text-center tracking-widest text-xl"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/80"
              >
                {loading ? "Verifying..." : "Verify Code"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep('email')}
                className="w-full"
              >
                Try Different Email
              </Button>
            </form>
          )}

          {/* STEP 3 — SET NEW PASSWORD */}
          {step === 'password' && (
            <form onSubmit={handleSetNewPassword} className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center">
                  Enter your new password
                </p>
                <Input
                  type="password"
                  placeholder="New password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-input text-foreground border border-border"
                />
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-input text-foreground border border-border"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/80"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Remember password?{" "}
            <Link to="/auth/login" className="text-primary hover:underline">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ResetPassword;