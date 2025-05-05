import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { executeQuery } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import StaffForm from "@/components/staff-form"
import { Badge } from "@/components/ui/badge"

async function getStaff() {
  const staff = await executeQuery({
    query: "SELECT * FROM STAFF ORDER BY staff_id DESC",
  })

  return staff
}

export default async function StaffPage() {
  const staff = (await getStaff()) as any[]

  // Count staff by role
  const roleCount = staff.reduce((acc, s) => {
    const role = s.role
    if (!acc[role]) {
      acc[role] = 0
    }
    acc[role] += 1
    return acc
  }, {})

  // Calculate total salary
  const totalSalary = staff.reduce((sum, s) => sum + s.salary, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Staff</h1>
        <StaffForm />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Staff by Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(roleCount).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2">
                      {count}
                    </Badge>
                    {role}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Salary Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSalary)}</div>
            <p className="text-xs text-muted-foreground">Monthly</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Staff</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((s) => (
                <TableRow key={s.staff_id}>
                  <TableCell>{s.staff_id}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-muted">
                      {s.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{s.phone}</TableCell>
                  <TableCell>{formatCurrency(s.salary)}</TableCell>
                  <TableCell className="text-right">
                    <StaffForm staffId={s.staff_id} staff={s} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
