import type { Issue, Project, Sprint, TeamMember, Update } from "@/db/schema";

const now = new Date().toISOString();

export const mockIssues: Issue[] = [
  { 
    id: "POWL-96", 
    title: "Déclaration Vol", 
    status: "warning", 
    priority: "urgent",
    childrenCount: 5,
    labels: ["urgent", "legal"],
    assignees: ["pauldemarécaux"],
    createdAt: "2024-11-14",
    updatedAt: "2024-11-14",
  },
  { 
    id: "POWL-101", 
    title: "Aller à Police Saint Jean de Luz", 
    status: "warning",
    priority: "high",
    assignees: ["pauldemarécaux"],
    createdAt: "2024-11-14",
    updatedAt: "2024-11-14",
  },
  { id: "POWL-100", title: "Pré-Plainte en ligne", status: "done", priority: "high", assignees: ["pauldemarécaux"], createdAt: "2024-11-14", updatedAt: "2024-11-14" },
  { id: "POWL-99", title: "Contexte", status: "done", priority: "medium", createdAt: "2024-11-14", updatedAt: "2024-11-14" },
  { id: "POWL-98", title: "Liste des éléments dans le SAC", status: "done", priority: "medium", createdAt: "2024-11-14", updatedAt: "2024-11-14" },
  { id: "POWL-97", title: "Mode Sentinelle", status: "done", priority: "low", createdAt: "2024-11-14", updatedAt: "2024-11-14" },
  { id: "POWL-92", title: "Voiture", status: "done", priority: "high", childrenCount: 3, createdAt: "2024-11-14", updatedAt: "2024-11-14" },
  { id: "POWL-87", title: "Téléphone", status: "done", priority: "high", childrenCount: 4, labels: ["replacement"], createdAt: "2024-11-14", updatedAt: "2024-11-14" },
  { id: "POWL-77", title: "Carte bancaire", status: "done", priority: "urgent", childrenCount: 4, createdAt: "2024-11-14", updatedAt: "2024-11-14" },
  { id: "POWL-82", title: "Permis de conduire", status: "warning", priority: "high", childrenCount: 4, createdAt: "2024-11-14", updatedAt: "2024-11-14" },
  { id: "POWL-86", title: "Timbre Fiscale", status: "done", priority: "medium", date: "Nov 14", createdAt: "2024-11-14", updatedAt: "2024-11-14" },
  { id: "POWL-85", title: "Photo identité", status: "progress", priority: "medium", date: "Nov 14", createdAt: "2024-11-14", updatedAt: "2024-11-14" },
  { id: "POWL-84", title: "Récipissé de Police", status: "warning", priority: "high", date: "Nov 14", createdAt: "2024-11-14", updatedAt: "2024-11-14" },
  { id: "POWL-83", title: "Justificatif de domicile", status: "done", priority: "medium", date: "Nov 14", createdAt: "2024-11-14", updatedAt: "2024-11-14" },
  { id: "POWL-71", title: "Carte Nationale d'Identité", status: "warning", priority: "urgent", childrenCount: 5, createdAt: "2024-11-14", updatedAt: "2024-11-14" },
  { id: "POWL-76", title: "Récipissé de Police", status: "backlog", priority: "medium", date: "Nov 14", createdAt: "2024-11-14", updatedAt: "2024-11-14" },
  { id: "POWL-75", title: "Justificatif de domicile", status: "done", priority: "low", date: "Nov 14", createdAt: "2024-11-14", updatedAt: "2024-11-14" },
  { id: "POWL-74", title: "Photo Identité", status: "progress", priority: "medium", date: "Nov 14", createdAt: "2024-11-14", updatedAt: "2024-11-14" },
  { id: "POWL-110", title: "Migration base de données", status: "progress", priority: "urgent", assignees: ["marie.dupont"], labels: ["backend", "database"], createdAt: "2024-11-15", updatedAt: "2024-11-15" },
  { id: "POWL-111", title: "Refactoring composants UI", status: "progress", priority: "high", assignees: ["jean.martin"], labels: ["frontend", "refactoring"], childrenCount: 8, createdAt: "2024-11-15", updatedAt: "2024-11-15" },
  { id: "POWL-112", title: "Tests d'intégration API", status: "backlog", priority: "high", labels: ["testing", "api"], createdAt: "2024-11-15", updatedAt: "2024-11-15" },
  { id: "POWL-113", title: "Documentation technique", status: "done", priority: "medium", assignees: ["sophie.bernard"], labels: ["docs"], createdAt: "2024-11-15", updatedAt: "2024-11-15" },
  { id: "POWL-114", title: "Optimisation performance", status: "warning", priority: "high", assignees: ["lucas.petit"], labels: ["performance", "optimization"], childrenCount: 3, createdAt: "2024-11-15", updatedAt: "2024-11-15" },
  { id: "POWL-115", title: "Sécurité authentification", status: "progress", priority: "urgent", assignees: ["emma.robert"], labels: ["security", "auth"], createdAt: "2024-11-15", updatedAt: "2024-11-15" },
  { id: "POWL-116", title: "Design système couleurs", status: "done", priority: "low", assignees: ["hugo.moreau"], labels: ["design", "ui"], createdAt: "2024-11-15", updatedAt: "2024-11-15" },
  { id: "POWL-117", title: "Intégration Stripe", status: "backlog", priority: "high", labels: ["payment", "integration"], childrenCount: 5, createdAt: "2024-11-15", updatedAt: "2024-11-15" },
  { id: "POWL-118", title: "Notifications push", status: "progress", priority: "medium", assignees: ["lea.laurent"], labels: ["notifications", "mobile"], createdAt: "2024-11-15", updatedAt: "2024-11-15" },
  { id: "POWL-119", title: "Export données CSV", status: "done", priority: "low", assignees: ["thomas.garcia"], labels: ["export", "feature"], createdAt: "2024-11-15", updatedAt: "2024-11-15" },
  { id: "POWL-120", title: "Mode hors ligne", status: "backlog", priority: "medium", labels: ["offline", "pwa"], childrenCount: 4, createdAt: "2024-11-15", updatedAt: "2024-11-15" },
  { id: "POWL-121", title: "Tableau de bord analytics", status: "warning", priority: "high", assignees: ["camille.roux"], labels: ["analytics", "dashboard"], createdAt: "2024-11-15", updatedAt: "2024-11-15" },
  { id: "POWL-122", title: "Internationalisation i18n", status: "progress", priority: "medium", assignees: ["antoine.blanc"], labels: ["i18n", "localization"], childrenCount: 12, createdAt: "2024-11-15", updatedAt: "2024-11-15" },
  { id: "POWL-123", title: "Accessibilité WCAG", status: "backlog", priority: "high", labels: ["a11y", "accessibility"], createdAt: "2024-11-15", updatedAt: "2024-11-15" },
  { id: "POWL-124", title: "CI/CD Pipeline", status: "done", priority: "urgent", assignees: ["julie.faure"], labels: ["devops", "ci-cd"], createdAt: "2024-11-15", updatedAt: "2024-11-15" },
  { id: "POWL-125", title: "Monitoring production", status: "progress", priority: "high", assignees: ["nicolas.henry"], labels: ["monitoring", "observability"], createdAt: "2024-11-15", updatedAt: "2024-11-15" },
];

