import { useState } from 'react'
import { Plus, Trash2, GripVertical, CalendarIcon  } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CustomField } from '@/types/issue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface CustomFieldEditorProps {
  fields: CustomField[]
  onChange: (fields: CustomField[]) => void
  editMode?: boolean
}

export const CustomFieldEditor = ({
  fields,
  onChange,
  editMode = false,
}: CustomFieldEditorProps) => {
  const [newFieldName, setNewFieldName] = useState('')
  const [newFieldType, setNewFieldType] = useState<CustomField['type']>('text')

  const handleAddField = () => {
    if (!newFieldName.trim()) return

    const newField: CustomField = {
      id: Date.now().toString(),
      name: newFieldName,
      type: newFieldType,
      value: newFieldType === 'multiselect' ? [] : '',
      options: ['text', 'number', 'date'].includes(newFieldType)
        ? undefined
        : [],
    }

    onChange([...fields, newField])
    setNewFieldName('')
    setNewFieldType('text')
  }

  const handleUpdateField = (
    fieldId: string,
    updates: Partial<CustomField>,
  ) => {
    onChange(
      fields.map((field) =>
        field.id === fieldId ? { ...field, ...updates } : field,
      ),
    )
  }

  const handleRemoveField = (fieldId: string) => {
    onChange(fields.filter((field) => field.id !== fieldId))
  }

  const renderFieldInput = (field: CustomField) => {
    switch (field.type) {
      case 'text':
        return (
          <Input
            value={field.value || ''}
            onChange={(e) =>
              handleUpdateField(field.id, { value: e.target.value })
            }
            placeholder="Entrer une valeur..."
          />
        )
      case 'number':
        return (
          <Input
            type="number"
            value={field.value || ''}
            onChange={(e) =>
              handleUpdateField(field.id, { value: e.target.value })
            }
            placeholder="Entrer un nombre..."
          />
        )
      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !field.value && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {field.value
                  ? format(new Date(field.value), 'PPP')
                  : 'Sélectionner une date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={field.value ? new Date(field.value) : undefined}
                onSelect={(date) =>
                  handleUpdateField(field.id, { value: date?.toISOString() })
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )
      case 'select':
        return (
          <div className="space-y-2">
            <Select
              value={field.value || ''}
              onValueChange={(value) => handleUpdateField(field.id, { value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une option" />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {editMode && (
              <div className="flex gap-2">
                <Input
                  placeholder="Ajouter une option..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      handleUpdateField(field.id, {
                        options: [
                          ...(field.options || []),
                          e.currentTarget.value.trim(),
                        ],
                      })
                      e.currentTarget.value = ''
                    }
                  }}
                />
              </div>
            )}
          </div>
        )
      case 'multiselect':
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {(field.value || []).map((val: string) => (
                <span
                  key={val}
                  className="px-2 py-1 bg-secondary text-xs rounded flex items-center gap-1"
                >
                  {val}
                  <button
                    onClick={() =>
                      handleUpdateField(field.id, {
                        value: (field.value || []).filter(
                          (v: string) => v !== val,
                        ),
                      })
                    }
                    className="hover:text-destructive"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <Select
              onValueChange={(value) => {
                const currentValues = field.value || []
                if (!currentValues.includes(value)) {
                  handleUpdateField(field.id, {
                    value: [...currentValues, value],
                  })
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ajouter une valeur" />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {editMode && (
              <Input
                placeholder="Ajouter une option..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    handleUpdateField(field.id, {
                      options: [
                        ...(field.options || []),
                        e.currentTarget.value.trim(),
                      ],
                    })
                    e.currentTarget.value = ''
                  }
                }}
              />
            )}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div
          key={field.id}
          className="space-y-2 p-3 border border-border rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {editMode && (
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              )}
              <Label className="font-medium">{field.name}</Label>
              <span className="text-xs text-muted-foreground">
                ({field.type})
              </span>
            </div>
            {editMode && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRemoveField(field.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          {renderFieldInput(field)}
        </div>
      ))}

      {editMode && (
        <div className="flex gap-2 pt-2">
          <Input
            placeholder="Nom du champ..."
            value={newFieldName}
            onChange={(e) => setNewFieldName(e.target.value)}
          />
          <Select
            value={newFieldType}
            onValueChange={(value: any) => setNewFieldType(value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Texte</SelectItem>
              <SelectItem value="number">Nombre</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="select">Select</SelectItem>
              <SelectItem value="multiselect">Multi-select</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleAddField}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
