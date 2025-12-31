import { beforeAll, afterEach, vi } from 'vitest'

// Mock better-sqlite3 before any database imports
vi.mock('better-sqlite3', () => ({
  default: vi.fn().mockImplementation(() => ({
    prepare: vi.fn(),
    exec: vi.fn(),
    close: vi.fn(),
  })),
}))

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-1234'),
  },
  writable: true,
  configurable: true,
})

beforeAll(() => {
  // Setup that runs before all tests
})

afterEach(() => {
  vi.clearAllMocks()
})
