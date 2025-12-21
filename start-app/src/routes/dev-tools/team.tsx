import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Mail, MoreHorizontal, Shield, User, Crown, Database, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { getMockTeamMembers } from "@/server/dev-tools-mocks";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/dev-tools/team")({
  loader: async () => {
    const members = await getMockTeamMembers();
    return { members };
  },
  component: Component,
});

const roleConfig = {
  owner: {
    label: "Propriétaire",
    color: "bg-primary/10 text-primary border-primary/20",
    icon: Crown,
  },
  admin: {
    label: "Admin",
    color: "bg-status-warning/10 text-status-warning border-status-warning/20",
    icon: Shield,
  },
  member: {
    label: "Membre",
    color: "bg-muted text-muted-foreground border-muted",
    icon: User,
  },
};

const statusColors = {
  online: "bg-status-done",
  away: "bg-status-warning",
  offline: "bg-status-backlog",
};

function Component() {
  const { members } = Route.useLoaderData();
  const router = useRouter();

  const handleRefresh = () => {
    router.invalidate();
    toast.success("Données rafraîchies (mock)");
  };

  const getCompletionRate = (member: typeof members[0]) => {
    if (!member.issuesAssigned || member.issuesAssigned === 0) return 0;
    return Math.round(((member.issuesCompleted || 0) / member.issuesAssigned) * 100);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            <Database className="h-3 w-3 mr-1" />
            Dev Tools
          </Badge>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Équipe</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Données depuis SQLite ({members.length} membres)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Inviter un membre
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => {
            const config = roleConfig[member.role as keyof typeof roleConfig] || roleConfig.member;
            const RoleIcon = config.icon;
            const completionRate = getCompletionRate(member);

            return (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12 ring-2 ring-primary/10">
                          <AvatarImage src={member.avatar || undefined} alt={member.name} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                            {member.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span 
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${statusColors[member.status as keyof typeof statusColors] || statusColors.offline}`}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-base">{member.name}</CardTitle>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Voir le profil</DropdownMenuItem>
                        <DropdownMenuItem>Changer le rôle</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Retirer</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={config.color}>
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {member.issuesAssigned} issues assignées
                      </span>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Complétion</span>
                        <span className="font-medium">{completionRate}%</span>
                      </div>
                      <Progress value={completionRate} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {member.issuesCompleted} / {member.issuesAssigned} terminées
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
