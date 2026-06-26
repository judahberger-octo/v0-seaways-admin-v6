"use client"

import { useState, useMemo } from "react"
import { Search, Plus, Ship, X, ChevronDown, Pencil } from "lucide-react"
import { vessels } from "@/lib/admin-mock-data"
import {
  managedUsers as initialUsers,
  roleLabels,
  roleDescriptions,
  vesselNameForUser,
  type ManagedUser,
  type AppRole,
} from "@/lib/managed-users"

const roleBadgeStyles: Record<AppRole, string> = {
  admin: "border-purple-200 bg-purple-50 text-purple-700",
  viewer: "border-blue-200 bg-blue-50 text-blue-700",
  crew: "border-teal-200 bg-teal-50 text-teal-700",
}

// Users page (SOLD-1502): application user list with role + vessel assignment.
export function AdminUsers() {
  const [users, setUsers] = useState<ManagedUser[]>(initialUsers)
  const [searchQuery, setSearchQuery] = useState("")
  // null = closed, "new" = create, ManagedUser = edit
  const [editing, setEditing] = useState<ManagedUser | "new" | null>(null)

  const filtered = useMemo(() => {
    if (!searchQuery) return users
    const q = searchQuery.toLowerCase()
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    )
  }, [users, searchQuery])

  const handleSave = (user: ManagedUser) => {
    setUsers((prev) => {
      const exists = prev.some((u) => u.id === user.id)
      return exists ? prev.map((u) => (u.id === user.id ? user : u)) : [...prev, user]
    })
    setEditing(null)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-shrink-0 p-6 pb-0">
        {/* Page header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-[#0f172a]">Users</h1>
            <p className="mt-1 text-sm text-[#64748b]">{users.length} users with access</p>
          </div>
          <button
            onClick={() => setEditing("new")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#7c3aed] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#6d28d9]"
          >
            <Plus className="h-4 w-4" />
            Add User
          </button>
        </div>

        {/* Search */}
        <div className="mb-4 rounded-xl border border-[#e2e8f0] bg-white p-4">
          <div className="relative min-w-[280px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full rounded-lg border border-[#e2e8f0] bg-white py-2 pl-10 pr-4 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="rounded-xl border border-[#e2e8f0] bg-white">
          {/* Header */}
          <div className="grid grid-cols-[2fr_100px_1.4fr_120px_80px] gap-4 border-b border-[#e2e8f0] px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">User</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Role</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Vessel</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Last Active</span>
            <span className="text-right text-xs font-semibold uppercase tracking-wide text-[#64748b]">Edit</span>
          </div>

          {/* Rows */}
          {filtered.map((user) => (
            <div
              key={user.id}
              className="grid grid-cols-[2fr_100px_1.4fr_120px_80px] items-center gap-4 border-b border-[#f1f5f9] px-4 py-3 last:border-b-0 hover:bg-[#f8fafc]"
            >
              {/* User */}
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#7c3aed] text-xs font-semibold text-white">
                  {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-[#0f172a]">{user.name}</p>
                  <p className="truncate text-xs text-[#64748b]">{user.email}</p>
                </div>
              </div>

              {/* Role */}
              <div>
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${roleBadgeStyles[user.role]}`}>
                  {roleLabels[user.role]}
                </span>
              </div>

              {/* Vessel */}
              <div className="flex items-center gap-1.5 text-sm text-[#334155] min-w-0">
                {user.vesselId ? (
                  <>
                    <Ship className="h-3.5 w-3.5 flex-shrink-0 text-[#94a3b8]" />
                    <span className="truncate">{vesselNameForUser(user)}</span>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[#64748b]">
                    <span className="rounded bg-[#f1f5f9] px-1.5 py-0.5 text-xs font-medium">All vessels</span>
                  </span>
                )}
              </div>

              {/* Last active */}
              <span className="text-sm text-[#64748b]">{user.lastActive || "—"}</span>

              {/* Edit */}
              <div className="flex justify-end">
                <button
                  onClick={() => setEditing(user)}
                  className="rounded-lg p-1.5 text-[#64748b] transition-colors hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                  title={`Edit ${user.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-[#64748b]">No users match your search</div>
          )}
        </div>
      </div>

      {/* Add/Edit modal */}
      {editing !== null && (
        <UserFormModal
          user={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Add / Edit User modal with role + vessel assignment
// ---------------------------------------------------------------------------
function UserFormModal({
  user,
  onClose,
  onSave,
}: {
  user: ManagedUser | null
  onClose: () => void
  onSave: (user: ManagedUser) => void
}) {
  const isEdit = user !== null
  const [name, setName] = useState(user?.name ?? "")
  const [email, setEmail] = useState(user?.email ?? "")
  const [role, setRole] = useState<AppRole>(user?.role ?? "crew")
  const [vesselId, setVesselId] = useState<string | null>(user?.vesselId ?? null)

  // Crew must be assigned to exactly one vessel; admin/viewer cover all vessels.
  const requiresVessel = role === "crew"
  const canSave = name.trim() && email.trim() && (!requiresVessel || vesselId)

  const handleRoleChange = (next: AppRole) => {
    setRole(next)
    // Admin/Viewer => all vessels (null). Crew => default to first vessel.
    if (next === "crew") {
      setVesselId((prev) => prev ?? vessels[0]?.id ?? null)
    } else {
      setVesselId(null)
    }
  }

  const handleSubmit = () => {
    if (!canSave) return
    onSave({
      id: user?.id ?? `mu-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      role,
      vesselId: requiresVessel ? vesselId : null,
      lastActive: user?.lastActive ?? "Just now",
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-form-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e2e8f0] px-5 py-4">
          <h2 id="user-form-title" className="text-base font-semibold text-[#0f172a]">
            {isEdit ? "Edit user" : "Add user"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 text-[#64748b] hover:bg-[#f1f5f9]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-5 py-5">
          {/* Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[#334155]">Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sofia Papadopoulos"
              className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[#334155]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@seaways.com"
              className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
            />
          </div>

          {/* Role */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#334155]">Role</label>
            <div className="grid grid-cols-3 gap-2">
              {(["admin", "viewer", "crew"] as AppRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRoleChange(r)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    role === r
                      ? "border-[#7c3aed] bg-[#f3e8ff] text-[#7c3aed]"
                      : "border-[#e2e8f0] text-[#334155] hover:bg-[#f8fafc]"
                  }`}
                >
                  {roleLabels[r]}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-[#64748b]">{roleDescriptions[role]}</p>
          </div>

          {/* Vessel assignment */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[#334155]">Vessel assignment</label>
            {requiresVessel ? (
              <div className="relative">
                <select
                  value={vesselId ?? ""}
                  onChange={(e) => setVesselId(e.target.value || null)}
                  className="w-full appearance-none rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 pr-8 text-sm text-[#0f172a] focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                >
                  <option value="" disabled>
                    Select a vessel...
                  </option>
                  {vessels.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm text-[#64748b]">
                <Ship className="h-4 w-4 text-[#94a3b8]" />
                All vessels
              </div>
            )}
            <p className="mt-1.5 text-xs text-[#64748b]">
              {requiresVessel
                ? "Crew users can only access reports for their assigned vessel."
                : "Admins and viewers have access to every vessel."}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-[#e2e8f0] px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-[#e2e8f0] px-4 py-2 text-sm font-medium text-[#334155] hover:bg-[#f8fafc]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSave}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
              canSave ? "bg-[#7c3aed] hover:bg-[#6d28d9]" : "cursor-not-allowed bg-[#cbd5e1]"
            }`}
          >
            {isEdit ? "Save changes" : "Add user"}
          </button>
        </div>
      </div>
    </div>
  )
}
