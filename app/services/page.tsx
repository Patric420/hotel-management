import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { executeQuery } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import ServiceForm from "@/components/service-form"
import ApplyDiscountButton from "@/components/apply-discount-button"

async function getServices() {
  const services = await executeQuery({
    query: "SELECT * FROM SERVICE ORDER BY service_id DESC",
  })

  return services
}

async function getCustomerServices() {
  const customerServices = await executeQuery({
    query: `
      SELECT 
        cs.customer_id,
        cs.service_id,
        c.name AS customer_name,
        s.service_name,
        s.cost
      FROM CUSTOMER_SERVICE cs
      JOIN CUSTOMER c ON cs.customer_id = c.customer_id
      JOIN SERVICE s ON cs.service_id = s.service_id
      ORDER BY cs.customer_id DESC
    `,
  })

  return customerServices
}

export default async function ServicesPage() {
  const services = (await getServices()) as any[]
  const customerServices = (await getCustomerServices()) as any[]

  // Calculate total service revenue
  const totalServiceRevenue = customerServices.reduce((sum, cs) => sum + cs.cost, 0)

  // Group customer services by customer
  const customerServicesByCustomer = customerServices.reduce((acc, cs) => {
    if (!acc[cs.customer_id]) {
      acc[cs.customer_id] = {
        customer_id: cs.customer_id,
        customer_name: cs.customer_name,
        services: [],
        total: 0,
      }
    }
    acc[cs.customer_id].services.push({
      service_id: cs.service_id,
      service_name: cs.service_name,
      cost: cs.cost,
    })
    acc[cs.customer_id].total += cs.cost
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Services</h1>
        <div className="flex gap-2">
          <ApplyDiscountButton />
          <ServiceForm />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Service Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalServiceRevenue)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Services</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Service Name</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.service_id}>
                  <TableCell>{service.service_id}</TableCell>
                  <TableCell className="font-medium">{service.service_name}</TableCell>
                  <TableCell>{formatCurrency(service.cost)}</TableCell>
                  <TableCell className="text-right">
                    <ServiceForm serviceId={service.service_id} service={service} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer Services</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.values(customerServicesByCustomer).length > 0 ? (
            <div className="space-y-6">
              {Object.values(customerServicesByCustomer).map((cs: any) => (
                <div key={cs.customer_id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">{cs.customer_name}</h3>
                    <div className="font-bold">{formatCurrency(cs.total)}</div>
                  </div>
                  <div className="mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Service</TableHead>
                          <TableHead className="text-right">Cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cs.services.map((service: any) => (
                          <TableRow key={`${cs.customer_id}-${service.service_id}`}>
                            <TableCell>{service.service_name}</TableCell>
                            <TableCell className="text-right">{formatCurrency(service.cost)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">No customer services found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
