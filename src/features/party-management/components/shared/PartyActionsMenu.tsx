// src/features/party-management/components/shared/PartyActionsMenu.tsx
//
// Row-level actions dropdown for a company party.
// Renders different items based on party status and user permissions.
//
// Visible actions per status (US-05 Actions Menu table):
//   Active party   → View | Edit | Deactivate
//   Inactive party → View | Edit | Activate
//
// Permission-gated actions:
//   Edit             → requires UPDATE_PARTY permission
//   Activate/Deactivate → requires TOGGLE_PARTY permission — US-05 AC-7
//   Delete           → requires DELETE_PARTY permission   — US-06 AC-01, AC-09
//
// Reference:
//   US-03 Table Columns "Actions: View / Edit"
//   US-05 Actions Menu, AC-7
//   US-06 UI Requirements Actions Menu, AC-01, AC-09
// ─────────────────────────────────────────────────────────────────────────────

'use client'

import {
  useRef,
  useState,
  useEffect,
  useCallback,
} from 'react'

import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  MoreHorizontal,
  Eye,
  FilePenLine,
  PowerOff,
  Power,
  Trash2,
} from 'lucide-react'

import { cn }            from '@/lib/utils'
import { useAuthStore }  from '@/store/auth.store'
import { usePartyStore } from '@/store/party.store'
import { Permission }    from '@/types/auth.types'

import type { CompanyParty } from '@/types/party.types'


// ─── Types ────────────────────────────────────────────────────────────────────

interface PartyActionsMenuProps {
  party:     Pick<CompanyParty, 'id' | 'partyName' | 'tin' | 'isActive'>
  companyId: string
}

interface MenuItem {
  key:        string
  label:      string
  icon:       typeof Eye
  onClick:    () => void
  variant:    'default' | 'danger' | 'warning'
  show:       boolean
  separator?: boolean
}

interface MenuPosition {
  top:   number
  left:  number
  width: number
}

const MENU_WIDTH = 192
const MENU_GAP = 6


// ─── Component ────────────────────────────────────────────────────────────────

export function PartyActionsMenu({ party }: PartyActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null)
  const menuRef             = useRef<HTMLDivElement>(null)
  const triggerRef          = useRef<HTMLButtonElement>(null)
  const router              = useRouter()
  const hasPermission       = useAuthStore(s => s.hasPermission)
  const { openModal }       = usePartyStore()

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    const viewportPadding = 8
    const left = Math.min(
      Math.max(viewportPadding, rect.right - MENU_WIDTH),
      window.innerWidth - MENU_WIDTH - viewportPadding,
    )

    setMenuPosition({
      top: rect.bottom + MENU_GAP,
      left,
      width: MENU_WIDTH,
    })
  }, [])

  const toggleMenu = () => {
    if (isOpen) {
      setIsOpen(false)
      return
    }

    updateMenuPosition()
    setIsOpen(true)
  }

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        menuRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return
      }

      setIsOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    updateMenuPosition()
    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updateMenuPosition, true)

    return () => {
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', updateMenuPosition, true)
    }
  }, [isOpen, updateMenuPosition])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen])

  const close = useCallback(() => setIsOpen(false), [])

  const items: MenuItem[] = [
    {
      key:     'view',
      label:   'View details',
      icon:    Eye,
      variant: 'default',
      show:    true,
      onClick: () => { close(); router.push(`/parties/${party.id}`) },
    },
    {
      key:     'edit',
      label:   'Edit',
      icon:    FilePenLine,
      variant: 'default',
      show:    hasPermission(Permission.UPDATE_PARTY),
      onClick: () => { close(); router.push(`/parties/${party.id}/edit`) },
    },
    {
      key:      party.isActive ? 'deactivate' : 'activate',
      label:    party.isActive ? 'Deactivate' : 'Activate',
      icon:     party.isActive ? PowerOff : Power,
      variant:  party.isActive ? 'warning' : 'default',
      separator: true,
      show:     hasPermission(Permission.TOGGLE_PARTY),
      onClick: () => {
        close()
        openModal(
          party.isActive ? 'deactivate' : 'activate',
          { id: party.id, partyName: party.partyName, tin: party.tin }
        )
      },
    },
    {
      key:      'delete',
      label:    'Delete',
      icon:     Trash2,
      variant:  'danger',
      separator: true,
      show:     hasPermission(Permission.DELETE_PARTY),
      onClick: () => {
        close()
        openModal('delete', { id: party.id, partyName: party.partyName, tin: party.tin })
      },
    },
  ]

  const visibleItems = items.filter(item => item.show)

  return (
    <div ref={menuRef} className="relative inline-block text-left">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleMenu}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Party actions"
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900',
          'text-zinc-600 transition-colors duration-150 dark:text-zinc-300',
          'hover:bg-zinc-100 hover:text-zinc-600',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1',
          'dark:hover:bg-zinc-800 dark:hover:text-zinc-300',
          isOpen && 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800',
        )}
      >
        <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
      </button>

      {isOpen && menuPosition && createPortal(
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          style={{
            position: 'fixed',
            top: menuPosition.top,
            left: menuPosition.left,
            width: menuPosition.width,
          }}
          className={cn(
            'z-[1000]',
            'rounded-lg border border-zinc-200 bg-white shadow-xl shadow-zinc-900/15',
            'dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-zinc-900/40',
            'animate-in fade-in-0 zoom-in-95 duration-100',
          )}
        >
          <div className="py-1">
            {visibleItems.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.key}>
                  {item.separator && (
                    <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
                  )}
                  <button
                    role="menuitem"
                    type="button"
                    onClick={item.onClick}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors duration-100',
                      item.variant === 'default' && [
                        'text-zinc-700 dark:text-zinc-300',
                        'hover:bg-zinc-50 hover:text-zinc-900',
                        'dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
                      ],
                      item.variant === 'warning' && [
                        'text-amber-600 dark:text-amber-500',
                        'hover:bg-amber-50 hover:text-amber-700',
                        'dark:hover:bg-amber-500/10',
                      ],
                      item.variant === 'danger' && [
                        'text-red-600 dark:text-red-500',
                        'hover:bg-red-50 hover:text-red-700',
                        'dark:hover:bg-red-500/10',
                      ],
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={2} aria-hidden="true" />
                    {item.label}
                  </button>
                </div>
              )
            })}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
