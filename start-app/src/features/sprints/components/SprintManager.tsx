import { useState } from 'react'
import {
  Calendar,
  Target,
  Play,
  CheckCircle2,
  Archive,
  Plus,
  Trash2,
  Edit,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Sprint, SprintStatus, Issue } from '@/types/issue'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface SprintManagerProps {
  sprints: Sprint[]
  issues: Issue[]
  onCreateSprint: (
    sprint: Omit<Sprint, 'id' | 'createdAt' | 'updatedAt'>,
  ) => void
  onUpdateSprint: (id: string, sprint: Partial<Sprint>) => void
  onDeleteSprint: (id: string) => void
  onAddReview: (
    sprintId: string,
    review: Omit<Sprint['reviews'][0], 'id'>,
  ) => void
}

export function SprintManager({
  sprints,
  issues,
  onCreateSprint,
  onUpdateSprint,
  onDeleteSprint,
  onAddReview,
}: SprintManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    goal: '',
    startDate: '',
    endDate: '',
    status: 'planning' as SprintStatus,
  })
  const [reviewData, setReviewData] = useState({
    summary: '',
    notes: '',
  })

  const getStatusIcon = (status: SprintStatus) => {
    switch (status) {
      case 'planning':
        return <Calendar className="h-4 w-4" />
      case 'active':
        return <Play className="h-4 w-4" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />
      case 'archived':
        return <Archive className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: SprintStatus) => {
    switch (status) {
      case 'planning':
        return 'bg-muted text-muted-foreground'
      case 'active':
        return 'bg-primary/10 text-primary border-primary/20'
      case 'completed':
        return 'bg-[hsl(var(--status-done))] text-background'
      case 'archived':
        return 'bg-secondary text-secondary-foreground'
    }
  }

  const handleCreateSprint = () => {
    if (
      !formData.name ||
      !formData.goal ||
      !formData.startDate ||
      !formData.endDate
    ) {
      toast.error('Veuillez remplir tous les champs requis')
      return
    }

    onCreateSprint({
      ...formData,
      issues: [],
      reviews: [],
    })

    setFormData({
      name: '',
      goal: '',
      startDate: '',
      endDate: '',
      status: 'planning',
    })
    setIsCreateOpen(false)
    toast.success('Sprint créé avec succès')
  }

  const handleAddReview = () => {
    if (!selectedSprint || !reviewData.summary) {
      toast.error('Veuillez remplir le résumé de la revue')
      return
    }

    const sprintIssues = issues.filter((issue) =>
      selectedSprint.issues.includes(issue.id),
    )
    const completedIssues = sprintIssues.filter(
      (issue) => issue.status === 'done',
    ).length
    const totalIssues = sprintIssues.length
    const velocity =
      totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0

    onAddReview(selectedSprint.id, {
      date: new Date().toISOString(),
      summary: reviewData.summary,
      completedIssues,
      totalIssues,
      velocity,
      notes: reviewData.notes,
    })

    setReviewData({ summary: '', notes: '' })
    setIsReviewOpen(false)
    setSelectedSprint(null)
    toast.success('Revue de sprint ajoutée')
  }

  const getSprintIssues = (sprint: Sprint) => {
    return issues.filter((issue) => sprint.issues.includes(issue.id))
  }

  const getSprintProgress = (sprint: Sprint) => {
    const sprintIssues = getSprintIssues(sprint)
    if (sprintIssues.length === 0) return 0
    const completed = sprintIssues.filter(
      (issue) => issue.status === 'done',
    ).length
    return Math.round((completed / sprintIssues.length) * 100)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            Sprints & Cycles
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Organisez vos issues dans le temps
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Sprint
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un nouveau sprint</DialogTitle>
              <DialogDescription>
                Définissez les objectifs et la durée de votre sprint
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du sprint</Label>
                <Input
                  id="name"
                  placeholder="Sprint 1 - Q4 2024"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal">Objectif du sprint</Label>
                <Textarea
                  id="goal"
                  placeholder="Décrire l'objectif principal du sprint..."
                  value={formData.goal}
                  onChange={(e) =>
                    setFormData({ ...formData, goal: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Date de début</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Date de fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: SprintStatus) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planification</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                    <SelectItem value="archived">Archivé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateSprint}>Créer le sprint</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sprints.map((sprint) => {
            const sprintIssues = getSprintIssues(sprint)
            const progress = getSprintProgress(sprint)

            return (
              <Card key={sprint.id} className="border-border bg-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg text-card-foreground">
                          {sprint.name}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className={getStatusColor(sprint.status)}
                        >
                          {getStatusIcon(sprint.status)}
                          <span className="ml-1 capitalize">
                            {sprint.status}
                          </span>
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(sprint.startDate), 'dd MMM')} -{' '}
                        {format(new Date(sprint.endDate), 'dd MMM yyyy')}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          const newStatus: SprintStatus =
                            sprint.status === 'planning'
                              ? 'active'
                              : sprint.status === 'active'
                                ? 'completed'
                                : sprint.status === 'completed'
                                  ? 'archived'
                                  : 'planning'
                          onUpdateSprint(sprint.id, { status: newStatus })
                          toast.success('Statut du sprint mis à jour')
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          onDeleteSprint(sprint.id)
                          toast.success('Sprint supprimé')
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Target className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        {sprint.goal}
                      </p>
                    </div>
                  </div>

                  <Separator className="bg-border" />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progression</span>
                      <span className="font-medium text-foreground">
                        {progress}% (
                        {sprintIssues.filter((i) => i.status === 'done').length}
                        /{sprintIssues.length})
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {sprint.reviews && sprint.reviews.length > 0 && (
                    <>
                      <Separator className="bg-border" />
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-foreground">
                          Dernière revue
                        </h4>
                        <div className="text-sm space-y-1">
                          <p className="text-muted-foreground">
                            {sprint.reviews[sprint.reviews.length - 1].summary}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>
                              Vélocité:{' '}
                              {
                                sprint.reviews[sprint.reviews.length - 1]
                                  .velocity
                              }
                              %
                            </span>
                            <span>•</span>
                            <span>
                              {format(
                                new Date(
                                  sprint.reviews[sprint.reviews.length - 1]
                                    .date,
                                ),
                                'dd MMM yyyy',
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSelectedSprint(sprint)
                      setIsReviewOpen(true)
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Ajouter une revue
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </ScrollArea>

      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une revue de sprint</DialogTitle>
            <DialogDescription>
              {selectedSprint?.name} - Documentez les résultats du sprint
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="summary">Résumé</Label>
              <Textarea
                id="summary"
                placeholder="Résumé des accomplissements du sprint..."
                value={reviewData.summary}
                onChange={(e) =>
                  setReviewData({ ...reviewData, summary: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Textarea
                id="notes"
                placeholder="Points d'amélioration, rétrospective..."
                value={reviewData.notes}
                onChange={(e) =>
                  setReviewData({ ...reviewData, notes: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsReviewOpen(false)
                setSelectedSprint(null)
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleAddReview}>Ajouter la revue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
