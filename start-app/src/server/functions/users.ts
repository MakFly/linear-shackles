import { createServerFn } from '@tanstack/react-start'
import { db, users } from '@/db'
import { eq, desc } from 'drizzle-orm'
import type {
  User,
  NewUser,
} from '@/db/schema/users'

// Helper: Generate ID
const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`

// Helper: Generate avatar initials
function generateInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

export const getUsers = createServerFn({ method: 'GET' }).handler(
  async () => {
    return await db.select().from(users).orderBy(desc(users.createdAt))
  },
)

export const getUserById = createServerFn({ method: 'GET' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const result = await db.select().from(users).where(eq(users.id, id))
    return result[0] || null
  })

export const getUserByEmail = createServerFn({ method: 'GET' })
  .inputValidator((email: string) => email)
  .handler(async ({ data: email }) => {
    const result = await db.select().from(users).where(eq(users.email, email))
    return result[0] || null
  })

export const createUser = createServerFn({ method: 'POST' })
  .inputValidator((user: NewUser) => user)
  .handler(async ({ data: user }) => {
    const now = new Date().toISOString()
    const newUser = await db
      .insert(users)
      .values({
        id: generateId(),
        ...user,
        avatar: user.avatar || generateInitials(user.name),
        createdAt: now,
        updatedAt: now,
      })
      .returning()
    return newUser[0]
  })

export const updateUser = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; updates: Partial<User> }) => data)
  .handler(async ({ data }) => {
    const result = await db
      .update(users)
      .set({ ...data.updates, updatedAt: new Date().toISOString() })
      .where(eq(users.id, data.id))
      .returning()
    return result[0]
  })

export const deleteUser = createServerFn({ method: 'POST' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    await db.delete(users).where(eq(users.id, id))
    return { success: true }
  })
