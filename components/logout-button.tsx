'use client'

import { logout } from '@/app/actions'
import { Button } from "@/components/ui/button"

export function LogoutButton() {
  return (
    <form action={logout}>
      <Button variant="ghost" type="submit">Sair</Button>
    </form>
  )
}
