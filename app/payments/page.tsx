import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { executeQuery } from "@/lib/db"
import { formatCurrency, formatDate } from "@/lib/utils"
import PaymentForm from "@/components/payment-form"

async function getPayments() {
  const payments = await executeQuery({
    query: `
      SELECT 
        p.payment_id, 
        p.booking_id,
        c.name AS customer_name,
        r.room_type,
        b.check_in,
        b.check_out,
        p.payment_date, 
        p.payment_method, 
        p.amount
      FROM PAYMENT p
      JOIN BOOKING b ON p.booking_id = b.booking_id
      JOIN CUSTOMER c ON b.customer_id = c.customer_id
      JOIN ROOM r ON b.room_id = r.room_id
      ORDER BY p.payment_id DESC
    `,
  })

  return payments
}

async function getUnpaidBookings() {
  const bookings = await executeQuery({
    query: `
      SELECT 
        b.booking_id, 
        c.name AS customer_name,
        r.room_type,
        b.check_in,
        b.check_out,
        r.price
      FROM BOOKING b
      JOIN CUSTOMER c ON b.customer_id = c.customer_id
      JOIN ROOM r ON b.room_id = r.room_id
      WHERE b.status IN ('Confirmed', 'Checked-In')
      AND NOT EXISTS (
        SELECT 1 FROM PAYMENT p WHERE p.booking_id = b.booking_id
      )
      ORDER BY b.booking_id DESC
    `,
  })

  return bookings
}

export default async function PaymentsPage() {
  const payments = (await getPayments()) as any[]
  const unpaidBookings = (await getUnpaidBookings()) as any[]

  // Calculate total revenue
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0)

  // Group payments by method
  const paymentMethods = payments.reduce((acc, payment) => {
    const method = payment.payment_method
    if (!acc[method]) {
      acc[method] = 0
    }
    acc[method] += 1
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <PaymentForm unpaidBookings={unpaidBookings} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{unpaidBookings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              {Object.entries(paymentMethods).map(([method, count]) => (
                <div key={method} className="flex justify-between">
                  <span>{method}:</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Booking</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length > 0 ? (
                payments.map((payment) => (
                  <TableRow key={payment.payment_id}>
                    <TableCell>{payment.payment_id}</TableCell>
                    <TableCell className="font-medium">{payment.customer_name}</TableCell>
                    <TableCell>
                      #{payment.booking_id} - {payment.room_type}
                      <div className="text-xs text-muted-foreground">
                        {formatDate(payment.check_in)} to {formatDate(payment.check_out)}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(payment.payment_date)}</TableCell>
                    <TableCell>{payment.payment_method}</TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell className="text-right">
                      <PaymentForm paymentId={payment.payment_id} payment={payment} unpaidBookings={unpaidBookings} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No payments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
