import { vi } from 'vitest';

// Mock Supabase query builder
export const mockSupabaseQuery = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn(),
  rpc: vi.fn(),
};

// Mock Supabase client
export const mockSupabaseClient = {
  from: vi.fn(() => mockSupabaseQuery),
  rpc: vi.fn(),
};

// Helper to reset all mocks
export function resetSupabaseMocks() {
  Object.values(mockSupabaseQuery).forEach((fn) => {
    if (typeof fn.mockReset === 'function') {
      fn.mockReset();
      fn.mockReturnThis();
    }
  });
  mockSupabaseClient.from.mockReset();
  mockSupabaseClient.from.mockReturnValue(mockSupabaseQuery);
  mockSupabaseClient.rpc.mockReset();
}

// Helper to mock a successful query response
export function mockQuerySuccess<T>(data: T) {
  mockSupabaseQuery.single.mockResolvedValue({ data, error: null });
  return mockSupabaseQuery;
}

// Helper to mock a query error
export function mockQueryError(message: string, code?: string) {
  mockSupabaseQuery.single.mockResolvedValue({
    data: null,
    error: { message, code: code || 'ERROR' },
  });
  return mockSupabaseQuery;
}

// Helper to mock array response (for queries without .single())
export function mockArraySuccess<T>(data: T[]) {
  // Override the chain to return data directly
  const chainEnd = { data, error: null };
  mockSupabaseQuery.order.mockResolvedValue(chainEnd);
  mockSupabaseQuery.limit.mockResolvedValue(chainEnd);
  mockSupabaseQuery.eq.mockImplementation(() => {
    return {
      ...mockSupabaseQuery,
      order: vi.fn().mockResolvedValue(chainEnd),
      single: vi.fn().mockResolvedValue({ data: data[0] || null, error: null }),
    };
  });
  return mockSupabaseQuery;
}
