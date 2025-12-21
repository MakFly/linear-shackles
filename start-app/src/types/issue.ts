export type IssueStatus = 'done' | 'warning' | 'backlog' | 'progress'
export type IssuePriority = 'urgent' | 'high' | 'medium' | 'low' | 'none'
export type RelationType =
  | 'blocks'
  | 'blocked_by'
  | 'relates_to'
  | 'duplicates'
  | 'parent'
  | 'child'

export interface IssueRelationship {
  id: string
  type: RelationType
  targetIssueId: string
}

export interface CustomField {
  id: string
  name: string
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect'
  value: any
  options?: string[]
}

export interface Issue {
  id: string
  title: string
  status: IssueStatus
  priority: IssuePriority
  date?: string
  description?: string
  childrenCount?: number
  parentId?: string
  relationships?: IssueRelationship[]
  customFields?: CustomField[]
  labels?: string[]
  assignees?: string[]
  createdAt: string
  updatedAt: string
}

export interface IssueTemplate {
  id: string
  name: string
  description?: string
  defaultStatus: IssueStatus
  defaultPriority: IssuePriority
  customFields: Omit<CustomField, 'value'>[]
  labels?: string[]
}

export interface Automation {
  id: string
  name: string
  trigger: {
    type: 'status_change' | 'priority_change' | 'field_change'
    condition: any
  }
  action: {
    type: 'set_status' | 'set_priority' | 'add_label' | 'assign' | 'notify'
    value: any
  }
  enabled: boolean
}

export interface FilterConfig {
  id: string
  name: string
  status?: IssueStatus[]
  priority?: IssuePriority[]
  labels?: string[]
  assignees?: string[]
  search?: string
  dateRange?: {
    from?: string
    to?: string
  }
}

export type SprintStatus = 'planning' | 'active' | 'completed' | 'archived'

export interface SprintReview {
  id: string
  date: string
  summary: string
  completedIssues: number
  totalIssues: number
  velocity: number
  notes?: string
}

export interface Sprint {
  id: string
  name: string
  goal: string
  status: SprintStatus
  startDate: string
  endDate: string
  issues: string[] // issue IDs
  reviews?: SprintReview[]
  createdAt: string
  updatedAt: string
}
