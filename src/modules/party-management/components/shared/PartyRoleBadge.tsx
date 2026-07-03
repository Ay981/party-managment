import { cn } from '@/shared/utils'
import { Building2, ShoppingCart } from 'lucide-react'

type RoleType = 'customer' | 'vendor'

interface RoleBadgeProps {
  role:       RoleType
  size?:      'sm' | 'md'
  className?: string
}

const ROLE_CONFIG: Record<RoleType, {
  label: string
  icon:  typeof Building2
  base:  string
  dark:  string
}> = {
  customer: {
    label: 'Customer',
    icon:  ShoppingCart,
    base:  'bg-sky-50 text-sky-700 ring-sky-600/20',
    dark:  'dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20',
  },
  vendor: {
    label: 'Vendor',
    icon:  Building2,
    base:  'bg-white text-zinc-800 ring-zinc-300',
    dark:  'dark:bg-zinc-950 dark:text-zinc-200 dark:ring-zinc-700',
  },
}

function RoleBadge({ role, size = 'md', className }: RoleBadgeProps) {
  const config = ROLE_CONFIG[role]
  const Icon   = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded font-medium ring-1 ring-inset',
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs',
        config.base,
        config.dark,
        className,
      )}
    >
      <Icon
        className={cn('shrink-0', size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3')}
        strokeWidth={2}
        aria-hidden="true"
      />
      {config.label}
    </span>
  )
}

interface PartyRoleBadgeProps {
  isCustomer: boolean
  isVendor:   boolean
  size?:      'sm' | 'md'
  className?: string
}

export function PartyRoleBadge({
  isCustomer,
  isVendor,
  size = 'md',
  className,
}: PartyRoleBadgeProps) {
  if (!isCustomer && !isVendor) {
    return <span className="text-xs text-zinc-400 italic">No role</span>
  }

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      {isCustomer && <RoleBadge role="customer" size={size} />}

      {isCustomer && isVendor && (
        <span className="text-zinc-300 dark:text-zinc-600 select-none text-[10px]">|</span>
      )}

      {isVendor && <RoleBadge role="vendor" size={size} />}
    </div>
  )
}
