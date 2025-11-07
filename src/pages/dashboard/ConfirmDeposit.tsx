import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ENDPOINTS } from "@/config/api";
import { api } from "@/utils/api";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { DashboardLoading } from '@/components/DashboardLoading';
import { useAuth } from '@/context/AuthContext';
import { APIError } from "@/utils/api"; // Import APIError if available

const ConfirmDeposit = () => {
  const location = useLocation();
  const { amount } = location.state || { amount: "0.00" };
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { logout } = useAuth();
  const { toast } = useToast();

  // Example calculation (add fee, adjust dynamically)
  const fee = 1.5;
  const total = (parseFloat(amount) + fee).toFixed(2);

  const walletAddress = "bc1qcl84vkhs9aur0qcf02n8xfwk6pe95zrtq7f05w";

  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  if (isLoading) {
    return <DashboardLoading message="Processing your deposit... Please wait" />;
  }

  return (
    <div className="p-6">
      {/* Top header bar */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-primary">Confirm Deposit</h2>
      </div>

      {/* Confirmation Card */}
      <Card className="rounded-2xl border border-border bg-card">
        <CardContent className="p-6 space-y-5">
          <div className="p-4 border border-border rounded-lg bg-background">
            <p>
              You are requesting{" "}
              <span className="font-bold text-primary">${amount} USD</span> to deposit.
              Please pay{" "}
              <span className="font-bold text-primary">{total} $</span> for
              successful payment.
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            Deposit to the USDT wallet address below
          </p>
          <div className="p-3 rounded-lg bg-background font-mono text-sm border border-border">
            {walletAddress}
          </div>

          <div className="space-y-2">
            <label className="font-medium text-foreground">Payment Proof</label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              className="block w-full border border-border rounded-lg p-2 bg-background"
              onChange={handleFileChange}
            />
            <p className="text-xs text-muted-foreground">
              Supported formats: jpg, jpeg, png, pdf
            </p>
          </div>

          <Button
            onClick={async () => {
              setIsLoading(true);
              try {
                if (!file) {
                  setIsLoading(false);
                  toast({
                    title: 'Upload required',
                    description: 'Please upload a proof of payment to continue.',
                    variant: 'destructive',
                  });
                  return;
                }

                const fd = new FormData();
                fd.append('amount', String(amount));
                fd.append('method', String((location.state || {}).method || ''));
                fd.append('proof_image', file, file.name);

                console.log('Making deposit request with api instance...');

                const response = await api.post(ENDPOINTS.WALLET_DEPOSIT_REQUEST, fd);

                console.log('Deposit successful:', response.data);

                // Wait for 2 seconds
                await new Promise(resolve => setTimeout(resolve, 2000));

                navigate('/dashboard', {
                  state: { flashMessage: 'Your deposit is being processed and will be approved shortly' }
                });
              } catch (err) {
                console.error('Deposit submit error:', err);
                let errorMessage = 'Failed to submit deposit';
                if (err instanceof APIError) {
                  errorMessage = err.message;
                  // If 401, logout
                  if (err.status === 401) {
                    logout();
                    navigate('/auth/login');
                    return;
                  }
                } else if (err instanceof Error) {
                  errorMessage = err.message;
                }
                toast({
                  title: 'Error',
                  description: errorMessage,
                  variant: 'destructive',
                });
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
            className="w-full bg-primary hover:opacity-90 text-primary-foreground rounded-xl"
          >
            {isLoading ? "Processing..." : "Pay Now"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfirmDeposit;