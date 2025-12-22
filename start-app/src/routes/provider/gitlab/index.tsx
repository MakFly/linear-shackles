import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { useGitProvider, type GitRepository } from '@/hooks/useGitProvider'
import { DataTable } from '@/components/ui/data-table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertCircle,
  ExternalLink,
  Settings,
  RefreshCw,
  HelpCircle,
  Check,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export const Route = createFileRoute('/provider/gitlab/')({
  component: Component,
})

function Component() {
  const provider = useGitProvider('gitlab')
  const { toast } = useToast()
  const [showSettings, setShowSettings] = useState(!provider.isConnected)
  const [tokenInput, setTokenInput] = useState('')
  const [repositories, setRepositories] = useState<GitRepository[]>([])
  const [loading, setLoading] = useState(false)

  const loadRepositories = async () => {
    if (!provider.isConnected) return

    setLoading(true)
    try {
      const repos = await provider.getRepositories()
      setRepositories(repos)
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (provider.isConnected) {
      loadRepositories()
      setShowSettings(false)
    }
  }, [provider.isConnected])

  const handleConnect = () => {
    if (!tokenInput) {
      toast({
        title: 'Erreur',
        description: 'Token requis',
        variant: 'destructive',
      })
      return
    }
    // On connecte sans projet spécifique pour pouvoir lister les projets
    provider.connect(tokenInput)
    // Recharger après connexion
    setTimeout(() => {
      loadRepositories()
    }, 100)
  }

  const columns: ColumnDef<GitRepository>[] = [
    {
      accessorKey: 'name',
      header: 'Nom',
      cell: ({ row }) => {
        const repo = row.original
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{repo.name}</span>
            <Badge
              variant={repo.visibility === 'private' ? 'secondary' : 'outline'}
            >
              {repo.visibility}
            </Badge>
          </div>
        )
      },
    },
    {
      accessorKey: 'fullName',
      header: 'Chemin complet',
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground">
          {row.original.fullName}
        </span>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground line-clamp-1">
          {row.original.description || 'Aucune description'}
        </span>
      ),
    },
    {
      accessorKey: 'defaultBranch',
      header: 'Branche par défaut',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.defaultBranch}</span>
      ),
    },
    {
      accessorKey: 'updatedAt',
      header: 'Dernière mise à jour',
      cell: ({ row }) => {
        const date = new Date(row.original.updatedAt)
        return (
          <span className="text-sm text-muted-foreground">
            {formatDistanceToNow(date, { addSuffix: true, locale: fr })}
          </span>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const repo = row.original
        return (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/provider/gitlab/${repo.id}`}>Ouvrir</Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <a href={repo.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        )
      },
    },
  ]

  if (showSettings) {
    return (
      <div className="flex-1 p-8 overflow-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Configuration GitLab
              <TokenHelpDialog provider="gitlab" />
            </CardTitle>
            <CardDescription>
              Connectez votre compte GitLab pour lister vos projets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important :</strong> Votre token sera stocké localement
                dans le navigateur. Pour une sécurité optimale, utilisez un
                Personal Access Token avec des permissions limitées.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="token">GitLab Personal Access Token</Label>
              <Input
                id="token"
                type="password"
                placeholder="glpat-xxxxxxxxxxxx"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Créez un token sur{' '}
                <a
                  href="https://gitlab.com/-/user_settings/personal_access_tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  GitLab Settings → Access Tokens
                </a>
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleConnect} className="flex-1">
                Connecter
              </Button>
              {provider.isConnected && (
                <Button
                  variant="outline"
                  onClick={() => setShowSettings(false)}
                >
                  Annuler
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Projets GitLab</h1>
            <p className="text-muted-foreground mt-1">
              Sélectionnez un projet pour voir ses issues, merge requests et
              pipelines
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={loadRepositories}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                provider.disconnect()
                window.location.reload()
              }}
            >
              Déconnecter
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={repositories}
          searchKey="fullName"
          searchPlaceholder="Rechercher un projet..."
          loading={loading}
        />
      </div>
    </div>
  )
}

function TokenHelpDialog({ provider }: { provider: 'github' | 'gitlab' }) {
  if (provider === 'gitlab') {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <HelpCircle className="h-4 w-4 mr-2" />
            Aide
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Créer un Personal Access Token GitLab</DialogTitle>
            <DialogDescription>
              Suivez ces étapes pour créer un token avec les permissions
              nécessaires
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <h4 className="font-medium">
                    Allez dans les settings GitLab
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Visitez{' '}
                    <a
                      href="https://gitlab.com/-/user_settings/personal_access_tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      gitlab.com/-/user_settings/personal_access_tokens
                    </a>{' '}
                    et cliquez sur "Add new token".
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Configurez le token</h4>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    <li>• Donnez un nom descriptif (ex: "SaaS App")</li>
                    <li>• Sélectionnez une date d'expiration</li>
                    <li>• Cochez les permissions requises ci-dessous</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <h4 className="font-medium">Permissions requises (scopes)</h4>
                  <div className="bg-muted/50 rounded-md p-3 mt-2 space-y-2">
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5" />
                      <div>
                        <span className="text-sm font-mono font-bold">api</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          (obligatoire)
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          Accès complet à l'API. Permet de lire, créer, modifier et supprimer les issues.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5" />
                      <div>
                        <span className="text-sm font-mono">read_user</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          (recommandé)
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          Lire vos infos utilisateur.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5" />
                      <div>
                        <span className="text-sm font-mono">read_repository</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          (optionnel)
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          Lire le contenu des repositories.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-md p-3 mt-3">
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      <strong>⚠️ Sans le scope "api"</strong>, vous ne pourrez pas créer, modifier ou supprimer d'issues.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                  4
                </div>
                <div>
                  <h4 className="font-medium">Copiez et utilisez le token</h4>
                  <p className="text-sm text-muted-foreground">
                    Copiez immédiatement le token généré (il ne sera plus
                    affiché) et collez-le dans le champ ci-dessus.
                  </p>
                </div>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Sécurité :</strong> Ne partagez jamais votre token. Il
                donne accès à vos projets GitLab. Stockez-le de manière
                sécurisée.
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return null
}
