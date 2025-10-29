import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/context/AuthContext";

const VerifyOtp = () => {
  const { pendingEmail, setPendingEmail } = useAuthContext();
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  // if no pending email, send user back to signup
  if (!pendingEmail) {
    // optional: you could navigate back to signup automatically
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: POST to backend verify endpoint with { email: pendingEmail, otp }
      await new Promise((r) => setTimeout(r, 1000)); // simulate

      // clear pendingEmail if you want (we'll keep it available for complete-profile if needed)
      // setPendingEmail(null);

      // on success, go to complete profile
      navigate("/complete-profile");
    } catch (err) {
      alert("OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!pendingEmail) {
      setResendMessage("No email available to resend OTP to.");
      return;
    }

    setResendMessage(null);
    setResendLoading(true);
    try {
      // TODO: Replace with real API call when backend is ready, e.g.
      // await fetch(`${API_URL}/auth/resend-otp`, { method: 'POST', body: JSON.stringify({ email: pendingEmail }) })
      await new Promise((r) => setTimeout(r, 1000)); // simulate network
      setResendMessage(`OTP resent to ${pendingEmail}`);
    } catch (err) {
      setResendMessage("Failed to resend OTP. Please try again.");
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
            We sent a 6-digit code to <strong>{pendingEmail ?? "your email"}</strong>. Enter it below.
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
