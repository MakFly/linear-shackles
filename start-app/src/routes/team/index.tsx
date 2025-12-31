import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Plus,
  MoreHorizontal,
  Trash2,
  Edit,
  Upload,
  UserPlus,
  Loader2,
  Gitlab as GitLabIcon,
  Users,
  Building2,
  Crown,
  Shield,
  User,
  Search,
  Circle,
  X,
  ChevronDown,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import {
  getTeams,
  getTeamWithMembers,
  createTeam,
  updateTeam,
  deleteTeam,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} from '@/server/db'
import { useGitLab } from '@/hooks/useGitLab'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { TeamMember, Team } from '@/db/schema'

interface GitLabMember {
  id: number
  username: string
  name: string
  avatar_url: string
  web_url: string
  access_level: number
}

type FilterTab = 'all' | 'online' | 'admins'
type RoleType = 'owner' | 'admin' | 'member'
type StatusType = 'online' | 'offline' | 'away'

export const Route = createFileRoute('/team/')({
  loader: async () => {
    const teamsList = await getTeams()
    const defaultTeam = teamsList.find((t) => t.id === 'default-team')
    const selectedTeamId = defaultTeam?.id || teamsList[0]?.id

    let selectedTeam = null
    let members: TeamMember[] = []

    if (selectedTeamId) {
      const teamData = await getTeamWithMembers({ data: selectedTeamId })
      if (teamData) {
        selectedTeam = {
          id: teamData.id,
          name: teamData.name,
          description: teamData.description,
          createdAt: teamData.createdAt,
          updatedAt: teamData.updatedAt,
        }
        members = teamData.members
      }
    }

    return { teams: teamsList, selectedTeam, members }
  },
  component: Component,
})

// Role configuration
const roleConfig: Record<
  RoleType,
  { label: string; icon: typeof Crown; color: string }
> = {
  owner: {
    label: 'Propriétaire',
    icon: Crown,
    color: 'bg-primary/10 text-primary border-primary/20',
  },
  admin: {
    label: 'Admin',
    icon: Shield,
    color: 'bg-[hsl(var(--status-warning))]/10 text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning))]/20',
  },
  member: {
    label: 'Membre',
    icon: User,
    color: 'bg-muted text-muted-foreground',
  },
}

// Status configuration
const statusConfig: Record<
  StatusType,
  { label: string; color: string; pulse: boolean }
> = {
  online: { label: 'En ligne', color: 'bg-[hsl(var(--status-done))]', pulse: true },
  away: { label: 'Absent', color: 'bg-[hsl(var(--status-warning))]', pulse: false },
  offline: { label: 'Hors ligne', color: 'bg-[hsl(var(--status-backlog))]', pulse: false },
}

