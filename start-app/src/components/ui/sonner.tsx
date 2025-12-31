'use client'

import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

type CustomToasterProps = ToasterProps & {
  closeButton?: boolean
}

const Toaster = ({ closeButton = false, ...props }: CustomToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      position="top-center"
      richColors
      expand
      closeButton={closeButton}
      toastOptions={{
        classNames: {
          toast: `
            group toast
            !bg-white !border-border/60 dark:!bg-neutral-950
            !rounded-xl !shadow-lg
            !py-3 !px-4
          `,
          title: '!text-foreground !font-medium !text-sm',
          description: '!text-muted-foreground !text-sm',
          actionButton:
            '!bg-primary !text-primary-foreground !font-medium !text-sm !rounded-lg',
          cancelButton:
            '!bg-secondary !text-secondary-foreground !font-medium !text-sm !rounded-lg',
          closeButton:
            '!bg-secondary !border-border !text-muted-foreground hover:!text-foreground',
        },
      }}
      icons={{
        success: <CheckCircle2 className="size-5 text-emerald-500" />,
        error: <XCircle className="size-5 text-red-500" />,
        warning: <AlertTriangle className="size-5 text-amber-500" />,
        info: <Info className="size-5 text-blue-500" />,
        loading: <Loader2 className="size-5 text-primary animate-spin" />,
      }}
      {...props}
    />
  )
}

export { Toaster }
