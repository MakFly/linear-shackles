import { useState } from 'react'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  IssueTemplate,
  IssuePriority,
  IssueStatus,
  CustomField,
} from '@/types/issue'
import { CustomFieldEditor } from '@/features/issues/components/CustomFieldEditor'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

interface TemplateManagerProps {
  templates: IssueTemplate[]
  onCreateTemplate: (template: IssueTemplate) => void
  onUpdateTemplate: (template: IssueTemplate) => void
  onDeleteTemplate: (templateId: string) => void
  onUseTemplate: (template: IssueTemplate) => void
}

export const TemplateManager = ({
  templates,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onUseTemplate,
}: TemplateManagerProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<IssueTemplate | null>(
    null,
  )
  const [formData, setFormData] = useState<Partial<IssueTemplate>>({
    name: '',
    description: '',
    defaultStatus: 'backlog',
    defaultPriority: 'medium',
    customFields: [],
    labels: [],
  })

  const handleSave = () => {
    if (!formData.name?.trim()) {
      toast.error('Le nom du template est requis')
      return
    }

    const template: IssueTemplate = {
      id: editingTemplate?.id || Date.now().toString(),
      name: formData.name,
      description: formData.description,
      defaultStatus: formData.defaultStatus || 'backlog',
      defaultPriority: formData.defaultPriority || 'medium',
      customFields: (formData.customFields || []).map(
        ({ id, name, type, options }) => ({
          id,
          name,
          type,
          options,
        }),
      ),
      labels: formData.labels,
    }

    if (editingTemplate) {
      onUpdateTemplate(template)
      toast.success('Template mis à jour')
    } else {
      onCreateTemplate(template)
      toast.success('Template créé')
    }

    setIsOpen(false)
    setEditingTemplate(null)
    setFormData({
      name: '',
      description: '',
      defaultStatus: 'backlog',
      defaultPriority: 'medium',
      customFields: [],
      labels: [],
    })
  }

  const handleEdit = (template: IssueTemplate) => {
    setEditingTemplate(template)
    const fieldsWithValues = template.customFields.map((field) => ({
      ...field,
      value: '',
    }))
    setFormData({ ...template, customFields: fieldsWithValues })
    setIsOpen(true)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingTemplate ? 'Modifier le template' : 'Gérer les templates'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          {!editingTemplate && templates.length > 0 ? (
            <div className="space-y-2 mb-4">
              <Label>Templates existants</Label>
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50"
                >
                  <div className="flex-1">
                    <div className="font-medium">{template.name}</div>
                    {template.description && (
                      <div className="text-sm text-muted-foreground">
                        {template.description}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        onUseTemplate(template)
                        setIsOpen(false)
                        toast.success('Template appliqué')
                      }}
                    >
                      Utiliser
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        onDeleteTemplate(template.id)
                        toast.success('Template supprimé')
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
              <Label htmlFor="name">Nom du template *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Bug Report, Feature Request"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Description du template..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Statut par défaut</Label>
                <Select
                  value={formData.defaultStatus}
                  onValueChange={(value: IssueStatus) =>
                    setFormData({ ...formData, defaultStatus: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="backlog">Backlog</SelectItem>
                    <SelectItem value="progress">In Progress</SelectItem>
                    <SelectItem value="warning">Blocked</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Priorité par défaut</Label>
                <Select
                  value={formData.defaultPriority}
                  onValueChange={(value: IssuePriority) =>
                    setFormData({ ...formData, defaultPriority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
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
            </div>

            <div>
              <Label>Champs personnalisés</Label>
              <CustomFieldEditor
                fields={(formData.customFields || []).map((f: any) => ({
                  ...f,
                  value: f.value || '',
                }))}
                onChange={(fields) =>
                  setFormData({ ...formData, customFields: fields })
                }
                editMode={true}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave}>
                {editingTemplate ? 'Mettre à jour' : 'Créer le template'}
              </Button>
              {editingTemplate && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingTemplate(null)
                    setFormData({
                      name: '',
                      description: '',
                      defaultStatus: 'backlog',
                      defaultPriority: 'medium',
                      customFields: [],
                      labels: [],
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
