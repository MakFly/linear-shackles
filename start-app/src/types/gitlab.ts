export interface GitLabUser {
  id: number;
  username: string;
  name: string;
  avatar_url: string;
  web_url: string;
}

export interface GitLabProject {
  id: number;
  name: string;
  name_with_namespace: string;
  path: string;
  path_with_namespace: string;
  description: string;
  default_branch: string;
  visibility: "private" | "internal" | "public";
  web_url: string;
  http_url_to_repo: string;
  ssh_url_to_repo: string;
  created_at: string;
  last_activity_at: string;
  star_count: number;
  forks_count: number;
  open_issues_count: number;
  archived: boolean;
}

export interface GitLabLabel {
  id: number;
  title: string;
  color: string;
  description?: string;
  text_color: string;
}

export interface GitLabIssue {
  id: number;
  iid: number;
  title: string;
  description?: string;
  state: "opened" | "closed";
  web_url: string;
  author: GitLabUser;
  assignees: GitLabUser[];
  labels: GitLabLabel[];
  created_at: string;
  updated_at: string;
  closed_at?: string;
  user_notes_count: number;
  due_date?: string;
  milestone?: {
    id: number;
    title: string;
    state: string;
  };
}

export interface GitLabMergeRequest {
  id: number;
  iid: number;
  title: string;
  description?: string;
  state: "opened" | "closed" | "merged" | "locked";
  web_url: string;
  author: GitLabUser;
  assignees: GitLabUser[];
  reviewers: GitLabUser[];
  labels: GitLabLabel[];
  created_at: string;
  updated_at: string;
  merged_at?: string;
  closed_at?: string;
  source_branch: string;
  target_branch: string;
  merge_status: string;
  draft: boolean;
  work_in_progress: boolean;
  user_notes_count: number;
  changes_count: string;
  commits_count: number;
}

export interface GitLabPipeline {
  id: number;
  iid: number;
  project_id: number;
  sha: string;
  ref: string;
  status: "created" | "waiting_for_resource" | "preparing" | "pending" | "running" | "success" | "failed" | "canceled" | "skipped" | "manual" | "scheduled";
  web_url: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  finished_at?: string;
  duration?: number;
  source: string;
  name: string;
}

export interface GitLabBranch {
  name: string;
  merged: boolean;
  protected: boolean;
  default: boolean;
  developers_can_push: boolean;
  developers_can_merge: boolean;
  can_push: boolean;
  web_url: string;
  commit: {
    id: string;
    short_id: string;
    title: string;
    message: string;
    author_name: string;
    author_email: string;
    authored_date: string;
    committer_name: string;
    committer_email: string;
    committed_date: string;
    created_at: string;
  };
}

export interface GitLabCommit {
  id: string;
  short_id: string;
  title: string;
  message: string;
  author_name: string;
  author_email: string;
  authored_date: string;
  committer_name: string;
  committer_email: string;
  committed_date: string;
  created_at: string;
  web_url: string;
}
