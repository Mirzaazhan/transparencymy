export interface Transaction {
  id: string;
  department: string;
  projectName: string;
  amount: number;
  date: string;
  description: string;
  location: string;
  status: 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';
  budgetAllocated: number;
  amountSpent: number;
  remaining: number;
  blockchainHash?: string;
}

export interface Department {
  id: string;
  name: string;
  totalBudget: number;
  totalSpent: number;
  projectCount: number;
}

export interface Feedback {
  id: string;
  transactionId: string;
  citizenName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Language {
  code: 'en' | 'ms';
  name: string;
}
