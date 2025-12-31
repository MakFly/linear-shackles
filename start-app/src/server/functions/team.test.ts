// Mock better-sqlite3 FIRST
vi.mock('better-sqlite3', () => ({
  default: vi.fn().mockImplementation(() => ({
    prepare: vi.fn(),
    exec: vi.fn(),
    close: vi.fn(),
  })),
}))

// Mock createServerFn to call handlers directly in unit tests
// TanStack Start calls functions with { data: ... } format
vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => {
    let validator: ((data: any) => any) | undefined
    const builder = {
      inputValidator: (fn: (data: any) => any) => {
        validator = fn
        return builder
      },
      handler: (fn: (ctx: { data: any }) => any) => {
        return async (opts?: { data?: any }) => {
          // Extract opts.data, validate it, then wrap in { data } for the handler
          const data = validator ? validator(opts?.data) : opts?.data
          return fn({ data } as { data: any })
        }
      },
    }
    return builder
  },
}))

// Mock drizzle ORM functions
vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>()
  return {
    ...actual,
    eq: vi.fn((field: any, value: any) => ({ field, value, type: 'eq' })),
    asc: vi.fn((field: any) => ({ field, type: 'asc' })),
    relations: vi.fn((table: any, fn: any) => fn),
  }
})

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Create chainable query builder mock
const createMockQueryBuilder = () => ({
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  returning: vi.fn(),
})

