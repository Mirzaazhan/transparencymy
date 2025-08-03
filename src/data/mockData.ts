import { Transaction, Department } from '../types';

export const mockTransactions: Transaction[] = [
  {
    id: 'TX001',
    department: 'Ministry of Health',
    projectName: 'Hospital Kuala Lumpur Equipment Upgrade',
    amount: 15000000,
    date: '2024-01-15',
    description: 'Purchase of advanced medical equipment including MRI machines and surgical robots',
    location: 'Kuala Lumpur',
    status: 'In Progress',
    budgetAllocated: 20000000,
    amountSpent: 15000000,
    remaining: 5000000,
    blockchainHash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12'
  },
  {
    id: 'TX002',
    department: 'Ministry of Education',
    projectName: 'Smart Classroom Initiative - Selangor',
    amount: 8500000,
    date: '2024-02-01',
    description: 'Installation of smart boards and digital learning systems in 150 schools',
    location: 'Selangor',
    status: 'Completed',
    budgetAllocated: 10000000,
    amountSpent: 8500000,
    remaining: 1500000,
    blockchainHash: '0x2b3c4d5e6f7890abcdef1234567890abcdef123a'
  },
  {
    id: 'TX003',
    department: 'Ministry of Transport',
    projectName: 'Federal Highway Maintenance Phase 2',
    amount: 25000000,
    date: '2024-01-20',
    description: 'Road resurfacing and bridge repairs along Federal Highway',
    location: 'Selangor, Kuala Lumpur',
    status: 'In Progress',
    budgetAllocated: 30000000,
    amountSpent: 25000000,
    remaining: 5000000,
    blockchainHash: '0x3c4d5e6f7890abcdef1234567890abcdef123ab4'
  },
  {
    id: 'TX004',
    department: 'Ministry of Health',
    projectName: 'Rural Clinic Construction - Sabah',
    amount: 12000000,
    date: '2024-03-01',
    description: 'Construction of 8 new clinics in rural areas of Sabah',
    location: 'Sabah',
    status: 'Planned',
    budgetAllocated: 12000000,
    amountSpent: 0,
    remaining: 12000000,
    blockchainHash: '0x4d5e6f7890abcdef1234567890abcdef123ab45c'
  },
  {
    id: 'TX005',
    department: 'Ministry of Education',
    projectName: 'University Research Grant Program',
    amount: 18000000,
    date: '2024-02-15',
    description: 'Research grants for Malaysian universities focusing on technology and innovation',
    location: 'Nationwide',
    status: 'In Progress',
    budgetAllocated: 20000000,
    amountSpent: 18000000,
    remaining: 2000000,
    blockchainHash: '0x5e6f7890abcdef1234567890abcdef123ab45cd6'
  },
  {
    id: 'TX006',
    department: 'Ministry of Transport',
    projectName: 'MRT Line Extension Planning',
    amount: 5000000,
    date: '2024-01-10',
    description: 'Feasibility study and planning for MRT line extension to Cyberjaya',
    location: 'Selangor',
    status: 'Completed',
    budgetAllocated: 5000000,
    amountSpent: 4800000,
    remaining: 200000,
    blockchainHash: '0x6f7890abcdef1234567890abcdef123ab45cd67e'
  }
];

export const mockDepartments: Department[] = [
  {
    id: 'MOH',
    name: 'Ministry of Health',
    totalBudget: 32000000,
    totalSpent: 27000000,
    projectCount: 2
  },
  {
    id: 'MOE',
    name: 'Ministry of Education',
    totalBudget: 30000000,
    totalSpent: 26500000,
    projectCount: 2
  },
  {
    id: 'MOT',
    name: 'Ministry of Transport',
    totalBudget: 35000000,
    totalSpent: 30800000,
    projectCount: 2
  }
];
