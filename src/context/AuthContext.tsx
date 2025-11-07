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
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (userData: RegisterData) => Promise<RegistrationResponse>;
    logout: () => Promise<void>;
    updateTokens: (access: string, refresh: string) => void; // ADD THIS LINE
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
    const [token, setToken] = useState<string | null>(getAccessToken());
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    // ADD THIS FUNCTION - Updates tokens without logging out
    const updateTokens = (access: string, refresh: string) => {
        console.log('🔍 DEBUG - Updating tokens in AuthContext');
        setTokens(access, refresh);
        setToken(access);
        console.log('🔍 DEBUG - Tokens updated successfully');
    };

    const checkAuth = async () => {
        const currentToken = getAccessToken();
        setToken(currentToken);
        
        if (!currentToken) {
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
                setToken(null);
            }
        } catch (error) {
            console.log('JWT auth check error:', error);
            clearTokens();
            setUser(null);
            setToken(null);
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
            
            const response = await api.post(ENDPOINTS.LOGIN, { email, password });
            
            console.log('JWT login response received:', response);
            console.log('Response data:', response.data);
            
            const { access, refresh } = response.data;
            
            if (access && refresh) {
                setTokens(access, refresh);
                setToken(access);
                
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
            console.log('Sending JWT registration request:', userData);
            
            const response = await api.post<RegistrationResponse>(ENDPOINTS.REGISTER, userData);
            
            console.log('JWT Registration response:', response);
            
            if (response.status >= 200 && response.status < 300) {
                toast({
                    title: "Success",
                    description: response.data.message || "Verification code sent to your email",
                });
                return response.data;
            } else {
                throw new APIError(
                    response.data.message || 'Registration failed',
                    response.status,
                    response.data
                );
            }
        } catch (error) {
            console.error('JWT Registration error:', error);
            
            if (error instanceof APIError && error.status >= 400) {
                let errorMessage = error.message;
                
                if (error.status === 400) {
                    errorMessage = "Please check your registration details and try again.";
                } else if (error.status === 500) {
                    errorMessage = "Server error during registration. Please try again.";
                }
                
                toast({
                    variant: "destructive",
                    title: "Registration Failed",
                    description: errorMessage,
                });
            } else if (error instanceof Error) {
                toast({
                    variant: "destructive",
                    title: "Registration Failed",
                    description: error.message || "Network error. Please check your connection.",
                });
            }
            
            throw error;
        }
    };

    const logout = async () => {
        try {
            clearTokens();
            setUser(null);
            setToken(null);
            
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
                token,
                isLoading,
                login,
                register,
                logout,
                updateTokens, // ADD THIS TO THE PROVIDER VALUE
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