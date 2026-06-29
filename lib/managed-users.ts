// ============================================================================
// User Management - Managed Users (SOLD-1502)
// ============================================================================
// Application users (distinct from per-vessel crew rosters). Each user has an
// app role and a vessel assignment. Admins/Viewers can be assigned to all
// vessels; Crew users are restricted to a single assigned vessel.
// ============================================================================

import { vessels } from "./admin-mock-data"

export type AppRole = "admin" | "viewer" | "crew"

export interface ManagedUser {
  id: string
  name: string
  email: string
  role: AppRole
  // null vesselId => assigned to all vessels (admins/viewers)
  vesselId: string | null
  lastActive?: string
}

export const roleLabels: Record<AppRole, string> = {
  admin: "Admin",
  viewer: "Viewer",
  crew: "Crew",
}

export const roleDescriptions: Record<AppRole, string> = {
  admin: "Full access to all vessels, settings, and master override.",
  viewer: "Read-only access to all vessels' reports.",
  crew: "Restricted to their assigned vessel's reports only.",
}

// Helper to look up a vessel name by id (or "All vessels" when unassigned)
export function vesselNameForUser(user: Pick<ManagedUser, "vesselId">): string {
  if (!user.vesselId) return "All"
  return vessels.find((v) => v.id === user.vesselId)?.name || "Unknown"
}

const v = (i: number) => vessels[i]?.id ?? null

export const managedUsers: ManagedUser[] = [
  {
    id: "mu-001",
    name: "Emily Martinez",
    email: "emily.martinez@uniframe.ai",
    role: "admin",
    vesselId: null,
    lastActive: "2 hours ago",
  },
  {
    id: "mu-002",
    name: "David Chen",
    email: "david.chen@uniframe.ai",
    role: "viewer",
    vesselId: null,
    lastActive: "1 day ago",
  },
  {
    id: "mu-003",
    name: "Sofia Papadopoulos",
    email: "sofia.p@seaways.com",
    role: "crew",
    vesselId: v(0), // Seaways Skopelos
    lastActive: "3 hours ago",
  },
  {
    id: "mu-004",
    name: "Marcus Johnson",
    email: "marcus.j@seaways.com",
    role: "crew",
    vesselId: v(1), // Seaways Andromeda
    lastActive: "5 hours ago",
  },
  {
    id: "mu-005",
    name: "Liang Wei",
    email: "liang.wei@seaways.com",
    role: "crew",
    vesselId: v(2), // Seaways Titan
    lastActive: "Yesterday",
  },
]
