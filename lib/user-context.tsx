"use client"

import { createContext, useContext, useState, ReactNode } from "react"

export interface CurrentUser {
  id: string
  name: string
  email: string
  role: 'crew' | 'admin'
  initials: string
  // Crew users are assigned to exactly one vessel. Admins see all vessels (null).
  assignedVessel: string | null
}

const defaultUser: CurrentUser = {
  id: 'user-admin-1',
  name: 'Emily Martinez',
  email: 'emily.martinez@uniframe.ai',
  role: 'admin',
  initials: 'EM',
  assignedVessel: null
}

// Default vessel assigned to a crew user (mock). When switching to the crew role,
// the user is auto-scoped to this vessel.
const CREW_DEFAULT_VESSEL = 'Seaways Athens'

interface UserContextType {
  currentUser: CurrentUser
  setRole: (role: 'crew' | 'admin') => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser>(defaultUser)

  const setRole = (role: 'crew' | 'admin') => {
    setCurrentUser(prev => ({
      ...prev,
      role,
      // Crew is scoped to a single vessel; admins see all vessels.
      assignedVessel: role === 'crew' ? CREW_DEFAULT_VESSEL : null,
    }))
  }

  return (
    <UserContext.Provider value={{ currentUser, setRole }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
