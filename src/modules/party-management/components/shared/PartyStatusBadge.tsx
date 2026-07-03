import { cn } from '@/shared/utils'


interface PartyStatusBadgeProps {
  isActive: boolean
  size?: 'sm' | 'md'
  className?: string
}


export function PartyStatusBadge({
  isActive,
  size = 'md',
  className,
}: PartyStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset',
        size === 'sm' ? 'px-2 py-0.5 text-[11px] tracking-wide' : 'px-2.5 py-1 text-xs',
        isActive
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/25 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20'
          : 'bg-zinc-100 text-zinc-500 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700',
        className,
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span
          className={cn(
            'relative inline-flex h-1.5 w-1.5 rounded-full',
            isActive ? 'bg-emerald-500' : 'bg-zinc-400',
          )}
        />
      </span>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}
