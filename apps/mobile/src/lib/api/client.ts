import { env } from '@/config/env';

type ApiResponse<TData> = {
  data: TData;
};

export async function apiGet<TData>(path: string): Promise<ApiResponse<TData>> {
  const response = await fetch(`${env.apiBaseUrl}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const data: TData = await response.json();

  return { data };
}
