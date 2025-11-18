import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { api } from "@/utils/api";
import { ENDPOINTS } from "@/config/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { DashboardLoading } from '@/components/DashboardLoading';

interface Message {
  text: string;
  type: "success" | "error";
}

export default function Settings() {
  const { isAuthenticated, user, updateTokens } = useAuth(); // Added updateTokens
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State declarations
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [busy, setBusy] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Handle authentication and loading state
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, navigate]);

  // Show loading state
  if (isLoading) {
    return <DashboardLoading message="Loading settings..." />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to change your password",
      });
      navigate('/auth/login');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ text: "New passwords do not match", type: "error" });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ text: "Password must be at least 8 characters long", type: "error" });
      return;
    }

    setBusy(true);

    try {
      console.log("🔍 DEBUG - Changing password for user:", user?.email);

      const response = await api.post(ENDPOINTS.CHANGE_PASSWORD, {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      console.log("🔍 DEBUG - Password change successful:", response.data);

      // Update tokens if provided (user stays logged in)
      if (response.data.access && response.data.refresh) {
        updateTokens(response.data.access, response.data.refresh);
        console.log("🔍 DEBUG - JWT tokens updated successfully");
      }

      toast({
        title: "Success",
        description: "Your password has been updated successfully",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      setMessage({ text: "Password updated successfully", type: "success" });

    } catch (error: any) {
      console.error("🔍 DEBUG - Password change error:", error);
      
      if (error?.response?.status === 401) {
        toast({
          variant: "destructive",
          title: "Session Expired",
          description: "Please log in again",
        });
        navigate('/auth/login');
        return;
      }

      let errMsg = 'An error occurred while changing password';
      
      if (error?.response?.data) {
        const data = error.response.data;
        
        if (typeof data === 'string') {
          errMsg = data;
        } else if (data.detail) {
          errMsg = data.detail;
        } else if (data.message) {
          errMsg = data.message;
        } else if (typeof data === 'object') {
          const firstError = Object.entries(data)[0];
          if (firstError) {
            const [field, errors] = firstError;
            errMsg = Array.isArray(errors) ? errors[0] : String(errors);
          }
        }
      } else if (error?.message) {
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

  if (busy) {
    return <DashboardLoading message="Updating password..." />;
  }

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
                    className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    disabled={busy}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((s) => !s)}
                    aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={busy}
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
                    className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={busy}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((s) => !s)}
                    aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={busy}
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
                    className="w-full px-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={busy}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={busy}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={busy || !isAuthenticated}
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
                <button 
                  className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 transition focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={busy}
                >
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
                <button 
                  className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 transition focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={busy}
                >
                  View
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Active Sessions</h4>
                  <p className="text-sm text-muted-foreground">
                    Manage your active login sessions
                  </p>
                </div>
                <button 
                  className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 transition focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={busy}
                >
                  Manage
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border p-4">
            <h3 className="text-lg font-semibold mb-4">Account Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Email</span>
                <span className="text-sm text-muted-foreground">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Account Status</span>
                <span className="text-sm text-green-600">Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Member Since</span>
                <span className="text-sm text-muted-foreground">
                  {user?.date_joined 
                    ? new Date(user.date_joined).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'Loading...'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}