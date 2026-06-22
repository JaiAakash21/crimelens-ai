"use client";

import { useUsers } from "@/hooks/use-api";
import { UserTable } from "@/components/users/user-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function UsersPage() {
  const { data: users, isLoading } = useUsers();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
        <p className="text-sm text-muted-foreground">
          Manage citizens, analysts, and administrators
        </p>
      </div>

      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-accent" />
            All Users ({users?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <UserTable users={users} loading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