// Mock @/db - this must be at top level for proper hoisting
vi.mock('@/db', () => {
  const createMockQueryBuilder = () => ({
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    returning: vi.fn(),
  })

  return {
    db: {
      select: vi.fn(() => createMockQueryBuilder()),
      insert: vi.fn(() => createMockQueryBuilder()),
      update: vi.fn(() => createMockQueryBuilder()),
      delete: vi.fn(() => createMockQueryBuilder()),
    },
    teams: {
      id: 'id',
      name: 'name',
      description: 'description',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    teamMembers: {
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
    },
  }
})

// Import db to get the mock functions - import AFTER mock declaration
import { db, teams, teamMembers } from '@/db'

// Now we can reference db.select directly since it's the mocked version
const dbSelect = db.select as any
const dbInsert = db.insert as any
const dbUpdate = db.update as any
const dbDelete = db.delete as any

import {
  getTeams,
  getTeamById,
  getTeamWithMembers,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamMembers,
  getTeamMemberById,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} from '../../server/functions/team'

describe('Team Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getTeams', () => {
    it('should return all teams ordered by name', async () => {
      const mockTeamsData = [
        {
          id: 'team-1',
          name: 'Alpha Team',
          description: 'First team',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'team-2',
          name: 'Beta Team',
          description: 'Second team',
          createdAt: '2024-01-02T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
        },
      ]

      const mockOrderBy = vi.fn().mockResolvedValue(mockTeamsData)
      const mockFrom = vi.fn().mockReturnValue({ orderBy: mockOrderBy })

      dbSelect.mockReturnValueOnce({ from: mockFrom })

      const result = await getTeams()

      expect(dbSelect).toHaveBeenCalled()
      expect(mockFrom).toHaveBeenCalledWith(teams)
      expect(result).toEqual(mockTeamsData)
    })
  })

  describe('getTeamById', () => {
    it('should return a team by id', async () => {
      const mockTeam = {
        id: 'team-1',
        name: 'Alpha Team',
        description: 'First team',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }

      const mockWhere = vi.fn().mockResolvedValue([mockTeam])
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })

      dbSelect.mockReturnValueOnce({ from: mockFrom })

      const result = await getTeamById({ data: 'team-1' })

      expect(dbSelect).toHaveBeenCalled()
      expect(mockFrom).toHaveBeenCalledWith(teams)
      expect(result).toEqual(mockTeam)
    })

    it('should return null if team not found', async () => {
      const mockWhere = vi.fn().mockResolvedValue([])
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })

      dbSelect.mockReturnValueOnce({ from: mockFrom })

      const result = await getTeamById({ data: 'non-existent' })

      expect(result).toBeNull()
    })
  })

  describe('getTeamWithMembers', () => {
    it('should return team with its members', async () => {
      const mockTeam = {
        id: 'team-1',
        name: 'Alpha Team',
        description: 'First team',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }

      const mockMembers = [
        {
          id: 'member-1',
          teamId: 'team-1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'owner',
          avatar: null,
          issuesAssigned: 5,
          issuesCompleted: 3,
          status: 'online',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]

      const mockTeamWhere = vi.fn().mockResolvedValue([mockTeam])
      const mockTeamFrom = vi.fn().mockReturnValue({ where: mockTeamWhere })

      const mockMemberOrderBy = vi.fn().mockResolvedValue(mockMembers)
      const mockMemberWhere = vi.fn().mockReturnValue({ orderBy: mockMemberOrderBy })
      const mockMemberFrom = vi.fn().mockReturnValue({ where: mockMemberWhere })

      dbSelect
        .mockReturnValueOnce({ from: mockTeamFrom })
        .mockReturnValueOnce({ from: mockMemberFrom })

      const result = await getTeamWithMembers({ data: 'team-1' })

      expect(result).toEqual({ ...mockTeam, members: mockMembers })
    })

    it('should return null if team not found', async () => {
      const mockTeamWhere = vi.fn().mockResolvedValue([])
      const mockTeamFrom = vi.fn().mockReturnValue({ where: mockTeamWhere })

      dbSelect.mockReturnValueOnce({ from: mockTeamFrom })

      const result = await getTeamWithMembers({ data: 'non-existent' })

      expect(result).toBeNull()
    })
  })

  describe('createTeam', () => {
    it('should create a new team', async () => {
      const newTeam = {
        id: 'test-uuid-1234',
        name: 'New Team',
        description: 'A new team',
        createdAt: '2024-01-01T12:00:00.000Z',
        updatedAt: '2024-01-01T12:00:00.000Z',
      }

      const mockValues = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([newTeam]),
      })

      dbInsert.mockReturnValueOnce({ values: mockValues })

      const result = await createTeam({
        data: { name: 'New Team', description: 'A new team' },
      })

      expect(dbInsert).toHaveBeenCalledWith(teams)
      expect(mockValues).toHaveBeenCalledWith({
        id: 'test-uuid-1234',
        name: 'New Team',
        description: 'A new team',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      })
      expect(result).toEqual(newTeam)
    })

    it('should trim whitespace from team name and description', async () => {
      const newTeam = {
        id: 'test-uuid-1234',
        name: 'New Team',
        description: 'Description',
        createdAt: '2024-01-01T12:00:00.000Z',
        updatedAt: '2024-01-01T12:00:00.000Z',
      }

      const mockValues = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([newTeam]),
      })

      dbInsert.mockReturnValueOnce({ values: mockValues })

      await createTeam({
        data: { name: '  New Team  ', description: '  Description  ' },
      })

      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Team',
          description: 'Description',
        }),
      )
    })

    it('should handle null description', async () => {
      const newTeam = {
        id: 'test-uuid-1234',
        name: 'New Team',
        description: null,
        createdAt: '2024-01-01T12:00:00.000Z',
        updatedAt: '2024-01-01T12:00:00.000Z',
      }

      const mockValues = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([newTeam]),
      })

      dbInsert.mockReturnValueOnce({ values: mockValues })

      await createTeam({ data: { name: 'New Team', description: null } })

      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          description: null,
        }),
      )
    })
  })

  describe('updateTeam', () => {
    it('should update an existing team', async () => {
      const updatedTeam = {
        id: 'team-1',
        name: 'Updated Team',
        description: 'Updated description',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T12:00:00.000Z',
      }

      const mockWhere = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([updatedTeam]),
      })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })

      dbUpdate.mockReturnValueOnce({ set: mockSet })

      const result = await updateTeam({
        data: {
          id: 'team-1',
          updates: { name: 'Updated Team', description: 'Updated description' },
        },
      })

      expect(dbUpdate).toHaveBeenCalledWith(teams)
      expect(mockSet).toHaveBeenCalledWith({
        name: 'Updated Team',
        description: 'Updated description',
        updatedAt: expect.any(String),
      })
      expect(result).toEqual(updatedTeam)
    })
  })

  describe('deleteTeam', () => {
    it('should delete a team', async () => {
      const deletedTeam = {
        id: 'team-1',
        name: 'Team to Delete',
        description: 'Will be deleted',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }

      const mockWhere = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([deletedTeam]),
      })

      dbDelete.mockReturnValueOnce({ where: mockWhere })

      const result = await deleteTeam({ data: 'team-1' })

      expect(dbDelete).toHaveBeenCalledWith(teams)
      expect(result).toEqual({ success: true, deleted: 1 })
    })
  })
})