export const mockProjects: Project[] = [
  {
    id: "proj-1",
    name: "Vol Tracker App",
    description: "Application de suivi des déclarations de vol",
    status: "active",
    progress: 65,
    members: 4,
    issuesCount: 18,
    dueDate: "2024-12-15",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "proj-2",
    name: "Dashboard Analytics",
    description: "Tableaux de bord et visualisation des données",
    status: "active",
    progress: 40,
    members: 3,
    issuesCount: 12,
    dueDate: "2024-12-20",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "proj-3",
    name: "Mobile App",
    description: "Application mobile React Native",
    status: "paused",
    progress: 25,
    members: 2,
    issuesCount: 8,
    dueDate: "2025-01-15",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "proj-4",
    name: "API v2",
    description: "Nouvelle version de l'API REST",
    status: "completed",
    progress: 100,
    members: 5,
    issuesCount: 0,
    dueDate: "2024-11-01",
    createdAt: now,
    updatedAt: now,
  },
];

export const mockSprints: Sprint[] = [
  {
    id: "SPRINT-1",
    name: "Sprint 1 - Q4 2024",
    goal: "Finaliser les démarches administratives suite au vol",
    status: "active",
    startDate: "2024-11-10",
    endDate: "2024-11-24",
    issues: ["POWL-96", "POWL-101", "POWL-100", "POWL-99"],
    velocity: 24,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "SPRINT-2",
    name: "Sprint 2 - Reconstruction",
    goal: "Remplacer tous les documents perdus",
    status: "planning",
    startDate: "2024-11-25",
    endDate: "2024-12-08",
    issues: ["POWL-85", "POWL-84"],
    velocity: 0,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "sprint-12",
    name: "Sprint 12",
    goal: "Finaliser la déclaration de vol et les documents",
    status: "active",
    startDate: "2024-11-11",
    endDate: "2024-11-25",
    issues: [],
    velocity: 24,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "sprint-11",
    name: "Sprint 11",
    goal: "Améliorer le système de notifications",
    status: "completed",
    startDate: "2024-10-28",
    endDate: "2024-11-10",
    issues: [],
    velocity: 28,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "sprint-13",
    name: "Sprint 13",
    goal: "Intégration GitHub et CI/CD",
    status: "planning",
    startDate: "2024-11-25",
    endDate: "2024-12-09",
    issues: [],
    velocity: 0,
    createdAt: now,
    updatedAt: now,
  },
];

