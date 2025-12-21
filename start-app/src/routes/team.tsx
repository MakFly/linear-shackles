import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Mail, MoreHorizontal, Shield, User, Crown, Trash2, Edit } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTeamMembers, createTeamMember, updateTeamMember, deleteTeamMember } from "@/server/db";
import { toast } from "sonner";
import type { TeamMember } from "@/db/schema";

export const Route = createFileRoute("/team")({
  loader: async () => {
    const members = await getTeamMembers();
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
  const { members: initialMembers } = Route.useLoaderData();
  const router = useRouter();
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "member" as "owner" | "admin" | "member",
    avatar: "",
    status: "offline" as "online" | "offline" | "away",
  });

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Le nom et l'email sont requis");
      return;
    }

    try {
      const newMember = await createTeamMember({
        id: crypto.randomUUID(),
        name: formData.name,
        email: formData.email,
        role: formData.role,
        avatar: formData.avatar || null,
        status: formData.status,
        issuesAssigned: 0,
        issuesCompleted: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setMembers([...members, newMember]);
      setFormData({
        name: "",
        email: "",
        role: "member",
        avatar: "",
        status: "offline",
      });
      setIsCreateOpen(false);
      toast.success("Membre ajouté avec succès");
      router.invalidate();
    } catch (error) {
      toast.error("Erreur lors de l'ajout du membre");
    }
  };

  const handleUpdate = async () => {
    if (!editingMember || !formData.name.trim() || !formData.email.trim()) {
      toast.error("Le nom et l'email sont requis");
      return;
    }

    try {
      const updated = await updateTeamMember({
        id: editingMember.id,
        updates: {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          avatar: formData.avatar || null,
          status: formData.status,
        },
      });

      setMembers(members.map((m) => (m.id === editingMember.id ? updated : m)));
      setEditingMember(null);
      setFormData({
        name: "",
        email: "",
        role: "member",
        avatar: "",
        status: "offline",
      });
      toast.success("Membre mis à jour");
      router.invalidate();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du membre");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir retirer ce membre ?")) return;

    try {
      await deleteTeamMember(id);
      setMembers(members.filter((m) => m.id !== id));
      toast.success("Membre retiré");
      router.invalidate();
    } catch (error) {
      toast.error("Erreur lors de la suppression du membre");
    }
  };

  const openEditDialog = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      role: member.role,
      avatar: member.avatar || "",
      status: (member.status as "online" | "offline" | "away") || "offline",
    });
  };

  const getCompletionRate = (member: TeamMember) => {
    if (!member.issuesAssigned || member.issuesAssigned === 0) return 0;
    return Math.round(((member.issuesCompleted || 0) / member.issuesAssigned) * 100);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Équipe</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez les membres de votre équipe et leurs permissions
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Inviter un membre
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un membre</DialogTitle>
              <DialogDescription>
                Ajoutez un nouveau membre à votre équipe
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Jean Dupont"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jean@example.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Rôle</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: "owner" | "admin" | "member") =>
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Membre</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="owner">Propriétaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "online" | "offline" | "away") =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="offline">Hors ligne</SelectItem>
                      <SelectItem value="online">En ligne</SelectItem>
                      <SelectItem value="away">Absent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatar">URL de l'avatar (optionnel)</Label>
                <Input
                  id="avatar"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreate}>Ajouter</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier le membre</DialogTitle>
              <DialogDescription>Modifiez les informations du membre</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nom *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Rôle</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: "owner" | "admin" | "member") =>
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Membre</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="owner">Propriétaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "online" | "offline" | "away") =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="offline">Hors ligne</SelectItem>
                      <SelectItem value="online">En ligne</SelectItem>
                      <SelectItem value="away">Absent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-avatar">URL de l'avatar (optionnel)</Label>
                <Input
                  id="edit-avatar"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingMember(null)}>
                Annuler
              </Button>
              <Button onClick={handleUpdate}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-custom">
        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun membre</h3>
            <p className="text-muted-foreground mb-4">
              Commencez par ajouter votre premier membre d'équipe
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un membre
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => {
              const config = roleConfig[member.role];
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
                              {member.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${
                              statusColors[member.status as keyof typeof statusColors] ||
                              statusColors.offline
                            }`}
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
                          <DropdownMenuItem onClick={() => openEditDialog(member)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(member.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Retirer
                          </DropdownMenuItem>
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
                          {member.issuesAssigned || 0} issues assignées
                        </span>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Complétion</span>
                          <span className="font-medium">{completionRate}%</span>
                        </div>
                        <Progress value={completionRate} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {member.issuesCompleted || 0} / {member.issuesAssigned || 0} terminées
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
