import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ENDPOINTS } from "@/config/api";
import { api } from "@/utils/api";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const ConfirmDeposit = () => {
  const location = useLocation();
  const { amount } = location.state || { amount: "0.00" };
  const navigate = useNavigate();

  // Example calculation (add fee, adjust dynamically)
  const fee = 1.5;
  const total = (parseFloat(amount) + fee).toFixed(2);

  const walletAddress = "bc1qcl84vkhs9aur0qcf02n8xfwk6pe95zrtq7f05w";

  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

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
              try {
                if (!file) {
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
                
                // Log file details for debugging
                console.log('File details:', {
                  name: file.name,
                  type: file.type,
                  size: file.size
                });
                
                fd.append('proof_image', file, file.name);

                // Ensure csrftoken cookie exists. If missing, call a lightweight endpoint
                // that sets the cookie via ensure_csrf_cookie.
                const getCsrfFromCookie = () => {
                  return document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('csrftoken='))?.split('=')[1];
                };

                let csrf = getCsrfFromCookie();
                if (!csrf) {
                  // Request the CSRF cookie from the backend
                  await fetch(ENDPOINTS.CSRF, {
                    method: 'GET',
                    credentials: 'include',
                    mode: 'cors'
                  });
                  csrf = getCsrfFromCookie();
                }

                // Use fetch directly to handle multipart and include credentials
                console.log('Making deposit request with:', {
                  amount,
                  method: (location.state || {}).method,
                  file: file?.name
                });

                const res = await fetch(ENDPOINTS.WALLET_DEPOSIT_REQUEST, {
                  method: 'POST',
                  body: fd,
                  credentials: 'include',
                  headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': csrf || ''
                  }
                });

                console.log('Response status:', res.status);
                const responseText = await res.text();
                console.log('Response text:', responseText);

                if (!res.ok) {
                  let errorMessage = 'Failed to submit deposit';
                  try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.error || errorData.message || errorMessage;
                  } catch (e) {
                    console.error('Error parsing error response:', e);
                  }
                  toast({
                    title: 'Deposit failed',
                    description: String(errorMessage),
                    variant: 'destructive',
                  });
                  return;
                }

                const data = JSON.parse(responseText);
                navigate('/dashboard', {
                  state: { flashMessage: 'Your deposit is being processed and will be approved shortly' }
                });
              } catch (err) {
                console.error('Deposit submit error:', err);
                toast({
                  title: 'Error',
                  description: 'Failed to submit deposit',
                  variant: 'destructive',
                });
              }
            }}
            className="w-full bg-primary hover:opacity-90 text-primary-foreground rounded-xl"
          >
            Pay Now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfirmDeposit;
