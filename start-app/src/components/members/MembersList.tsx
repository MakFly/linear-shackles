import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Trash2, Shield, ShieldAlert, Eye } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  removeProjectMember,
  updateMemberRole,
  type ProjectRole,
} from '@/server/db'

interface Member {
  id: string
  userId: string
  userName: string
  userEmail: string
  userAvatar: string | null
  role: ProjectRole
  issuesCount: number
}

interface MembersListProps {
  projectId: string
  members: Member[]
  currentUserId?: string
  currentUserRole?: ProjectRole
  onUpdated?: () => void
}

const roleConfig = {
  owner: {
    label: 'Owner',
    color:
      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    icon: Shield,
  },
  admin: {
    label: 'Admin',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    icon: Shield,
  },
  member: {
    label: 'Member',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    icon: ShieldAlert,
  },
  viewer: {
    label: 'Viewer',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    icon: Eye,
  },
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

function canEditRole(
  currentRole: ProjectRole | undefined,
  targetRole: ProjectRole,
): boolean {
  if (!currentRole) return false
  const hierarchy = { owner: 3, admin: 2, member: 1, viewer: 0 }
  return hierarchy[currentRole] >= hierarchy[targetRole]
}

function canRemoveMember(
  currentRole: ProjectRole | undefined,
  targetRole: ProjectRole,
  isSelf: boolean,
): boolean {
  if (isSelf) return false // On ne peut pas se retirer soi-même
  if (!currentRole) return false
  const hierarchy = { owner: 3, admin: 2, member: 1, viewer: 0 }
  return hierarchy[currentRole] > hierarchy[targetRole]
}

export function MembersList({
  projectId,
  members,
  currentUserId,
  currentUserRole,
  onUpdated,
}: MembersListProps) {
  const [removingId, setRemovingId] = useState<string | null>(null)

  const handleRoleChange = async (userId: string, newRole: ProjectRole) => {
    try {
      await updateMemberRole({
        data: { projectId, userId, role: newRole },
      })
      toast.success('Rôle mis à jour')
      onUpdated?.()
    } catch {
      toast.error('Erreur lors de la mise à jour du rôle')
    }
  }

  const handleRemove = async (userId: string) => {
    setRemovingId(userId)
    try {
      await removeProjectMember({
        data: { projectId, userId },
      })
      toast.success('Membre retiré')
      onUpdated?.()
    } catch {
      toast.error('Erreur lors du retrait du membre')
    } finally {
      setRemovingId(null)
    }
  }

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <ShieldAlert className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Aucun membre</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Ajoutez des membres à ce projet pour commencer à collaborer
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {members.map((member) => {
        const config = roleConfig[member.role]
        const Icon = config.icon
        const isSelf = member.userId === currentUserId
        const canEdit = canEditRole(currentUserRole, member.role)
        const canRemove = canRemoveMember(currentUserRole, member.role, isSelf)

        return (
          <div
            key={member.id}
            className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
          >
            <Avatar className="h-10 w-10">
              <AvatarFallback className={config.color}>
                {member.userAvatar || getInitials(member.userName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{member.userName}</span>
                <Badge variant="secondary" className={config.color}>
                  <Icon className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
                {isSelf && (
                  <Badge variant="outline" className="text-xs">
                    Vous
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {member.userEmail}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{member.issuesCount}</p>
                <p className="text-xs text-muted-foreground">issues</p>
              </div>
              {(canEdit || canRemove) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canEdit && (
                      <Select
                        value={member.role}
                        onValueChange={(v: ProjectRole) =>
                          handleRoleChange(member.userId, v)
                        }
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    {canRemove && (
                      <>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleRemove(member.userId)}
                          disabled={removingId === member.id}
                        >
                          {removingId === member.id ? (
                            'Retrait...'
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Retirer
                            </>
                          )}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
