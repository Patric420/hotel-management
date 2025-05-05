import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { executeQuery } from "@/lib/db"
import { formatDate } from "@/lib/utils"
import BookingForm from "@/components/booking-form"
import { Badge } from "@/components/ui/badge"
import BookingStatusForm from "@/components/booking-status-form"

async function getBookings() {
  const bookings = await executeQuery({
    query: `
      SELECT 
        b.booking_id, 
        c.name AS customer_name, 
        r.room_type, 
        r.price AS room_price,
        b.check_in, 
        b.check_out, 
        b.status,
        p.payment_id,
        p.amount AS payment_amount
      FROM BOOKING b
      JOIN CUSTOMER c ON b.customer_id = c.customer_id
      JOIN ROOM r ON b.room_id = r.room_id
      LEFT JOIN PAYMENT p ON b.booking_id = p.booking_id
      ORDER BY b.booking_id DESC
    `,
  })

  return bookings
}

export default async function BookingsPage() {
  const bookings = (await getBookings()) as any[]

  // Count bookings by status
  const statusCounts = {
    Confirmed: bookings.filter((booking) => booking.status === "Confirmed").length,
    "Checked-In": bookings.filter((booking) => booking.status === "Checked-In").length,
    "Checked-Out": bookings.filter((booking) => booking.status === "Checked-Out").length,
    Cancelled: bookings.filter((booking) => booking.status === "Cancelled").length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
        <BookingForm />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statusCounts.Confirmed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Checked-In</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts["Checked-In"]}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Checked-Out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{statusCounts["Checked-Out"]}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statusCounts.Cancelled}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Check-In</TableHead>
                <TableHead>Check-Out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.booking_id}>
                  <TableCell>{booking.booking_id}</TableCell>
                  <TableCell className="font-medium">{booking.customer_name}</TableCell>
                  <TableCell>{booking.room_type}</TableCell>
                  <TableCell>{formatDate(booking.check_in)}</TableCell>
                  <TableCell>{formatDate(booking.check_out)}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        booking.status === "Confirmed"
                          ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                          : booking.status === "Checked-In"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : booking.status === "Checked-Out"
                              ? "bg-gray-100 text-gray-800 hover:bg-gray-100"
                              : "bg-red-100 text-red-800 hover:bg-red-100"
                      }
                    >
                      {booking.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {booking.payment_id ? (
                      <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                        Paid
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <BookingStatusForm bookingId={booking.booking_id} currentStatus={booking.status} />
                      <BookingForm bookingId={booking.booking_id} booking={booking} />
                    </div>
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
