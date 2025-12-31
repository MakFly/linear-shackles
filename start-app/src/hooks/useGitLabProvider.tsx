import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import type { GitLabIssue } from '@/types/gitlab'
import {
  getProviderCredentials,
  saveProviderCredentials,
  deleteProviderCredentials,
} from '@/server/db'

interface GitLabProviderState {
  isConnected: boolean
  token: string | null
  gitlabUrl: string | null
  projectId: string | null
}

export const useGitLabProvider = (projectId: string | null) => {
  const [state, setState] = useState<GitLabProviderState>({
    isConnected: false,
    token: null,
    gitlabUrl: null,
    projectId: null,
  })
  const [loading, setLoading] = useState(false)

  // Load credentials from DB when projectId changes
  useEffect(() => {
    if (projectId) {
      loadCredentials(projectId)
    } else {
      setState({
        isConnected: false,
        token: null,
        gitlabUrl: null,
        projectId: null,
      })
    }
  }, [projectId])

  const loadCredentials = async (pid: string) => {
    setLoading(true)
    try {
      // First try: load project-specific credentials
      let credential = await getProviderCredentials({
        data: { projectId: pid, provider: 'gitlab' },
      })

      // Fallback: if no project-specific credentials, try 'global'
      if (!credential) {
        credential = await getProviderCredentials({
          data: { projectId: 'global', provider: 'gitlab' },
        })

        // If global credentials found, save them for this project
        if (credential) {
          await saveProviderCredentials({
            data: {
              projectId: pid,
              provider: 'gitlab',
              token: credential.token,
              providerUrl: credential.providerUrl,
              providerRepo: credential.providerRepo || null,
            },
          })
        }
      }

      if (credential) {
        setState({
          isConnected: true,
          token: credential.token,
          gitlabUrl: credential.providerUrl || 'https://gitlab.com',
          projectId: pid,
        })
      } else {
        setState({
          isConnected: false,
          token: null,
          gitlabUrl: null,
          projectId: pid,
        })
      }
    } catch (error) {
      console.error('Error loading GitLab credentials:', error)
      setState({
        isConnected: false,
        token: null,
        gitlabUrl: null,
        projectId: pid,
      })
    } finally {
      setLoading(false)
    }
  }

  const connect = async (
    token: string,
    url: string,
    pid?: string,
  ): Promise<boolean> => {
    const targetProjectId = pid || projectId
    if (!targetProjectId) {
      toast.error('Project ID is required')
      return false
    }

    setLoading(true)
    try {
      await saveProviderCredentials({
        data: {
          projectId: targetProjectId,
          provider: 'gitlab',
          token,
          providerUrl: url,
        },
      })

      setState({
        isConnected: true,
        token,
        gitlabUrl: url,
        projectId: targetProjectId,
      })

      toast.success('GitLab connecté', {
        description: `Instance: ${url}`,
      })
      return true
    } catch (error) {
      console.error('Error connecting GitLab:', error)
      toast.error('Erreur lors de la connexion GitLab')
      return false
    } finally {
      setLoading(false)
    }
  }

  const disconnect = async (): Promise<boolean> => {
    if (!projectId) return false

    setLoading(true)
    try {
      await deleteProviderCredentials({
        data: { projectId, provider: 'gitlab' },
      })

      setState({
        isConnected: false,
        token: null,
        gitlabUrl: null,
        projectId,
      })

      toast.success('GitLab déconnecté')
      return true
    } catch (error) {
      console.error('Error disconnecting GitLab:', error)
      toast.error('Erreur lors de la déconnexion GitLab')
      return false
    } finally {
      setLoading(false)
    }
  }

  const makeRequest = async <T,>(endpoint: string): Promise<T> => {
    if (!state.token || !state.gitlabUrl) {
      throw new Error('GitLab not connected')
    }

    const response = await fetch(`${state.gitlabUrl}/api/v4${endpoint}`, {
      headers: {
        Authorization: `Bearer ${state.token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `GitLab API error: ${response.status}`)
    }

    return response.json()
  }

  const getUserProjects = async () => {
    if (!state.token || !state.gitlabUrl) {
      throw new Error('GitLab not connected')
    }

    const projects: {
      id: number
      name: string
      path_with_namespace: string
      description: string
      web_url: string
      default_branch: string
      created_at: string
      last_activity_at: string
    }[] = []
    let page = 1
    const perPage = 100

    while (true) {
      const response = await fetch(
        `${state.gitlabUrl}/api/v4/projects?per_page=${perPage}&page=${page}&membership=true&order_by=last_activity_at&sort=desc`,
        {
          headers: {
            Authorization: `Bearer ${state.token}`,
            'Content-Type': 'application/json',
          },
        },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || `GitLab API error: ${response.status}`)
      }

      const data = await response.json()
      projects.push(...data)

      if (data.length < perPage) {
        break
      }
      page++
    }

    return projects
  }

  const getIssues = async (
    gitlabProjectId: number,
    issueState: 'opened' | 'closed' | 'all' = 'opened',
  ) => {
    if (!state.token || !state.gitlabUrl) {
      throw new Error('GitLab not connected')
    }

    const response = await fetch(
      `${state.gitlabUrl}/api/v4/projects/${gitlabProjectId}/issues?state=${issueState}&per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${state.token}`,
          'Content-Type': 'application/json',
        },
      },
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `GitLab API error: ${response.status}`)
    }

    return response.json() as Promise<GitLabIssue[]>
  }

  const createIssue = async (
    gitlabProjectId: string,
    title: string,
    body?: string,
    labels?: string[],
  ) => {
    if (!state.token || !state.gitlabUrl) {
      throw new Error('GitLab not connected')
    }

    const response = await fetch(
      `${state.gitlabUrl}/api/v4/projects/${gitlabProjectId}/issues`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${state.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description: body, labels }),
      },
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create issue')
    }

    return response.json()
  }

  return {
    ...state,
    loading,
    connect,
    disconnect,
    getUserProjects,
    getIssues,
    createIssue,
  }
}
