import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Users as UsersIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { PermissionGate } from "@/components/common/PermissionGate";
import { RoleSelect } from "@/components/admin/RoleSelect";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useAdminUsers, useSetUserRole } from "@/hooks/use-admin";
import { ROUTES } from "@/lib/routes";
import { toast } from "@/stores/toast-store";
import { cn } from "@/lib/utils";
import type { AdminUserSummary, UserRole } from "@/lib/types";

const ROLE_FILTER_OPTIONS: { value: UserRole | "all"; label: string }[] = [
  { value: "all", label: "All roles" },
  { value: "user", label: "Users" },
  { value: "developer", label: "Developers" },
  { value: "publisher", label: "Publishers" },
  { value: "admin", label: "Admins" },
];

export function UsersPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<UserRole | "all">("all");
  const { data, isLoading, error } = useAdminUsers({ search, role });
  const setUserRoleMutation = useSetUserRole();

  const [pending, setPending] = useState<{ user: AdminUserSummary; next: UserRole } | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const onConfirmRole = async () => {
    if (!pending) return;
    try {
      await setUserRoleMutation.mutateAsync({
        targetUid: pending.user.uid,
        role: pending.next,
      });
      toast.success(`${pending.user.displayName} is now ${pending.next}.`);
      setPending(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Role change failed.");
    }
  };

  const headers = useMemo(
    () => ["User", "Email", "Role", "Permissions", "UID"],
    [],
  );

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-foreground">Users</h2>
          <p className="text-[12px] text-muted/60">
            Search and promote users. Role changes write to dw_admin_audit and update custom claims.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted/55" />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by email, name, or uid"
              className="h-9 w-72 rounded-xl border border-separator bg-input pl-8 pr-3 text-[13px] text-foreground placeholder:text-muted/40 focus:border-acid/30 focus:outline-none focus:ring-1 focus:ring-acid/15"
            />
          </div>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as UserRole | "all")}
            className="h-9 rounded-xl border border-separator bg-input px-3 text-[13px] text-foreground focus:border-acid/30 focus:outline-none focus:ring-1 focus:ring-acid/15"
          >
            {ROLE_FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      {isLoading ? (
        <Card className="p-6 text-[13px] text-muted/65">Loading users…</Card>
      ) : error ? (
        <Card className="p-6 text-[13px] text-red">
          Failed to load users: {(error as Error).message}
        </Card>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="No users match"
          description="Try a different search or role filter."
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1.5fr)] gap-2 border-b border-separator bg-card-active/45 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-muted/55">
            {headers.map((h) => (
              <span key={h}>{h}</span>
            ))}
          </div>
          {data.map((user) => (
            <div
              key={user.uid}
              className={cn(
                "grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1.5fr)] items-center gap-2 border-b border-separator px-4 py-2 text-[12px] last:border-b-0",
                user.suspended && "opacity-60",
              )}
            >
              <Link
                to={ROUTES.adminUserDetail(user.uid)}
                className="truncate font-medium text-foreground hover:text-acid"
              >
                {user.displayName}
              </Link>
              <span className="truncate text-muted/75">{user.email}</span>
              <div>
                <PermissionGate
                  require="admin.users.role_change"
                  fallback={
                    <span className="text-[11px] text-muted/55 italic">{user.role}</span>
                  }
                >
                  <RoleSelect
                    value={user.role}
                    onChange={(next) => setPending({ user, next })}
                    disabled={setUserRoleMutation.isPending}
                  />
                </PermissionGate>
              </div>
              <span className="truncate text-[11px] text-muted/65">
                {user.permissions.length === 0 ? "—" : user.permissions.join(", ")}
              </span>
              <span className="truncate font-mono text-[10px] text-muted/55">{user.uid}</span>
            </div>
          ))}
        </Card>
      )}

      <Modal
        open={!!pending}
        onClose={() => !setUserRoleMutation.isPending && setPending(null)}
        title="Confirm role change"
      >
        {pending && (
          <div className="space-y-4">
            <p className="text-[13px] text-foreground/85">
              Set <span className="font-semibold">{pending.user.displayName}</span>'s role to{" "}
              <span className="font-semibold text-acid">{pending.next}</span>?
            </p>
            <p className="text-[12px] text-muted/65">
              Updates both their user document and Firebase custom claims. The user's next token
              refresh (≤1 hour, or after a re-sign-in) picks up the change.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setPending(null)}
                disabled={setUserRoleMutation.isPending}
              >
                Cancel
              </Button>
              <Button onClick={onConfirmRole} disabled={setUserRoleMutation.isPending}>
                {setUserRoleMutation.isPending ? "Updating…" : "Confirm"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
