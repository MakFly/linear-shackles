import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo, useEffect } from 'react'
import {
  List,
  Columns,
  Calendar,
  Table2,
  Plus,
  Loader2,
  CircleDot,
  Trash2,
  Download,
  Github,
  Gitlab,
  Cloud,
} from 'lucide-react'
import { DraggableIssueRow } from '@/features/issues/components/DraggableIssueRow'
import { CommandPalette } from '@/components/CommandPalette'
import { IssuesTableV2 } from '@/features/issues/components/IssuesTableV2'
import { IssueDetailModal } from '@/features/issues/components/IssueDetailModal'
import { KeyboardShortcutsDialog } from '@/components/KeyboardShortcutsDialog'
import { KanbanBoard } from '@/features/issues/components/KanbanBoard'
import { FilterPanel } from '@/features/issues/components/FilterPanel'
import { TemplateManager } from '@/features/issues/components/TemplateManager'
import { AutomationManager } from '@/features/issues/components/AutomationManager'
import { SprintManager } from '@/features/sprints/components/SprintManager'
import { ImportIssuesModal } from '@/features/issues/components/ImportIssuesModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import type {
  Issue,
  IssueTemplate,
  FilterConfig,
  IssueStatus,
  Automation,
  Sprint,
} from '@/types/issue'
import {
  getProjectByIdOrSlug,
  getIssues,
  createIssue as createIssueInDb,
  updateIssue as updateIssueInDb,
  deleteIssue as deleteIssueInDb,
  updateIssuePositions,
  createUpdate,
} from '@/server/db'
import { useGitHubProvider } from '@/hooks/useGitHubProvider'
import { useGitLabProvider } from '@/hooks/useGitLabProvider'
import type { Project } from '@/db/schema'
import type { GitHubIssue } from '@/types/github'
import type { GitLabIssue } from '@/types/gitlab'
import type {
  DragEndEvent,
  DragStartEvent} from '@dnd-kit/core';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { toast } from 'sonner'

export const Route = createFileRoute('/projects/$slugOrId/issues/')({
  component: ProjectIssues,
  loader: async ({ params }) => {
    const [project, dbIssues] = await Promise.all([
      getProjectByIdOrSlug({ data: params.slugOrId }),
      getIssues(),
    ])
    // Filtrer les issues pour ce projet (utilise l'ID du projet, pas le slug)
    const projectIssues = project
      ? dbIssues.filter((issue) => issue.projectId === project.id)
      : []
    return { project, dbIssues: projectIssues }
  },
})

// Helper pour détecter le provider depuis les colonnes du projet
function detectProvider(project: Project | null): {
  provider: 'github' | 'gitlab' | null
  providerId: string | null
} {
  if (!project) return { provider: null, providerId: null }

  // Use the provider columns from the project directly
  if (project.provider && project.providerProjectId) {
    return { provider: project.provider, providerId: project.providerProjectId }
  }

  return { provider: null, providerId: null }
}

// Type étendu pour inclure providerIssueId
interface IssueWithProvider extends Issue {
  providerIssueId?: string | null
}

// Convertir une issue de la BDD vers le type Issue du frontend
function dbIssueToFrontend(dbIssue: any): IssueWithProvider {
  return {
    id: dbIssue.id,
    title: dbIssue.title,
    description: dbIssue.description || '',
    status: (dbIssue.status || 'backlog') as IssueStatus,
    priority: dbIssue.priority || 'medium',
    date: dbIssue.createdAt,
    labels: dbIssue.labels || [],
    assignees: dbIssue.assignees || [],
    providerIssueId: dbIssue.providerIssueId,
    createdAt: dbIssue.createdAt,
    updatedAt: dbIssue.updatedAt,
  }
}

