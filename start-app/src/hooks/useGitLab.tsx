import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import type {
  GitLabProject,
  GitLabIssue,
  GitLabMergeRequest,
  GitLabBranch,
  GitLabPipeline,
} from '@/types/gitlab'

const DEFAULT_GITLAB_URL = 'https://gitlab.tilvest.com'

const normalizeGitLabUrl = (url: string): string => {
  // Supprimer le trailing slash et /api/v4 s'il est présent
  let normalized = url.trim().replace(/\/+$/, '')
  normalized = normalized.replace(/\/api\/v4\/?$/, '')
  // S'assurer que l'URL commence par http(s)://
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https://${normalized}`
  }
  return normalized
}

const normalizeProjectId = (
  projectInput: string,
  gitlabUrl: string,
): string => {
  // Extraire le hostname de l'URL GitLab configurée
  let hostname: string
  try {
    hostname = new URL(gitlabUrl).hostname
  } catch {
    hostname = 'gitlab.com'
  }

  // Si c'est une URL GitLab complète, extraire project_id ou path
  // Support pour n'importe quel domaine GitLab
  const gitlabUrlRegex = new RegExp(
    `${hostname.replace(/\./g, '\\.')}[/:]([^/]+)\\/([^/]+?)(?:\\.git|\\/|$)`,
  )
  const gitlabUrlMatch = projectInput.match(gitlabUrlRegex)
  if (gitlabUrlMatch) {
    return `${gitlabUrlMatch[1]}/${gitlabUrlMatch[2]}`
  }

  // Fallback: essayer avec un pattern générique pour les URLs Git
  const genericUrlMatch = projectInput.match(
    /(?:https?:\/\/[^/]+)[/:]([^/]+)\/([^/]+?)(?:\.git|\/|$)/,
  )
  if (genericUrlMatch) {
    return `${genericUrlMatch[1]}/${genericUrlMatch[2]}`
  }

  // Si c'est un ID numérique, retourner tel quel
  if (/^\d+$/.test(projectInput.trim())) {
    return projectInput.trim()
  }
  // Sinon, retourner tel quel (déjà au format owner/repo ou path)
  return projectInput.trim()
}

