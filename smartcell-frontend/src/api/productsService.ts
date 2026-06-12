import { isAxiosError } from 'axios';
import type {
  ApiProduct,
  PaginatedProductsResponse,
  ProductPayload,
} from '../types/product';
import { httpClient } from './httpClient';

export async function fetchProducts(params: {
  page?: number;
  per_page?: number;
  search?: string;
  name?: string;
  code?: string;
  category?: string;
  status?: string;
} = {}): Promise<PaginatedProductsResponse> {
  const { data } = await httpClient.get<PaginatedProductsResponse>('/products', {
    params: {
      page: params.page ?? 1,
      per_page: params.per_page ?? 15,
      search: params.search || undefined,
      name: params.name || undefined,
      code: params.code || undefined,
      category: params.category || undefined,
      status: params.status || undefined,
    },
  });
  return data;
}

export async function fetchProduct(id: number | string): Promise<ApiProduct> {
  const { data } = await httpClient.get<{ data: ApiProduct }>(`/products/${id}`);
  return data.data;
}

export async function fetchNextProductCode(): Promise<string> {
  try {
    const { data } = await httpClient.get<{ next_code: string }>('/products/next-code');
    return data.next_code;
  } catch {
    return 'PRD-00001';
  }
}

export async function createProduct(
  payload: ProductPayload,
): Promise<ApiProduct> {
  const { data } = await httpClient.post<{ data: ApiProduct }>(
    '/products',
    payload,
  );
  return data.data;
}

export async function updateProduct(
  id: number | string,
  payload: Partial<ProductPayload>,
): Promise<ApiProduct> {
  const { data } = await httpClient.put<{ data: ApiProduct }>(
    `/products/${id}`,
    payload,
  );
  return data.data;
}

export async function deleteProduct(id: number | string): Promise<void> {
  await httpClient.delete(`/products/${id}`);
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
