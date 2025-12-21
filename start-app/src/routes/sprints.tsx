import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Calendar, Play, Pause, CheckCircle2, Clock, Trash2, Edit } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSprints, createSprint, updateSprint, deleteSprint } from "@/server/db";
import { toast } from "sonner";
import type { Sprint } from "@/db/schema";

export const Route = createFileRoute("/sprints")({
  loader: async () => {
    const sprints = await getSprints();
    return { sprints };
  },
  component: Component,
});

const statusConfig = {
  planning: {
    label: "Planification",
    color: "bg-muted text-muted-foreground border-muted",
    icon: Clock,
  },
  active: {
    label: "En cours",
    color: "bg-status-progress/10 text-status-progress border-status-progress/20",
    icon: Play,
  },
  completed: {
    label: "Terminé",
    color: "bg-status-done/10 text-status-done border-status-done/20",
    icon: CheckCircle2,
  },
  archived: {
    label: "Archivé",
    color: "bg-status-backlog/10 text-status-backlog border-status-backlog/20",
    icon: Pause,
  },
};

function Component() {
  const { sprints: initialSprints } = Route.useLoaderData();
  const router = useRouter();
  const [sprints, setSprints] = useState<Sprint[]>(initialSprints);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    goal: "",
    startDate: "",
    endDate: "",
    status: "planning" as "planning" | "active" | "completed" | "archived",
  });

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.startDate || !formData.endDate) {
      toast.error("Le nom, la date de début et la date de fin sont requis");
      return;
    }

    try {
      const newSprint = await createSprint({
        id: crypto.randomUUID(),
        name: formData.name,
        goal: formData.goal || null,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
        issues: [],
        velocity: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setSprints([...sprints, newSprint]);
      setFormData({
        name: "",
        goal: "",
        startDate: "",
        endDate: "",
        status: "planning",
      });
      setIsCreateOpen(false);
      toast.success("Sprint créé avec succès");
      router.invalidate();
    } catch (error) {
      toast.error("Erreur lors de la création du sprint");
    }
  };

  const handleUpdate = async () => {
    if (!editingSprint || !formData.name.trim() || !formData.startDate || !formData.endDate) {
      toast.error("Le nom, la date de début et la date de fin sont requis");
      return;
    }

    try {
      const updated = await updateSprint({
        id: editingSprint.id,
        updates: {
          name: formData.name,
          goal: formData.goal || null,
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: formData.status,
        },
      });

      setSprints(sprints.map((s) => (s.id === editingSprint.id ? updated : s)));
      setEditingSprint(null);
      setFormData({
        name: "",
        goal: "",
        startDate: "",
        endDate: "",
        status: "planning",
      });
      toast.success("Sprint mis à jour");
      router.invalidate();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du sprint");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce sprint ?")) return;

    try {
      await deleteSprint(id);
      setSprints(sprints.filter((s) => s.id !== id));
      toast.success("Sprint supprimé");
      router.invalidate();
    } catch (error) {
      toast.error("Erreur lors de la suppression du sprint");
    }
  };

  const handleStartSprint = async (sprint: Sprint) => {
    try {
      const updated = await updateSprint({
        id: sprint.id,
        updates: { status: "active" },
      });
      setSprints(sprints.map((s) => (s.id === sprint.id ? updated : s)));
      toast.success("Sprint démarré");
      router.invalidate();
    } catch (error) {
      toast.error("Erreur lors du démarrage du sprint");
    }
  };

  const openEditDialog = (sprint: Sprint) => {
    setEditingSprint(sprint);
    setFormData({
      name: sprint.name,
      goal: sprint.goal || "",
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      status: sprint.status,
    });
  };

  const getProgress = (sprint: Sprint) => {
    const issues = (sprint.issues as string[]) || [];
    if (issues.length === 0) return 0;
    // Pour l'instant, on retourne 0 car on n'a pas les issues complètes
    // TODO: calculer le vrai progrès basé sur les issues complétées
    return 0;
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sprints</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Planifiez et suivez vos cycles de développement
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau sprint
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouveau sprint</DialogTitle>
              <DialogDescription>
                Définissez les objectifs et la durée de votre sprint
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Sprint 1 - Q4 2024"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal">Objectif</Label>
                <Textarea
                  id="goal"
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  placeholder="Objectif principal du sprint..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Date de début *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Date de fin *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "planning" | "active" | "completed" | "archived") =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planification</SelectItem>
                    <SelectItem value="active">En cours</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                    <SelectItem value="archived">Archivé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreate}>Créer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingSprint} onOpenChange={(open) => !open && setEditingSprint(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier le sprint</DialogTitle>
              <DialogDescription>Modifiez les informations du sprint</DialogDescription>
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
                <Label htmlFor="edit-goal">Objectif</Label>
                <Textarea
                  id="edit-goal"
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-startDate">Date de début *</Label>
                  <Input
                    id="edit-startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-endDate">Date de fin *</Label>
                  <Input
                    id="edit-endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "planning" | "active" | "completed" | "archived") =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planification</SelectItem>
                    <SelectItem value="active">En cours</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                    <SelectItem value="archived">Archivé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingSprint(null)}>
                Annuler
              </Button>
              <Button onClick={handleUpdate}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-custom">
        {sprints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun sprint</h3>
            <p className="text-muted-foreground mb-4">
              Commencez par créer votre premier sprint
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un sprint
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {sprints.map((sprint) => {
              const config = statusConfig[sprint.status];
              const StatusIcon = config.icon;
              const progress = getProgress(sprint);
              const daysRemaining = getDaysRemaining(sprint.endDate);
              const issues = (sprint.issues as string[]) || [];

              return (
                <Card key={sprint.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {sprint.name}
                            <Badge variant="outline" className={config.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {config.label}
                            </Badge>
                          </CardTitle>
                          {sprint.goal && <CardDescription>{sprint.goal}</CardDescription>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(sprint)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(sprint.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-muted-foreground">
                      {new Date(sprint.startDate).toLocaleDateString("fr-FR")} →{" "}
                      {new Date(sprint.endDate).toLocaleDateString("fr-FR")}
                      {sprint.status === "active" && (
                        <span
                          className={`ml-2 ${
                            daysRemaining < 3 ? "text-destructive font-medium" : ""
                          }`}
                        >
                          {daysRemaining > 0
                            ? `${daysRemaining} jours restants`
                            : "Terminé aujourd'hui"}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">
                            {issues.length} issues
                          </span>
                          <span className="font-medium">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Vélocité: {sprint.velocity || 0} pts</span>
                        </div>
                        <div className="flex gap-2">
                          {sprint.status === "planning" && (
                            <Button size="sm" onClick={() => handleStartSprint(sprint)}>
                              <Play className="h-4 w-4 mr-1" />
                              Démarrer
                            </Button>
                          )}
                        </div>
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
