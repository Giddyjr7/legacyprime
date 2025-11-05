import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "../utils/api";
import { ENDPOINTS } from "../config/api";
import { useToast } from "@/hooks/use-toast";
import { APIError } from "@/utils/api";

interface User {
    id: string;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
}

interface RegistrationResponse {
    message: string;
    email?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (userData: RegisterData) => Promise<RegistrationResponse>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
}

interface RegisterData {
    email: string;
    password: string;
    password2: string;
    username: string;
    first_name: string;
    last_name: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const checkAuth = async () => {
        try {
            console.log('Checking authentication...');
            // Ensure we have a CSRF cookie set (backend will set csrftoken cookie)
            try {
                await api.get(ENDPOINTS.CSRF);
                console.log('CSRF cookie ensured');
            } catch (e) {
                console.log('Could not ensure CSRF cookie before auth check', e);
            }

            // The `/accounts/profile/` endpoint may return either:
            //  - { user: { ... } }  (wrapped under `user`) OR
            //  - { ...user fields... } (the serializer data directly)
            // Accept both shapes for robustness across environments.
            const userResp = await api.get<any>(ENDPOINTS.PROFILE);
            const payload = userResp?.data;
            const resolvedUser = payload?.user ?? payload ?? null;
            if (resolvedUser) {
                setUser(resolvedUser);
            } else {
                // No authenticated user returned
                setUser(null);
            }
        } catch (error) {
            console.log('Auth check error:', error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            // Ensure CSRF cookie first (login requires CSRF token)
            try {
                await api.get(ENDPOINTS.CSRF);
            } catch (e) {
                console.warn('CSRF preflight failed', e);
            }

            const response = await api.post<{ user: User }>(ENDPOINTS.LOGIN, { email, password });
            // FIX 3: Use .data.user to extract the payload from the Axios response
            setUser(response.data.user);
            
            toast({
                title: "Success",
                description: "Logged in successfully",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Login failed",
            });
            throw error;
        }
    };

    // FIX 4: Explicitly define the return type to satisfy the AuthContextType interface
    const register = async (userData: RegisterData): Promise<RegistrationResponse> => {
        try {
            console.log('Sending registration request:', userData);
            // The generic type is the shape of the data payload (RegistrationResponse)
            const response = await api.post<RegistrationResponse>(ENDPOINTS.REGISTER, userData);
            console.log('Registration response:', response);
            
            // Don't set user here as they need to verify OTP first
            toast({
                title: "Success",
                // FIX 5: Access message property from the response data payload
                description: response.data.message || "Verification code sent to your email",
            });
            // FIX 6: Return the response data payload, which matches the Promise<RegistrationResponse> type
            return response.data;
        } catch (error) {
            console.error('Registration error:', error);
            
            let errorMessage = "Registration failed";
            if (error instanceof APIError) {
                errorMessage = error.message; 
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            
            // Check if error message contains email sending failure
            if (errorMessage.toLowerCase().includes('verification email')) {
                errorMessage = "Failed to send verification email. Please try again or contact support.";
            }
            
            toast({
                variant: "destructive",
                title: "Error",
                description: errorMessage,
            });
            throw error;
        }
    };

    const logout = async () => {
        try {
            await api.post(ENDPOINTS.LOGOUT);
            setUser(null);
            // Refresh CSRF cookie for the anonymous session so the frontend
            // has a valid token for any subsequent actions that may need it.
            try {
                await api.get(ENDPOINTS.CSRF);
            } catch (e) {
                // Non-fatal: just log for debugging; don't surface to user.
                console.debug('Could not refresh CSRF after logout', e);
            }
            toast({
                title: "Success",
                description: "Logged out successfully",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Logout failed",
            });
        }
    };

    return (
        <AuthContext.Provider 
            value={{
                user,
                isLoading,
                login,
                register,
                logout,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
