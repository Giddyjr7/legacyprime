export interface Transaction {
  id: number;
  status: 'pending' | 'approved' | 'rejected';
  amount: string;
  type: 'deposit' | 'withdrawal';
  created_at: string;
  updated_at: string;
}

export function getTransactionStatusMessage(transaction: Transaction): string {
  const type = transaction.type.toLowerCase();
  const amount = `$${parseFloat(transaction.amount).toLocaleString()}`;

  switch (transaction.status) {
    case 'pending':
      return `Your ${type} of ${amount} is awaiting approval`;
    case 'approved':
      return `${type.charAt(0).toUpperCase() + type.slice(1)} of ${amount} has been approved and processed`;
    case 'rejected':
      return `Your ${type} of ${amount} was declined`;
    default:
      return `Status update for your ${type} of ${amount}`;
  }
}

export function getTransactionStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'approved':
      return 'text-green-600 bg-green-50';
    case 'rejected':
      return 'text-red-600 bg-red-50';
    case 'pending':
      return 'text-yellow-600 bg-yellow-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export function getFlashMessageForTransaction(transaction: Transaction): {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
} {
  const baseMessage = getTransactionStatusMessage(transaction);
  
  switch (transaction.status) {
    case 'approved':
      return {
        message: `Success! ${baseMessage}`,
        type: 'success'
      };
    case 'rejected':
      return {
        message: `Notice: ${baseMessage}`,
        type: 'error'
      };
    case 'pending':
      return {
        message: `In Progress: ${baseMessage}`,
        type: 'warning'
      };
    default:
      return {
        message: baseMessage,
        type: 'info'
      };
  }
}