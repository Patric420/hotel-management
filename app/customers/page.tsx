import { executeQuery } from "@/lib/db"
import CustomerTable from "@/components/CustomerTable"
import CustomerForm from "@/components/customer-form"

async function getCustomers() {
  const customers = await executeQuery({
    query: "SELECT * FROM CUSTOMER ORDER BY customer_id DESC",
  })
  return customers
}

export default async function CustomersPage() {
  const customers = (await getCustomers()) as any[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <CustomerForm />
      </div>

      <CustomerTable initialCustomers={customers} />
    </div>
  )
}