function ProjectIssues() {
  const { slugOrId } = Route.useParams()
  const { project, dbIssues } = Route.useLoaderData()

  // Early return if project not found
  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Projet non trouvé</p>
      </div>
    )
  }

  // Hooks pour les providers - utilisent l'ID du projet (pas le slug)
  const github = useGitHubProvider(project.id)
  const gitlab = useGitLabProvider(project.id)

  // Détecter le provider (depuis les credentials d'abord, puis les colonnes du projet)
  const { provider, providerId } = useMemo(() => {
    // Priorité aux credentials (pour les projets créés avant les colonnes provider)
    if (github.isConnected && github.repo) {
      return { provider: 'github' as const, providerId: github.repo }
    }
    if (gitlab.isConnected && gitlab.projectId) {
      return { provider: 'gitlab' as const, providerId: gitlab.projectId }
    }

    // Fallback aux colonnes du projet
    return detectProvider(project)
  }, [project, github.isConnected, github.repo, gitlab.isConnected, gitlab.projectId])

  // Convertir les issues de la BDD
  const initialIssues = useMemo(
    () => dbIssues.map(dbIssueToFrontend),
    [dbIssues],
  )

  // IDs des issues déjà importées
  const existingProviderIds = useMemo(() => {
    return new Set<string>(
      (dbIssues as { providerIssueId?: string | null }[])
        .filter((i) => i.providerIssueId)
        .map((i) => i.providerIssueId!),
    )
  }, [dbIssues])

  const [issues, setIssues] = useState<IssueWithProvider[]>(initialIssues)

  // Mettre à jour quand les données du loader changent
  useEffect(() => {
    setIssues(dbIssues.map(dbIssueToFrontend))
  }, [dbIssues])

  // État pour le dialog de création
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newIssueTitle, setNewIssueTitle] = useState('')
  const [newIssueBody, setNewIssueBody] = useState('')
  const [newIssueLabels, setNewIssueLabels] = useState('')
  const [creating, setCreating] = useState(false)

  // État pour le dialog de suppression
  const [issueToDelete, setIssueToDelete] = useState<IssueWithProvider | null>(
    null,
  )
  const [deleting, setDeleting] = useState(false)

  // État pour l'import d'issues
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [remoteIssues, setRemoteIssues] = useState<
    (GitHubIssue | GitLabIssue)[]
  >([])
  const [loadingRemoteIssues, setLoadingRemoteIssues] = useState(false)

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailIssue, setDetailIssue] = useState<Issue | null>(null)
  const [viewMode, setViewMode] = useState<
    'list' | 'board' | 'sprint' | 'table'
  >('list')
  const [templates, setTemplates] = useState<IssueTemplate[]>([])
  const [automations, setAutomations] = useState<Automation[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [currentFilter, setCurrentFilter] = useState<FilterConfig>({
    id: 'default',
    name: 'Tous les issues',
  })
  const [savedViews, setSavedViews] = useState<FilterConfig[]>([
    { id: 'default', name: 'Tous les issues' },
  ])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Connecter au provider si nécessaire
  // Note: The useGitHubProvider/useGitLabProvider hooks auto-load credentials from DB
  // No need to manually connect - the hooks will set isConnected=true when credentials are found
  useEffect(() => {
    // Just log the connection status for debugging
    if (provider && providerId) {
      console.log('Provider detected:', { provider, providerId, githubConnected: github.isConnected, gitlabConnected: gitlab.isConnected })
    }
  }, [provider, providerId, github.isConnected, gitlab.isConnected])

  // Fonction pour créer une issue (BDD d'abord, puis optionnellement Provider)
  const handleCreateIssue = async (pushToProvider: boolean = false) => {
    if (!newIssueTitle.trim()) {
      toast.error('Le titre est requis')
      return
    }

    setCreating(true)

    const createOperation = async () => {
      const labels = newIssueLabels
        .split(',')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)

      // 1. Créer en BDD d'abord
      const issueId = `${project.id}-${Date.now()}`
      const dbIssue = await createIssueInDb({
        data: {
          id: issueId,
          projectId: project.id,
          title: newIssueTitle,
          description: newIssueBody || null,
          status: 'backlog',
          priority: 'medium',
          labels: labels.length > 0 ? labels : null,
          providerIssueId: null,
        },
      })

      let providerIssueNumber: number | undefined

      // 2. Push vers le provider SI demandé ET connecté
      if (pushToProvider && provider && providerId) {
        if (provider === 'github' && github.isConnected) {
          try {
            console.log('Creating GitHub issue with:', { repo: providerId, title: newIssueTitle })
            const githubIssue = await github.createIssue(
              providerId,
              newIssueTitle,
              newIssueBody || undefined,
              labels.length > 0 ? labels : undefined,
            )
            console.log('GitHub issue created:', githubIssue)
            providerIssueNumber = githubIssue.number
            await updateIssueInDb({
              data: {
                id: issueId,
                updates: { providerIssueId: String(providerIssueNumber) },
              },
            })
          } catch (err) {
            console.error('Erreur sync GitHub:', err)
            throw new Error(`Échec de la création sur GitHub: ${err instanceof Error ? err.message : 'Erreur inconnue'}`)
          }
        } else if (provider === 'gitlab' && gitlab.isConnected) {
          try {
            console.log('Creating GitLab issue with:', { projectId: providerId, title: newIssueTitle })
            const gitlabIssue = await gitlab.createIssue(
              providerId,
              newIssueTitle,
              newIssueBody || undefined,
              labels.length > 0 ? labels : undefined,
            )
            providerIssueNumber = gitlabIssue.iid
            await updateIssueInDb({
              data: {
                id: issueId,
                updates: { providerIssueId: String(providerIssueNumber) },
              },
            })
          } catch (err) {
            console.error('Erreur sync GitLab:', err)
            throw new Error(`Échec de la création sur GitLab: ${err instanceof Error ? err.message : 'Erreur inconnue'}`)
          }
        }
      }

      // 3. Créer l'activité 'issue_created'
      await createUpdate({
        data: {
          id: `update-${Date.now()}`,
          type: 'issue_created',
          author: 'Utilisateur',
          content: 'a créé cette issue',
          timestamp: new Date().toISOString(),
          metadata: {
            issueId: issueId,
            issueTitle: newIssueTitle,
            priority: 'medium',
            providerIssueNumber: providerIssueNumber,
            provider: providerIssueNumber ? provider : null,
          },
        },
      })

      // 4. Ajouter à l'état local
      const createdIssue = dbIssue as {
        id: string
        title: string
        description?: string | null
        createdAt: string
        updatedAt: string
      }
      const now = new Date().toISOString()
      const newIssue: IssueWithProvider = {
        id: createdIssue.id,
        title: createdIssue.title,
        description: createdIssue.description || '',
        status: 'backlog',
        priority: 'medium',
        date: createdIssue.createdAt,
        labels: labels,
        assignees: [],
        providerIssueId: providerIssueNumber
          ? String(providerIssueNumber)
          : null,
        createdAt: createdIssue.createdAt || now,
        updatedAt: createdIssue.updatedAt || now,
      }
      setIssues((prev) => [...prev, newIssue])

      // Reset form
      setNewIssueTitle('')
      setNewIssueBody('')
      setNewIssueLabels('')
      setShowCreateDialog(false)

      return { title: newIssueTitle, providerIssueNumber, pushedToProvider: pushToProvider }
    }

    toast.promise(createOperation(), {
      loading: pushToProvider ? 'Création et publication...' : 'Création locale...',
      success: (data) => {
        setCreating(false)
        if (data.providerIssueNumber) {
          return `Issue "${data.title}" créée (#${data.providerIssueNumber} sur ${provider === 'github' ? 'GitHub' : 'GitLab'})`
        }
        return `Issue "${data.title}" créée localement`
      },
      error: (err) => {
        setCreating(false)
        return `Erreur: ${err.message}`
      },
    })
  }

  // Ouvre le dialog de confirmation de suppression
  const handleDeleteIssue = (issue: IssueWithProvider) => {
    setIssueToDelete(issue)
  }

  // Synchroniser une issue vers le provider (GitHub/GitLab)
  const syncToProvider = async (issue: IssueWithProvider) => {
    if (!provider || !providerId) {
      toast.error('Aucun provider configuré pour ce projet')
      return
    }

    const syncOperation = async () => {
      let providerIssueNumber: number | undefined

      if (provider === 'github' && github.isConnected) {
        try {
          console.log('Syncing to GitHub:', { repo: providerId, title: issue.title })
          const githubIssue = await github.createIssue(
            providerId,
            issue.title,
            issue.description,
            issue.labels,
          )
          providerIssueNumber = githubIssue.number
          console.log('GitHub issue created:', githubIssue)

          // Update local issue with provider ID
          await updateIssueInDb({
            data: {
              id: issue.id,
              updates: { providerIssueId: String(providerIssueNumber) },
            },
          })

          // Update local state
          setIssues((prev) =>
            prev.map((i) =>
              i.id === issue.id
                ? { ...i, providerIssueId: String(providerIssueNumber) }
                : i,
            ),
          )

          return { provider: 'GitHub', number: providerIssueNumber }
        } catch (err) {
          console.error('Erreur sync GitHub:', err)
          throw err
        }
      } else if (provider === 'gitlab' && gitlab.isConnected) {
        try {
          console.log('Syncing to GitLab:', { projectId: providerId, title: issue.title })
          const gitlabIssue = await gitlab.createIssue(
            providerId,
            issue.title,
            issue.description,
            issue.labels,
          )
          providerIssueNumber = gitlabIssue.iid
          console.log('GitLab issue created:', gitlabIssue)

          // Update local issue with provider ID
          await updateIssueInDb({
            data: {
              id: issue.id,
              updates: { providerIssueId: String(providerIssueNumber) },
            },
          })

          // Update local state
          setIssues((prev) =>
            prev.map((i) =>
              i.id === issue.id
                ? { ...i, providerIssueId: String(providerIssueNumber) }
                : i,
            ),
          )

          return { provider: 'GitLab', number: providerIssueNumber }
        } catch (err) {
          console.error('Erreur sync GitLab:', err)
          throw err
        }
      } else {
        throw new Error('Provider non connecté')
      }
    }

    toast.promise(syncOperation(), {
      loading: 'Synchronisation...',
      success: (result) =>
        `Issue synchronisée avec ${result.provider} (#${result.number})`,
      error: (err) => `Erreur lors de la synchronisation: ${err.message}`,
    })
  }

  // Confirme et exécute la suppression
  const confirmDeleteIssue = async () => {
    if (!issueToDelete) return

    setDeleting(true)
    const issue = issueToDelete

    const deleteOperation = async () => {
      // 1. Fermer sur le provider si connecté et si on a l'ID provider
      if (issue.providerIssueId && providerId) {
        const providerIssueNumber = parseInt(issue.providerIssueId)

        if (provider === 'github' && github.isConnected) {
          // Utiliser le providerId du projet pour fermer l'issue sur le bon repo
          await github.closeIssue(providerId, providerIssueNumber)
        }
        // Note: GitLab close n'est pas encore implémenté dans le nouveau hook
      }

      // 2. Supprimer de la BDD via server action
      await deleteIssueInDb({ data: issue.id })

      // 3. Mettre à jour l'état local
      setIssues((prev) => prev.filter((i) => i.id !== issue.id))

      // Fermer le modal si ouvert
      if (detailModalOpen && detailIssue?.id === issue.id) {
        setDetailModalOpen(false)
        setDetailIssue(null)
      }

      return issue
    }

    toast.promise(deleteOperation(), {
      loading: 'Suppression en cours...',
      success: (deletedIssue) => {
        setDeleting(false)
        setIssueToDelete(null)
        const providerMsg = deletedIssue.providerIssueId
          ? ` (fermée sur ${provider === 'github' ? 'GitHub' : 'GitLab'})`
          : ''
        return `Issue "${deletedIssue.title}" supprimée${providerMsg}`
      },
      error: (err) => {
        setDeleting(false)
        setIssueToDelete(null)
        return `Erreur: ${err.message}`
      },
    })
  }

  // Charge les issues du provider (sans cache)
  const loadRemoteIssues = async () => {
    if (!provider) return

    setLoadingRemoteIssues(true)
    setRemoteIssues([]) // Reset pour forcer le rechargement

    try {
      if (provider === 'github' && github.isConnected && providerId) {
        // github.getIssues(repo, state) - providerId est le repo (owner/repo)
        const issues = await github.getIssues(providerId, 'all')
        setRemoteIssues(issues)
      } else if (provider === 'gitlab' && gitlab.isConnected && providerId) {
        // gitlab.getIssues(projectId, state) - providerId est l'ID numérique du projet
        const issues = await gitlab.getIssues(Number(providerId), 'all')
        setRemoteIssues(issues)
      }
    } catch (err) {
      toast.error(`Erreur lors du chargement: ${(err as Error).message}`)
    } finally {
      setLoadingRemoteIssues(false)
    }
  }

  // Ouvre le dialog d'import et charge les issues du provider
  const handleOpenImport = () => {
    if (!provider) return
    setShowImportDialog(true)
    loadRemoteIssues() // Toujours recharger à l'ouverture
  }

  // Callback après import
  const handleImportComplete = () => {
    // Recharger la page pour rafraîchir les données
    window.location.reload()
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      // Calculer le nouvel ordre
      const oldIndex = issues.findIndex((item) => item.id === active.id)
      const newIndex = issues.findIndex((item) => item.id === over.id)
      const reorderedIssues = arrayMove(issues, oldIndex, newIndex)

      // Mettre à jour l'état local immédiatement
      setIssues(reorderedIssues)

      // Persister les nouvelles positions en BDD
      const positions = reorderedIssues.map((issue, index) => ({
        id: issue.id,
        position: index,
      }))

      try {
        await updateIssuePositions({ data: positions })
        toast.success('Issue réorganisée')
      } catch (err) {
        toast.error('Erreur lors de la sauvegarde')
        // Rollback en cas d'erreur
        setIssues(issues)
      }
    }
  }

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleIssueClick = (issue: Issue) => {
    setSelectedIssue(issue.id)
    setDetailIssue(issue)
    setDetailModalOpen(true)
  }

  const handleSelectIssue = (issueId: string) => {
    const issue = issues.find((i) => i.id === issueId)
    if (issue) {
      handleIssueClick(issue)
    }
  }

  const handleChangeStatus = (issueId: string, newStatus: string) => {
    setIssues((items) =>
      items.map((item) =>
        item.id === issueId
          ? { ...item, status: newStatus as IssueStatus }
          : item,
      ),
    )

    toast.success('Statut mis à jour', {
      description: `${issueId} → ${newStatus}`,
    })
  }

  const handleUpdateIssue = (updatedIssue: Issue) => {
    setIssues((items) =>
      items.map((item) => (item.id === updatedIssue.id ? updatedIssue : item)),
    )
    setDetailIssue(updatedIssue)
  }

  const handleCreateSprint = (
    sprint: Omit<Sprint, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    const newSprint: Sprint = {
      ...sprint,
      id: `SPRINT-${sprints.length + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setSprints([...sprints, newSprint])
  }

  const handleUpdateSprint = (id: string, updates: Partial<Sprint>) => {
    setSprints((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, ...updates, updatedAt: new Date().toISOString() }
          : item,
      ),
    )
  }

  const handleDeleteSprint = (id: string) => {
    setSprints((items) => items.filter((item) => item.id !== id))
  }

  const handleAddReview = (
    sprintId: string,
    review: Omit<Sprint['reviews'][0], 'id'>,
  ) => {
    setSprints((items) =>
      items.map((item) => {
        if (item.id === sprintId) {
          const newReview = {
            ...review,
            id: `REVIEW-${(item.reviews?.length || 0) + 1}`,
          }
          return {
            ...item,
            reviews: [...(item.reviews || []), newReview],
            updatedAt: new Date().toISOString(),
          }
        }
        return item
      }),
    )
  }

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (currentFilter.search) {
        const searchLower = currentFilter.search.toLowerCase()
        const matchesSearch =
          issue.title.toLowerCase().includes(searchLower) ||
          issue.id.toLowerCase().includes(searchLower) ||
          issue.description?.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      if (currentFilter.status && currentFilter.status.length > 0) {
        if (!currentFilter.status.includes(issue.status)) return false
      }

      if (currentFilter.priority && currentFilter.priority.length > 0) {
        if (!currentFilter.priority.includes(issue.priority)) return false
      }

      if (currentFilter.labels && currentFilter.labels.length > 0) {
        const hasMatchingLabel = currentFilter.labels.some((label) =>
          issue.labels?.includes(label),
        )
        if (!hasMatchingLabel) return false
      }

      if (currentFilter.assignees && currentFilter.assignees.length > 0) {
        const hasMatchingAssignee = currentFilter.assignees.some((assignee) =>
          issue.assignees?.includes(assignee),
        )
        if (!hasMatchingAssignee) return false
      }

      return true
    })
  }, [issues, currentFilter])

  return (
    <>
      <CommandPalette
        issues={issues}
        onSelectIssue={handleSelectIssue}
        onChangeStatus={handleChangeStatus}
      />

      <KeyboardShortcutsDialog />

      {/* Dialog de confirmation de suppression */}
      <AlertDialog
        open={!!issueToDelete}
        onOpenChange={(open) => !open && setIssueToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'issue ?</AlertDialogTitle>
            <AlertDialogDescription>
              {issueToDelete && (
                <>
                  Vous êtes sur le point de supprimer l'issue{' '}
                  <strong>"{issueToDelete.title}"</strong>.
                  {issueToDelete.providerIssueId && provider && (
                    <>
                      <br />
                      <br />
                      L'issue sera également <strong>fermée</strong> sur{' '}
                      {provider === 'github' ? 'GitHub' : 'GitLab'} (#
                      {issueToDelete.providerIssueId}).
                    </>
                  )}
                  <br />
                  <br />
                  Cette action est irréversible.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="cursor-pointer">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteIssue}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal d'import d'issues */}
      {provider && (
        <ImportIssuesModal
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          provider={provider}
          projectId={project.id}
          remoteIssues={remoteIssues}
          isLoading={loadingRemoteIssues}
          existingProviderIds={existingProviderIds}
          onImportComplete={handleImportComplete}
          onRefresh={loadRemoteIssues}
        />
      )}

      <IssueDetailModal
        issue={detailIssue}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onUpdateIssue={handleUpdateIssue}
        allIssues={issues}
        sprints={sprints}
        onAssignToSprint={(issueId, sprintId) => {
          setSprints((items) =>
            items.map((sprint) => {
              if (sprint.id === sprintId) {
                return {
                  ...sprint,
                  issues: sprint.issues.includes(issueId)
                    ? sprint.issues
                    : [...sprint.issues, issueId],
                  updatedAt: new Date().toISOString(),
                }
              }
              return sprint
            }),
          )
          toast.success('Issue assigné au sprint')
        }}
        onUnassignFromSprint={(issueId, sprintId) => {
          setSprints((items) =>
            items.map((sprint) => {
              if (sprint.id === sprintId) {
                return {
                  ...sprint,
                  issues: sprint.issues.filter((id) => id !== issueId),
                  updatedAt: new Date().toISOString(),
                }
              }
              return sprint
            }),
          )
          toast.success('Issue retiré du sprint')
        }}
      />

      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="flex-1 overflow-hidden flex flex-col gap-3 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <FilterPanel
                currentFilter={currentFilter}
                savedViews={savedViews}
                onFilterChange={setCurrentFilter}
                onSaveView={(view) => setSavedViews([...savedViews, view])}
                onDeleteView={(id) =>
                  setSavedViews(savedViews.filter((v) => v.id !== id))
                }
                onLoadView={setCurrentFilter}
              />
              <TemplateManager
                templates={templates}
                onCreateTemplate={(t) => setTemplates([...templates, t])}
                onUpdateTemplate={(t) =>
                  setTemplates(
                    templates.map((tmpl) => (tmpl.id === t.id ? t : tmpl)),
                  )
                }
                onDeleteTemplate={(id) =>
                  setTemplates(templates.filter((t) => t.id !== id))
                }
                onUseTemplate={(template) => {
                  console.log('Using template:', template)
                }}
              />
              <AutomationManager
                automations={automations}
                onCreateAutomation={(a) => setAutomations([...automations, a])}
                onUpdateAutomation={(a) =>
                  setAutomations(
                    automations.map((auto) => (auto.id === a.id ? a : auto)),
                  )
                }
                onDeleteAutomation={(id) =>
                  setAutomations(automations.filter((a) => a.id !== id))
                }
              />
            </div>
            <div className="flex items-center gap-3">
              {/* Bouton importer depuis provider */}
              {provider &&
                (provider === 'github'
                  ? github.isConnected
                  : gitlab.isConnected) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenImport}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Importer
                  </Button>
                )}

              {/* Bouton créer une issue */}
              <Dialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle issue
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <CircleDot className="h-5 w-5" />
                      Créer une issue
                    </DialogTitle>
                    <DialogDescription>
                      {provider ? (
                        <>
                          L'issue sera créée en local et synchronisée avec{' '}
                          {provider === 'github' ? 'GitHub' : 'GitLab'}
                          {(
                            provider === 'github'
                              ? github.isConnected
                              : gitlab.isConnected
                          ) ? (
                            <span className="text-green-600 ml-1">
                              (connecté)
                            </span>
                          ) : (
                            <span className="text-yellow-600 ml-1">
                              (non connecté - création locale uniquement)
                            </span>
                          )}
                        </>
                      ) : (
                        "L'issue sera créée en local uniquement"
                      )}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="issue-title">Titre *</Label>
                      <Input
                        id="issue-title"
                        placeholder="Titre de l'issue"
                        value={newIssueTitle}
                        onChange={(e) => setNewIssueTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="issue-body">Description</Label>
                      <Textarea
                        id="issue-body"
                        placeholder="Description détaillée de l'issue"
                        value={newIssueBody}
                        onChange={(e) => setNewIssueBody(e.target.value)}
                        rows={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="issue-labels">Labels</Label>
                      <Input
                        id="issue-labels"
                        placeholder="bug, enhancement, documentation (séparés par des virgules)"
                        value={newIssueLabels}
                        onChange={(e) => setNewIssueLabels(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setShowCreateDialog(false)}
                      disabled={creating}
                    >
                      Annuler
                    </Button>
                    <div className="flex gap-2">
                      {/* Bouton créer localement */}
                      <Button
                        variant="outline"
                        onClick={() => handleCreateIssue(false)}
                        disabled={creating}
                      >
                        {creating ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Cloud className="h-4 w-4 mr-2" />
                        )}
                        Créer localement
                      </Button>
                      {/* Bouton créer et publier - visible seulement si provider connecté */}
                      {provider && (provider === 'github' ? github.isConnected : gitlab.isConnected) && (
                        <Button
                          onClick={() => handleCreateIssue(true)}
                          disabled={creating}
                        >
                          {creating ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : provider === 'github' ? (
                            <Github className="h-4 w-4 mr-2" />
                          ) : (
                            <Gitlab className="h-4 w-4 mr-2" />
                          )}
                          Créer et publier
                        </Button>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Boutons de vue */}
              <div className="flex items-center gap-1 rounded-full border border-border/80 bg-muted/40 p-1">
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  title="Liste"
                  className="rounded-full"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  title="Tableau v2"
                  className="rounded-full"
                >
                  <Table2 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'board' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('board')}
                  title="Kanban"
                  className="rounded-full"
                >
                  <Columns className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'sprint' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('sprint')}
                  title="Sprints"
                  className="rounded-full"
                >
                  <Calendar className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-2 shadow-sm">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="text-xs">
                {filteredIssues.length} issue
                {filteredIssues.length > 1 ? 's' : ''}
                {filteredIssues.length !== issues.length &&
                  ` (filtrés sur ${issues.length})`}
              </span>
            </div>
          </div>

          {viewMode === 'list' ? (
            <div className="flex-1 overflow-hidden rounded-lg border bg-card shadow-sm">
              <div className="h-full overflow-y-auto scrollbar-custom">
                <DndContext
                  id="issues-dnd-context"
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={filteredIssues.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="divide-y divide-border/80">
                      {filteredIssues.map((issue) => {
                        const getChildIssues = (parentId: string): Issue[] => {
                          const parent = issues.find((i) => i.id === parentId)
                          if (!parent?.relationships) return []
                          const childIds = parent.relationships
                            .filter((r) => r.type === 'parent')
                            .map((r) => r.targetIssueId)
                          return issues.filter((i) => childIds.includes(i.id))
                        }

                        const children = getChildIssues(issue.id)
                        const isExpanded = expandedGroups.has(issue.id)

                        return (
                          <div
                            key={issue.id}
                            className="bg-card group relative"
                          >
                            <DraggableIssueRow
                              id={issue.id}
                              title={issue.title}
                              status={issue.status}
                              date={issue.date}
                              hasChildren={
                                !!issue.childrenCount || children.length > 0
                              }
                              childrenCount={
                                issue.childrenCount || children.length
                              }
                              isExpanded={isExpanded}
                              onToggle={() => toggleGroup(issue.id)}
                              onClick={() => handleIssueClick(issue)}
                            />
                            {/* Bouton supprimer au survol */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteIssue(issue)
                              }}
                              title="Supprimer l'issue"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            {isExpanded && children.length > 0 && (
                              <div className="pl-8 border-l-2 border-primary/20 ml-6 space-y-1 py-1">
                                {children.map((child) => (
                                  <DraggableIssueRow
                                    key={child.id}
                                    id={child.id}
                                    title={child.title}
                                    status={child.status}
                                    date={child.date}
                                    hasChildren={false}
                                    onClick={() => handleIssueClick(child)}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </SortableContext>
                  <DragOverlay>
                    {activeId
                      ? (() => {
                          const issue = filteredIssues.find(
                            (i) => i.id === activeId,
                          )
                          if (!issue) return null
                          return (
                            <DraggableIssueRow
                              id={issue.id}
                              title={issue.title}
                              status={issue.status}
                              date={issue.date}
                              hasChildren={!!issue.childrenCount}
                              childrenCount={issue.childrenCount}
                              isDragOverlay
                            />
                          )
                        })()
                      : null}
                  </DragOverlay>
                </DndContext>
              </div>
            </div>
          ) : viewMode === 'table' ? (
            <div className="flex-1 overflow-hidden rounded-lg border bg-card shadow-sm">
              <IssuesTableV2
                issues={filteredIssues}
                allIssues={issues}
                onUpdateIssue={handleUpdateIssue}
                onReorderIssues={setIssues}
                onSyncIssue={syncToProvider}
                provider={provider}
                isProviderConnected={provider === 'github' ? github.isConnected : provider === 'gitlab' ? gitlab.isConnected : false}
              />
            </div>
          ) : viewMode === 'board' ? (
            <div className="flex-1 overflow-hidden rounded-lg border bg-card shadow-sm h-full min-h-0">
              <KanbanBoard
                issues={filteredIssues}
                onIssueClick={handleIssueClick}
                onStatusChange={handleChangeStatus}
              />
            </div>
          ) : (
            <div className="flex-1 overflow-hidden rounded-lg border bg-card shadow-sm">
              <div className="h-full overflow-y-auto p-6 scrollbar-custom">
                <SprintManager
                  sprints={sprints}
                  issues={issues}
                  onCreateSprint={handleCreateSprint}
                  onUpdateSprint={handleUpdateSprint}
                  onDeleteSprint={handleDeleteSprint}
                  onAddReview={handleAddReview}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
