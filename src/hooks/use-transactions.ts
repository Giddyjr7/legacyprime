import { useState } from 'react';
import { api } from '@/utils/api';
import { ENDPOINTS } from '@/config/api';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  // Add other transaction fields as needed
}

interface CreateTransactionData {
  amount: number;
  type: 'deposit' | 'withdrawal';
  // Add other transaction creation fields as needed
}

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const data = await api.get(ENDPOINTS.TRANSACTIONS);
      setTransactions(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch transactions",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createTransaction = async (data: CreateTransactionData) => {
    try {
      const response = await api.post(ENDPOINTS.CREATE_TRANSACTION, data);
      setTransactions(prev => [response, ...prev]);
      toast({
        title: "Success",
        description: "Transaction created successfully",
      });
      return response;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create transaction",
      });
      throw error;
    }
  };

  return {
    transactions,
    isLoading,
    fetchTransactions,
    createTransaction,
  };
};