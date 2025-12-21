import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import type {
  GitHubIssue,
  GitHubPullRequest,
  GitHubBranch,
  GitHubWorkflowRun,
} from '@/types/github'

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

export const useGitHub = () => {
  const [token, setToken] = useState<string>('')
  const [repo, setRepo] = useState<string>('')
  const [isConnected, setIsConnected] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const savedToken = localStorage.getItem('github_token')
    const savedRepo = localStorage.getItem('github_repo')
    if (savedToken) setToken(savedToken)
    if (savedRepo) {
      // Normaliser le repo sauvegardé au cas où il serait mal formaté
      const normalizedRepo = normalizeRepo(savedRepo)
      setRepo(normalizedRepo)
      // Mettre à jour le localStorage avec la version normalisée
      if (normalizedRepo !== savedRepo) {
        localStorage.setItem('github_repo', normalizedRepo)
      }
    }
    // Se connecter si on a un token (même sans repo pour lister les repos)
    if (savedToken) setIsConnected(true)
  }, [])

  const connect = (newToken: string, newRepo?: string) => {
    localStorage.setItem('github_token', newToken)
    setToken(newToken)
    setIsConnected(true)

    if (newRepo) {
      const normalizedRepo = normalizeRepo(newRepo)
      localStorage.setItem('github_repo', normalizedRepo)
      setRepo(normalizedRepo)
      toast({
        title: 'GitHub connecté',
        description: `Repository: ${normalizedRepo}`,
      })
    } else {
      toast({
        title: 'GitHub connecté',
        description: 'Token configuré',
      })
    }
  }

  const disconnect = () => {
    localStorage.removeItem('github_token')
    localStorage.removeItem('github_repo')
    setToken('')
    setRepo('')
    setIsConnected(false)
    toast({
      title: 'GitHub déconnecté',
    })
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

    const repos: Array<{
      id: number
      name: string
      full_name: string
      description: string
      html_url: string
      default_branch: string
      private: boolean
      updated_at: string
    }> = []
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
