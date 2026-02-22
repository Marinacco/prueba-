// Core domain types for the legal firm management system

export interface Lawyer {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  avatar?: string;
  status: 'active' | 'inactive';
  hireDate: string;
  totalCases: number;
  activeCases: number;
  totalEarnings: number;
  pendingCommissions: number;
}

export interface LegalService {
  id: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  commissionType: 'fixed' | 'variable';
  commissionPercentage: number;
  minCommission?: number;
  maxCommission?: number;
  isActive: boolean;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  company?: string;
  createdAt: string;
}

export interface Case {
  id: string;
  caseNumber: string;
  client: Client;
  service: LegalService;
  assignedLawyer: Lawyer;
  status: 'active' | 'in_progress' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string;
  totalAmount: number;
  commissionAmount: number;
  commissionPaid: boolean;
  notes?: string;
}

export interface DashboardStats {
  totalRevenue: number;
  monthlyRevenue: number;
  totalCommissions: number;
  pendingCommissions: number;
  activeCases: number;
  completedCases: number;
  totalLawyers: number;
  totalClients: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  label?: string;
}

export type UserRole = 'admin' | 'partner' | 'lawyer' | 'sales';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}
