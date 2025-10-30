import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/utils/api";
import { ENDPOINTS } from "@/config/api";

const VerifyOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState<string>("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(emailParam);
    } else {
      navigate('/login');
    }
  }, [location, navigate]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No email found. Please start the verification process again."
      });
      return;
    }

    setLoading(true);
    try {
      await api.post(ENDPOINTS.VERIFY_OTP, { email, otp });
      
      toast({
        title: "Success",
        description: "Email verified successfully!"
      });

      // Redirect to complete profile or dashboard
      navigate("/complete-profile");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "OTP verification failed"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setResendMessage("No email available to resend OTP to.");
      return;
    }

    setResendMessage(null);
    setResendLoading(true);
    try {
      await api.post(ENDPOINTS.RESEND_OTP, { email });
      setResendMessage(`OTP resent to ${email}`);
      toast({
        title: "Success",
        description: "OTP has been resent to your email"
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to resend OTP";
      setResendMessage(message);
      toast({
        variant: "destructive",
        title: "Error",
        description: message
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <Card className="w-full max-w-md bg-card text-card-foreground shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">Verify Email</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            We sent a 6-digit code to <strong>{email || "your email"}</strong>. Enter it below.
          </p>

          <form onSubmit={handleVerify} className="space-y-4">
            <Input
              type="text"
              maxLength={6}
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="bg-input text-foreground border border-border text-center tracking-widest text-xl"
            />

            <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/80">
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Didn’t receive code?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
              className="text-sm text-primary underline disabled:opacity-50"
            >
              {resendLoading ? 'Resending...' : 'Resend'}
            </button>
          </p>
          {resendMessage && (
            <p className="text-xs text-muted-foreground">{resendMessage}</p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default VerifyOtp;
