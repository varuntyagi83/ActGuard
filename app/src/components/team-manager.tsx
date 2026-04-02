"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Loader2,
  Shield,
  ShieldCheck,
  Eye,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format-date";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  emailVerified: string | null;
  createdAt: string;
}

interface Props {
  users: User[];
  currentUserId: string;
}

const ROLE_CONFIG: Record<
  string,
  { label: string; color: string; icon: typeof Shield }
> = {
  admin: {
    label: "Admin",
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
    icon: ShieldCheck,
  },
  compliance_officer: {
    label: "Compliance Officer",
    color:
      "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    icon: Shield,
  },
  viewer: {
    label: "Viewer",
    color:
      "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    icon: Eye,
  },
};

export function TeamManager({ users: initialUsers, currentUserId }: Props) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError("");
    setInviteSuccess("");
    setInviting(true);

    try {
      const res = await fetch("/api/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          name: inviteName,
          role: inviteRole,
          password: invitePassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setInviteError(data.error || "Failed to add user");
      } else {
        const data = await res.json();
        setInviteSuccess(`${data.user.email} added as ${ROLE_CONFIG[data.user.role]?.label || data.user.role}`);
        setInviteEmail("");
        setInviteName("");
        setInvitePassword("");
        setInviteRole("viewer");
        router.refresh();
        // Add to local state
        setUsers((prev) => [
          ...prev,
          {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            emailVerified: null,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      setInviteError("Something went wrong");
    }

    setInviting(false);
  }

  async function handleRoleChange(userId: string, newRole: string) {
    setUpdatingId(userId);

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        router.refresh();
      }
    } catch {
      // Silently fail
    }

    setUpdatingId(null);
  }

  async function handleRemove(userId: string) {
    if (!confirm("Remove this user from the organization?")) return;
    setRemovingId(userId);

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        router.refresh();
      }
    } catch {
      // Silently fail
    }

    setRemovingId(null);
  }

  return (
    <div className="space-y-6">
      {/* Team members table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Members</CardTitle>
          <CardDescription>
            {users.length} {users.length === 1 ? "member" : "members"} in your
            organisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const config = ROLE_CONFIG[user.role] || ROLE_CONFIG.viewer;
                const isCurrentUser = user.id === currentUserId;

                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.name || "—"}
                      {isCurrentUser && (
                        <span className="text-xs text-muted-foreground ml-2">
                          (you)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      {isCurrentUser ? (
                        <Badge className={config.color}>{config.label}</Badge>
                      ) : (
                        <Select
                          value={user.role}
                          onValueChange={(val) =>
                            val && handleRoleChange(user.id, val)
                          }
                          disabled={updatingId === user.id}
                        >
                          <SelectTrigger className="w-[180px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="compliance_officer">
                              Compliance Officer
                            </SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      {!isCurrentUser && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          onClick={() => handleRemove(user.id)}
                          disabled={removingId === user.id}
                        >
                          {removingId === user.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add user form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Team Member
          </CardTitle>
          <CardDescription>
            Create an account for a new team member in your organisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="space-y-4">
            {inviteError && (
              <div className="bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm rounded-md p-3">
                {inviteError}
              </div>
            )}
            {inviteSuccess && (
              <div className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 text-sm rounded-md p-3">
                {inviteSuccess}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invite-name">Name</Label>
                <Input
                  id="invite-name"
                  placeholder="Jane Smith"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email *</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="jane@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-password">Temporary Password *</Label>
                <Input
                  id="invite-password"
                  type="password"
                  placeholder="Min 8 characters"
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <Select value={inviteRole} onValueChange={(val) => val && setInviteRole(val)}>
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="compliance_officer">
                      Compliance Officer
                    </SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={inviting} className="gap-2">
              {inviting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {inviting ? "Adding..." : "Add Member"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
