import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Mode Sombre</Label>
          <p className="text-sm text-muted-foreground">
            Basculer entre le mode clair et sombre
          </p>
        </div>
        <Switch disabled />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5 flex items-center gap-2">
        <Sun className="h-4 w-4 text-muted-foreground" />
        <div>
          <Label>Mode Sombre</Label>
          <p className="text-sm text-muted-foreground">
            Basculer entre le mode clair et sombre
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={theme === 'dark'}
          onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
        />
        <Moon className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  )
}
