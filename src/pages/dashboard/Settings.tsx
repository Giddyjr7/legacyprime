import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { api } from "@/utils/api";
import { ENDPOINTS } from "@/config/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

interface Message {
  text: string;
  type: "success" | "error";
}

export default function Settings() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    
    if (newPassword !== confirmPassword) {
      setMessage({ text: "New passwords do not match", type: "error" });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ text: "Password must be at least 8 characters long", type: "error" });
      return;
    }

    setBusy(true);

    if (!isAuthenticated) {
      setMessage({ text: "Please log in to change your password", type: "error" });
      setBusy(false);
      return;
    }

    try {
      // Ensure CSRF cookie is set (safe no-op if already set)
      try {
        await api.get(ENDPOINTS.CSRF);
      } catch (e) {
        // ignore
      }

      const response = await api.post(ENDPOINTS.CHANGE_PASSWORD, {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      console.log("Password change response:", response);  // Debug log

      // Keep user logged in; just show success toast and clear fields
      toast({
        title: "Success",
        description: "Your password has been updated successfully",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Password change error:", error);  // Debug log
      console.error("Error response:", error.response?.data);  // Debug log

      // Get detailed error message from backend response
      let errMsg = 'An error occurred while changing password';
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'string') {
          errMsg = data;
        } else if (typeof data === 'object') {
          // Handle DRF error format {field: [errors]}
          const firstError = Object.entries(data)[0];
          if (firstError) {
            const [field, errors] = firstError;
            errMsg = Array.isArray(errors) ? errors[0] : errors;
          }
        }
      }
      // If fetchApi threw an APIError, it will carry a user-friendly message
      if (!errMsg && error?.message) {
        errMsg = error.message;
      } else if (error?.message && errMsg === 'An error occurred while changing password') {
        // Prefer explicit message from thrown error when available
        errMsg = error.message;
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: errMsg,
      });
      setMessage({ text: errMsg, type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      {/* Header */}
      <div className="rounded-t-lg bg-primary px-4 py-2 text-center text-lg font-semibold text-primary-foreground">
        Account Settings
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* Left side - Change Password */}
        <div className="space-y-4">
          <div className="rounded-lg border border-border p-4">
            <h3 className="text-lg font-semibold mb-4">Change Password</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((s) => !s)}
                    aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((s) => !s)}
                    aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={busy || isLoading}
              >
                {busy ? "Updating..." : "Update Password"}
              </button>
              {message && (
                <div className={`text-center text-sm mt-2 ${message.type === "success" ? "text-green-600" : "text-destructive"}`}>
                  {message.text}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Right side - Additional Settings */}
        <div className="space-y-4">
          <div className="rounded-lg border border-border p-4">
            <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Two-Factor Authentication</h4>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <button className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 transition">
                  Enable
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Login History</h4>
                  <p className="text-sm text-muted-foreground">
                    View your recent login activities
                  </p>
                </div>
                <button className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 transition">
                  View
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