export const mockTeamMembers: TeamMember[] = [
  {
    id: "user-1",
    name: "Paul de Marécaux",
    email: "paul@example.com",
    role: "owner",
    issuesAssigned: 12,
    issuesCompleted: 8,
    status: "online",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "user-2",
    name: "Marie Dupont",
    email: "marie.dupont@example.com",
    role: "admin",
    issuesAssigned: 8,
    issuesCompleted: 6,
    status: "online",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "user-3",
    name: "Jean Martin",
    email: "jean.martin@example.com",
    role: "member",
    issuesAssigned: 15,
    issuesCompleted: 10,
    status: "away",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "user-4",
    name: "Sophie Bernard",
    email: "sophie.bernard@example.com",
    role: "member",
    issuesAssigned: 6,
    issuesCompleted: 6,
    status: "offline",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "user-5",
    name: "Lucas Petit",
    email: "lucas.petit@example.com",
    role: "member",
    issuesAssigned: 10,
    issuesCompleted: 5,
    status: "online",
    createdAt: now,
    updatedAt: now,
  },
];

export const mockUpdates: Update[] = [
  {
    id: "update-1",
    type: "review",
    author: "pauldemarécaux",
    content: "Revue du Sprint 1 - Q4 2024 ajoutée",
    timestamp: "2024-11-14T16:30:00",
    metadata: { sprintName: "Sprint 1 - Q4 2024" },
  },
  {
    id: "update-2",
    type: "status_change",
    author: "pauldemarécaux",
    content: "a changé le statut de",
    timestamp: "2024-11-14T15:20:00",
    metadata: {
      issueId: "POWL-100",
      issueTitle: "Pré-Plainte en ligne",
      oldStatus: "progress",
      newStatus: "done",
    },
  },
  {
    id: "update-3",
    type: "sprint_created",
    author: "pauldemarécaux",
    content: "a créé un nouveau sprint",
    timestamp: "2024-11-14T14:00:00",
    metadata: { sprintName: "Sprint 2 - Reconstruction" },
  },
  {
    id: "update-4",
    type: "comment",
    author: "Marie Dubois",
    content: "N'oublie pas d'apporter tous les documents nécessaires !",
    timestamp: "2024-11-14T13:45:00",
    metadata: {
      issueId: "POWL-101",
      issueTitle: "Aller à Police Saint Jean de Luz",
    },
  },
  {
    id: "update-5",
    type: "relationship",
    author: "pauldemarécaux",
    content: "a ajouté une relation 'blocked_by' entre",
    timestamp: "2024-11-14T12:30:00",
    metadata: {
      issueId: "POWL-101",
      issueTitle: "Aller à Police Saint Jean de Luz",
    },
  },
  {
    id: "update-6",
    type: "issue_created",
    author: "pauldemarécaux",
    content: "a créé une nouvelle issue",
    timestamp: "2024-11-14T10:15:00",
    metadata: {
      issueId: "POWL-96",
      issueTitle: "Déclaration Vol",
      priority: "urgent",
    },
  },
  {
    id: "update-7",
    type: "status_change",
    author: "pauldemarécaux",
    content: "a changé le statut de",
    timestamp: "2024-11-14T09:00:00",
    metadata: {
      issueId: "POWL-99",
      issueTitle: "Contexte",
      oldStatus: "progress",
      newStatus: "done",
    },
  },
  {
    id: "update-8",
    type: "sprint_created",
    author: "pauldemarécaux",
    content: "a créé un nouveau sprint",
    timestamp: "2024-11-13T16:00:00",
    metadata: { sprintName: "Sprint 1 - Q4 2024" },
  },
];

// Mock functions that match the API from db.ts
export const getMockIssues = async () => {
  return mockIssues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getMockSprints = async () => {
  return mockSprints.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getMockProjects = async () => {
  return mockProjects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getMockAnalyticsData = async () => {
  const issuesByStatus = {
    done: mockIssues.filter(i => i.status === "done").length,
    progress: mockIssues.filter(i => i.status === "progress").length,
    warning: mockIssues.filter(i => i.status === "warning").length,
    backlog: mockIssues.filter(i => i.status === "backlog").length,
  };
  
  const issuesByPriority = {
    urgent: mockIssues.filter(i => i.priority === "urgent").length,
    high: mockIssues.filter(i => i.priority === "high").length,
    medium: mockIssues.filter(i => i.priority === "medium").length,
    low: mockIssues.filter(i => i.priority === "low").length,
    none: mockIssues.filter(i => i.priority === "none").length,
  };
  
  const activeSprint = mockSprints.find(s => s.status === "active");
  
  return {
    totalIssues: mockIssues.length,
    issuesByStatus,
    issuesByPriority,
    activeSprint,
    sprints: mockSprints,
  };
};

export const getMockTeamMembers = async () => {
  return mockTeamMembers.sort((a, b) => a.name.localeCompare(b.name));
};

export const getMockUpdates = async () => {
  return mockUpdates.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};
