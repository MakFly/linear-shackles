import { useState } from 'react'
import { Plus, Trash2, Play, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Automation, IssueStatus, IssuePriority } from '@/types/issue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

interface AutomationManagerProps {
  automations: Automation[]
  onCreateAutomation: (automation: Automation) => void
  onUpdateAutomation: (automation: Automation) => void
  onDeleteAutomation: (automationId: string) => void
}

export const AutomationManager = ({
  automations,
  onCreateAutomation,
  onUpdateAutomation,
  onDeleteAutomation,
}: AutomationManagerProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(
    null,
  )
  const [formData, setFormData] = useState<Partial<Automation>>({
    name: '',
    trigger: { type: 'status_change', condition: {} },
    action: { type: 'set_status', value: {} },
    enabled: true,
  })

  const handleSave = () => {
    if (!formData.name?.trim()) {
      toast.error("Le nom de l'automation est requis")
      return
    }

    const automation: Automation = {
      id: editingAutomation?.id || Date.now().toString(),
      name: formData.name,
      trigger: formData.trigger || { type: 'status_change', condition: {} },
      action: formData.action || { type: 'set_status', value: {} },
      enabled: formData.enabled ?? true,
    }

    if (editingAutomation) {
      onUpdateAutomation(automation)
      toast.success('Automation mise à jour')
    } else {
      onCreateAutomation(automation)
      toast.success('Automation créée')
    }

    setIsOpen(false)
    setEditingAutomation(null)
    setFormData({
      name: '',
      trigger: { type: 'status_change', condition: {} },
      action: { type: 'set_status', value: {} },
      enabled: true,
    })
  }

  const handleEdit = (automation: Automation) => {
    setEditingAutomation(automation)
    setFormData(automation)
    setIsOpen(true)
  }

  const handleToggleEnabled = (automation: Automation) => {
    onUpdateAutomation({ ...automation, enabled: !automation.enabled })
    toast.success(
      automation.enabled ? 'Automation désactivée' : 'Automation activée',
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Play className="h-4 w-4 mr-2" />
          Automations
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingAutomation
              ? "Modifier l'automation"
              : 'Gérer les automations'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          {!editingAutomation && automations.length > 0 ? (
            <div className="space-y-2 mb-4">
              <Label>Automations existantes</Label>
              {automations.map((automation) => (
                <div
                  key={automation.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{automation.name}</span>
                      {automation.enabled ? (
                        <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-500 rounded">
                          Actif
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded">
                          Inactif
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Quand {automation.trigger.type} → {automation.action.type}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleEnabled(automation)}
                    >
                      {automation.enabled ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(automation)}
                    >
                      Modifier
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        onDeleteAutomation(automation.id)
                        toast.success('Automation supprimée')
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom de l'automation *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Notifier quand urgent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Déclencheur</Label>
                <Select
                  value={formData.trigger?.type}
                  onValueChange={(value: any) =>
                    setFormData({
                      ...formData,
                      trigger: {
                        ...formData.trigger,
                        type: value,
                        condition: {},
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="status_change">
                      Changement de statut
                    </SelectItem>
                    <SelectItem value="priority_change">
                      Changement de priorité
                    </SelectItem>
                    <SelectItem value="field_change">
                      Changement de champ
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Action</Label>
                <Select
                  value={formData.action?.type}
                  onValueChange={(value: any) =>
                    setFormData({
                      ...formData,
                      action: { ...formData.action, type: value, value: {} },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="set_status">
                      Définir le statut
                    </SelectItem>
                    <SelectItem value="set_priority">
                      Définir la priorité
                    </SelectItem>
                    <SelectItem value="add_label">Ajouter un label</SelectItem>
                    <SelectItem value="assign">Assigner</SelectItem>
                    <SelectItem value="notify">Notifier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.trigger?.type === 'status_change' && (
              <div>
                <Label>Quand le statut devient</Label>
                <Select
                  value={formData.trigger.condition?.status}
                  onValueChange={(value: IssueStatus) =>
                    setFormData({
                      ...formData,
                      trigger: {
                        ...formData.trigger!,
                        condition: { status: value },
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="backlog">Backlog</SelectItem>
                    <SelectItem value="progress">In Progress</SelectItem>
                    <SelectItem value="warning">Blocked</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.action?.type === 'set_priority' && (
              <div>
                <Label>Définir la priorité à</Label>
                <Select
                  value={formData.action.value?.priority}
                  onValueChange={(value: IssuePriority) =>
                    setFormData({
                      ...formData,
                      action: {
                        ...formData.action!,
                        value: { priority: value },
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une priorité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enabled: checked })
                }
              />
              <Label>Automation activée</Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave}>
                {editingAutomation ? 'Mettre à jour' : "Créer l'automation"}
              </Button>
              {editingAutomation && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingAutomation(null)
                    setFormData({
                      name: '',
                      trigger: { type: 'status_change', condition: {} },
                      action: { type: 'set_status', value: {} },
                      enabled: true,
                    })
                  }}
                >
                  Annuler
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
