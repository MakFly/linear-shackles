import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Loader2, Download, Github, GitBranch } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createIssue, createUpdate } from '@/server/db'
import type { GitHubIssue } from '@/types/github'
import type { GitLabIssue } from '@/types/gitlab'
import { toast } from 'sonner'

type StateFilter = 'open' | 'closed' | 'all'

interface ImportIssuesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider: 'github' | 'gitlab'
  projectId: string
  remoteIssues: Array<GitHubIssue | GitLabIssue>
  isLoading: boolean
  existingProviderIds: Set<string>
  onImportComplete: () => void
  onRefresh: () => void
}

export function ImportIssuesModal({
  open,
  onOpenChange,
  provider,
  projectId,
  remoteIssues,
  isLoading,
  existingProviderIds,
  onImportComplete,
  onRefresh,
}: ImportIssuesModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [stateFilter, setStateFilter] = useState<StateFilter>('open')
  const queryClient = useQueryClient()

  // Filtrer les issues déjà importées et par état
  const availableIssues = remoteIssues.filter((issue) => {
    const id =
      provider === 'github'
        ? String((issue as GitHubIssue).number)
        : String((issue as GitLabIssue).iid)

    // Exclure les issues déjà importées
    if (existingProviderIds.has(id)) return false

    // Filtrer par état
    if (stateFilter !== 'all') {
      const isGitHub = provider === 'github'
      const state = isGitHub
        ? (issue as GitHubIssue).state
        : (issue as GitLabIssue).state

      if (stateFilter === 'open') {
        return state === 'open' || state === 'opened'
      } else {
        return state === 'closed'
      }
    }

    return true
  })

  // Compter les issues par état (non importées)
  const counts = remoteIssues.reduce(
    (acc, issue) => {
      const id =
        provider === 'github'
          ? String((issue as GitHubIssue).number)
          : String((issue as GitLabIssue).iid)

      if (existingProviderIds.has(id)) return acc

      const isGitHub = provider === 'github'
      const state = isGitHub
        ? (issue as GitHubIssue).state
        : (issue as GitLabIssue).state

      if (state === 'open' || state === 'opened') {
        acc.open++
      } else {
        acc.closed++
      }
      acc.all++
      return acc
    },
    { open: 0, closed: 0, all: 0 },
  )

  const importMutation = useMutation({
    mutationFn: async () => {
      const issuesToImport = availableIssues.filter((issue) => {
        const id =
          provider === 'github'
            ? String((issue as GitHubIssue).number)
            : String((issue as GitLabIssue).iid)
        return selectedIds.has(id)
      })

      for (const issue of issuesToImport) {
        const isGitHub = provider === 'github'
        const ghIssue = issue as GitHubIssue
        const glIssue = issue as GitLabIssue

        const providerIssueId = isGitHub
          ? String(ghIssue.number)
          : String(glIssue.iid)
        const title = issue.title
        const description = isGitHub ? ghIssue.body : glIssue.description
        const labels = isGitHub
          ? ghIssue.labels.map((l) => l.name)
          : glIssue.labels.map((l) => l.title)
        const status =
          (isGitHub ? ghIssue.state === 'closed' : glIssue.state === 'closed')
            ? 'done'
            : 'backlog'

        const issueId = `${projectId}-import-${Date.now()}-${providerIssueId}`

        await createIssue({
          data: {
            id: issueId,
            projectId,
            title,
            description: description || null,
            status,
            priority: 'medium',
            labels: labels.length > 0 ? labels : null,
            providerIssueId,
          },
        })

        await createUpdate({
          data: {
            id: `update-import-${Date.now()}-${providerIssueId}`,
            type: 'issue_created',
            author: 'Import',
            content: `a importé depuis ${provider === 'github' ? 'GitHub' : 'GitLab'}`,
            timestamp: new Date().toISOString(),
            metadata: {
              issueId,
              issueTitle: title,
              providerIssueNumber: Number(providerIssueId),
              provider,
              imported: true,
            },
          },
        })
      }

      return issuesToImport.length
    },
    onSuccess: (count) => {
      toast.success(`${count} issue(s) importée(s)`)
      queryClient.invalidateQueries({ queryKey: ['issues'] })
      setSelectedIds(new Set())
      onImportComplete()
      onOpenChange(false)
    },
    onError: (err) => {
      toast.error(`Erreur: ${(err as Error).message}`)
    },
  })

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === availableIssues.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(
        new Set(
          availableIssues.map((issue) =>
            provider === 'github'
              ? String((issue as GitHubIssue).number)
              : String((issue as GitLabIssue).iid),
          ),
        ),
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {provider === 'github' ? (
                <Github className="h-5 w-5" />
              ) : (
                <GitBranch className="h-5 w-5" />
              )}
              Importer des issues depuis {provider === 'github' ? 'GitHub' : 'GitLab'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Actualiser'
              )}
            </Button>
          </DialogTitle>
          <DialogDescription>
            Sélectionnez les issues à importer dans votre projet local.
          </DialogDescription>
        </DialogHeader>

        {/* Tabs de filtre par état */}
        <div className="flex gap-1 border-b pb-2">
          <button
            className={cn(
              'px-3 py-1.5 text-sm rounded-md transition-colors',
              stateFilter === 'open'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent',
            )}
            onClick={() => {
              setStateFilter('open')
              setSelectedIds(new Set())
            }}
          >
            Ouvertes ({counts.open})
          </button>
          <button
            className={cn(
              'px-3 py-1.5 text-sm rounded-md transition-colors',
              stateFilter === 'closed'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent',
            )}
            onClick={() => {
              setStateFilter('closed')
              setSelectedIds(new Set())
            }}
          >
            Fermées ({counts.closed})
          </button>
          <button
            className={cn(
              'px-3 py-1.5 text-sm rounded-md transition-colors',
              stateFilter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent',
            )}
            onClick={() => {
              setStateFilter('all')
              setSelectedIds(new Set())
            }}
          >
            Toutes ({counts.all})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : availableIssues.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {remoteIssues.length === 0
                ? 'Aucune issue trouvée sur le provider'
                : counts.all === 0
                  ? 'Toutes les issues ont déjà été importées'
                  : `Aucune issue ${stateFilter === 'open' ? 'ouverte' : stateFilter === 'closed' ? 'fermée' : ''} disponible`}
            </p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Checkbox
                  checked={
                    selectedIds.size === availableIssues.length &&
                    availableIssues.length > 0
                  }
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  Tout sélectionner ({availableIssues.length})
                </span>
              </div>

              {availableIssues.map((issue) => {
                const isGitHub = provider === 'github'
                const id = isGitHub
                  ? String((issue as GitHubIssue).number)
                  : String((issue as GitLabIssue).iid)
                const labels = isGitHub
                  ? (issue as GitHubIssue).labels
                  : (issue as GitLabIssue).labels
                const state = isGitHub
                  ? (issue as GitHubIssue).state
                  : (issue as GitLabIssue).state

                return (
                  <div
                    key={id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer"
                    onClick={() => toggleSelect(id)}
                  >
                    <Checkbox
                      checked={selectedIds.has(id)}
                      onCheckedChange={() => toggleSelect(id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          #{id}
                        </span>
                        <Badge
                          variant={state === 'open' || state === 'opened' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {state}
                        </Badge>
                        <span className="font-medium truncate">
                          {issue.title}
                        </span>
                      </div>
                      {labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {labels.slice(0, 3).map((label, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs"
                            >
                              {isGitHub
                                ? (label as GitHubIssue['labels'][0]).name
                                : (label as GitLabIssue['labels'][0]).title}
                            </Badge>
                          ))}
                          {labels.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{labels.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={() => importMutation.mutate()}
            disabled={selectedIds.size === 0 || importMutation.isPending}
          >
            {importMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Import...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Importer ({selectedIds.size})
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
