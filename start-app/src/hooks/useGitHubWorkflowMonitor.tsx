import { useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import type { GitHubWorkflowRun } from '@/types/github'

interface UseWorkflowMonitorOptions {
  enabled?: boolean
  interval?: number // en millisecondes
  onWorkflowChange?: (
    workflow: GitHubWorkflowRun,
    previousState: string,
    newState: string,
  ) => void
}

export const useGitHubWorkflowMonitor = (
  workflows: GitHubWorkflowRun[],
  getWorkflowRuns: () => Promise<GitHubWorkflowRun[]>,
  options: UseWorkflowMonitorOptions = {},
) => {
  const { enabled = true, interval = 30000, onWorkflowChange } = options
  const previousWorkflowsRef = useRef<Map<number, GitHubWorkflowRun>>(new Map())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isInitializedRef = useRef(false)
  const getWorkflowRunsRef = useRef(getWorkflowRuns)

  // Mettre à jour la référence de la fonction
  useEffect(() => {
    getWorkflowRunsRef.current = getWorkflowRuns
  }, [getWorkflowRuns])

  // Fonction pour obtenir une clé d'état unique pour un workflow
  const getWorkflowStateKey = useCallback(
    (workflow: GitHubWorkflowRun): string => {
      return `${workflow.status}-${workflow.conclusion || 'none'}`
    },
    [],
  )

  // Fonction pour détecter les changements et envoyer des notifications
  const checkWorkflowChanges = useCallback(async () => {
    if (!enabled) return

    try {
      const currentWorkflows = await getWorkflowRunsRef.current()
      const currentWorkflowsMap = new Map(
        currentWorkflows.map((w) => [w.id, w]),
      )
      const previousWorkflowsMap = previousWorkflowsRef.current

      // Comparer les workflows
      for (const currentWorkflow of currentWorkflows) {
        const previousWorkflow = previousWorkflowsMap.get(currentWorkflow.id)

        if (previousWorkflow) {
          const previousState = getWorkflowStateKey(previousWorkflow)
          const currentState = getWorkflowStateKey(currentWorkflow)

          // Si l'état a changé
          if (previousState !== currentState) {
            const stateChanged =
              previousWorkflow.status !== currentWorkflow.status

            // Notifier les changements importants
            if (stateChanged) {
              if (
                previousWorkflow.status === 'queued' &&
                currentWorkflow.status === 'in_progress'
              ) {
                toast.info(`🚀 Workflow démarré`, {
                  description: `${currentWorkflow.name} a commencé à s'exécuter`,
                })
              } else if (
                previousWorkflow.status === 'in_progress' &&
                currentWorkflow.status === 'completed'
              ) {
                if (currentWorkflow.conclusion === 'success') {
                  toast.success(`✅ Workflow réussi`, {
                    description: `${currentWorkflow.name} s'est terminé avec succès`,
                    action: {
                      label: 'Voir',
                      onClick: () =>
                        window.open(currentWorkflow.html_url, '_blank'),
                    },
                  })
                } else if (currentWorkflow.conclusion === 'failure') {
                  toast.error(`❌ Workflow échoué`, {
                    description: `${currentWorkflow.name} a échoué`,
                    action: {
                      label: 'Voir',
                      onClick: () =>
                        window.open(currentWorkflow.html_url, '_blank'),
                    },
                  })
                } else if (currentWorkflow.conclusion === 'cancelled') {
                  toast.warning(`⚠️ Workflow annulé`, {
                    description: `${currentWorkflow.name} a été annulé`,
                  })
                }
              }
            }

            // Appeler le callback personnalisé si fourni
            onWorkflowChange?.(currentWorkflow, previousState, currentState)
          }
        } else if (isInitializedRef.current) {
          // Nouveau workflow détecté (seulement après l'initialisation)
          if (
            currentWorkflow.status === 'queued' ||
            currentWorkflow.status === 'in_progress'
          ) {
            toast.info(`🔄 Nouveau workflow`, {
              description: `${currentWorkflow.name} a été déclenché`,
            })
          }
        }
      }

      // Mettre à jour la référence pour la prochaine vérification
      previousWorkflowsRef.current = currentWorkflowsMap
      isInitializedRef.current = true
    } catch (error: any) {
      console.error('Erreur lors de la vérification des workflows:', error)
    }
  }, [enabled, getWorkflowStateKey, onWorkflowChange])

  // Initialiser avec les workflows actuels
  useEffect(() => {
    if (workflows.length > 0 && !isInitializedRef.current) {
      const workflowsMap = new Map(workflows.map((w) => [w.id, w]))
      previousWorkflowsRef.current = workflowsMap
      isInitializedRef.current = true
    }
  }, [workflows])

  // Démarrer le polling
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Démarrer l'intervalle
    intervalRef.current = setInterval(checkWorkflowChanges, interval)

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, interval, checkWorkflowChanges])
}
