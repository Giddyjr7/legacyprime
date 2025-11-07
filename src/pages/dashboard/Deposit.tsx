import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLoading } from '@/components/DashboardLoading';
import { useAuth } from '@/context/AuthContext'; // Import your auth context

export default function Deposit() {
  const [selectedMethod, setSelectedMethod] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false); // Changed to false initially
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth(); // Get auth state

  // Check authentication on component mount
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  const paymentMethods = [
    { name: "BITCOIN", icon: "₿" },
    { name: "ETHEREUM", icon: "Ξ" },
    { name: "USDT BEP20", icon: "🟢" },
    { name: "USDT TRC20", icon: "💠" },
  ];

  // Handle Confirm Deposit
  const handleConfirm = async () => {
    try {
      if (!isAuthenticated) {
        alert("Please log in to continue");
        navigate('/auth/login');
        return;
      }

      if (!selectedMethod) {
        alert("Please select a payment method");
        return;
      }

      if (!amount || parseFloat(amount) <= 0) {
        alert("Please enter a valid amount");
        return;
      }

      setLoading(true);

      // Short, reasonable loading time
      await new Promise(resolve => setTimeout(resolve, 1000));

      navigate("/dashboard/confirm-deposit", {
        state: {
          method: selectedMethod,
          amount: parseFloat(amount),
          fee: 1.5,
          userEmail: user?.email, // Pass user info if needed
        },
      });
    } catch (error) {
      console.error('Error processing deposit:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardLoading message="Processing deposit ..." />;
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      {/* Header */}
      <div className="rounded-t-lg bg-primary px-4 py-2 text-center text-lg font-semibold text-primary-foreground">
        Deposit
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* Left side - Payment Methods */}
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
                  name="payment"
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

        {/* Right side - Deposit Form */}
        <div className="space-y-4">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium">Amount</label>
            <div className="mt-1 flex items-center rounded-md border border-border bg-background px-3 py-2">
              <span className="text-muted-foreground">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="ml-2 flex-1 bg-transparent text-sm focus:outline-none"
                min="1"
                max="1000000"
              />
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Limit</span>
              <span>$1.00 USD - $1,000,000.00 USD</span>
            </div>
            <div className="flex justify-between">
              <span>Processing Charge</span>
              <span>1.50 USD</span>
            </div>
            <div className="flex justify-between">
              <span>Total</span>
              <span>
                {amount
                  ? `$${(parseFloat(amount) + 1.5).toFixed(2)} USD`
                  : "0.00 USD"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Conversion</span>
              <span>1 USD = 1.00 $</span>
            </div>
            <div className="flex justify-between">
              <span>In $</span>
              <span>{amount || "0.00"}</span>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleConfirm}
            disabled={!selectedMethod || !amount || loading}
            className={`w-full rounded-lg px-4 py-2 font-medium text-primary-foreground ${
              !selectedMethod || !amount || loading 
                ? 'bg-muted cursor-not-allowed opacity-60' 
                : 'bg-primary hover:opacity-90'
            }`}
          >
            {loading ? "Processing..." : "Confirm Deposit"}
          </button>

          {/* Info */}
          <p className="text-xs text-muted-foreground">
            Ensuring your funds grow safely through our secure deposit process
            with world-class payment options.
          </p>
        </div>
      </div>
    </div>
  );
}