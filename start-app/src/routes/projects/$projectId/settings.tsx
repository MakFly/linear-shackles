import { createFileRoute, useParams } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

export const Route = createFileRoute('/projects/$projectId/settings')({
  component: ProjectSettings,
})

function ProjectSettings() {
  const { projectId } = useParams({ from: '/projects/$projectId/settings' })

  return (
    <div className="flex-1 overflow-auto scrollbar-custom">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Paramètres - {projectId}</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les paramètres et la configuration de ce projet
          </p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList>
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="members">Membres</TabsTrigger>
            <TabsTrigger value="integrations">Intégrations</TabsTrigger>
            <TabsTrigger value="advanced">Avancé</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informations du projet</CardTitle>
                <CardDescription>
                  Modifiez les informations de base du projet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Nom du projet</Label>
                  <Input id="project-name" defaultValue={projectId} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-description">Description</Label>
                  <Textarea
                    id="project-description"
                    placeholder="Description du projet"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-status">Statut</Label>
                  <Input id="project-status" defaultValue="Actif" />
                </div>
                <Button>Enregistrer les modifications</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dates importantes</CardTitle>
                <CardDescription>
                  Définissez les dates clés du projet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Date de début</Label>
                  <Input id="start-date" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due-date">Date limite</Label>
                  <Input id="due-date" type="date" />
                </div>
                <Button>Enregistrer</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Membres de l'équipe</CardTitle>
                <CardDescription>
                  Gérez les membres ayant accès à ce projet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Fonctionnalité à venir
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Intégrations</CardTitle>
                <CardDescription>
                  Connectez des services externes à ce projet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>GitHub</Label>
                    <p className="text-sm text-muted-foreground">
                      Synchroniser les issues et PRs depuis GitHub
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configurer
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Slack</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir les notifications sur Slack
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configurer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Options avancées</CardTitle>
                <CardDescription>
                  Paramètres avancés et options de configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Archivage automatique</Label>
                    <p className="text-sm text-muted-foreground">
                      Archiver automatiquement les issues résolues après 30
                      jours
                    </p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifications par email</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir des notifications par email pour ce projet
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mode privé</Label>
                    <p className="text-sm text-muted-foreground">
                      Rendre ce projet privé (visible uniquement par les
                      membres)
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">
                  Zone de danger
                </CardTitle>
                <CardDescription>
                  Actions irréversibles sur ce projet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Supprimer le projet</Label>
                  <p className="text-sm text-muted-foreground">
                    Cette action est irréversible. Toutes les données seront
                    supprimées.
                  </p>
                  <Button variant="destructive" size="sm">
                    Supprimer le projet
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
