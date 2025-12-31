import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useMemo, useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
import { getProjectByIdOrSlug, updateProject, deleteProject, getProjectMembers } from '@/server/db'
import {
  Github,
  Gitlab,
  CheckCircle2,
  Loader2,
  ExternalLink,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { MembersList } from '@/components/members/MembersList'
import { AddMemberDialog } from '@/components/members/AddMemberDialog'

export const Route = createFileRoute('/projects/$slugOrId/settings/')({
  component: ProjectSettings,
  loader: async ({ params }) => {
    const project = await getProjectByIdOrSlug({ data: params.slugOrId })
    const members = await getProjectMembers({ data: params.slugOrId })
    return { project, members }
  },
})

function ProjectSettings() {
  const { slugOrId } = Route.useParams()
  const { project, members } = Route.useLoaderData()
  const router = useRouter()

  // Mock current user - à remplacer par vrai système d'auth
  const currentUserId = 'user-1' // TODO: Récupérer depuis auth context
  const currentUserRole = members?.find((m) => m.userId === currentUserId)?.role

  // États pour les formulaires
  const [generalForm, setGeneralForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'active',
  })

  const [datesForm, setDatesForm] = useState({
    dueDate: project?.dueDate || '',
  })

  const [advancedSettings, setAdvancedSettings] = useState({
    autoArchive: false,
    emailNotifications: true,
    privateMode: false,
  })

  const [savingGeneral, setSavingGeneral] = useState(false)
  const [savingDates, setSavingDates] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [disconnectingProvider, setDisconnectingProvider] = useState(false)

  // Synchroniser les formulaires avec le projet
  useEffect(() => {
    if (project) {
      setGeneralForm({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'active',
      })
      setDatesForm({
        dueDate: project.dueDate || '',
      })
    }
  }, [project])

  // Provider depuis les colonnes dédiées
  const provider = project?.provider as 'github' | 'gitlab' | null
  const providerProjectId = project?.providerProjectId || null
  const providerUrl = project?.providerUrl || null

  const isGitHubConnected = provider === 'github' && !!providerProjectId
  const isGitLabConnected = provider === 'gitlab' && !!providerProjectId

  const handleSaveGeneral = async () => {
    if (!generalForm.name.trim()) {
      toast.error('Le nom du projet est requis')
      return
    }

    const saveOperation = async () => {
      setSavingGeneral(true)
      const updated = await updateProject({
        id: slugOrId,
        updates: {
          name: generalForm.name,
          description: generalForm.description || null,
          status: generalForm.status,
        },
      })
      router.invalidate()
      return updated
    }

    toast.promise(saveOperation(), {
      loading: 'Enregistrement des informations...',
      success: () => {
        setSavingGeneral(false)
        return 'Informations du projet mises à jour'
      },
      error: (err) => {
        setSavingGeneral(false)
        return `Erreur: ${err.message || 'Erreur lors de la mise à jour'}`
      },
    })
  }

  const handleSaveDates = async () => {
    const saveOperation = async () => {
      setSavingDates(true)
      const updated = await updateProject({
        id: slugOrId,
        updates: {
          dueDate: datesForm.dueDate || null,
        },
      })
      router.invalidate()
      return updated
    }

    toast.promise(saveOperation(), {
      loading: 'Enregistrement des dates...',
      success: () => {
        setSavingDates(false)
        return 'Dates mises à jour'
      },
      error: (err) => {
        setSavingDates(false)
        return `Erreur: ${err.message || 'Erreur lors de la mise à jour'}`
      },
    })
  }

  const handleDisconnectProvider = async () => {
    setDisconnectingProvider(true)
    try {
      await updateProject({
        id: slugOrId,
        updates: {
          provider: null,
          providerProjectId: null,
          providerUrl: null,
        },
      })
      router.invalidate()
      toast.success('Intégration déconnectée')
    } catch (error) {
      toast.error('Erreur lors de la déconnexion')
    } finally {
      setDisconnectingProvider(false)
    }
  }

  const executeDeleteProject = async () => {
    setDeleting(true)
    try {
      await deleteProject({ data: slugOrId })
      toast.success('Projet supprimé')
      router.navigate({ to: '/projects' })
    } catch (error) {
      toast.error('Erreur lors de la suppression')
      setDeleting(false)
    } finally {
      setShowDeleteDialog(false)
    }
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Paramètres</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les paramètres et la configuration de ce projet
          </p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="members">Membres</TabsTrigger>
            <TabsTrigger value="integrations">Intégrations</TabsTrigger>
            <TabsTrigger value="advanced">Avancé</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informations du projet</CardTitle>
                <CardDescription>
                  Modifiez les informations de base du projet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Nom du projet</Label>
                  <Input
                    id="project-name"
                    value={generalForm.name}
                    onChange={(e) =>
                      setGeneralForm({ ...generalForm, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-description">Description</Label>
                  <Textarea
                    id="project-description"
                    placeholder="Description du projet"
                    rows={4}
                    value={generalForm.description}
                    onChange={(e) =>
                      setGeneralForm({
                        ...generalForm,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-status">Statut</Label>
                  <Select
                    value={generalForm.status}
                    onValueChange={(value: 'active' | 'completed' | 'paused') =>
                      setGeneralForm({ ...generalForm, status: value })
                    }
                  >
                    <SelectTrigger id="project-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="completed">Terminé</SelectItem>
                      <SelectItem value="paused">En pause</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSaveGeneral} disabled={savingGeneral}>
                  {savingGeneral && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Enregistrer les modifications
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dates importantes</CardTitle>
                <CardDescription>
                  Définissez les dates clés du projet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="due-date">Date limite</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={datesForm.dueDate}
                    onChange={(e) =>
                      setDatesForm({ ...datesForm, dueDate: e.target.value })
                    }
                  />
                </div>
                <Button onClick={handleSaveDates} disabled={savingDates}>
                  {savingDates && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Enregistrer
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Membres de l'équipe</CardTitle>
                    <CardDescription>
                      Gérez les membres ayant accès à ce projet
                    </CardDescription>
                  </div>
                  <AddMemberDialog
                    projectId={slugOrId}
                    projectMembers={members}
                    onMemberAdded={() => router.invalidate()}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <MembersList
                  projectId={slugOrId}
                  members={members || []}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                  onUpdated={() => router.invalidate()}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            {/* GitHub Integration */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-gray-800 to-black flex items-center justify-center shrink-0">
                      <Github className="h-5 w-5 text-white" />
                    </div>
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center gap-2">
                        <Label className="font-semibold">GitHub</Label>
                        {isGitHubConnected && (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Connecté
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {isGitHubConnected
                          ? `Connecté à ${providerProjectId}`
                          : 'Connectez un repository GitHub pour synchroniser les issues et PRs'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isGitHubConnected && providerUrl && (
                      <Button variant="ghost" size="icon" asChild>
                        <a
                          href={providerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Voir sur GitHub"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {isGitHubConnected ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDisconnectProvider}
                        disabled={disconnectingProvider}
                      >
                        {disconnectingProvider ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-1" />
                            Déconnecter
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/provider/github">Connecter</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* GitLab Integration */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shrink-0">
                      <Gitlab className="h-5 w-5 text-white" />
                    </div>
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center gap-2">
                        <Label className="font-semibold">GitLab</Label>
                        {isGitLabConnected && (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Connecté
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {isGitLabConnected
                          ? `Connecté à ${providerProjectId}`
                          : 'Connectez un projet GitLab pour synchroniser les issues et MRs'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isGitLabConnected && providerUrl && (
                      <Button variant="ghost" size="icon" asChild>
                        <a
                          href={providerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Voir sur GitLab"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {isGitLabConnected ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDisconnectProvider}
                        disabled={disconnectingProvider}
                      >
                        {disconnectingProvider ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-1" />
                            Déconnecter
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/provider/gitlab">Connecter</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Coming Soon Integrations */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">S</span>
                    </div>
                    <div className="space-y-0.5">
                      <Label>Slack</Label>
                      <p className="text-sm text-muted-foreground">
                        Recevoir les notifications sur Slack
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">Bientôt</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Options avancées</CardTitle>
                <CardDescription>
                  Paramètres avancés et options de configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Archivage automatique</Label>
                    <p className="text-sm text-muted-foreground">
                      Archiver automatiquement les issues résolues après 30
                      jours
                    </p>
                  </div>
                  <Switch
                    checked={advancedSettings.autoArchive}
                    onCheckedChange={(checked) =>
                      setAdvancedSettings({
                        ...advancedSettings,
                        autoArchive: checked,
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifications par email</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir des notifications par email pour ce projet
                    </p>
                  </div>
                  <Switch
                    checked={advancedSettings.emailNotifications}
                    onCheckedChange={(checked) =>
                      setAdvancedSettings({
                        ...advancedSettings,
                        emailNotifications: checked,
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mode privé</Label>
                    <p className="text-sm text-muted-foreground">
                      Rendre ce projet privé (visible uniquement par les
                      membres)
                    </p>
                  </div>
                  <Switch
                    checked={advancedSettings.privateMode}
                    onCheckedChange={(checked) =>
                      setAdvancedSettings({
                        ...advancedSettings,
                        privateMode: checked,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">
                  Zone de danger
                </CardTitle>
                <CardDescription>
                  Actions irréversibles sur ce projet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Supprimer le projet</Label>
                  <p className="text-sm text-muted-foreground">
                    Cette action est irréversible. Toutes les données seront
                    supprimées.
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={deleting}
                  >
                    {deleting && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Supprimer le projet
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Êtes-vous sûr de vouloir supprimer ce projet ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les données associées à ce
              projet seront définitivement supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDeleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
