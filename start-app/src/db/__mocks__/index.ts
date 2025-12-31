import { vi } from 'vitest'

// Create a chainable query builder mock
const createMockQueryBuilder = () => ({
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  returning: vi.fn(),
})

export const db = {
  select: vi.fn(() => createMockQueryBuilder()),
  insert: vi.fn(() => createMockQueryBuilder()),
  update: vi.fn(() => createMockQueryBuilder()),
  delete: vi.fn(() => createMockQueryBuilder()),
}

export const teams = {
  id: 'id',
  name: 'name',
  description: 'description',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
}

export const teamMembers = {
  id: 'id',
  teamId: 'team_id',
  name: 'name',
  email: 'email',
  role: 'role',
  avatar: 'avatar',
  issuesAssigned: 'issues_assigned',
  issuesCompleted: 'issues_completed',
  status: 'status',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
}

// Re-export all schema exports that might be imported
export * from '../schema/index'