function Component() {
  const {
    teams: initialTeams,
    selectedTeam: initialSelectedTeam,
    members: initialMembers,
  } = Route.useLoaderData()
  const router = useRouter()
  const gitlab = useGitLab()

  // State
  const [teams, setTeams] = useState<Team[]>(initialTeams)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(
    initialSelectedTeam,
  )
  const [members, setMembers] = useState<TeamMember[]>(initialMembers)
  const [filterTab, setFilterTab] = useState<FilterTab>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Dialog states
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false)
  const [isCreateMemberOpen, setIsCreateMemberOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [deleteConfirmTeam, setDeleteConfirmTeam] = useState<Team | null>(null)
  const [deleteConfirmMember, setDeleteConfirmMember] =
    useState<TeamMember | null>(null)

  // Form states
  const [teamFormData, setTeamFormData] = useState({
    name: '',
    description: '',
  })
  const [memberFormData, setMemberFormData] = useState({
    name: '',
    email: '',
    role: 'member' as RoleType,
    avatar: '',
    status: 'offline' as StatusType,
  })

  // GitLab import states
  const [gitlabUsers, setGitlabUsers] = useState<GitLabMember[]>([])
  const [selectedGitlabUsers, setSelectedGitlabUsers] = useState<number[]>([])
  const [loadingGitlab, setLoadingGitlab] = useState(false)
  const [importingMembers, setImportingMembers] = useState(false)
  const [gitlabSearchQuery, setGitlabSearchQuery] = useState('')
  const [importTab, setImportTab] = useState('manual')

  // Computed stats
  const stats = useMemo(() => {
    const total = members.length
    const online = members.filter((m) => m.status === 'online').length
    const admins = members.filter((m) => m.role === 'owner' || m.role === 'admin').length
    const avgCompletion =
      total > 0
        ? Math.round(
            members.reduce((acc, m) => {
              if (!m.issuesAssigned) return acc
              return acc + (m.issuesCompleted || 0) / m.issuesAssigned
            }, 0) / total * 100,
          )
        : 0

    return { total, online, admins, avgCompletion }
  }, [members])

  // Filtered members
  const filteredMembers = useMemo(() => {
    let result = [...members]

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.email.toLowerCase().includes(query),
      )
    }

    // Apply tab filter
    switch (filterTab) {
      case 'online':
        result = result.filter((m) => m.status === 'online')
        break
      case 'admins':
        result = result.filter((m) => m.role === 'owner' || m.role === 'admin')
        break
    }

    return result
  }, [members, searchQuery, filterTab])

  // GitLab filtered users
  const filteredGitlabUsers = useMemo(
    () =>
      gitlabUsers.filter(
        (u) =>
          u.name?.toLowerCase().includes(gitlabSearchQuery.toLowerCase()) ||
          u.username?.toLowerCase().includes(gitlabSearchQuery.toLowerCase()),
      ),
    [gitlabUsers, gitlabSearchQuery],
  )

  // Handlers
  const loadGitlabUsers = async () => {
    if (!gitlab.isConnected) {
      toast.error('Connectez-vous à GitLab dans les paramètres du provider')
      return
    }

    setLoadingGitlab(true)
    try {
      const allUsers: GitLabMember[] = []
      let page = 1
      const perPage = 100

      while (true) {
        const response = await fetch(
          `${gitlab.gitlabUrl}/api/v4/users?per_page=${perPage}&page=${page}&active=true`,
          {
            headers: {
              Authorization: `Bearer ${gitlab.token}`,
              'Content-Type': 'application/json',
            },
            cache: 'no-store',
          },
        )

        if (!response.ok) throw new Error(`Erreur ${response.status}`)

        const data: GitLabMember[] = await response.json()
        allUsers.push(...data)

        if (data.length < perPage) break
        page++
      }

      setGitlabUsers(allUsers)
    } catch (error) {
      toast.error('Erreur lors du chargement des utilisateurs GitLab')
      console.error(error)
    } finally {
      setLoadingGitlab(false)
    }
  }

  const handleSelectTeam = async (team: Team) => {
    setSelectedTeam(team)
    const teamData = await getTeamWithMembers({ data: team.id })
    if (teamData) {
      setMembers(teamData.members)
    }
  }

  const handleCreateTeam = async () => {
    if (!teamFormData.name.trim()) {
      toast.error("Le nom de l'équipe est requis")
      return
    }

    try {
      const newTeam = await createTeam({
        data: {
          name: teamFormData.name,
          description: teamFormData.description || null,
        },
      })
      setTeams([...teams, newTeam])
      setTeamFormData({ name: '', description: '' })
      setIsCreateTeamOpen(false)
      toast.success('Équipe créée avec succès')
      await handleSelectTeam(newTeam)
      router.invalidate()
    } catch (error) {
      toast.error("Erreur lors de la création de l'équipe")
    }
  }

  const handleCreateMember = async () => {
    if (!selectedTeam) {
      toast.error("Sélectionnez une équipe d'abord")
      return
    }
    if (!memberFormData.name.trim() || !memberFormData.email.trim()) {
      toast.error("Le nom et l'email sont requis")
      return
    }

    try {
      const newMember = await createTeamMember({
        data: {
          teamId: selectedTeam.id,
          name: memberFormData.name,
          email: memberFormData.email,
          role: memberFormData.role,
          avatar: memberFormData.avatar || null,
          status: memberFormData.status,
          issuesAssigned: 0,
          issuesCompleted: 0,
        },
      })

      setMembers([...members, newMember])
      setMemberFormData({
        name: '',
        email: '',
        role: 'member',
        avatar: '',
        status: 'offline',
      })
      setIsCreateMemberOpen(false)
      toast.success('Membre ajouté avec succès')
      router.invalidate()
    } catch (error) {
      toast.error("Erreur lors de l'ajout du membre")
    }
  }

  const handleUpdateTeam = async () => {
    if (!editingTeam || !teamFormData.name.trim()) {
      toast.error("Le nom de l'équipe est requis")
      return
    }

    try {
      const updated = await updateTeam({
        data: {
          id: editingTeam.id,
          updates: {
            name: teamFormData.name,
            description: teamFormData.description || null,
          },
        },
      })
      setTeams(teams.map((t) => (t.id === editingTeam.id ? updated : t)))
      if (selectedTeam?.id === editingTeam.id) {
        setSelectedTeam(updated)
      }
      setEditingTeam(null)
      setTeamFormData({ name: '', description: '' })
      toast.success('Équipe mise à jour')
      router.invalidate()
    } catch (error) {
      toast.error("Erreur lors de la mise à jour de l'équipe")
    }
  }

  const handleUpdateMember = async () => {
    if (
      !editingMember ||
      !memberFormData.name.trim() ||
      !memberFormData.email.trim()
    ) {
      toast.error("Le nom et l'email sont requis")
      return
    }

    try {
      const updated = await updateTeamMember({
        data: {
          id: editingMember.id,
          updates: {
            name: memberFormData.name,
            email: memberFormData.email,
            role: memberFormData.role,
            avatar: memberFormData.avatar || null,
            status: memberFormData.status,
          },
        },
      })

      setMembers(members.map((m) => (m.id === editingMember.id ? updated : m)))
      setEditingMember(null)
      setMemberFormData({
        name: '',
        email: '',
        role: 'member',
        avatar: '',
        status: 'offline',
      })
      toast.success('Membre mis à jour')
      router.invalidate()
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du membre')
    }
  }

  const confirmDeleteTeam = async () => {
    if (!deleteConfirmTeam) return

    try {
      await deleteTeam({ data: deleteConfirmTeam.id })
      setTeams(teams.filter((t) => t.id !== deleteConfirmTeam.id))
      if (selectedTeam?.id === deleteConfirmTeam.id) {
        const newSelected = teams.find((t) => t.id !== deleteConfirmTeam.id)
        if (newSelected) {
          await handleSelectTeam(newSelected)
        } else {
          setSelectedTeam(null)
          setMembers([])
        }
      }
      toast.success('Équipe supprimée')
      setDeleteConfirmTeam(null)
      router.invalidate()
    } catch (error) {
      console.error('Erreur suppression:', error)
      toast.error("Erreur lors de la suppression de l'équipe")
    }
  }

  const confirmDeleteMember = async () => {
    if (!deleteConfirmMember) return

    try {
      await deleteTeamMember({ data: deleteConfirmMember.id })
      setMembers(members.filter((m) => m.id !== deleteConfirmMember.id))
      toast.success('Membre retiré')
      setDeleteConfirmMember(null)
      router.invalidate()
    } catch (error) {
      console.error('Erreur suppression:', error)
      toast.error('Erreur lors de la suppression du membre')
    }
  }

  const importSelectedUsers = async () => {
    if (!selectedTeam) {
      toast.error("Sélectionnez une équipe d'abord")
      return
    }
    if (selectedGitlabUsers.length === 0) {
      toast.error('Sélectionnez au moins un utilisateur')
      return
    }

    setImportingMembers(true)
    const usersToImport = gitlabUsers.filter((u) =>
      selectedGitlabUsers.includes(u.id),
    )

    let imported = 0
    for (const glUser of usersToImport) {
      const emailGuess = `${glUser.username}@gitlab`
      const exists = members.some(
        (m) => m.email === emailGuess || m.name === glUser.name,
      )

      if (!exists) {
        try {
          const newMember = await createTeamMember({
            data: {
              teamId: selectedTeam.id,
              name: glUser.name || glUser.username || `User ${glUser.id}`,
              email: emailGuess,
              role: 'member',
              avatar: glUser.avatar_url,
              status: 'offline',
              issuesAssigned: 0,
              issuesCompleted: 0,
            },
          })
          setMembers((prev) => [...prev, newMember])
          imported++
        } catch (error) {
          console.error(`Erreur import ${glUser.name}:`, error)
        }
      }
    }

    setImportingMembers(false)
    setIsCreateMemberOpen(false)
    setSelectedGitlabUsers([])
    toast.success(`${imported} membre(s) importé(s)`)
    router.invalidate()
  }

  const openEditTeamDialog = (team: Team) => {
    setEditingTeam(team)
    setTeamFormData({
      name: team.name,
      description: team.description || '',
    })
  }

  const openEditMemberDialog = (member: TeamMember) => {
    setEditingMember(member)
    setMemberFormData({
      name: member.name,
      email: member.email,
      role: member.role,
      avatar: member.avatar || '',
      status: member.status || 'offline',
    })
  }

  const getCompletionRate = (member: TeamMember) => {
    if (!member.issuesAssigned || member.issuesAssigned === 0) return 0
    return Math.round(
      ((member.issuesCompleted || 0) / member.issuesAssigned) * 100,
    )
  }

  const toggleGitlabUser = (id: number) => {
    setSelectedGitlabUsers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const selectAllFiltered = () => {
    const filtered = filteredGitlabUsers.filter(
      (u) =>
        !members.some(
          (m) => m.email === `${u.username}@gitlab` || m.name === u.name,
        ),
    )
    setSelectedGitlabUsers(filtered.map((u) => u.id))
  }

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6 scrollbar-custom">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Équipes</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos équipes et leurs membres
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle équipe
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une équipe</DialogTitle>
                <DialogDescription>
                  Créez une nouvelle équipe pour organiser vos membres
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="team-name">Nom *</Label>
                  <Input
                    id="team-name"
                    value={teamFormData.name}
                    onChange={(e) =>
                      setTeamFormData({ ...teamFormData, name: e.target.value })
                    }
                    placeholder="Équipe de développement"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team-description">Description</Label>
                  <Textarea
                    id="team-description"
                    value={teamFormData.description}
                    onChange={(e) =>
                      setTeamFormData({
                        ...teamFormData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Description de l'équipe..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateTeamOpen(false)}
                >
                  Annuler
                </Button>
                <Button onClick={handleCreateTeam}>Créer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {selectedTeam && (
            <Dialog
              open={isCreateMemberOpen}
              onOpenChange={setIsCreateMemberOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un membre
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>
                    Ajouter un membre à {selectedTeam.name}
                  </DialogTitle>
                  <DialogDescription>
                    Ajoutez des membres manuellement ou importez-les depuis
                    GitLab
                  </DialogDescription>
                </DialogHeader>

                <Tabs
                  value={importTab}
                  onValueChange={setImportTab}
                  className="mt-4"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="manual" className="gap-2">
                      <UserPlus className="h-4 w-4" />
                      Ajouter manuellement
                    </TabsTrigger>
                    <TabsTrigger value="import" className="gap-2">
                      <Upload className="h-4 w-4" />
                      Importer depuis GitLab
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="import" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                        <GitLabIcon className="h-5 w-5 text-orange-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Utilisateurs GitLab
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {gitlab.isConnected
                              ? `Connecté à ${gitlab.gitlabUrl}`
                              : 'Non connecté - Configurez GitLab dans Providers'}
                          </p>
                        </div>
                        {gitlab.isConnected && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={loadGitlabUsers}
                            disabled={loadingGitlab}
                          >
                            {loadingGitlab ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Actualiser'
                            )}
                          </Button>
                        )}
                      </div>

                      {!gitlab.isConnected ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <GitLabIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>
                            Connectez-vous à GitLab pour importer des membres
                          </p>
                        </div>
                      ) : loadingGitlab ? (
                        <div className="text-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                          <p className="text-muted-foreground">
                            Chargement des utilisateurs...
                          </p>
                        </div>
                      ) : gitlabUsers.length > 0 ? (
                        <>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Rechercher un utilisateur..."
                              value={gitlabSearchQuery}
                              onChange={(e) =>
                                setGitlabSearchQuery(e.target.value)
                              }
                              className="flex-1"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={selectAllFiltered}
                            >
                              Tout sélectionner
                            </Button>
                          </div>

                          <div className="border rounded-lg divide-y max-h-[280px] overflow-y-auto">
                            {filteredGitlabUsers.map((glUser) => {
                              const isSelected =
                                selectedGitlabUsers.includes(glUser.id)
                              const alreadyExists = members.some(
                                (m) =>
                                  m.email === `${glUser.username}@gitlab` ||
                                  m.name === glUser.name,
                              )

                              return (
                                <div
                                  key={glUser.id}
                                  className={cn(
                                    'flex items-center gap-3 p-3',
                                    alreadyExists
                                      ? 'opacity-50 bg-muted/50'
                                      : 'hover:bg-muted/50 cursor-pointer',
                                  )}
                                  onClick={() =>
                                    !alreadyExists && toggleGitlabUser(glUser.id)
                                  }
                                >
                                  <Checkbox
                                    checked={isSelected}
                                    disabled={alreadyExists}
                                    onCheckedChange={() =>
                                      toggleGitlabUser(glUser.id)
                                    }
                                  />
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={glUser.avatar_url} />
                                    <AvatarFallback>
                                      {(glUser.name || glUser.username)
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')
                                        .substring(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {glUser.name || glUser.username}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      @{glUser.username}
                                    </p>
                                  </div>
                                  {alreadyExists && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      Déjà ajouté
                                    </Badge>
                                  )}
                                </div>
                              )
                            })}
                            {filteredGitlabUsers.length === 0 && (
                              <div className="p-4 text-center text-muted-foreground">
                                Aucun utilisateur trouvé
                              </div>
                            )}
                          </div>

                          <div className="flex justify-between items-center pt-2">
                            <p className="text-sm text-muted-foreground">
                              {selectedGitlabUsers.length} utilisateur(s)
                              sélectionné(s) sur {gitlabUsers.length}
                            </p>
                            <Button
                              onClick={importSelectedUsers}
                              disabled={
                                selectedGitlabUsers.length === 0 ||
                                importingMembers
                              }
                            >
                              {importingMembers ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Import...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Importer ({selectedGitlabUsers.length})
                                </>
                              )}
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Circle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Aucun utilisateur chargé</p>
                          <Button
                            variant="outline"
                            className="mt-4"
                            onClick={loadGitlabUsers}
                          >
                            Charger les utilisateurs
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="manual" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nom *</Label>
                        <Input
                          id="name"
                          value={memberFormData.name}
                          onChange={(e) =>
                            setMemberFormData({
                              ...memberFormData,
                              name: e.target.value,
                            })
                          }
                          placeholder="Jean Dupont"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={memberFormData.email}
                          onChange={(e) =>
                            setMemberFormData({
                              ...memberFormData,
                              email: e.target.value,
                            })
                          }
                          placeholder="jean@example.com"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="role">Rôle</Label>
                          <Select
                            value={memberFormData.role}
                            onValueChange={(value: RoleType) =>
                              setMemberFormData({
                                ...memberFormData,
                                role: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Membre</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="owner">
                                Propriétaire
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="status">Statut</Label>
                          <Select
                            value={memberFormData.status}
                            onValueChange={(value: StatusType) =>
                              setMemberFormData({
                                ...memberFormData,
                                status: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="offline">
                                Hors ligne
                              </SelectItem>
                              <SelectItem value="online">En ligne</SelectItem>
                              <SelectItem value="away">Absent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="avatar">
                          URL de l'avatar (optionnel)
                        </Label>
                        <Input
                          id="avatar"
                          value={memberFormData.avatar}
                          onChange={(e) =>
                            setMemberFormData({
                              ...memberFormData,
                              avatar: e.target.value,
                            })
                          }
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateMemberOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button onClick={handleCreateMember}>Ajouter</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Team Selector */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-card-foreground flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                {selectedTeam?.name || 'Sélectionner une équipe'}
              </CardTitle>
              {selectedTeam?.description && (
                <CardDescription className="mt-2">
                  {selectedTeam.description}
                </CardDescription>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  {selectedTeam?.name || 'Équipe'}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {teams.map((team) => (
                  <DropdownMenuItem
                    key={team.id}
                    onClick={() => handleSelectTeam(team)}
                    className="cursor-pointer"
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    {team.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => openEditTeamDialog(selectedTeam!)}
                  disabled={!selectedTeam}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier l'équipe
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">
              Total Membres
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {stats.total}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">
              En ligne
            </CardTitle>
            <div className="h-2 w-2 rounded-full bg-[hsl(var(--status-done))]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {stats.online}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">
              Admins
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {stats.admins}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">
              Complétion moy.
            </CardTitle>
            <Circle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {stats.avgCompletion}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Button
          variant={filterTab === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilterTab('all')}
        >
          Tous les membres ({members.length})
        </Button>
        <Button
          variant={filterTab === 'online' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilterTab('online')}
        >
          En ligne ({members.filter((m) => m.status === 'online').length})
        </Button>
        <Button
          variant={filterTab === 'admins' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilterTab('admins')}
        >
          Admins ({members.filter((m) => m.role === 'owner' || m.role === 'admin').length})
        </Button>

        <div className="ml-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-64"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Members Grid */}
      {filteredMembers.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery ? 'Aucun membre trouvé' : 'Aucun membre'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? 'Essayez d\'ajuster votre recherche'
                  : 'Commencez par ajouter votre premier membre'}
              </p>
              {!searchQuery && selectedTeam && (
                <Button onClick={() => setIsCreateMemberOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un membre
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const role = roleConfig[member.role]
            const RoleIcon = role.icon
            const status = statusConfig[member.status || 'offline']
            const completion = getCompletionRate(member)

            return (
              <Card
                key={member.id}
                className="border-border bg-card hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={member.avatar || undefined}
                            alt={member.name}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {member.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={cn(
                            'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card',
                            status.color,
                            status.pulse && 'animate-pulse',
                          )}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {member.name}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {member.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openEditMemberDialog(member)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteConfirmMember(member)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Retirer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={role.color}>
                      <RoleIcon className="h-3 w-3 mr-1" />
                      {role.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {member.issuesAssigned || 0} issues
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Complétion
                      </span>
                      <span className="font-medium text-foreground">
                        {completion}%
                      </span>
                    </div>
                    <Progress value={completion} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {member.issuesCompleted || 0} /{' '}
                      {member.issuesAssigned || 0} terminées
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Edit Team Dialog */}
      <Dialog
        open={!!editingTeam}
        onOpenChange={(open) => !open && setEditingTeam(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'équipe</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'équipe
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-team-name">Nom *</Label>
              <Input
                id="edit-team-name"
                value={teamFormData.name}
                onChange={(e) =>
                  setTeamFormData({ ...teamFormData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-team-description">Description</Label>
              <Textarea
                id="edit-team-description"
                value={teamFormData.description}
                onChange={(e) =>
                  setTeamFormData({
                    ...teamFormData,
                    description: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTeam(null)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateTeam}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog
        open={!!editingMember}
        onOpenChange={(open) => !open && setEditingMember(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le membre</DialogTitle>
            <DialogDescription>
              Modifiez les informations du membre
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nom *</Label>
              <Input
                id="edit-name"
                value={memberFormData.name}
                onChange={(e) =>
                  setMemberFormData({
                    ...memberFormData,
                    name: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={memberFormData.email}
                onChange={(e) =>
                  setMemberFormData({
                    ...memberFormData,
                    email: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-role">Rôle</Label>
                <Select
                  value={memberFormData.role}
                  onValueChange={(value: RoleType) =>
                    setMemberFormData({ ...memberFormData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Membre</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="owner">Propriétaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Statut</Label>
                <Select
                  value={memberFormData.status}
                  onValueChange={(value: StatusType) =>
                    setMemberFormData({ ...memberFormData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offline">Hors ligne</SelectItem>
                    <SelectItem value="online">En ligne</SelectItem>
                    <SelectItem value="away">Absent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-avatar">
                URL de l'avatar (optionnel)
              </Label>
              <Input
                id="edit-avatar"
                value={memberFormData.avatar}
                onChange={(e) =>
                  setMemberFormData({
                    ...memberFormData,
                    avatar: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMember(null)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateMember}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Team Alert */}
      <AlertDialog
        open={!!deleteConfirmTeam}
        onOpenChange={(open) => !open && setDeleteConfirmTeam(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'équipe ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'équipe "
              <strong>{deleteConfirmTeam?.name}</strong>" ? Tous les
              membres seront également supprimés. Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTeam}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Member Alert */}
      <AlertDialog
        open={!!deleteConfirmMember}
        onOpenChange={(open) => !open && setDeleteConfirmMember(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer le membre ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir retirer "
              <strong>{deleteConfirmMember?.name}</strong>" de l'équipe ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
