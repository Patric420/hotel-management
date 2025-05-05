import { executeQuery } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const { status } = await request.json()

    // Validate status
    const validStatuses = ["Confirmed", "Checked-In", "Checked-Out", "Cancelled"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 })
    }

    // Get current booking details
    const currentBooking = (await executeQuery({
      query: "SELECT * FROM BOOKING WHERE booking_id = ?",
      values: [id],
    })) as any[]

    if (!currentBooking.length) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    const roomId = currentBooking[0].room_id

    // Update booking status
    await executeQuery({
      query: "UPDATE BOOKING SET status = ? WHERE booking_id = ?",
      values: [status, id],
    })

    // Update room status based on booking status
    // The trigger will handle updating room status to 'Available' when booking is 'Checked-Out'
    if (status === "Confirmed" || status === "Checked-In") {
      await executeQuery({
        query: "UPDATE ROOM SET status = 'Booked' WHERE room_id = ?",
        values: [roomId],
      })
    } else if (status === "Cancelled") {
      await executeQuery({
        query: "UPDATE ROOM SET status = 'Available' WHERE room_id = ?",
        values: [roomId],
      })
    }

    return NextResponse.json({
      id,
      status,
    })
  } catch (error) {
    console.error("Error updating booking status:", error)
    return NextResponse.json({ error: "Failed to update booking status" }, { status: 500 })
  }
}
