import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { getUsers, addProjectMember, type ProjectRole } from '@/server/db'

interface AddMemberDialogProps {
  projectId: string
  projectMembers?: Array<{ userId: string }>
  onMemberAdded?: () => void
}

export function AddMemberDialog({
  projectId,
  projectMembers = [],
  onMemberAdded,
}: AddMemberDialogProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<ProjectRole>('member')
  const [loading, setLoading] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<
    Array<{ id: string; name: string; email: string }>
  >([])

  const handleOpenChange = async (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      // Charger les utilisateurs disponibles (pas déjà membres)
      try {
        const allUsers = await getUsers()
        const memberIds = projectMembers.map((m) => m.userId)
        const available = allUsers.filter((u) => !memberIds.includes(u.id))
        setAvailableUsers(available)
      } catch {
        setAvailableUsers([])
      }
    } else {
      setEmail('')
      setRole('member')
    }
  }

  const handleAdd = async () => {
    if (!email.trim()) {
      toast.error('Email requis')
      return
    }

    setLoading(true)
    try {
      // Trouver l'utilisateur par email
      const user = availableUsers.find((u) => u.email === email)
      if (!user) {
        toast.error(
          "Utilisateur non trouvé. Contactez un admin pour l'ajouter.",
        )
        return
      }

      await addProjectMember({
        data: {
          projectId,
          userId: user.id,
          role,
        },
      })

      toast.success('Membre ajouté')
      setOpen(false)
      onMemberAdded?.()
    } catch (error) {
      toast.error("Erreur lors de l'ajout du membre")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="h-4 w-4 mr-1" />
          Ajouter
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un membre</DialogTitle>
          <DialogDescription>
            Ajoutez un utilisateur existant à ce projet
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              list="available-users"
            />
            <datalist id="available-users">
              {availableUsers.map((user) => (
                <option key={user.id} value={user.email}>
                  {user.name} ({user.email})
                </option>
              ))}
            </datalist>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Rôle</Label>
            <Select value={role} onValueChange={(v: ProjectRole) => setRole(v)}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button onClick={handleAdd} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