describe('Team Member Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getTeamMembers', () => {
    it('should return all members when no teamId provided', async () => {
      const mockMembers = [
        {
          id: 'member-1',
          teamId: 'team-1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'owner',
          avatar: null,
          issuesAssigned: 5,
          issuesCompleted: 3,
          status: 'online',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]

      const mockOrderBy = vi.fn().mockResolvedValue(mockMembers)
      const mockFrom = vi.fn().mockReturnValue({ orderBy: mockOrderBy })

      dbSelect.mockReturnValueOnce({ from: mockFrom })

      const result = await getTeamMembers()

      expect(dbSelect).toHaveBeenCalled()
      expect(mockFrom).toHaveBeenCalledWith(teamMembers)
      expect(result).toEqual(mockMembers)
    })

    it('should return members filtered by teamId', async () => {
      const mockMembers = [
        {
          id: 'member-1',
          teamId: 'team-1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'owner',
          avatar: null,
          issuesAssigned: 5,
          issuesCompleted: 3,
          status: 'online',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]

      const mockOrderBy = vi.fn().mockResolvedValue(mockMembers)
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })

      dbSelect.mockReturnValueOnce({ from: mockFrom })

      const result = await getTeamMembers({ data: 'team-1' })

      expect(dbSelect).toHaveBeenCalled()
      expect(mockFrom).toHaveBeenCalledWith(teamMembers)
      expect(result).toEqual(mockMembers)
    })
  })

  describe('getTeamMemberById', () => {
    it('should return a member by id', async () => {
      const mockMember = {
        id: 'member-1',
        teamId: 'team-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'owner',
        avatar: null,
        issuesAssigned: 5,
        issuesCompleted: 3,
        status: 'online',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }

      const mockWhere = vi.fn().mockResolvedValue([mockMember])
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })

      dbSelect.mockReturnValueOnce({ from: mockFrom })

      const result = await getTeamMemberById({ data: 'member-1' })

      expect(dbSelect).toHaveBeenCalled()
      expect(mockFrom).toHaveBeenCalledWith(teamMembers)
      expect(result).toEqual(mockMember)
    })

    it('should return null if member not found', async () => {
      const mockWhere = vi.fn().mockResolvedValue([])
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })

      dbSelect.mockReturnValueOnce({ from: mockFrom })

      const result = await getTeamMemberById({ data: 'non-existent' })

      expect(result).toBeNull()
    })
  })

  describe('createTeamMember', () => {
    it('should create a new team member', async () => {
      const newMember = {
        id: 'test-uuid-1234',
        teamId: 'team-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'admin',
        avatar: null,
        issuesAssigned: 0,
        issuesCompleted: 0,
        status: 'offline',
        createdAt: '2024-01-01T12:00:00.000Z',
        updatedAt: '2024-01-01T12:00:00.000Z',
      }

      const mockValues = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([newMember]),
      })

      dbInsert.mockReturnValueOnce({ values: mockValues })

      const result = await createTeamMember({
        data: {
          teamId: 'team-1',
          name: 'Jane Doe',
          email: 'jane@example.com',
          role: 'admin',
        },
      })

      expect(dbInsert).toHaveBeenCalledWith(teamMembers)
      expect(mockValues).toHaveBeenCalledWith({
        id: 'test-uuid-1234',
        teamId: 'team-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'admin',
        avatar: null,
        status: 'offline',
        issuesAssigned: 0,
        issuesCompleted: 0,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      })
      expect(result).toEqual(newMember)
    })

    it('should use provided values for optional fields', async () => {
      const newMember = {
        id: 'test-uuid-1234',
        teamId: 'team-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'member',
        avatar: 'avatar-url',
        issuesAssigned: 5,
        issuesCompleted: 3,
        status: 'online',
        createdAt: '2024-01-01T12:00:00.000Z',
        updatedAt: '2024-01-01T12:00:00.000Z',
      }

      const mockValues = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([newMember]),
      })

      dbInsert.mockReturnValueOnce({ values: mockValues })

      await createTeamMember({
        data: {
          teamId: 'team-1',
          name: 'Jane Doe',
          email: 'jane@example.com',
          role: 'member',
          avatar: 'avatar-url',
          issuesAssigned: 5,
          issuesCompleted: 3,
          status: 'online',
        },
      })

      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          avatar: 'avatar-url',
          issuesAssigned: 5,
          issuesCompleted: 3,
          status: 'online',
        }),
      )
    })
  })

  describe('updateTeamMember', () => {
    it('should update an existing team member', async () => {
      const updatedMember = {
        id: 'member-1',
        teamId: 'team-1',
        name: 'Jane Updated',
        email: 'jane.updated@example.com',
        role: 'admin',
        avatar: null,
        issuesAssigned: 10,
        issuesCompleted: 5,
        status: 'away',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T12:00:00.000Z',
      }

      const mockWhere = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([updatedMember]),
      })
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere })

      dbUpdate.mockReturnValueOnce({ set: mockSet })

      const result = await updateTeamMember({
        data: {
          id: 'member-1',
          updates: { name: 'Jane Updated', role: 'admin' },
        },
      })

      expect(dbUpdate).toHaveBeenCalledWith(teamMembers)
      expect(mockSet).toHaveBeenCalledWith({
        name: 'Jane Updated',
        role: 'admin',
        updatedAt: expect.any(String),
      })
      expect(result).toEqual(updatedMember)
    })
  })

  describe('deleteTeamMember', () => {
    it('should delete a team member', async () => {
      const deletedMember = {
        id: 'member-1',
        teamId: 'team-1',
        name: 'Deleted Member',
        email: 'deleted@example.com',
        role: 'member',
        avatar: null,
        issuesAssigned: 0,
        issuesCompleted: 0,
        status: 'offline',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      }

      const mockWhere = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([deletedMember]),
      })

      dbDelete.mockReturnValueOnce({ where: mockWhere })

      const result = await deleteTeamMember({ data: 'member-1' })

      expect(dbDelete).toHaveBeenCalledWith(teamMembers)
      expect(result).toEqual({ success: true, deleted: 1 })
    })

    it('should return success: true even if no member deleted', async () => {
      const mockWhere = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([]),
      })

      dbDelete.mockReturnValueOnce({ where: mockWhere })

      const result = await deleteTeamMember({ data: 'non-existent' })

      expect(result).toEqual({ success: true, deleted: 0 })
    })
  })
})
