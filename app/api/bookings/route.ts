import { executeQuery } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const bookings = await executeQuery({
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
        ORDER BY b.booking_id DESC
      `,
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error("Error fetching bookings:", error)
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { customer_id, room_id, check_in, check_out, status } = await request.json()

    // Validate required fields
    if (!customer_id || !room_id || !check_in || !check_out) {
      return NextResponse.json({ error: "Customer, room, check-in, and check-out dates are required" }, { status: 400 })
    }

    // Check if room is available for the selected dates
    const availableRooms = (await executeQuery({
      query: `
        SELECT * FROM ROOM r
        WHERE r.room_id = ?
        AND r.status = 'Available'
        AND NOT EXISTS (
          SELECT 1 FROM BOOKING b
          WHERE b.room_id = r.room_id
          AND b.status IN ('Confirmed', 'Checked-In')
          AND (
            (b.check_in <= ? AND b.check_out >= ?) OR
            (b.check_in <= ? AND b.check_out >= ?) OR
            (b.check_in >= ? AND b.check_out <= ?)
          )
        )
      `,
      values: [room_id, check_in, check_in, check_out, check_out, check_in, check_out],
    })) as any[]

    if (availableRooms.length === 0) {
      return NextResponse.json({ error: "The selected room is not available for the chosen dates" }, { status: 400 })
    }

    // Insert new booking
    const result = (await executeQuery({
      query: "INSERT INTO BOOKING (customer_id, room_id, check_in, check_out, status) VALUES (?, ?, ?, ?, ?)",
      values: [customer_id, room_id, check_in, check_out, status || "Confirmed"],
    })) as any

    // Update room status to 'Booked' if booking is confirmed or checked-in
    if (status === "Confirmed" || status === "Checked-In") {
      await executeQuery({
        query: "UPDATE ROOM SET status = 'Booked' WHERE room_id = ?",
        values: [room_id],
      })
    }

    return NextResponse.json(
      {
        id: result.insertId,
        customer_id,
        room_id,
        check_in,
        check_out,
        status: status || "Confirmed",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating booking:", error)
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
  }
}
