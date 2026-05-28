import { httpClient } from './httpClient';

export interface Purchase {
  id: number;
  purchase_code: string;
  purchase_date: string;
  supplier_name: string;
  total_amount: string;
  detail?: PurchaseDetail[];
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface PurchaseDetail {
  id: number;
  purchase_id: number;
  product_id: number;
  product?: {
    id: number;
    code: string;
    name: string;
  };
  quantity: number;
  unit_price: string;
  line_total: string;
}

export interface PurchasesResponse {
  data: Purchase[];
  links: {
    first: string;
    last: string;
    next: string | null;
    prev: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
}

export async function fetchPurchases(
  page: number = 1,
  perPage: number = 15,
  filters?: {
    purchase_code?: string;
    supplier_name?: string;
    date_from?: string;
    date_to?: string;
  }
): Promise<PurchasesResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });

  if (filters?.purchase_code) {
    params.append('purchase_code', filters.purchase_code);
  }
  if (filters?.supplier_name) {
    params.append('supplier_name', filters.supplier_name);
  }
  if (filters?.date_from) {
    params.append('date_from', filters.date_from);
  }
  if (filters?.date_to) {
    params.append('date_to', filters.date_to);
  }

  const { data } = await httpClient.get<PurchasesResponse>(
    `/purchases?${params.toString()}`
  );
  return data;
}

export async function fetchPurchase(id: number): Promise<Purchase> {
  const { data } = await httpClient.get<Purchase>(`/purchases/${id}`);
  return data;
}

/**
 * Obtiene el próximo código de compra del servidor (auto-increment)
 */
export async function fetchNextPurchaseCode(): Promise<string> {
  try {
    const { data } = await httpClient.get<{ next_code: string }>(
      '/purchases/next-code'
    );
    return data.next_code;
  } catch {
    // Si el endpoint no existe, generar localmente con formato PUR-000001
    const timestamp = Date.now();
    const lastDigits = String(timestamp).slice(-6);
    return `PUR-${lastDigits}`;
  }
}

export async function createPurchase(purchase: {
  purchase_code: string;
  purchase_date: string;
  supplier_name: string;
  details: Array<{
    product_id: number;
    quantity: number;
    unit_price: number;
  }>;
}): Promise<Purchase> {
  const { data } = await httpClient.post<Purchase>('/purchases', purchase);
  return data;
}

export async function updatePurchase(
  id: number,
  purchase: Partial<Purchase>
): Promise<Purchase> {
  const { data } = await httpClient.put<Purchase>(`/purchases/${id}`, purchase);
  return data;
}

export async function deletePurchase(id: number): Promise<void> {
  await httpClient.delete(`/purchases/${id}`);
}

export function collectApiErrorMessages(error: unknown): string[] {
  if (error instanceof Error) {
    return [error.message];
  }
  if (typeof error === 'object' && error !== null) {
    const err = error as any;
    if (err.response?.data?.errors) {
      return Object.values(err.response.data.errors).flat() as string[];
    }
    if (err.response?.data?.message) {
      return [err.response.data.message];
    }
    if (err.message) {
      return [err.message];
    }
  }
  return ['Error desconocido'];
}
