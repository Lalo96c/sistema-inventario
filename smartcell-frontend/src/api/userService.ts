import type { User } from '../types/auth';
import { httpClient } from './httpClient';

export type UserCreatePayload = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  is_admin?: boolean;
  is_active?: boolean;
};

export type UserUpdatePayload = Partial<UserCreatePayload> & {
  password?: string;
  password_confirmation?: string;
};

export async function fetchUsers(): Promise<User[]> {
  const { data } = await httpClient.get<User[]>('/users');
  return data;
}

export async function createUser(payload: UserCreatePayload): Promise<User> {
  const { data } = await httpClient.post<User>('/users', payload);
  return data;
}

export async function updateUser(id: number, payload: UserUpdatePayload): Promise<User> {
  const { data } = await httpClient.put<User>(`/users/${id}`, payload);
  return data;
}

export async function deleteUser(id: number): Promise<void> {
  await httpClient.delete(`/users/${id}`);
}
