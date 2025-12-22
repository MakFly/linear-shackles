import { createFileRoute, Link, useParams, useRouter } from '@tanstack/react-router'
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
import { getProjectById, updateProject, deleteProject } from '@/server/db'
import { Github, Gitlab, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/projects/$projectId/settings/')({
  component: ProjectSettings,
  loader: async ({ params }) => {
    const project = await getProjectById({ data: params.projectId })
    return { project }
  },
})

function ProjectSettings() {
  const { projectId } = useParams({ from: '/projects/$projectId/settings' })
  const { project } = Route.useLoaderData()
  const router = useRouter()

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

  // Détecter le provider depuis la description du projet
  const provider = useMemo(() => {
    if (!project?.description) return null
    if (project.description.includes('provider:github:')) return 'github'
    if (project.description.includes('provider:gitlab:')) return 'gitlab'
    return null
  }, [project?.description])

  // Extraire l'identifiant du provider
  const providerInfo = useMemo(() => {
    if (!project?.description || !provider) return null
    const match = project.description.match(
      /provider:(github|gitlab):([^\s\n]+)/,
    )
    return match ? match[2] : null
  }, [project?.description, provider])

  // Préserver le provider dans la description lors de la mise à jour
  const preserveProviderInDescription = (newDescription: string) => {
    if (!provider || !providerInfo) return newDescription
    const providerPrefix = `provider:${provider}:${providerInfo}`
    // Si la nouvelle description ne contient pas déjà le provider, l'ajouter
    if (!newDescription.includes(providerPrefix)) {
      return newDescription ? `${newDescription}\n\n${providerPrefix}` : providerPrefix
    }
    return newDescription
  }

  const handleSaveGeneral = async () => {
    if (!generalForm.name.trim()) {
      toast.error('Le nom du projet est requis')
      return
    }

    const saveOperation = async () => {
      setSavingGeneral(true)
      const descriptionWithProvider = preserveProviderInDescription(generalForm.description)
      const updated = await updateProject({
        id: projectId,
        updates: {
          name: generalForm.name,
          description: descriptionWithProvider,
          status: generalForm.status as 'active' | 'completed' | 'paused',
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
        id: projectId,
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

  const executeDeleteProject = async () => {
    setDeleting(true)
    try {
      await deleteProject({ data: projectId })
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
    <div className="flex-1 overflow-auto scrollbar-custom">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Paramètres - {projectId}</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les paramètres et la configuration de ce projet
          </p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList>
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
                <CardTitle>Membres de l'équipe</CardTitle>
                <CardDescription>
                  Gérez les membres ayant accès à ce projet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Fonctionnalité à venir
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Intégrations</CardTitle>
                <CardDescription>
                  Connectez des services externes à ce projet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {provider !== 'gitlab' && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Github className="h-5 w-5 text-muted-foreground" />
                        <div className="space-y-0.5 flex-1">
                          <div className="flex items-center gap-2">
                            <Label>GitHub</Label>
                            {provider === 'github' && (
                              <Badge variant="secondary" className="gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Configuré
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {provider === 'github' && providerInfo
                              ? `Synchronisé avec ${providerInfo}`
                              : 'Synchroniser les issues et PRs depuis GitHub'}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/provider/github">
                          {provider === 'github' ? 'Modifier' : 'Configurer'}
                        </Link>
                      </Button>
                    </div>
                    {provider !== 'github' && <Separator />}
                  </>
                )}
                {provider !== 'github' && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Gitlab className="h-5 w-5 text-muted-foreground" />
                        <div className="space-y-0.5 flex-1">
                          <div className="flex items-center gap-2">
                            <Label>GitLab</Label>
                            {provider === 'gitlab' && (
                              <Badge variant="secondary" className="gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Configuré
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {provider === 'gitlab' && providerInfo
                              ? `Synchronisé avec ${providerInfo}`
                              : 'Synchroniser les issues et MRs depuis GitLab'}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/provider/gitlab">
                          {provider === 'gitlab' ? 'Modifier' : 'Configurer'}
                        </Link>
                      </Button>
                    </div>
                    {provider !== 'gitlab' && <Separator />}
                  </>
                )}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 flex-1">
                    <Label>Slack</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir les notifications sur Slack
                    </p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Bientôt disponible
                  </Button>
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
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer ce projet ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les données associées à ce projet seront définitivement supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={executeDeleteProject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
