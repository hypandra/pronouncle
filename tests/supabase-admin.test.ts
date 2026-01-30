import { describe, it, expect, vi, beforeEach } from 'vitest'

const TEST_URL = 'https://test.supabase.co'
const TEST_SERVICE_KEY = 'test-service-role-key'

// Set up env vars before any imports
vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
})

const mockCreateClient = vi.hoisted(() => vi.fn(() => ({
  from: vi.fn(),
})))

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}))

import { createAdminClient } from '@/lib/supabase/admin'

describe('createAdminClient', () => {
  beforeEach(() => {
    mockCreateClient.mockClear()
  })

  it('uses service role key (bypasses RLS)', () => {
    createAdminClient()

    expect(mockCreateClient).toHaveBeenCalledWith(
      TEST_URL,
      TEST_SERVICE_KEY,
      { auth: { persistSession: false } }
    )
  })
})
