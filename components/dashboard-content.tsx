"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { executeQuery } from "@/lib/db"
import DashboardCharts from "@/components/dashboard-charts"
import { formatCurrency } from "@/lib/utils"
import { Users, Hotel, Calendar, CreditCard } from "lucide-react"

async function getDashboardData() {
  // Get total customers
  const customers = (await executeQuery({
    query: "SELECT COUNT(*) as total FROM CUSTOMER",
  })) as any[]

  // Get room statistics
  const rooms = (await executeQuery({
    query: "SELECT status, COUNT(*) as count FROM ROOM GROUP BY status",
  })) as any[]

  // Get revenue this month
  const revenue = (await executeQuery({
    query:
      "SELECT SUM(amount) as total FROM PAYMENT WHERE MONTH(payment_date) = MONTH(CURRENT_DATE()) AND YEAR(payment_date) = YEAR(CURRENT_DATE())",
  })) as any[]

  // Get active bookings
  const bookings = (await executeQuery({
    query: "SELECT COUNT(*) as total FROM BOOKING WHERE status IN ('Confirmed', 'Checked-In')",
  })) as any[]

  // Get room type distribution
  const roomTypes = (await executeQuery({
    query:
      "SELECT r.room_type, COUNT(b.booking_id) as count FROM ROOM r LEFT JOIN BOOKING b ON r.room_id = b.room_id GROUP BY r.room_type",
  })) as any[]

  // Get payment methods distribution
  const paymentMethods = (await executeQuery({
    query: "SELECT payment_method, COUNT(*) as count FROM PAYMENT GROUP BY payment_method",
  })) as any[]

  return {
    totalCustomers: customers[0]?.total || 0,
    roomStats: rooms,
    revenueThisMonth: revenue[0]?.total || 0,
    activeBookings: bookings[0]?.total || 0,
    roomTypeData: roomTypes,
    paymentMethodData: paymentMethods,
  }
}

export default async function DashboardContent() {
  const { totalCustomers, roomStats, revenueThisMonth, activeBookings, roomTypeData, paymentMethodData } =
    await getDashboardData()

  // Calculate available and booked rooms
  const availableRooms = roomStats.find((r) => r.status === "Available")?.count || 0
  const bookedRooms = roomStats.find((r) => r.status === "Booked")?.count || 0
  const maintenanceRooms = roomStats.find((r) => r.status === "Under Maintenance")?.count || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Room Status</CardTitle>
            <Hotel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {availableRooms} / {availableRooms + bookedRooms + maintenanceRooms}
            </div>
            <div className="text-xs text-muted-foreground">Available Rooms</div>
            <div className="mt-3 flex gap-2">
              <div className="flex items-center">
                <div className="mr-1 h-3 w-3 rounded-full bg-green-500"></div>
                <span className="text-xs">Available: {availableRooms}</span>
              </div>
              <div className="flex items-center">
                <div className="mr-1 h-3 w-3 rounded-full bg-red-500"></div>
                <span className="text-xs">Booked: {bookedRooms}</span>
              </div>
              <div className="flex items-center">
                <div className="mr-1 h-3 w-3 rounded-full bg-yellow-500"></div>
                <span className="text-xs">Maintenance: {maintenanceRooms}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue This Month</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(revenueThisMonth)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBookings}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="charts">
        <TabsList>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="charts" className="space-y-4">
          <DashboardCharts roomTypeData={roomTypeData} paymentMethodData={paymentMethodData} />
        </TabsContent>
        <TabsContent value="recent">
          <RecentActivity />
        </TabsContent>
      </Tabs>
    </div>
  )
}

async function getRecentActivity() {
  const recentBookings = (await executeQuery({
    query: `
      SELECT 
        b.booking_id, 
        c.name AS customer_name, 
        r.room_type, 
        b.check_in, 
        b.status 
      FROM BOOKING b
      JOIN CUSTOMER c ON b.customer_id = c.customer_id
      JOIN ROOM r ON b.room_id = r.room_id
      ORDER BY b.booking_id DESC
      LIMIT 5
    `,
  })) as any[]

  return recentBookings
}

async function RecentActivity() {
  const recentBookings = await getRecentActivity()

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Recent Bookings</h3>
      <div className="rounded-md border">
        <div className="p-4">
          {recentBookings.length > 0 ? (
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div key={booking.booking_id} className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      Booking #{booking.booking_id} - {booking.customer_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {booking.room_type} - Check-in: {new Date(booking.check_in).toLocaleDateString()}
                    </p>
                  </div>
                  <div
                    className={`rounded-full px-2 py-1 text-xs ${
                      booking.status === "Confirmed"
                        ? "bg-blue-100 text-blue-800"
                        : booking.status === "Checked-In"
                          ? "bg-green-100 text-green-800"
                          : booking.status === "Checked-Out"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-red-100 text-red-800"
                    }`}
                  >
                    {booking.status}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No recent bookings</p>
          )}
        </div>
      </div>
    </div>
  )
}
