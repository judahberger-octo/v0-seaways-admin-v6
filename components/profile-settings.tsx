"use client"

import { useState } from "react"
import { X, User, Users, ShieldCheck, Building2, Waves, Ship } from "lucide-react"
import { useUser } from "@/lib/user-context"

interface ProfileSettingsProps {
  open: boolean
  onClose: () => void
}

type SettingsSection = "profile" | "users" | "roles" | "vessel-groups" | "tenant"

export function ProfileSettings({ open, onClose }: ProfileSettingsProps) {
  const { currentUser } = useUser()
  const isAdmin = currentUser.role === "admin"
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile")

  if (!open) return null

  // Crew users only see Profile. Admins see the full settings sidebar.
  const navItems: { id: SettingsSection; label: string; icon: typeof User; group?: string }[] = isAdmin
    ? [
        { id: "profile", label: "Profile", icon: User },
        { id: "users", label: "Users", icon: Users, group: "User management" },
        { id: "roles", label: "Roles", icon: ShieldCheck, group: "User management" },
        { id: "vessel-groups", label: "Vessel Groups", icon: Ship, group: "User management" },
        { id: "tenant", label: "Tenant Settings", icon: Building2 },
      ]
    : [{ id: "profile", label: "Profile", icon: User }]

  // Group nav items by their optional group label
  const ungrouped = navItems.filter((i) => !i.group)
  const groupedKeys = Array.from(new Set(navItems.filter((i) => i.group).map((i) => i.group as string)))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div className="w-full max-w-4xl h-[600px] max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex" onClick={(e) => e.stopPropagation()}>
        {/* Sidebar */}
        <aside className="w-60 flex-shrink-0 border-r border-[#e2e8f0] bg-[#f8fafc] flex flex-col">
          <div className="px-5 py-4 border-b border-[#e2e8f0]">
            <h2 id="settings-title" className="text-base font-semibold text-[#0f172a]">Settings</h2>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
            {/* Ungrouped (Profile) first */}
            <div className="space-y-1">
              {ungrouped
                .filter((i) => i.id === "profile")
                .map((item) => (
                  <SettingsNavButton key={item.id} item={item} active={activeSection === item.id} onClick={() => setActiveSection(item.id)} />
                ))}
            </div>

            {/* Grouped sections (admin only) */}
            {groupedKeys.map((groupKey) => (
              <div key={groupKey}>
                <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">{groupKey}</p>
                <div className="space-y-1">
                  {navItems
                    .filter((i) => i.group === groupKey)
                    .map((item) => (
                      <SettingsNavButton key={item.id} item={item} active={activeSection === item.id} onClick={() => setActiveSection(item.id)} />
                    ))}
                </div>
              </div>
            ))}

            {/* Remaining ungrouped (Tenant) */}
            <div className="space-y-1">
              {ungrouped
                .filter((i) => i.id !== "profile")
                .map((item) => (
                  <SettingsNavButton key={item.id} item={item} active={activeSection === item.id} onClick={() => setActiveSection(item.id)} />
                ))}
            </div>
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
            <h3 className="text-sm font-semibold text-[#0f172a] capitalize">
              {navItems.find((i) => i.id === activeSection)?.label}
            </h3>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9]" aria-label="Close settings">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeSection === "profile" && <ProfileSection />}
            {activeSection !== "profile" && (
              <div className="text-sm text-[#64748b]">
                This section is managed in the Admin panel.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SettingsNavButton({
  item,
  active,
  onClick,
}: {
  item: { id: string; label: string; icon: typeof User }
  active: boolean
  onClick: () => void
}) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
        active ? "bg-[#f3e8ff] text-[#7c3aed] font-medium" : "text-[#334155] hover:bg-[#f1f5f9]"
      }`}
    >
      <Icon className="w-4 h-4" />
      {item.label}
    </button>
  )
}

function ProfileSection() {
  const { currentUser } = useUser()
  const isCrew = currentUser.role === "crew"

  return (
    <div className="max-w-lg space-y-6">
      {/* Identity */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[#7c3aed] flex items-center justify-center text-white text-lg font-semibold">
          {currentUser.initials}
        </div>
        <div>
          <p className="text-base font-semibold text-[#0f172a]">{currentUser.name}</p>
          <p className="text-sm text-[#64748b]">{currentUser.email}</p>
        </div>
      </div>

      {/* Details */}
      <dl className="divide-y divide-[#e2e8f0] rounded-xl border border-[#e2e8f0] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <dt className="text-sm text-[#64748b]">Role</dt>
          <dd>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f3e8ff] px-2.5 py-0.5 text-xs font-medium text-[#7c3aed] capitalize">
              <ShieldCheck className="w-3 h-3" />
              {currentUser.role}
            </span>
          </dd>
        </div>

        {/* Assigned vessel - prominent for crew, "All vessels" for admin */}
        <div className="flex items-center justify-between px-4 py-3">
          <dt className="text-sm text-[#64748b]">Assigned vessel</dt>
          <dd>
            {isCrew && currentUser.assignedVessel ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#99f6e4] bg-[#f0fdfa] px-3 py-1 text-sm font-semibold text-[#0d9488]">
                <Waves className="w-3.5 h-3.5" />
                {currentUser.assignedVessel}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0f172a]">
                <Ship className="w-3.5 h-3.5 text-[#64748b]" />
                All vessels
              </span>
            )}
          </dd>
        </div>
      </dl>

      {isCrew && (
        <div className="rounded-xl border border-[#99f6e4] bg-[#f0fdfa] p-4">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#ccfbf1] flex items-center justify-center">
              <Waves className="w-4 h-4 text-[#0d9488]" />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#0f172a]">Assigned vessel: {currentUser.assignedVessel}</p>
              <p className="text-xs text-[#64748b] mt-0.5">
                You only see reports for this vessel. Contact an administrator to change your vessel assignment.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
