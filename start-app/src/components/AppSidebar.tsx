import * as React from 'react'
import {
  LayoutDashboard,
  ListTodo,
  FileText,
  Github,
  Gitlab,
  FolderKanban,
  Calendar,
  BarChart3,
  Users,
  Sun,
  Moon,
  Rocket,
  Settings,
  ChevronRight,
  Database,
} from 'lucide-react'
import { useRouterState } from '@tanstack/react-router'
import { useTheme } from 'next-themes'
import { NavLink } from '@/components/NavLink'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getIssuesCount, getUpdatesCount } from '@/server/db'

const mainNav = [
  { title: 'Overview', url: '/', icon: LayoutDashboard },
  { title: 'Issues', url: '/issues', icon: ListTodo },
  { title: 'Updates', url: '/updates', icon: FileText },
]

const providersNav = [
  { title: 'GitHub', url: '/provider/github', icon: Github },
  { title: 'GitLab', url: '/provider/gitlab', icon: Gitlab },
]

const workspaceNav = [
  { title: 'Projets', url: '/projects', icon: FolderKanban },
  { title: 'Sprints', url: '/sprints', icon: Calendar },
  { title: 'Analytics', url: '/analytics', icon: BarChart3 },
  { title: 'Équipe', url: '/team', icon: Users },
]

const devToolsNav = [
  { title: 'Overview', url: '/dev-tools', icon: LayoutDashboard },
  { title: 'Issues', url: '/dev-tools/issues', icon: ListTodo },
  { title: 'Updates', url: '/dev-tools/updates', icon: FileText },
  { title: 'Projets', url: '/dev-tools/projects', icon: FolderKanban },
  { title: 'Sprints', url: '/dev-tools/sprints', icon: Calendar },
  { title: 'Analytics', url: '/dev-tools/analytics', icon: BarChart3 },
  { title: 'Équipe', url: '/dev-tools/team', icon: Users },
]

// Component pour afficher le badge avec compte dynamique
function CountBadge({ count }: { count: number | string }) {
  if (count === 0) return null
  return (
    <span className="text-xs font-medium text-foreground/70">
      {count}
    </span>
  )
}

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const router = useRouterState()
  const location = { pathname: router.location.pathname }
  const { theme, setTheme } = useTheme()
  const [devToolsOpen, setDevToolsOpen] = React.useState(
    location.pathname.startsWith('/dev-tools'),
  )

  // Fetch dynamic counts
  const [issuesCount, setIssuesCount] = React.useState<number>(0)
  const [updatesCount, setUpdatesCount] = React.useState<number>(0)

  React.useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [issues, updates] = await Promise.all([
          getIssuesCount(),
          getUpdatesCount(),
        ])
        setIssuesCount(issues)
        setUpdatesCount(updates)
      } catch (error) {
        console.error('Error fetching counts:', error)
      }
    }
    fetchCounts()
  }, [])

  const isActive = (path: string) => {
    if (path.startsWith('/provider')) {
      return location.pathname.startsWith(path)
    }
    if (path.startsWith('/dev-tools')) {
      return location.pathname === path
    }
    return location.pathname === path
  }

  // Map mainNav with dynamic counts
  const mainNavWithCounts = mainNav.map((item) => {
    if (item.title === 'Issues') return { ...item, count: issuesCount }
    if (item.title === 'Updates') return { ...item, count: updatesCount }
    return item
  })

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 shadow-lg">
            <Rocket className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold leading-tight text-sidebar-foreground">
              Vol Tracker
            </span>
            <span className="text-xs text-sidebar-foreground/60">
              Issue Management
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wide text-sidebar-foreground/60">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavWithCounts.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{item.title}</span>
                      {'count' in item && item.count !== undefined && (
                        <CountBadge count={item.count} />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-xs uppercase tracking-wide text-sidebar-foreground/60">
            Providers
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {providersNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-xs uppercase tracking-wide text-sidebar-foreground/60">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workspaceNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isActive(item.url)}
                  >
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-xs uppercase tracking-wide text-sidebar-foreground/60">
            Dev Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible
                open={devToolsOpen}
                onOpenChange={setDevToolsOpen}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip="Dev Tools"
                      isActive={location.pathname.startsWith('/dev-tools')}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent"
                    >
                      <Database className="h-4 w-4 shrink-0 text-emerald-500" />
                      <span className="flex-1">Database Routes</span>
                      <Badge
                        variant="outline"
                        className="h-5 px-1.5 text-xs bg-emerald-500/15 text-emerald-500 border-emerald-500/20"
                      >
                        DB
                      </Badge>
                      <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {devToolsNav.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isActive(item.url)}
                          >
                            <NavLink
                              to={item.url}
                              end={item.url === '/dev-tools'}
                              className="flex items-center gap-2"
                              activeClassName="text-emerald-500 font-medium"
                            >
                              <item.icon className="h-3.5 w-3.5 shrink-0" />
                              <span>{item.title}</span>
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs text-sidebar-foreground/60">Thème</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 ring-2 ring-primary/20">
            <AvatarImage src="" alt="User" />
            <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
              PM
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              Paul de Marecaux
            </p>
            <p className="truncate text-xs text-sidebar-foreground/60">
              paul@example.com
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <NavLink to="/settings">
              <Settings className="h-4 w-4 text-sidebar-foreground/70" />
            </NavLink>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
