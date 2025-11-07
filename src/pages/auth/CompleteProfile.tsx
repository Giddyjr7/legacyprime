import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/utils/api";
import { ENDPOINTS } from "@/config/api";
import Logo from "@/assets/LEGACYPRIME-LOGO-WEB-ICON.png";

const CompleteProfile = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // If no user and not loading, redirect to login
    if (!isLoading && !user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please log in to continue"
      });
      navigate("/auth/login");
    }
  }, [user, isLoading, navigate, toast]);

  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [address, setAddress] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log('Submitting profile update...');
      const response = await api.put(ENDPOINTS.PROFILE, {
        first_name: firstName,
        last_name: lastName,
        address,
        state: stateVal,
        zip_code: zipCode,
        city,
        country
      });
      
      console.log('Profile update response:', response);

      toast({
        title: "Success",
        description: "Profile updated successfully"
      });

      navigate("/dashboard");
    } catch (error) {
      console.error('Profile update error:', error);
      
      // Check for specific error types
      if (error instanceof Error) {
        if (error.message.includes('Authentication credentials were not provided')) {
          // Try to refresh the page to restore session
          window.location.reload();
          return;
        }
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update profile. Please try again."
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero hero-glow text-foreground">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero hero-glow text-foreground">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-muted-foreground">Saving...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero hero-glow text-foreground">
      <Card className="w-full max-w-2xl bg-card text-card-foreground shadow-xl shadow-primary/10 border border-border/40">
        <CardHeader>
          <div className="flex flex-col items-center gap-3 py-4">
            <img src={Logo} alt="LegacyPrime logo" className="w-12 h-12" />
            <CardTitle className="text-2xl font-semibold text-center">Complete Profile</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 py-6 px-4">
          <p className="text-sm text-muted-foreground mb-4 text-center">
            Complete your profile information. Email: <strong>{user?.email ?? "—"}</strong>
          </p>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="bg-input text-foreground border border-border"
            />
            <Input
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="bg-input text-foreground border border-border"
            />
            <Input
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="bg-input text-foreground border border-border md:col-span-2"
            />
            <Input
              placeholder="State"
              value={stateVal}
              onChange={(e) => setStateVal(e.target.value)}
              className="bg-input text-foreground border border-border"
            />
            <Input
              placeholder="Zip code"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              className="bg-input text-foreground border border-border"
            />
            <Input
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="bg-input text-foreground border border-border"
            />
            <Input
              placeholder="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="bg-input text-foreground border border-border"
            />

            <div className="md:col-span-2">
              <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/80">
                {loading ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">You can edit these details later in Settings.</p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CompleteProfile;
