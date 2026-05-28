import { isAxiosError } from 'axios';
import type { ApiSale, PaginatedSalesResponse, SalePayload } from '../types/sale';
import { httpClient } from './httpClient';

export async function fetchSales(params: {
  page?: number;
  per_page?: number;
  sale_code?: string;
  date_from?: string;
  date_to?: string;
  client_id?: number | null;
} = {}): Promise<PaginatedSalesResponse> {
  const { data } = await httpClient.get<PaginatedSalesResponse>('/sales', {
    params: {
      page: params.page ?? 1,
      per_page: params.per_page ?? 15,
      sale_code: params.sale_code || undefined,
      date_from: params.date_from || undefined,
      date_to: params.date_to || undefined,
      client_id: params.client_id || undefined,
    },
  });
  return data;
}

export async function fetchSale(id: number | string): Promise<ApiSale> {
  const { data } = await httpClient.get<{ data: ApiSale }>(`/sales/${id}`);
  return data.data;
}

/**
 * Obtiene el próximo código de venta del servidor (auto-increment)
 */
export async function fetchNextSaleCode(): Promise<string> {
  try {
    const { data } = await httpClient.get<{ next_code: string }>(
      '/sales/next-code'
    );
    return data.next_code;
  } catch {
    // Si el endpoint no existe, generar localmente con formato SAL-000001
    const timestamp = Date.now();
    const lastDigits = String(timestamp).slice(-6);
    return `SAL-${lastDigits}`;
  }
}

export async function createSale(payload: SalePayload): Promise<ApiSale> {
  const { data } = await httpClient.post<{ data: ApiSale }>('/sales', payload);
  return data.data;
}

export async function updateSale(
  id: number | string,
  payload: Partial<SalePayload>,
): Promise<ApiSale> {
  const { data } = await httpClient.put<{ data: ApiSale }>(`/sales/${id}`, payload);
  return data.data;
}

export async function deleteSale(id: number | string): Promise<void> {
  await httpClient.delete(`/sales/${id}`);
}

export function collectApiErrorMessages(error: unknown): string[] {
  if (isAxiosError(error)) {
    const res = error.response?.data as
      | { errors?: Record<string, string | string[]>; message?: string }
      | undefined;
    if (res?.errors && typeof res.errors === 'object') {
      return Object.entries(res.errors).flatMap(([field, messages]) => {
        const arr = Array.isArray(messages) ? messages : [messages];
        return arr.map((m) => `${field}: ${m}`);
      });
    }
    if (typeof res?.message === 'string') {
      return [res.message];
    }
  }
  if (error instanceof Error) {
    return [error.message];
  }
  return ['Error al contactar con el servidor'];
}
