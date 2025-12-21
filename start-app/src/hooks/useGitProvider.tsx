import { useGitHub } from "./useGitHub";
import { useGitLab } from "./useGitLab";

export type GitProvider = "github" | "gitlab";

export interface GitRepository {
  id: string | number;
  name: string;
  fullName: string;
  description: string;
  url: string;
  defaultBranch: string;
  visibility: "public" | "private" | "internal";
  updatedAt: string;
}

export interface GitProviderActions {
  isConnected: boolean;
  token: string;
  repositoryId: string;
  connect: (token: string, repositoryId?: string) => void;
  disconnect: () => void;
  getRepositories: () => Promise<GitRepository[]>;
}

export const useGitProvider = (provider: GitProvider): GitProviderActions => {
  const github = useGitHub();
  const gitlab = useGitLab();

  if (provider === "github") {
    return {
      isConnected: github.isConnected,
      token: github.token,
      repositoryId: github.repo,
      connect: github.connect,
      disconnect: github.disconnect,
      getRepositories: async () => {
        const repos = await github.getUserRepositories();
        return repos.map((repo) => ({
          id: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description || "",
          url: repo.html_url,
          defaultBranch: repo.default_branch,
          visibility: repo.private ? ("private" as const) : ("public" as const),
          updatedAt: repo.updated_at,
        }));
      },
    };
  } else {
    return {
      isConnected: gitlab.isConnected,
      token: gitlab.token,
      repositoryId: gitlab.projectId,
      connect: gitlab.connect,
      disconnect: gitlab.disconnect,
      getRepositories: async () => {
        const projects = await gitlab.getUserProjects();
        return projects.map((project) => ({
          id: project.id,
          name: project.name,
          fullName: project.path_with_namespace,
          description: project.description || "",
          url: project.web_url,
          defaultBranch: project.default_branch,
          visibility: project.visibility,
          updatedAt: project.last_activity_at,
        }));
      },
    };
  }
};
