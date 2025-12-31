import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Plus,
  FolderKanban,
  MoreHorizontal,
  Users,
  Calendar,
  Trash2,
  Edit,
  Github,
  Gitlab,
  Loader2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  findOrCreateProjectByProvider,
} from '@/server/db'
import { useGitHub } from '@/hooks/useGitHub'
import { useGitLab } from '@/hooks/useGitLab'
import { toast } from 'sonner'
import type { Project } from '@/db/schema'

export const Route = createFileRoute('/projects/')({
  loader: async () => {
    const projects = await getProjects()
    return { projects }
  },
  component: Component,
})

const statusColors = {
  active:
    'bg-status-progress/10 text-status-progress border-status-progress/20',
  completed: 'bg-status-done/10 text-status-done border-status-done/20',
  paused: 'bg-status-backlog/10 text-status-backlog border-status-backlog/20',
}

const statusLabels = {
  active: 'Actif',
  completed: 'Terminé',
  paused: 'En pause',
}

interface GitRepository {
  id: string | number
  name: string
  fullName: string
  description: string
  url: string
}

function Component() {
  const { projects: initialProjects } = Route.useLoaderData()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active' as 'active' | 'completed' | 'paused',
    progress: 0,
    members: 0,
    issuesCount: 0,
    dueDate: '',
  })

  // Provider states
  const [selectedProvider, setSelectedProvider] = useState<'github' | 'gitlab'>(
    'github',
  )
  const [githubRepos, setGithubRepos] = useState<GitRepository[]>([])
  const [gitlabRepos, setGitlabRepos] = useState<GitRepository[]>([])
  const [selectedRepo, setSelectedRepo] = useState<string>('')
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)

  const github = useGitHub()
  const gitlab = useGitLab()

  // Synchroniser le state avec les données du loader après invalidation
  useEffect(() => {
    setProjects(initialProjects)
  }, [initialProjects])

  const loadGithubRepos = async () => {
    if (!github.isConnected || !github.token) {
      toast.error("Veuillez vous connecter à GitHub d'abord")
      return
    }

    setLoadingRepos(true)
    try {
      const repos = await github.getUserRepositories()
      setGithubRepos(
        repos.map((repo) => ({
          id: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description || '',
          url: repo.html_url,
        })),
      )
    } catch (error: any) {
      toast.error(
        `Erreur lors du chargement des repos GitHub: ${error.message}`,
      )
    } finally {
      setLoadingRepos(false)
    }
  }

  const loadGitlabRepos = async () => {
    if (!gitlab.isConnected || !gitlab.token) {
      toast.error("Veuillez vous connecter à GitLab d'abord")
      return
    }

    setLoadingRepos(true)
    try {
      const repos = await gitlab.getUserProjects()
      setGitlabRepos(
        repos.map((repo) => ({
          id: repo.id,
          name: repo.name,
          fullName: repo.path_with_namespace,
          description: repo.description || '',
          url: repo.web_url,
        })),
      )
    } catch (error: any) {
      toast.error(
        `Erreur lors du chargement des projets GitLab: ${error.message}`,
      )
    } finally {
      setLoadingRepos(false)
    }
  }

  useEffect(() => {
    if (
      selectedProvider === 'github' &&
      githubRepos.length === 0 &&
      github.isConnected
    ) {
      loadGithubRepos()
    } else if (
      selectedProvider === 'gitlab' &&
      gitlabRepos.length === 0 &&
      gitlab.isConnected
    ) {
      loadGitlabRepos()
    }
  }, [selectedProvider])

  const handleCreate = async () => {
    // if (selectedProvider === "manual") {
    //   if (!formData.name.trim()) {
    //     toast.error("Le nom du projet est requis");
    //     return;
    //   }

    //   try {
    //     const newProject = await createProject({
    //       id: `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
    //       name: formData.name,
    //       description: formData.description || null,
    //       status: formData.status,
    //       progress: formData.progress,
    //       members: formData.members,
    //       issuesCount: formData.issuesCount,
    //       dueDate: formData.dueDate || null,
    //       createdAt: new Date().toISOString(),
    //       updatedAt: new Date().toISOString(),
    //     });

    //     setProjects([...projects, newProject]);
    //     setFormData({
    //       name: "",
    //       description: "",
    //       status: "active",
    //       progress: 0,
    //       members: 0,
    //       issuesCount: 0,
    //       dueDate: "",
    //     });
    //     setIsCreateOpen(false);
    //     toast.success("Projet créé avec succès");
    //     router.invalidate();
    //   } catch (error) {
    //     toast.error("Erreur lors de la création du projet");
    //   }
    //     // Créer depuis provider
    if (!selectedRepo) {
      toast.error('Veuillez sélectionner un repository')
      return
    }

    if (selectedProvider !== 'github' && selectedProvider !== 'gitlab') {
      toast.error('Provider invalide')
      return
    }

    try {
      const repo =
        selectedProvider === 'github'
          ? githubRepos.find((r) => r.fullName === selectedRepo)
          : gitlabRepos.find((r) => r.fullName === selectedRepo)

      if (!repo) {
        toast.error('Repository introuvable')
        return
      }

      if (!repo.fullName || !repo.name) {
        toast.error('Données du repository invalides')
        return
      }

      const providerData = {
        provider: selectedProvider,
        providerId: repo.fullName,
        name: repo.name,
        description:
          repo.description ||
          `Projet ${selectedProvider === 'github' ? 'GitHub' : 'GitLab'}: ${repo.fullName}`,
      }

      console.log('Calling findOrCreateProjectByProvider with:', providerData)

      const project = await findOrCreateProjectByProvider({
        data: providerData,
      })

      setProjects([...projects, project])
      setSelectedProvider('github')
      setSelectedRepo('')
      setIsCreateOpen(false)
      toast.success(
        `Projet créé depuis ${selectedProvider === 'github' ? 'GitHub' : 'GitLab'}`,
      )
      router.invalidate()
    } catch (error: any) {
      toast.error(`Erreur lors de la création du projet: ${error.message}`)
    }
  }

  const handleUpdate = async () => {
    if (!editingProject || !formData.name.trim()) {
      toast.error('Le nom du projet est requis')
      return
    }

    try {
      const updated = await updateProject({
        id: editingProject.id,
        updates: {
          name: formData.name,
          description: formData.description || null,
          status: formData.status,
          progress: formData.progress,
          members: formData.members,
          issuesCount: formData.issuesCount,
          dueDate: formData.dueDate || null,
        },
      })

      setProjects(
        projects.map((p) => (p.id === editingProject.id ? updated : p)),
      )
      setEditingProject(null)
      setFormData({
        name: '',
        description: '',
        status: 'active',
        progress: 0,
        members: 0,
        issuesCount: 0,
        dueDate: '',
      })
      toast.success('Projet mis à jour')
      router.invalidate()
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du projet')
    }
  }

  const executeDelete = async (id: string) => {
    try {
      await deleteProject({ data: id })
      setProjects(projects.filter((p) => p.id !== id))
      toast.success('Projet supprimé')
      setProjectToDelete(null)
      router.invalidate()
    } catch (error) {
      toast.error('Erreur lors de la suppression du projet')
    }
  }

  const openEditDialog = (project: Project) => {
    setEditingProject(project)
    setFormData({
      name: project.name,
      description: project.description || '',
      status: project.status,
      progress: project.progress || 0,
      members: project.members || 0,
      issuesCount: project.issuesCount || 0,
      dueDate: project.dueDate || '',
    })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez vos projets et suivez leur avancement
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau projet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un nouveau projet</DialogTitle>
              <DialogDescription>
                Importez un projet depuis GitHub ou GitLab
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Tabs
                value={selectedProvider}
                onValueChange={(v) => {
                  if (v === 'github' || v === 'gitlab') {
                    setSelectedProvider(v)
                  }
                }}
              >
                <TabsList className="grid w-full grid-cols-2">
                  {/* <TabsTrigger value="manual">Manuel</TabsTrigger> */}
                  <TabsTrigger value="github" disabled={!github.isConnected}>
                    <Github className="h-4 w-4 mr-2" />
                    GitHub
                  </TabsTrigger>
                  <TabsTrigger value="gitlab" disabled={!gitlab.isConnected}>
                    <Gitlab className="h-4 w-4 mr-2" />
                    GitLab
                  </TabsTrigger>
                </TabsList>

                {/* <TabsContent value="manual" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Mon projet"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Description du projet..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Statut</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: "active" | "completed" | "paused") =>
                          setFormData({ ...formData, status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Actif</SelectItem>
                          <SelectItem value="completed">Terminé</SelectItem>
                          <SelectItem value="paused">En pause</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="progress">Progression (%)</Label>
                      <Input
                        id="progress"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.progress}
                        onChange={(e) =>
                          setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="members">Membres</Label>
                      <Input
                        id="members"
                        type="number"
                        min="0"
                        value={formData.members}
                        onChange={(e) =>
                          setFormData({ ...formData, members: parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Date d'échéance</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      />
                    </div>
                  </div>
                </TabsContent> */}

                <TabsContent value="github" className="space-y-4 mt-4">
                  {!github.isConnected ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Github className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Veuillez vous connecter à GitHub d'abord</p>
                      <Button variant="outline" className="mt-4" asChild>
                        <Link to="/provider/github">Configurer GitHub</Link>
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <Label>Repository GitHub</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={loadGithubRepos}
                          disabled={loadingRepos}
                        >
                          {loadingRepos ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : null}
                          Actualiser
                        </Button>
                      </div>
                      <Select
                        value={selectedRepo}
                        onValueChange={setSelectedRepo}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un repository" />
                        </SelectTrigger>
                        <SelectContent>
                          {githubRepos.map((repo) => (
                            <SelectItem key={repo.id} value={repo.fullName}>
                              <div className="flex flex-col">
                                <span className="font-medium">{repo.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {repo.fullName}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedRepo && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium">
                            {
                              githubRepos.find(
                                (r) => r.fullName === selectedRepo,
                              )?.name
                            }
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {githubRepos.find(
                              (r) => r.fullName === selectedRepo,
                            )?.description || 'Aucune description'}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="gitlab" className="space-y-4 mt-4">
                  {!gitlab.isConnected ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Gitlab className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Veuillez vous connecter à GitLab d'abord</p>
                      <Button variant="outline" className="mt-4" asChild>
                        <Link to="/provider/gitlab">Configurer GitLab</Link>
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <Label>Projet GitLab</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={loadGitlabRepos}
                          disabled={loadingRepos}
                        >
                          {loadingRepos ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : null}
                          Actualiser
                        </Button>
                      </div>
                      <Select
                        value={selectedRepo}
                        onValueChange={setSelectedRepo}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un projet" />
                        </SelectTrigger>
                        <SelectContent>
                          {gitlabRepos.map((repo) => (
                            <SelectItem key={repo.id} value={repo.fullName}>
                              <div className="flex flex-col">
                                <span className="font-medium">{repo.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {repo.fullName}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedRepo && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium">
                            {
                              gitlabRepos.find(
                                (r) => r.fullName === selectedRepo,
                              )?.name
                            }
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {gitlabRepos.find(
                              (r) => r.fullName === selectedRepo,
                            )?.description || 'Aucune description'}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreate} disabled={loadingRepos}>
                Créer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!editingProject}
          onOpenChange={(open) => !open && setEditingProject(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier le projet</DialogTitle>
              <DialogDescription>
                Modifiez les informations du projet
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nom *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'active' | 'completed' | 'paused') =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="completed">Terminé</SelectItem>
                      <SelectItem value="paused">En pause</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-progress">Progression (%)</Label>
                  <Input
                    id="edit-progress"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progress}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        progress: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-members">Membres</Label>
                  <Input
                    id="edit-members"
                    type="number"
                    min="0"
                    value={formData.members}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        members: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-dueDate">Date d'échéance</Label>
                  <Input
                    id="edit-dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingProject(null)}>
                Annuler
              </Button>
              <Button onClick={handleUpdate}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-custom">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun projet</h3>
            <p className="text-muted-foreground mb-4">
              Commencez par créer votre premier projet
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un projet
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <Link
                      to={`/projects/${project.slug || project.id}`}
                      className="flex items-center gap-3 flex-1"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FolderKanban className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base hover:text-primary transition-colors">
                          {project.name}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className={statusColors[project.status]}
                        >
                          {statusLabels[project.status]}
                        </Badge>
                      </div>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/projects/${project.slug || project.id}`}>
                            Voir le projet
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openEditDialog(project)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setProjectToDelete(project)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {project.description && (
                    <CardDescription className="mt-2">
                      {project.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">
                          Progression
                        </span>
                        <span className="font-medium">
                          {project.progress || 0}%
                        </span>
                      </div>
                      <Progress value={project.progress || 0} className="h-2" />
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {project.members || 0}
                        </span>
                        <span>{project.issuesCount || 0} issues</span>
                      </div>
                      {project.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(project.dueDate).toLocaleDateString(
                            'fr-FR',
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        open={!!projectToDelete}
        onOpenChange={(open) => !open && setProjectToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Cela supprimera définitivement le
              projet "{projectToDelete?.name}" et toutes les données associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                projectToDelete && executeDelete(projectToDelete.id)
              }
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
