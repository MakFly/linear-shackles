import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import type {
  GitLabProject,
  GitLabIssue,
  GitLabMergeRequest,
  GitLabBranch,
  GitLabPipeline,
} from '@/types/gitlab'
import {
  getProviderCredentials,
  saveProviderCredentials,
  deleteProviderCredentials,
} from '@/server/db'

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

export const useGitLab = (options?: { mode: 'global' | 'project'; projectId?: string }) => {
  const mode = options?.mode || 'global'
  const projectId = options?.projectId || 'global'

  const [token, setToken] = useState<string>('')
  const [projectIdState, setProjectIdState] = useState<string>('')
  const [gitlabUrl, setGitlabUrl] = useState<string>(DEFAULT_GITLAB_URL)
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(false)

  // Load credentials from DB ONLY
  useEffect(() => {
    const loadCredentials = async () => {
      setLoading(true)
      try {
        // First try: load project-specific credentials
        let credential = await getProviderCredentials({
          data: { projectId, provider: 'gitlab' },
        })

        // Fallback: if no project-specific credentials and mode is 'project', try 'global'
        if (!credential && mode === 'project') {
          credential = await getProviderCredentials({
            data: { projectId: 'global', provider: 'gitlab' },
          })

          // If global credentials found, save them for this project
          if (credential) {
            await saveProviderCredentials({
              data: {
                projectId,
                provider: 'gitlab',
                token: credential.token,
                providerUrl: credential.providerUrl,
                providerRepo: credential.providerRepo || null,
              },
            })
          }
        }

        if (credential) {
          setToken(credential.token)
          if (credential.providerUrl) {
            setGitlabUrl(credential.providerUrl)
          }
          if (credential.providerRepo) {
            setProjectIdState(credential.providerRepo)
          }
          setIsConnected(true)
        } else {
          // No credentials found
          setToken('')
          setProjectIdState('')
          setGitlabUrl(DEFAULT_GITLAB_URL)
          setIsConnected(false)
        }
      } catch (error) {
        console.error('Error loading GitLab credentials:', error)
        setToken('')
        setProjectIdState('')
        setGitlabUrl(DEFAULT_GITLAB_URL)
        setIsConnected(false)
      } finally {
        setLoading(false)
      }
    }

    loadCredentials()
  }, [projectId, mode])

  const connect = async (
    newToken: string,
    newProjectId?: string,
    newUrl?: string,
  ) => {
    const url = newUrl ? normalizeGitLabUrl(newUrl) : gitlabUrl

    setLoading(true)
    try {
      // Save ONLY to DB
      await saveProviderCredentials({
        data: {
          projectId,
          provider: 'gitlab',
          token: newToken,
          providerUrl: url,
          providerRepo: newProjectId || null,
        },
      })

      // Update local state
      setToken(newToken)
      setGitlabUrl(url)
      setIsConnected(true)

      if (newProjectId) {
        const normalizedProjectId = normalizeProjectId(newProjectId, url)
        setProjectIdState(normalizedProjectId)
        toast.success('GitLab connecté', {
          description: `Projet: ${normalizedProjectId}`,
        })
      } else {
        toast.success('GitLab connecté', {
          description: `Connecté à ${url}`,
        })
      }
    } catch (error) {
      console.error('Error connecting GitLab:', error)
      toast.error('Erreur lors de la connexion GitLab')
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
        data: { projectId, provider: 'gitlab' },
      })

      // Update local state
      setToken('')
      setProjectIdState('')
      setGitlabUrl(DEFAULT_GITLAB_URL)
      setIsConnected(false)
      toast.success('GitLab déconnecté')
    } catch (error) {
      console.error('Error disconnecting GitLab:', error)
      toast.error('Erreur lors de la déconnexion GitLab')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const getApiBase = () => `${gitlabUrl}/api/v4`

  const makeRequest = async <T,>(endpoint: string): Promise<T> => {
    if (!token || !projectIdState) {
      throw new Error('GitLab not connected')
    }

    // Encoder le projectId si c'est un path (owner/repo)
    const encodedProjectId = encodeURIComponent(projectIdState)

    const response = await fetch(
      `${getApiBase()}/projects/${encodedProjectId}${endpoint}`,
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

    return response.json()
  }

  const getUserProjects = async (): Promise<GitLabProject[]> => {
    if (!token) {
      throw new Error('GitLab not connected')
    }

    const projects: GitLabProject[] = []
    let page = 1
    const perPage = 100

    while (true) {
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
    labels?: string[],
  ) => {
    if (!token || !projectIdState) throw new Error('GitLab not connected')

    const encodedProjectId = encodeURIComponent(projectIdState)

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
    if (!token || !projectIdState) throw new Error('GitLab not connected')

    const encodedProjectId = encodeURIComponent(projectIdState)

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
    projectId: projectIdState,
    gitlabUrl,
    loading,
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
