export interface GitHubUser {
  login: string
  avatar_url: string
  html_url: string
}

export interface GitHubLabel {
  id: number
  name: string
  color: string
  description?: string
}

export interface GitHubIssue {
  id: number
  number: number
  title: string
  body?: string
  state: 'open' | 'closed'
  html_url: string
  user: GitHubUser
  labels: GitHubLabel[]
  assignees: GitHubUser[]
  created_at: string
  updated_at: string
  closed_at?: string
  comments: number
}

export interface GitHubPullRequest {
  id: number
  number: number
  title: string
  body?: string
  state: 'open' | 'closed'
  html_url: string
  user: GitHubUser
  labels: GitHubLabel[]
  assignees: GitHubUser[]
  created_at: string
  updated_at: string
  closed_at?: string
  merged_at?: string
  draft: boolean
  head: {
    ref: string
    sha: string
  }
  base: {
    ref: string
  }
  mergeable_state: string
  comments: number
  review_comments: number
  commits: number
  additions: number
  deletions: number
}

export interface GitHubBranch {
  name: string
  commit: {
    sha: string
    url: string
  }
  protected: boolean
}

export interface GitHubWorkflowRun {
  id: number
  name: string
  status: 'queued' | 'in_progress' | 'completed'
  conclusion?: 'success' | 'failure' | 'cancelled' | 'skipped' | 'neutral'
  html_url: string
  created_at: string
  updated_at: string
  head_branch: string
  head_sha: string
  event: string
}

export interface GitHubCommit {
  sha: string
  commit: {
    message: string
    author: {
      name: string
      email: string
      date: string
    }
  }
  author?: GitHubUser
  html_url: string
}
