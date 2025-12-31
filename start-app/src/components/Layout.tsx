import type { ReactNode } from 'react'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { SiteHeader } from '@/components/site-header'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider defaultOpen className="h-svh overflow-hidden">
      <div className="flex h-full w-full bg-background overflow-hidden">
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col h-full overflow-hidden">
          <SiteHeader />
          <div className="flex-1 min-h-0 overflow-hidden px-4 py-4 lg:px-6 lg:py-6 flex flex-col">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
