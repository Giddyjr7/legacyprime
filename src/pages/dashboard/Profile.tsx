import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/utils/api";
import { ENDPOINTS } from "@/config/api";
import { Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { toast } = useToast();
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    address: "",
    state: "",
    zipCode: "",
    city: "",
    country: "",
  });

  const [image, setImage] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Create FormData if there's an image file
      const formData = new FormData();

      // Add all text fields
      formData.append('first_name', profile.firstName);
      formData.append('last_name', profile.lastName);
      formData.append('address', profile.address);
      formData.append('state', profile.state);
      formData.append('zip_code', profile.zipCode);
      formData.append('city', profile.city);
      formData.append('country', profile.country);
      formData.append('mobile', profile.mobile);
      
      // Keep track of whether we're updating the image
      let isImageUpdating = false;

      // Add file if present
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput?.files?.length) {
        formData.append('profile_picture', fileInput.files[0]);
        isImageUpdating = true;
      }

      // Send multipart form data - no need to set Content-Type header
      const response = await api.put(ENDPOINTS.PROFILE, formData);
      
      // If we're not updating the image, keep the current image URL
      if (!isImageUpdating && currentImageUrl) {
        setImage(currentImageUrl);
      }
      console.log('Profile update response:', response);

      toast({
        title: "Success",
        description: "Your profile has been updated successfully",
      });

      // Refresh profile data to show new values
      const data = await api.get(ENDPOINTS.PROFILE);
      console.log('Profile refresh data:', data);
      setProfile({
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        email: data.email || '',
        mobile: data.mobile || '',
        address: data.address || '',
        state: data.state || '',
        zipCode: data.zip_code || '',
        city: data.city || '',
        country: data.country || '',
      });
      if (data.profile_picture_url) {
        const baseUrl = 'http://localhost:8000';
        const imageUrl = data.profile_picture_url.startsWith('http')
          ? data.profile_picture_url
          : `${baseUrl}${data.profile_picture_url}`;
        setCurrentImageUrl(imageUrl);
        setImage(imageUrl);
      }
    } catch (err) {
      console.error('Profile update error', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update profile",
      });
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get(ENDPOINTS.PROFILE);
        setProfile({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          email: data.email || '',
          mobile: data.mobile || '',
          address: data.address || '',
          state: data.state || '',
          zipCode: data.zip_code || '',
          city: data.city || '',
          country: data.country || '',
        });
        
        // Set profile picture if available
        console.log('Profile data received:', data);
        if (data.profile_picture_url) {
          // Construct full URL if it's a relative path
          const baseUrl = 'http://localhost:8000';  // Use the same base URL as the API
          const imageUrl = data.profile_picture_url.startsWith('http') 
            ? data.profile_picture_url 
            : `${baseUrl}${data.profile_picture_url}`;
          console.log('Setting profile picture URL:', imageUrl);
          setCurrentImageUrl(imageUrl);
          setImage(imageUrl);
        }
      } catch (err) {
        console.error('Failed to load profile', err);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load profile data",
        });
      }
    })();
  }, []);

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Profile Card */}
        <div className="col-span-1 border border-border rounded-2xl overflow-hidden">
          <div className="bg-primary h-28 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-3xl text-gray-500 border-4 border-white overflow-hidden">
              {(image || currentImageUrl) ? (
                <img src={image || currentImageUrl!} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>👤</span>
              )}
            </div>
          </div>
          <div className="p-6">
            <h2 className="text-lg font-semibold">{profile.firstName} {profile.lastName}</h2>
            <p className="text-sm text-muted-foreground">@{profile.firstName}</p>
            <div className="mt-6 space-y-2 text-sm">
              <p><span className="font-semibold">Email:</span> {profile.email}</p>
              <p><span className="font-semibold">Mobile:</span> {profile.mobile}</p>
              <p><span className="font-semibold">Address:</span> {profile.address}</p>
              <p><span className="font-semibold">State:</span> {profile.state}</p>
              <p><span className="font-semibold">Zip Code:</span> {profile.zipCode}</p>
              <p><span className="font-semibold">City:</span> {profile.city}</p>
              <p><span className="font-semibold">Country:</span> {profile.country}</p>
            </div>
          </div>
        </div>

        {/* Right Form */}
        <div className="col-span-2 border border-border rounded-2xl p-6">
          <h1 className="text-xl font-bold mb-4">Update Profile</h1>

          {/* Profile Image Upload */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {(image || currentImageUrl) ? (
                  <img 
                    src={image || currentImageUrl!} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    style={{ minWidth: '100%', minHeight: '100%' }}
                  />
                ) : (
                  <span className="text-3xl text-gray-500">👤</span>
                )}
              </div>
              <label
                htmlFor="profileImage"
                className="absolute bottom-0 right-0 bg-primary p-1 rounded-full cursor-pointer"
              >
                <Camera className="w-4 h-4 text-white" />
              </label>
              <input
                id="profileImage"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Supported Files: <strong>.png, .jpg, .jpeg</strong><br />
              Image will be resized into <strong>80×80px</strong>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">First Name</label>
              <input
                type="text"
                name="firstName"
                value={profile.firstName}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={profile.lastName}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Mobile</label>
              <input
                type="text"
                name="mobile"
                value={profile.mobile}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Address</label>
              <input
                type="text"
                name="address"
                value={profile.address}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">State</label>
              <input
                type="text"
                name="state"
                value={profile.state}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Zip Code</label>
              <input
                type="text"
                name="zipCode"
                value={profile.zipCode}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">City</label>
              <input
                type="text"
                name="city"
                value={profile.city}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Country</label>
              <input
                type="text"
                name="country"
                value={profile.country}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
