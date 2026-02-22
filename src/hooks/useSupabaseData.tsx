import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Generic fetch helpers
const fetchTable = async (table: string) => {
  const { data, error } = await (supabase as any).from(table).select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

// Lawyers
export function useLawyers() {
  return useQuery({ queryKey: ['lawyers'], queryFn: () => fetchTable('lawyers') });
}

export function useCreateLawyer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lawyer: { name: string; email?: string; phone?: string; specialties?: string[]; hire_date?: string }) => {
      const { data, error } = await (supabase as any).from('lawyers').insert(lawyer).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lawyers'] }); toast.success('Profesional registrado'); },
    onError: (e: any) => toast.error('Error', { description: e.message }),
  });
}

export function useUpdateLawyer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await (supabase as any).from('lawyers').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lawyers'] }); toast.success('Profesional actualizado'); },
    onError: (e: any) => toast.error('Error', { description: e.message }),
  });
}

export function useDeleteLawyer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('lawyers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lawyers'] }); toast.success('Profesional eliminado'); },
    onError: (e: any) => toast.error('Error', { description: e.message }),
  });
}

// Legal Services
export function useServices() {
  return useQuery({ queryKey: ['legal_services'], queryFn: () => fetchTable('legal_services') });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (service: { name: string; description?: string; category: string; base_price: number; commission_type?: string; commission_percentage?: number }) => {
      const { data, error } = await (supabase as any).from('legal_services').insert(service).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['legal_services'] }); toast.success('Servicio creado'); },
    onError: (e: any) => toast.error('Error', { description: e.message }),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await (supabase as any).from('legal_services').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['legal_services'] }); toast.success('Servicio actualizado'); },
    onError: (e: any) => toast.error('Error', { description: e.message }),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('legal_services').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['legal_services'] }); toast.success('Servicio eliminado'); },
    onError: (e: any) => toast.error('Error', { description: e.message }),
  });
}

// Clients
export function useClients() {
  return useQuery({ queryKey: ['clients'], queryFn: () => fetchTable('clients') });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (client: { name: string; email?: string; phone?: string; company?: string; address?: string }) => {
      const { data, error } = await (supabase as any).from('clients').insert(client).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); },
    onError: (e: any) => toast.error('Error', { description: e.message }),
  });
}

// Case Lawyers (junction table)
export function useCaseLawyers(caseId?: string) {
  return useQuery({
    queryKey: ['case_lawyers', caseId],
    queryFn: async () => {
      let query = (supabase as any).from('case_lawyers').select('*, lawyer:lawyers(*)');
      if (caseId) query = query.eq('case_id', caseId);
      const { data, error } = await query.order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: caseId ? !!caseId : true,
  });
}

export function useAllCaseLawyers() {
  return useQuery({
    queryKey: ['case_lawyers_all'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('case_lawyers')
        .select('*, lawyer:lawyers(*), case:cases(*, client:clients(*), service:legal_services(*))');
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCaseLawyer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { case_id: string; lawyer_id: string; commission_type?: string; commission_percentage: number; commission_amount: number }) => {
      const { data: result, error } = await (supabase as any).from('case_lawyers').insert(data).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['case_lawyers'] });
      qc.invalidateQueries({ queryKey: ['case_lawyers_all'] });
      qc.invalidateQueries({ queryKey: ['cases'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (e: any) => toast.error('Error', { description: e.message }),
  });
}

export function useDeleteCaseLawyer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('case_lawyers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['case_lawyers'] });
      qc.invalidateQueries({ queryKey: ['case_lawyers_all'] });
      qc.invalidateQueries({ queryKey: ['cases'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (e: any) => toast.error('Error', { description: e.message }),
  });
}

export function useUpdateCaseLawyer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await (supabase as any).from('case_lawyers').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['case_lawyers'] });
      qc.invalidateQueries({ queryKey: ['case_lawyers_all'] });
      qc.invalidateQueries({ queryKey: ['cases'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Comisión actualizada');
    },
    onError: (e: any) => toast.error('Error', { description: e.message }),
  });
}

// Cases with joins
export function useCases() {
  return useQuery({
    queryKey: ['cases'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('cases')
        .select('*, client:clients(*), service:legal_services(*), lawyer:lawyers(*), case_lawyers:case_lawyers(*, lawyer:lawyers(*))')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (caseData: {
      case_number: string;
      client_id: string;
      service_id: string;
      lawyer_id?: string;
      total_amount: number;
      commission_amount?: number;
      start_date?: string;
      notes?: string;
    }) => {
      const { data, error } = await (supabase as any).from('cases').insert(caseData).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cases'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Caso creado');
    },
    onError: (e: any) => toast.error('Error', { description: e.message }),
  });
}

export function useUpdateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { data, error } = await (supabase as any).from('cases').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cases'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      qc.invalidateQueries({ queryKey: ['case_lawyers'] });
      qc.invalidateQueries({ queryKey: ['case_lawyers_all'] });
      toast.success('Caso actualizado');
    },
    onError: (e: any) => toast.error('Error', { description: e.message }),
  });
}

export function useDeleteCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('cases').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cases'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Caso eliminado');
    },
    onError: (e: any) => toast.error('Error', { description: e.message }),
  });
}

// Dashboard stats (computed from cases + case_lawyers)
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [casesRes, lawyersRes, clientsRes, caseLawyersRes] = await Promise.all([
        (supabase as any).from('cases').select('*'),
        (supabase as any).from('lawyers').select('*'),
        (supabase as any).from('clients').select('id'),
        (supabase as any).from('case_lawyers').select('*, lawyer:lawyers(name), case:cases(total_amount, status, start_date)'),
      ]);

      const cases = casesRes.data || [];
      const lawyers = lawyersRes.data || [];
      const clients = clientsRes.data || [];
      const caseLawyers = caseLawyersRes.data || [];

      // Monto Contratado = sum of all case total_amounts
      const totalContracted = cases.reduce((s: number, c: any) => s + Number(c.total_amount || 0), 0);

      // Total commissions paid
      const totalCommissionsPaid = caseLawyers
        .filter((cl: any) => cl.commission_paid)
        .reduce((s: number, cl: any) => s + Number(cl.commission_amount || 0), 0);

      // Monto Pagado = Monto Contratado - Comisiones Pagadas
      const montoPagado = totalContracted - totalCommissionsPaid;

      // Pending commissions
      const pendingCommissions = caseLawyers
        .filter((cl: any) => !cl.commission_paid)
        .reduce((s: number, cl: any) => s + Number(cl.commission_amount || 0), 0);

      return {
        totalContracted,
        montoPagado,
        totalCommissionsPaid,
        pendingCommissions,
        activeCases: cases.filter((c: any) => c.status === 'active' || c.status === 'in_progress').length,
        completedCases: cases.filter((c: any) => c.status === 'completed').length,
        totalLawyers: lawyers.length,
        totalClients: clients.length,
        caseLawyers,
      };
    },
  });
}
