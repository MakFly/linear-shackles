import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type {
  GitLabProject,
  GitLabIssue,
  GitLabMergeRequest,
  GitLabBranch,
  GitLabPipeline,
} from "@/types/gitlab";

const GITLAB_API_BASE = "https://gitlab.com/api/v4";

const normalizeProjectId = (projectInput: string): string => {
  // Si c'est une URL GitLab complète, extraire project_id ou path
  const gitlabUrlMatch = projectInput.match(/gitlab\.com[/:]([^/]+)\/([^/]+?)(?:\.git|\/|$)/);
  if (gitlabUrlMatch) {
    return `${gitlabUrlMatch[1]}/${gitlabUrlMatch[2]}`;
  }
  // Si c'est un ID numérique, retourner tel quel
  if (/^\d+$/.test(projectInput.trim())) {
    return projectInput.trim();
  }
  // Sinon, retourner tel quel (déjà au format owner/repo ou path)
  return projectInput.trim();
};

export const useGitLab = () => {
  const [token, setToken] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedToken = localStorage.getItem("gitlab_token");
    const savedProjectId = localStorage.getItem("gitlab_project_id");
    if (savedToken) setToken(savedToken);
    if (savedProjectId) {
      const normalizedProjectId = normalizeProjectId(savedProjectId);
      setProjectId(normalizedProjectId);
      if (normalizedProjectId !== savedProjectId) {
        localStorage.setItem("gitlab_project_id", normalizedProjectId);
      }
    }
    // Se connecter si on a un token (même sans projet pour lister les projets)
    if (savedToken) setIsConnected(true);
  }, []);

  const connect = (newToken: string, newProjectId?: string) => {
    localStorage.setItem("gitlab_token", newToken);
    setToken(newToken);
    setIsConnected(true);
    
    if (newProjectId) {
      const normalizedProjectId = normalizeProjectId(newProjectId);
      localStorage.setItem("gitlab_project_id", normalizedProjectId);
      setProjectId(normalizedProjectId);
      toast({
        title: "GitLab connecté",
        description: `Projet: ${normalizedProjectId}`,
      });
    } else {
      toast({
        title: "GitLab connecté",
        description: "Token configuré",
      });
    }
  };

  const disconnect = () => {
    localStorage.removeItem("gitlab_token");
    localStorage.removeItem("gitlab_project_id");
    setToken("");
    setProjectId("");
    setIsConnected(false);
    toast({
      title: "GitLab déconnecté",
    });
  };

  const makeRequest = async <T,>(endpoint: string): Promise<T> => {
    if (!token || !projectId) {
      throw new Error("GitLab not connected");
    }

    // Encoder le projectId si c'est un path (owner/repo)
    const encodedProjectId = encodeURIComponent(projectId);

    const response = await fetch(`${GITLAB_API_BASE}/projects/${encodedProjectId}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: `GitLab API error: ${response.status}` }));
      throw new Error(error.message || `GitLab API error: ${response.status}`);
    }

    return response.json();
  };

  const getUserProjects = async (): Promise<GitLabProject[]> => {
    if (!token) {
      throw new Error("GitLab not connected");
    }

    const projects: GitLabProject[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const response = await fetch(`${GITLAB_API_BASE}/projects?membership=true&per_page=${perPage}&page=${page}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `GitLab API error: ${response.status}` }));
        throw new Error(error.message || `GitLab API error: ${response.status}`);
      }

      const data: GitLabProject[] = await response.json();
      projects.push(...data);

      // Si on a moins de résultats que perPage, c'est la dernière page
      if (data.length < perPage) {
        break;
      }
      page++;
    }

    return projects;
  };

  const getIssues = async (state: "opened" | "closed" | "all" = "opened") => {
    const stateParam = state === "all" ? "" : `&state=${state}`;
    return makeRequest<GitLabIssue[]>(`/issues?per_page=100${stateParam}`);
  };

  const getMergeRequests = async (state: "opened" | "closed" | "merged" | "all" = "opened") => {
    const stateParam = state === "all" ? "" : `&state=${state}`;
    return makeRequest<GitLabMergeRequest[]>(`/merge_requests?per_page=100${stateParam}`);
  };

  const getBranches = async () => {
    return makeRequest<GitLabBranch[]>("/repository/branches?per_page=100");
  };

  const getPipelines = async () => {
    return makeRequest<GitLabPipeline[]>("/pipelines?per_page=50");
  };

  const createIssue = async (title: string, description?: string, labels?: string[]) => {
    if (!token || !projectId) throw new Error("GitLab not connected");

    const encodedProjectId = encodeURIComponent(projectId);

    const body: Record<string, unknown> = { title };
    if (description) body.description = description;
    if (labels && labels.length > 0) body.labels = labels.join(",");

    const response = await fetch(`${GITLAB_API_BASE}/projects/${encodedProjectId}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to create issue" }));
      throw new Error(error.message || "Failed to create issue");
    }

    return response.json();
  };

  return {
    isConnected,
    token,
    projectId,
    connect,
    disconnect,
    getUserProjects,
    getIssues,
    getMergeRequests,
    getBranches,
    getPipelines,
    createIssue,
  };
};
