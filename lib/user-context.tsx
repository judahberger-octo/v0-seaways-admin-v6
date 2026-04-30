"use client"

import { createContext, useContext, useState, ReactNode } from "react"

export interface CurrentUser {
  id: string
  name: string
  email: string
  role: 'crew' | 'admin'
  initials: string
}

const defaultUser: CurrentUser = {
  id: 'user-admin-1',
  name: 'Emily Martinez',
  email: 'emily.martinez@uniframe.ai',
  role: 'admin',
  initials: 'EM'
}

interface UserContextType {
  currentUser: CurrentUser
  setRole: (role: 'crew' | 'admin') => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser>(defaultUser)

  const setRole = (role: 'crew' | 'admin') => {
    setCurrentUser(prev => ({ ...prev, role }))
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
