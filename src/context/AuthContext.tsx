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
            
            // Check if user is authenticated via profile endpoint
            const response = await api.get(ENDPOINTS.PROFILE);
            const userData = response.data;
            
            if (userData && userData.id) {
                setUser(userData);
                console.log('User authenticated:', userData.email);
            } else {
                setUser(null);
            }
        } catch (error) {
            if (error instanceof APIError && error.status === 403) {
                console.log('User not authenticated (403) - normal behavior');
            } else {
                console.log('Auth check error:', error);
            }
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
            console.log('Making login request...');
            const response = await api.post<{ user: User; message: string }>(ENDPOINTS.LOGIN, { email, password });
            
            // DEBUG: Log the full response
            console.log('Login response received:', response);
            console.log('Response data:', response.data);
            
            if (response.data && response.data.user) {
                setUser(response.data.user);
                console.log('User set successfully:', response.data.user.email);
                
                toast({
                    title: "Success",
                    description: "Logged in successfully",
                });
            } else {
                console.error('No user data in response:', response.data);
                throw new Error('Login response missing user data');
            }
        } catch (error) {
            console.error('Login error details:', error);
            
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
            await api.post(ENDPOINTS.LOGOUT);
            setUser(null);
            
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