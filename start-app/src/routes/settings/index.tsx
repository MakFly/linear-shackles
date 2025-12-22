import { createFileRoute } from '@tanstack/react-router'

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
import { ThemeToggle } from '@/components/ThemeToggle'

export const Route = createFileRoute('/settings/')({
  component: Component,
})

function Component() {
  return (
    <div className="flex-1 overflow-auto scrollbar-custom">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your workspace preferences and configuration
          </p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Workspace</CardTitle>
                <CardDescription>
                  Configure your workspace settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="workspace-name">Workspace Name</Label>
                  <Input id="workspace-name" defaultValue="Vol" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workspace-url">Workspace URL</Label>
                  <Input id="workspace-url" defaultValue="vol.workspace.com" />
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full Name</Label>
                  <Input id="full-name" defaultValue="Paul de Marecaux" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue="paul@example.com"
                  />
                </div>
                <Button>Update Profile</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>
                  Personnalisez l'apparence de votre espace de travail
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ThemeToggle />
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Vue Compacte</Label>
                    <p className="text-sm text-muted-foreground">
                      Utiliser une mise en page plus compacte pour les listes
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose what notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Issue Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when issues are updated
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sprint Changes</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about sprint updates
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mentions</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when someone mentions you
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Connected Services</CardTitle>
                <CardDescription>
                  Manage your integrations with external services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>GitHub</Label>
                    <p className="text-sm text-muted-foreground">
                      Connect your GitHub repositories
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Connect
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Slack</Label>
                    <p className="text-sm text-muted-foreground">
                      Sync notifications to Slack
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Connect
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Jira</Label>
                    <p className="text-sm text-muted-foreground">
                      Import issues from Jira
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Connect
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