export const useGitLab = () => {
  const [token, setToken] = useState<string>('')
  const [projectId, setProjectId] = useState<string>('')
  const [gitlabUrl, setGitlabUrl] = useState<string>(DEFAULT_GITLAB_URL)
  const [isConnected, setIsConnected] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const savedToken = localStorage.getItem('gitlab_token')
    const savedProjectId = localStorage.getItem('gitlab_project_id')
    const savedUrl = localStorage.getItem('gitlab_url')

    if (savedUrl) {
      const normalizedUrl = normalizeGitLabUrl(savedUrl)
      setGitlabUrl(normalizedUrl)
    }

    if (savedToken) setToken(savedToken)
    if (savedProjectId) {
      const currentUrl = savedUrl
        ? normalizeGitLabUrl(savedUrl)
        : DEFAULT_GITLAB_URL
      const normalizedProjectId = normalizeProjectId(savedProjectId, currentUrl)
      setProjectId(normalizedProjectId)
      if (normalizedProjectId !== savedProjectId) {
        localStorage.setItem('gitlab_project_id', normalizedProjectId)
      }
    }
    // Se connecter si on a un token (même sans projet pour lister les projets)
    if (savedToken) setIsConnected(true)
  }, [])

  const connect = (
    newToken: string,
    newProjectId?: string,
    newUrl?: string,
  ) => {
    const url = newUrl ? normalizeGitLabUrl(newUrl) : gitlabUrl
    localStorage.setItem('gitlab_token', newToken)
    localStorage.setItem('gitlab_url', url)
    setToken(newToken)
    setGitlabUrl(url)
    setIsConnected(true)

    if (newProjectId) {
      const normalizedProjectId = normalizeProjectId(newProjectId, url)
      localStorage.setItem('gitlab_project_id', normalizedProjectId)
      setProjectId(normalizedProjectId)
      toast({
        title: 'GitLab connecté',
        description: `Projet: ${normalizedProjectId}`,
      })
    } else {
      toast({
        title: 'GitLab connecté',
        description: `Connecté à ${url}`,
      })
    }
  }

  const disconnect = () => {
    localStorage.removeItem('gitlab_token')
    localStorage.removeItem('gitlab_project_id')
    localStorage.removeItem('gitlab_url')
    setToken('')
    setProjectId('')
    setGitlabUrl(DEFAULT_GITLAB_URL)
    setIsConnected(false)
    toast({
      title: 'GitLab déconnecté',
    })
  }

  const getApiBase = () => `${gitlabUrl}/api/v4`

  const makeRequest = async <T,>(endpoint: string): Promise<T> => {
    if (!token || !projectId) {
      throw new Error('GitLab not connected')
    }

    // Encoder le projectId si c'est un path (owner/repo)
    const encodedProjectId = encodeURIComponent(projectId)

    const response = await fetch(
      `${getApiBase()}/projects/${encodedProjectId}${endpoint}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Éviter les 304 Not Modified
      },
    )

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: `GitLab API error: ${response.status}` }))
      throw new Error(error.message || `GitLab API error: ${response.status}`)
    }

    return response.json()
  }

  const getUserProjects = async (): Promise<Array<GitLabProject>> => {
    if (!token) {
      throw new Error('GitLab not connected')
    }

    const projects: Array<GitLabProject> = []
    let page = 1
    const perPage = 100

    while (true) {
      // Ne pas utiliser membership=true pour voir tous les projets accessibles (internal/public)
      const response = await fetch(
        `${getApiBase()}/projects?per_page=${perPage}&page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        },
      )

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ message: `GitLab API error: ${response.status}` }))
        throw new Error(error.message || `GitLab API error: ${response.status}`)
      }

      const data: GitLabProject[] = await response.json()
      projects.push(...data)

      // Si on a moins de résultats que perPage, c'est la dernière page
      if (data.length < perPage) {
        break
      }
      page++
    }

    return projects
  }

  const getIssues = async (state: 'opened' | 'closed' | 'all' = 'opened') => {
    const stateParam = state === 'all' ? '' : `&state=${state}`
    return makeRequest<GitLabIssue[]>(`/issues?per_page=100${stateParam}`)
  }

  const getMergeRequests = async (
    state: 'opened' | 'closed' | 'merged' | 'all' = 'opened',
  ) => {
    const stateParam = state === 'all' ? '' : `&state=${state}`
    return makeRequest<GitLabMergeRequest[]>(
      `/merge_requests?per_page=100${stateParam}`,
    )
  }

  const getBranches = async () => {
    return makeRequest<GitLabBranch[]>('/repository/branches?per_page=100')
  }

  const getPipelines = async () => {
    return makeRequest<GitLabPipeline[]>('/pipelines?per_page=50')
  }

  const createIssue = async (
    title: string,
    description?: string,
    labels?: Array<string>,
  ) => {
    if (!token || !projectId) throw new Error('GitLab not connected')

    const encodedProjectId = encodeURIComponent(projectId)

    const body: Record<string, unknown> = { title }
    if (description) body.description = description
    if (labels && labels.length > 0) body.labels = labels.join(',')

    const response = await fetch(
      `${getApiBase()}/projects/${encodedProjectId}/issues`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        cache: 'no-store',
      },
    )

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: 'Failed to create issue' }))
      throw new Error(error.message || 'Failed to create issue')
    }

    return response.json()
  }

  const closeIssue = async (issueIid: number) => {
    if (!token || !projectId) throw new Error('GitLab not connected')

    const encodedProjectId = encodeURIComponent(projectId)

    const response = await fetch(
      `${getApiBase()}/projects/${encodedProjectId}/issues/${issueIid}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ state_event: 'close' }),
        cache: 'no-store',
      },
    )

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: 'Failed to close issue' }))
      throw new Error(error.message || 'Failed to close issue')
    }

    return response.json()
  }

  return {
    isConnected,
    token,
    projectId,
    gitlabUrl,
    connect,
    disconnect,
    getUserProjects,
    getIssues,
    getMergeRequests,
    getBranches,
    getPipelines,
    createIssue,
    closeIssue,
  }
}
