import { useMatches, Link } from '@tanstack/react-router'
import React from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { useMemo } from 'react'

// Helper: Convertir un slug en titre lisible
function formatSlugTitle(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Helper: Extraire le titre depuis le pathname
function pathnameToTitle(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean)

  if (parts.length === 0) return 'Accueil'

  // Routes spéciales
  if (parts[0] === 'projects') {
    if (parts.length === 1) return 'Projets'
    // Pour les pages de projet, le nom du projet sera extrait via loader data
    if (parts[2]) {
      const subPage = parts[2]
      if (subPage === 'issues') return 'Issues'
      if (subPage === 'analytics') return 'Analytics'
      if (subPage === 'settings') return 'Paramètres'
      if (subPage === 'github') return 'GitHub'
      if (subPage === 'gitlab') return 'GitLab'
      return formatSlugTitle(subPage)
    }
    return 'Projet'
  }

  if (parts[0] === 'sprints') return 'Sprints'
  if (parts[0] === 'issues') return 'Issues'
  if (parts[0] === 'team') return 'Équipe'
  if (parts[0] === 'updates') return 'Activité'
  if (parts[0] === 'analytics') return 'Analytics'
  if (parts[0] === 'settings') return 'Paramètres'

  return formatSlugTitle(parts[parts.length - 1] || 'Accueil')
}

export function SiteHeader() {
  const matches = useMatches()

  // Construire le breadcrumb dynamiquement depuis les routes + loader data
  const breadcrumbs = useMemo(() => {
    const items: { label: string; href?: string }[] = []

    // Parcourir les routes pour construire le breadcrumb
    for (const match of matches) {
      // Ignorer la racine
      if (match.pathname === '/') continue

      let label: string

      // Check si cette route a des loader data avec un project
      const loaderData = match.loaderData as
        | { project?: { name: string } }
        | undefined
      if (loaderData?.project?.name) {
        // Pour les routes de projet, utiliser le nom réel du projet
        label = loaderData.project.name
      } else {
        // Sinon, extraire depuis le pathname
        label = pathnameToTitle(match.pathname)
      }

      items.push({ label, href: match.pathname })
    }

    // Ajouter "Accueil" au début
    return [{ label: 'Accueil', href: '/' }, ...items]
  }, [matches])

  // Titre de page basé sur la route actuelle
  const pageTitle = useMemo(() => {
    const lastItem = breadcrumbs[breadcrumbs.length - 1]
    return lastItem.label || 'Linear Shackles'
  }, [breadcrumbs])

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-3 px-4 lg:gap-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />

        {/* Breadcrumb dynamique */}
        <Breadcrumb className="hidden sm:flex">
          <BreadcrumbList>
            {breadcrumbs.slice(-3).map((item, index) => {
              // Afficher seulement les 3 derniers éléments pour éviter surcharge
              const actualIndex = breadcrumbs.length - 3 + index
              const isLast = actualIndex === breadcrumbs.length - 1

              return (
                <React.Fragment key={item.href || actualIndex}>
                  <BreadcrumbItem>
                    {item.href && !isLast ? (
                      <BreadcrumbLink asChild>
                        <Link to={item.href}>{item.label}</Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </React.Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>

        {/* Titre mobile (sans breadcrumb) */}
        <span className="sm:hidden font-medium">{pageTitle}</span>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/projects">Projets</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
