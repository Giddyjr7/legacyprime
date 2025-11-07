import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/utils/api";
import { ENDPOINTS } from "@/config/api";
import { DashboardLoading } from '@/components/DashboardLoading';
import { useAuth } from '@/context/AuthContext';
import { useToast } from "@/hooks/use-toast";

export default function Withdraw() {
  const [selectedMethod, setSelectedMethod] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const navigate = useNavigate();
  const { user, isAuthenticated, token } = useAuth();
  const { toast } = useToast();

  // Check authentication on component mount
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  const paymentMethods = [
    { name: "USDT BEP20", icon: "🟢", address: "Enter your USDT BEP20 address" },
    { name: "USDT TRC20", icon: "💠", address: "Enter your USDT TRC20 address" },
    { name: "BITCOIN", icon: "₿", address: "Enter your Bitcoin address" },
  ];

  const handleWithdraw = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to continue',
        variant: 'destructive',
      });
      navigate('/auth/login');
      return;
    }

    if (!selectedMethod) {
      toast({
        title: 'Method required',
        description: 'Please select a withdrawal method',
        variant: 'destructive',
      });
      return;
    }

    if (!amount || parseFloat(amount) < 5) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter an amount of at least $5.00',
        variant: 'destructive',
      });
      return;
    }

    if (!walletAddress) {
      toast({
        title: 'Address required',
        description: 'Please enter your withdrawal address',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('Making withdrawal request with:', {
        amount: parseFloat(amount),
        method: selectedMethod,
        walletAddress
      });

      // Use the api instance which should already have JWT token configured
      const response = await api.post(ENDPOINTS.WALLET_WITHDRAW, {
        amount: parseFloat(amount),
        method: selectedMethod,
        withdrawal_address: walletAddress,
      });

      console.log('Withdrawal response:', response);

      // Reasonable loading time instead of fixed 10 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Success",
        description: "Your withdrawal request has been submitted and is being processed.",
      });

      navigate('/dashboard', {
        state: { 
          flashMessage: 'Your withdrawal is being processed and will be confirmed shortly.' 
        }
      });
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      
      let errorMessage = 'Failed to process withdrawal request';
      
      if (error?.response?.data) {
        // Handle specific error messages from backend
        const errorData = error.response.data;
        errorMessage = errorData.detail || errorData.error || errorData.message || errorMessage;
        
        // Handle insufficient funds
        if (errorMessage.toLowerCase().includes('insufficient') || errorMessage.toLowerCase().includes('balance')) {
          errorMessage = 'Insufficient funds for this withdrawal';
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Withdrawal Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update wallet address placeholder when method changes
  useEffect(() => {
    const method = paymentMethods.find(m => m.name === selectedMethod);
    if (method) {
      setWalletAddress(""); // Clear previous address
    }
  }, [selectedMethod]);

  if (isLoading) {
    return <DashboardLoading message="Processing withdrawal request..." />;
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      {/* Header */}
      <div className="rounded-t-lg bg-primary px-4 py-2 text-center text-lg font-semibold text-primary-foreground">
        Withdraw
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* Left side - Withdrawal Methods */}
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <label
              key={method.name}
              className={`flex items-center justify-between rounded-lg border px-4 py-3 cursor-pointer ${
                selectedMethod === method.name
                  ? "border-primary bg-muted"
                  : "border-border"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="withdraw"
                  value={method.name}
                  checked={selectedMethod === method.name}
                  onChange={() => setSelectedMethod(method.name)}
                  className="text-primary focus:ring-primary"
                />
                <span className="font-medium">{method.name}</span>
              </div>
              <span className="text-xl">{method.icon}</span>
            </label>
          ))}
        </div>

        {/* Right side - Withdraw Form */}
        <div className="space-y-4">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium">Amount (USD)</label>
            <div className="mt-1 flex items-center rounded-md border border-border bg-background px-3 py-2">
              <span className="text-muted-foreground">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="5"
                max="1000000"
                step="0.01"
                className="ml-2 flex-1 bg-transparent text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Wallet Address Input */}
          {selectedMethod && (
            <div>
              <label className="block text-sm font-medium">
                Your {selectedMethod} Address
              </label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder={paymentMethods.find(m => m.name === selectedMethod)?.address || "Enter your wallet address"}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          )}

          {/* Details */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Limit</span>
              <span>$5.00 USD - $1,000,000.00 USD</span>
            </div>
            <div className="flex justify-between">
              <span>Processing Charge</span>
              <span>0.00 USD</span>
            </div>
            <div className="flex justify-between">
              <span>You will receive</span>
              <span>
                {amount && parseFloat(amount) >= 5 
                  ? `$${parseFloat(amount).toFixed(2)} USD`
                  : "0.00 USD"
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span>Conversion</span>
              <span>1 USD = 1.00 $</span>
            </div>
            <div className="flex justify-between">
              <span>Processing Time</span>
              <span>1-24 hours</span>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleWithdraw}
            disabled={!selectedMethod || !amount || !walletAddress || isLoading || parseFloat(amount) < 5}
            className={`w-full rounded-lg px-4 py-2 font-medium text-primary-foreground ${
              !selectedMethod || !amount || !walletAddress || isLoading || parseFloat(amount) < 5
                ? 'bg-muted cursor-not-allowed opacity-60'
                : 'bg-primary hover:opacity-90'
            }`}
          >
            {isLoading ? "Processing..." : "Confirm Withdrawal"}
          </button>

          {/* Info */}
          <p className="text-xs text-muted-foreground">
            Safely withdraw your funds using our highly secure process and
            various withdrawal methods. Processing typically takes 1-24 hours.
          </p>
        </div>
      </div>
    </div>
  );
}