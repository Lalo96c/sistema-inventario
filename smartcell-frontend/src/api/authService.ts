import type { User } from '../types/auth';
import { httpClient } from './httpClient';

export type LoginResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
};

export type RegisterResponse = {
  message?: string;
  user?: User;
};

export async function login(credentials: {
  email: string;
  password: string;
}): Promise<LoginResponse> {
  const { data } = await httpClient.post<LoginResponse>('/auth/login', credentials);
  return data;
}

export async function register(payload: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}): Promise<RegisterResponse> {
  const { data } = await httpClient.post<RegisterResponse>('/auth/register', payload);
  return data;
}

export async function fetchMe(): Promise<User> {
  const { data } = await httpClient.get<User>('/auth/me');
  return data;
}

export async function logout(): Promise<{ message?: string }> {
  const { data } = await httpClient.post<{ message?: string }>('/auth/logout');
  return data;
}
