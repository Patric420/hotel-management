import { executeQuery } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const booking = (await executeQuery({
      query: `
        SELECT 
          b.booking_id, 
          b.customer_id,
          c.name AS customer_name, 
          b.room_id,
          r.room_type, 
          r.price AS room_price,
          b.check_in, 
          b.check_out, 
          b.status
        FROM BOOKING b
        JOIN CUSTOMER c ON b.customer_id = c.customer_id
        JOIN ROOM r ON b.room_id = r.room_id
        WHERE b.booking_id = ?
      `,
      values: [id],
    })) as any[]

    if (!booking.length) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    return NextResponse.json(booking[0])
  } catch (error) {
    console.error("Error fetching booking:", error)
    return NextResponse.json({ error: "Failed to fetch booking" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const { customer_id, room_id, check_in, check_out, status } = await request.json()

    // Validate required fields
    if (!customer_id || !room_id || !check_in || !check_out) {
      return NextResponse.json({ error: "Customer, room, check-in, and check-out dates are required" }, { status: 400 })
    }

    // Get current booking details
    const currentBooking = (await executeQuery({
      query: "SELECT * FROM BOOKING WHERE booking_id = ?",
      values: [id],
    })) as any[]

    if (!currentBooking.length) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    const currentRoomId = currentBooking[0].room_id

    // If room is changing, check if new room is available
    if (room_id !== currentRoomId) {
      const availableRooms = (await executeQuery({
        query: `
          SELECT * FROM ROOM r
          WHERE r.room_id = ?
          AND r.status = 'Available'
          AND NOT EXISTS (
            SELECT 1 FROM BOOKING b
            WHERE b.room_id = r.room_id
            AND b.booking_id != ?
            AND b.status IN ('Confirmed', 'Checked-In')
            AND (
              (b.check_in <= ? AND b.check_out >= ?) OR
              (b.check_in <= ? AND b.check_out >= ?) OR
              (b.check_in >= ? AND b.check_out <= ?)
            )
          )
        `,
        values: [room_id, id, check_in, check_in, check_out, check_out, check_in, check_out],
      })) as any[]

      if (availableRooms.length === 0) {
        return NextResponse.json({ error: "The selected room is not available for the chosen dates" }, { status: 400 })
      }
    }

    // Update booking
    await executeQuery({
      query:
        "UPDATE BOOKING SET customer_id = ?, room_id = ?, check_in = ?, check_out = ?, status = ? WHERE booking_id = ?",
      values: [customer_id, room_id, check_in, check_out, status, id],
    })

    // Update old room status to 'Available' if room is changing
    if (room_id !== currentRoomId) {
      await executeQuery({
        query: "UPDATE ROOM SET status = 'Available' WHERE room_id = ?",
        values: [currentRoomId],
      })

      // Update new room status to 'Booked' if booking is confirmed or checked-in
      if (status === "Confirmed" || status === "Checked-In") {
        await executeQuery({
          query: "UPDATE ROOM SET status = 'Booked' WHERE room_id = ?",
          values: [room_id],
        })
      }
    }

    return NextResponse.json({
      id,
      customer_id,
      room_id,
      check_in,
      check_out,
      status,
    })
  } catch (error) {
    console.error("Error updating booking:", error)
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Get current booking details to update room status later
    const currentBooking = (await executeQuery({
      query: "SELECT * FROM BOOKING WHERE booking_id = ?",
      values: [id],
    })) as any[]

    if (!currentBooking.length) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    const currentRoomId = currentBooking[0].room_id

    // Delete booking
    await executeQuery({
      query: "DELETE FROM BOOKING WHERE booking_id = ?",
      values: [id],
    })

    // Update room status to 'Available'
    await executeQuery({
      query: "UPDATE ROOM SET status = 'Available' WHERE room_id = ?",
      values: [currentRoomId],
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting booking:", error)
    return NextResponse.json({ error: "Failed to delete booking" }, { status: 500 })
  }
}
