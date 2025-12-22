import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
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
  Mail,
  MoreHorizontal,
  Shield,
  User,
  Crown,
  Trash2,
  Edit,
  Upload,
  UserPlus,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import {
  getTeams,
  getTeamWithMembers,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} from '@/server/db'
import { useGitLab } from '@/hooks/useGitLab'
import { toast } from 'sonner'
import type { TeamMember, Team } from '@/db/schema'
import { Textarea } from '@/components/ui/textarea'

interface GitLabMember {
  id: number
  username: string
  name: string
  avatar_url: string
  web_url: string
  access_level: number
}

export const Route = createFileRoute('/team/')({
  loader: async () => {
    const teamsList = await getTeams()
    const defaultTeam = teamsList.find((t) => t.id === 'default-team')
    const selectedTeamId = defaultTeam?.id || teamsList[0]?.id

    let selectedTeam = null
    let members: TeamMember[] = []

    if (selectedTeamId) {
      const teamData = await getTeamWithMembers(selectedTeamId)
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

const roleConfig = {
  owner: {
    label: 'Propriétaire',
    color: 'bg-primary/10 text-primary border-primary/20',
    icon: Crown,
  },
  admin: {
    label: 'Admin',
    color: 'bg-status-warning/10 text-status-warning border-status-warning/20',
    icon: Shield,
  },
  member: {
    label: 'Membre',
    color: 'bg-muted text-muted-foreground border-muted',
    icon: User,
  },
}

const statusColors = {
  online: 'bg-status-done',
  away: 'bg-status-warning',
  offline: 'bg-status-backlog',
}

function Component() {
  const { teams: initialTeams, selectedTeam: initialSelectedTeam, members: initialMembers } = Route.useLoaderData()
  const router = useRouter()
  const gitlab = useGitLab()
  const [teams, setTeams] = useState<Array<Team>>(initialTeams)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(initialSelectedTeam)
  const [members, setMembers] = useState<Array<TeamMember>>(initialMembers)
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false)
  const [isCreateMemberOpen, setIsCreateMemberOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('manual')
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [teamFormData, setTeamFormData] = useState({
    name: '',
    description: '',
  })
  const [memberFormData, setMemberFormData] = useState({
    name: '',
    email: '',
    role: 'member' as 'owner' | 'admin' | 'member',
    avatar: '',
    status: 'offline' as 'online' | 'offline' | 'away',
  })

  // État pour l'import GitLab
  const [gitlabUsers, setGitlabUsers] = useState<Array<GitLabMember>>([])
  const [selectedGitlabUsers, setSelectedGitlabUsers] = useState<Array<number>>(
    [],
  )
  const [loadingGitlab, setLoadingGitlab] = useState(false)
  const [importingMembers, setImportingMembers] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const loadGitlabUsers = async () => {
    if (!gitlab.isConnected) {
      toast.error('Connectez-vous à GitLab dans les paramètres du provider')
      return
    }

    setLoadingGitlab(true)
    try {
      // Charger tous les utilisateurs GitLab (paginé)
      const allUsers: Array<GitLabMember> = []
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

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}`)
        }

        const data: Array<GitLabMember> = await response.json()
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

  // Charger les utilisateurs quand on ouvre l'onglet import
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (value === 'import' && gitlab.isConnected && gitlabUsers.length === 0) {
      loadGitlabUsers()
    }
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

  const loadTeamMembers = async (teamId: string) => {
    const teamData = await getTeamWithMembers(teamId)
    if (teamData) {
      setMembers(teamData.members)
    }
  }

  const handleSelectTeam = async (team: Team) => {
    setSelectedTeam(team)
    await loadTeamMembers(team.id)
  }

  const importSelectedUsers = async () => {
    if (!selectedTeam) {
      toast.error('Sélectionnez une équipe d\'abord')
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
            teamId: selectedTeam.id,
            name: glUser.name || glUser.username || `User ${glUser.id}`,
            email: emailGuess,
            role: 'member',
            avatar: glUser.avatar_url,
            status: 'offline',
            issuesAssigned: 0,
            issuesCompleted: 0,
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

  // Filtrer les utilisateurs par recherche
  const filteredGitlabUsers = gitlabUsers.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleCreateTeam = async () => {
    if (!teamFormData.name.trim()) {
      toast.error('Le nom de l\'équipe est requis')
      return
    }

    try {
      const newTeam = await createTeam({
        name: teamFormData.name,
        description: teamFormData.description || null,
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
      toast.error('Sélectionnez une équipe d\'abord')
      return
    }
    if (!memberFormData.name.trim() || !memberFormData.email.trim()) {
      toast.error("Le nom et l'email sont requis")
      return
    }

    try {
      const newMember = await createTeamMember({
        teamId: selectedTeam.id,
        name: memberFormData.name,
        email: memberFormData.email,
        role: memberFormData.role,
        avatar: memberFormData.avatar || null,
        status: memberFormData.status,
        issuesAssigned: 0,
        issuesCompleted: 0,
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
      toast.error('Le nom de l\'équipe est requis')
      return
    }

    try {
      const updated = await updateTeam({
        id: editingTeam.id,
        updates: {
          name: teamFormData.name,
          description: teamFormData.description || null,
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
      toast.error('Erreur lors de la mise à jour de l\'équipe')
    }
  }

  const handleUpdateMember = async () => {
    if (!editingMember || !memberFormData.name.trim() || !memberFormData.email.trim()) {
      toast.error("Le nom et l'email sont requis")
      return
    }

    try {
      const updated = await updateTeamMember({
        id: editingMember.id,
        updates: {
          name: memberFormData.name,
          email: memberFormData.email,
          role: memberFormData.role,
          avatar: memberFormData.avatar || null,
          status: memberFormData.status,
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

  const handleDeleteTeam = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette équipe ? Tous les membres seront également supprimés.')) return

    try {
      await deleteTeam(id)
      setTeams(teams.filter((t) => t.id !== id))
      if (selectedTeam?.id === id) {
        const newSelected = teams.find((t) => t.id !== id)
        if (newSelected) {
          await handleSelectTeam(newSelected)
        } else {
          setSelectedTeam(null)
          setMembers([])
        }
      }
      toast.success('Équipe supprimée')
      router.invalidate()
    } catch (error) {
      console.error('Erreur suppression:', error)
      toast.error('Erreur lors de la suppression de l\'équipe')
    }
  }

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce membre ?')) return

    try {
      await deleteTeamMember({ data: id })
      setMembers(members.filter((m) => m.id !== id))
      toast.success('Membre retiré')
      router.invalidate()
    } catch (error) {
      console.error('Erreur suppression:', error)
      toast.error('Erreur lors de la suppression du membre')
    }
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
      status: (member.status as 'online' | 'offline' | 'away') || 'offline',
    })
  }

  const getCompletionRate = (member: TeamMember) => {
    if (!member.issuesAssigned || member.issuesAssigned === 0) return 0
    return Math.round(
      ((member.issuesCompleted || 0) / member.issuesAssigned) * 100,
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Équipes</h1>
          <p className="text-sm text-muted-foreground mt-1">
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
            <Dialog open={isCreateMemberOpen} onOpenChange={setIsCreateMemberOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un membre
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Ajouter un membre à {selectedTeam.name}</DialogTitle>
                  <DialogDescription>
                    Ajoutez des membres manuellement ou importez-les depuis GitLab
                  </DialogDescription>
                </DialogHeader>

            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="mt-4"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="import" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Importer depuis GitLab
                </TabsTrigger>
                <TabsTrigger value="manual" className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Ajouter manuellement
                </TabsTrigger>
              </TabsList>

              <TabsContent value="import" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Gitlab className="h-5 w-5 text-orange-500" />
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
                      <Gitlab className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Connectez-vous à GitLab pour importer des membres</p>
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
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
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
                          const isSelected = selectedGitlabUsers.includes(
                            glUser.id,
                          )
                          const alreadyExists = members.some(
                            (m) =>
                              m.email === `${glUser.username}@gitlab` ||
                              m.name === glUser.name,
                          )

                          return (
                            <div
                              key={glUser.id}
                              className={`flex items-center gap-3 p-3 ${
                                alreadyExists
                                  ? 'opacity-50 bg-muted/50'
                                  : 'hover:bg-muted/50 cursor-pointer'
                              }`}
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
                                  className="text-xs gap-1"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
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
                            selectedGitlabUsers.length === 0 || importingMembers
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
                      <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
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
                        setMemberFormData({ ...memberFormData, name: e.target.value })
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
                        setMemberFormData({ ...memberFormData, email: e.target.value })
                      }
                      placeholder="jean@example.com"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">Rôle</Label>
                      <Select
                        value={memberFormData.role}
                        onValueChange={(value: 'owner' | 'admin' | 'member') =>
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
                      <Label htmlFor="status">Statut</Label>
                      <Select
                        value={memberFormData.status}
                        onValueChange={(value: 'online' | 'offline' | 'away') =>
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
                    <Label htmlFor="avatar">URL de l'avatar (optionnel)</Label>
                    <Input
                      id="avatar"
                      value={memberFormData.avatar}
                      onChange={(e) =>
                        setMemberFormData({ ...memberFormData, avatar: e.target.value })
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

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar avec les équipes */}
        <div className="w-64 border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-sm">Équipes</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {teams.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                <p className="mb-2">Aucune équipe</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateTeamOpen(true)}
                >
                  Créer une équipe
                </Button>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    onClick={() => handleSelectTeam(team)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedTeam?.id === team.id
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{team.name}</p>
                        {team.description && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {team.description}
                          </p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditTeamDialog(team)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          {team.id !== 'default-team' && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteTeam(team.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Contenu principal avec les membres */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedTeam ? (
            <>
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-xl font-semibold">{selectedTeam.name}</h2>
                {selectedTeam.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedTeam.description}
                  </p>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-6 scrollbar-custom">
                {members.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <User className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucun membre</h3>
                    <p className="text-muted-foreground mb-4">
                      Commencez par ajouter votre premier membre à cette équipe
                    </p>
                    <Button onClick={() => setIsCreateMemberOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un membre
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {members.map((member) => {
                      const config = roleConfig[member.role]
                      const RoleIcon = config.icon
                      const completionRate = getCompletionRate(member)

                      return (
                        <Card
                          key={member.id}
                          className="hover:shadow-md transition-shadow"
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <Avatar className="h-12 w-12 ring-2 ring-primary/10">
                                    <AvatarImage
                                      src={member.avatar || undefined}
                                      alt={member.name}
                                    />
                                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                                      {member.name
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span
                                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${
                                      statusColors[
                                        member.status as keyof typeof statusColors
                                      ] || statusColors.offline
                                    }`}
                                  />
                                </div>
                                <div>
                                  <CardTitle className="text-base">
                                    {member.name}
                                  </CardTitle>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                    <Mail className="h-3 w-3" />
                                    {member.email}
                                  </div>
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
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
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDeleteMember(member.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Retirer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className={config.color}>
                                  <RoleIcon className="h-3 w-3 mr-1" />
                                  {config.label}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {member.issuesAssigned || 0} issues assignées
                                </span>
                              </div>
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-muted-foreground">
                                    Complétion
                                  </span>
                                  <span className="font-medium">{completionRate}%</span>
                                </div>
                                <Progress value={completionRate} className="h-2" />
                                <p className="text-xs text-muted-foreground mt-1">
                                  {member.issuesCompleted || 0} /{' '}
                                  {member.issuesAssigned || 0} terminées
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Sélectionnez une équipe</h3>
                <p className="text-muted-foreground mb-4">
                  Choisissez une équipe pour voir ses membres
                </p>
                {teams.length === 0 && (
                  <Button onClick={() => setIsCreateTeamOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer votre première équipe
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialog pour modifier une équipe */}
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

      {/* Dialog pour modifier un membre */}
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
                  setMemberFormData({ ...memberFormData, name: e.target.value })
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
                  setMemberFormData({ ...memberFormData, email: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-role">Rôle</Label>
                <Select
                  value={memberFormData.role}
                  onValueChange={(value: 'owner' | 'admin' | 'member') =>
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
                  onValueChange={(value: 'online' | 'offline' | 'away') =>
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
              <Label htmlFor="edit-avatar">URL de l'avatar (optionnel)</Label>
              <Input
                id="edit-avatar"
                value={memberFormData.avatar}
                onChange={(e) =>
                  setMemberFormData({ ...memberFormData, avatar: e.target.value })
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
    </div>
  )
}
