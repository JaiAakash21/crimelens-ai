"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatShortDate, capitalize } from "@/lib/utils";
import type { UserProfile } from "@/types";

interface UserTableProps {
  users?: UserProfile[];
  loading?: boolean;
}

const roleVariant: Record<string, "default" | "secondary" | "outline"> = {
  admin: "default",
  analyst: "secondary",
  citizen: "outline",
};

export function UserTable({ users, loading }: UserTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Joined</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(!users || users.length === 0) && (
          <TableRow>
            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
              No users found
            </TableCell>
          </TableRow>
        )}
        {users?.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-muted">
                    {(user.full_name ?? user.email)[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">
                  {user.full_name ?? "Unnamed"}
                </span>
              </div>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {user.email}
            </TableCell>
            <TableCell>
              <Badge
                variant={roleVariant[user.role] ?? "outline"}
                className="text-[11px]"
              >
                {capitalize(user.role)}
              </Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
              {formatShortDate(user.created_at)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
