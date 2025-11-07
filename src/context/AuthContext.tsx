import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api, setTokens, clearTokens, getAccessToken } from "../utils/api";
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
        const token = getAccessToken();
        if (!token) {
            setUser(null);
            setIsLoading(false);
            return;
        }

        try {
            console.log('Checking JWT authentication...');
            const response = await api.get(ENDPOINTS.PROFILE);
            const userData = response.data;
            
            if (userData && userData.id) {
                setUser(userData);
                console.log('User authenticated via JWT:', userData.email);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.log('JWT auth check error:', error);
            // Clear tokens if auth check fails
            clearTokens();
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
            console.log('Making JWT login request...');
            
            // Call JWT token endpoint
            const response = await api.post(ENDPOINTS.LOGIN, { email, password });
            
            console.log('JWT login response received:', response);
            console.log('Response data:', response.data);
            
            const { access, refresh } = response.data;
            
            if (access && refresh) {
                // Store JWT tokens
                setTokens(access, refresh);
                
                // Now fetch user data using the token
                console.log('Fetching user profile with new token...');
                const userResponse = await api.get(ENDPOINTS.PROFILE);
                const userData = userResponse.data;
                
                if (userData && userData.id) {
                    setUser(userData);
                    console.log('JWT login successful, user data set:', userData.email);
                    
                    toast({
                        title: "Success",
                        description: "Logged in successfully",
                    });
                } else {
                    console.error('No user data in profile response:', userResponse.data);
                    throw new Error('Profile response missing user data');
                }
            } else {
                console.error('Missing tokens in response:', response.data);
                throw new Error('Login response missing tokens');
            }
        } catch (error) {
            console.error('JWT login error details:', error);
            
            // Log the actual error response from Django
            if (error instanceof APIError) {
                console.error('API Error data:', error.data);
                console.error('API Error status:', error.status);
            }
            
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Login failed",
            });
            throw error;
        }
    };

    const register = async (userData: RegisterData): Promise<RegistrationResponse> => {
        try {
            console.log('Sending registration request:', userData);
            const response = await api.post<RegistrationResponse>(ENDPOINTS.REGISTER, userData);
            console.log('Registration response:', response);
            
            // Don't set user here as they need to verify OTP first
            toast({
                title: "Success",
                description: response.data.message || "Verification code sent to your email",
            });
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
            // Clear JWT tokens from localStorage
            clearTokens();
            
            // Clear user state
            setUser(null);
            
            console.log('JWT logout successful');
            
            toast({
                title: "Success",
                description: "Logged out successfully",
            });
        } catch (error) {
            console.error('Logout error:', error);
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