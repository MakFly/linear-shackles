import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import type {
  GitHubIssue,
  GitHubPullRequest,
  GitHubBranch,
  GitHubWorkflowRun,
} from '@/types/github'
import {
  getProviderCredentials,
  saveProviderCredentials,
  deleteProviderCredentials,
} from '@/server/db'

const GITHUB_API_BASE = 'https://api.github.com'

const normalizeRepo = (repoInput: string): string => {
  // Si c'est une URL GitHub complète, extraire owner/repo
  const githubUrlMatch = repoInput.match(
    /github\.com[/:]([^/]+)\/([^/]+?)(?:\.git|\/|$)/,
  )
  if (githubUrlMatch) {
    return `${githubUrlMatch[1]}/${githubUrlMatch[2]}`
  }
  // Sinon, retourner tel quel (déjà au format owner/repo)
  return repoInput.trim()
}

export const useGitHub = (options?: { mode: 'global' | 'project'; projectId?: string }) => {
  const mode = options?.mode || 'global'
  const projectId = options?.projectId || 'global'

  const [token, setToken] = useState<string>('')
  const [repo, setRepo] = useState<string>('')
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(false)

  // Load credentials from DB ONLY
  useEffect(() => {
    const loadCredentials = async () => {
      setLoading(true)
      try {
        // First try: load project-specific credentials
        let credential = await getProviderCredentials({
          data: { projectId, provider: 'github' },
        })

        // Fallback: if no project-specific credentials and mode is 'project', try 'global'
        if (!credential && mode === 'project') {
          credential = await getProviderCredentials({
            data: { projectId: 'global', provider: 'github' },
          })

          // If global credentials found, save them for this project
          if (credential) {
            await saveProviderCredentials({
              data: {
                projectId,
                provider: 'github',
                token: credential.token,
                providerUrl: credential.providerUrl,
                providerRepo: credential.providerRepo || null,
              },
            })
          }
        }

        if (credential) {
          setToken(credential.token)
          if (credential.providerRepo) {
            setRepo(credential.providerRepo)
          }
          setIsConnected(true)
        } else {
          // No credentials found
          setToken('')
          setRepo('')
          setIsConnected(false)
        }
      } catch (error) {
        console.error('Error loading GitHub credentials:', error)
        setToken('')
        setRepo('')
        setIsConnected(false)
      } finally {
        setLoading(false)
      }
    }

    loadCredentials()
  }, [projectId, mode])

  const connect = async (newToken: string, newRepo?: string) => {
    setLoading(true)
    try {
      // Save ONLY to DB
      await saveProviderCredentials({
        data: {
          projectId,
          provider: 'github',
          token: newToken,
          providerUrl: GITHUB_API_BASE,
          providerRepo: newRepo || null,
        },
      })

      // Update local state
      setToken(newToken)
      setIsConnected(true)

      if (newRepo) {
        const normalizedRepo = normalizeRepo(newRepo)
        setRepo(normalizedRepo)
        toast.success('GitHub connecté', {
          description: `Repository: ${normalizedRepo}`,
        })
      } else {
        toast.success('GitHub connecté', {
          description: 'Token configuré',
        })
      }
    } catch (error) {
      console.error('Error connecting GitHub:', error)
      toast.error('Erreur lors de la connexion GitHub')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const disconnect = async () => {
    setLoading(true)
    try {
      // Remove ONLY from DB
      await deleteProviderCredentials({
        data: { projectId, provider: 'github' },
      })

      // Update local state
      setToken('')
      setRepo('')
      setIsConnected(false)
      toast.success('GitHub déconnecté')
    } catch (error) {
      console.error('Error disconnecting GitHub:', error)
      toast.error('Erreur lors de la déconnexion GitHub')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const makeRequest = async <T,>(endpoint: string): Promise<T> => {
    if (!token || !repo) {
      throw new Error('GitHub not connected')
    }

    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${repo}${endpoint}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
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
    if (!token) {
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
            Authorization: `Bearer ${token}`,
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

  const getIssues = async (state: 'open' | 'closed' | 'all' = 'open') => {
    return makeRequest<GitHubIssue[]>(`/issues?state=${state}&per_page=100`)
  }

  const getPullRequests = async (state: 'open' | 'closed' | 'all' = 'open') => {
    return makeRequest<GitHubPullRequest[]>(
      `/pulls?state=${state}&per_page=100`,
    )
  }

  const getBranches = async () => {
    return makeRequest<GitHubBranch[]>('/branches?per_page=100')
  }

  const getWorkflowRuns = async () => {
    return makeRequest<{ workflow_runs: GitHubWorkflowRun[] }>(
      '/actions/runs?per_page=50',
    ).then((data) => data.workflow_runs)
  }

  const createIssue = async (
    title: string,
    body?: string,
    labels?: string[],
  ) => {
    if (!token || !repo) throw new Error('GitHub not connected')

    const response = await fetch(`${GITHUB_API_BASE}/repos/${repo}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, body, labels }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create issue')
    }

    return response.json()
  }

  const closeIssue = async (issueNumber: number) => {
    if (!token || !repo) throw new Error('GitHub not connected')

    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${repo}/issues/${issueNumber}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
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
    isConnected,
    token,
    repo,
    loading,
    connect,
    disconnect,
    getUserRepositories,
    getIssues,
    getPullRequests,
    getBranches,
    getWorkflowRuns,
    createIssue,
    closeIssue,
  }
}
