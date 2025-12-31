import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import type { GitHubIssue } from '@/types/github'
import {
  getProviderCredentials,
  saveProviderCredentials,
  deleteProviderCredentials,
} from '@/server/db'

const GITHUB_API_BASE = 'https://api.github.com'

interface GitHubProviderState {
  isConnected: boolean
  token: string | null
  repo: string | null
  projectId: string | null
}

export const useGitHubProvider = (projectId: string | null) => {
  const [state, setState] = useState<GitHubProviderState>({
    isConnected: false,
    token: null,
    repo: null,
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
        repo: null,
        projectId: null,
      })
    }
  }, [projectId])

  const loadCredentials = async (pid: string) => {
    setLoading(true)
    try {
      console.log('[useGitHubProvider] Loading credentials for:', pid)

      // First try: load project-specific credentials
      let credential = await getProviderCredentials({
        data: { projectId: pid, provider: 'github' },
      })
      console.log('[useGitHubProvider] Project credentials found:', !!credential, credential?.providerRepo)

      // Fallback: if no project-specific credentials, try 'global'
      if (!credential) {
        console.log('[useGitHubProvider] No project credentials, trying global fallback')
        credential = await getProviderCredentials({
          data: { projectId: 'global', provider: 'github' },
        })
        console.log('[useGitHubProvider] Global credentials found:', !!credential, credential?.providerRepo)

        // If global credentials found, save them for this project
        if (credential) {
          console.log('[useGitHubProvider] Copying global credentials to project:', pid)
          await saveProviderCredentials({
            data: {
              projectId: pid,
              provider: 'github',
              token: credential.token,
              providerUrl: credential.providerUrl,
              providerRepo: credential.providerRepo || null,
            },
          })
        }
      }

      if (credential) {
        console.log('[useGitHubProvider] Setting state as connected')
        setState({
          isConnected: true,
          token: credential.token,
          repo: credential.providerRepo,
          projectId: pid,
        })
      } else {
        console.log('[useGitHubProvider] No credentials found, setting state as disconnected')
        setState({
          isConnected: false,
          token: null,
          repo: null,
          projectId: pid,
        })
      }
    } catch (error) {
      console.error('[useGitHubProvider] Error loading GitHub credentials:', error)
      setState({
        isConnected: false,
        token: null,
        repo: null,
        projectId: pid,
      })
    } finally {
      setLoading(false)
    }
  }

  const connect = async (
    token: string,
    repo: string,
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
          provider: 'github',
          token,
          providerUrl: GITHUB_API_BASE,
          providerRepo: repo,
        },
      })

      setState({
        isConnected: true,
        token,
        repo,
        projectId: targetProjectId,
      })

      toast.success('GitHub connecté', {
        description: `Repository: ${repo}`,
      })
      return true
    } catch (error) {
      console.error('Error connecting GitHub:', error)
      toast.error('Erreur lors de la connexion GitHub')
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
        data: { projectId, provider: 'github' },
      })

      setState({
        isConnected: false,
        token: null,
        repo: null,
        projectId,
      })

      toast.success('GitHub déconnecté')
      return true
    } catch (error) {
      console.error('Error disconnecting GitHub:', error)
      toast.error('Erreur lors de la déconnexion GitHub')
      return false
    } finally {
      setLoading(false)
    }
  }

  const makeRequest = async <T,>(endpoint: string): Promise<T> => {
    if (!state.token) {
      throw new Error('GitHub not connected')
    }

    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${state.repo}${endpoint}`,
      {
        headers: {
          Authorization: `Bearer ${state.token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `GitHub API error: ${response.status}`)
    }

    return response.json()
  }

  const getUserRepositories = async () => {
    if (!state.token) {
      throw new Error('GitHub not connected')
    }

    const repos: {
      id: number
      name: string
      full_name: string
      description: string
      html_url: string
      default_branch: string
      private: boolean
      updated_at: string
    }[] = []
    let page = 1
    const perPage = 100

    while (true) {
      const response = await fetch(
        `${GITHUB_API_BASE}/user/repos?per_page=${perPage}&page=${page}&sort=updated`,
        {
          headers: {
            Authorization: `Bearer ${state.token}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        },
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || `GitHub API error: ${response.status}`)
      }

      const data = await response.json()
      repos.push(...data)

      if (data.length < perPage) {
        break
      }
      page++
    }

    return repos
  }

  const getIssues = async (
    repoOverride?: string,
    issueState: 'open' | 'closed' | 'all' = 'open',
  ) => {
    if (!state.token) throw new Error('GitHub not connected')

    const targetRepo = repoOverride || state.repo
    if (!targetRepo) throw new Error('Repository not specified')

    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${targetRepo}/issues?state=${issueState}&per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${state.token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `GitHub API error: ${response.status}`)
    }

    return response.json() as Promise<GitHubIssue[]>
  }

  const createIssue = async (
    repoOverride: string,
    title: string,
    body?: string,
    labels?: string[],
  ) => {
    if (!state.token) throw new Error('GitHub not connected')

    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${repoOverride}/issues`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${state.token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, body, labels }),
      },
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create issue')
    }

    return response.json()
  }

  const closeIssue = async (repoOverride: string, issueNumber: number) => {
    if (!state.token) throw new Error('GitHub not connected')

    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${repoOverride}/issues/${issueNumber}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${state.token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ state: 'closed' }),
      },
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to close issue')
    }

    return response.json()
  }

  return {
    ...state,
    loading,
    connect,
    disconnect,
    getUserRepositories,
    getIssues,
    createIssue,
    closeIssue,
  }
}
