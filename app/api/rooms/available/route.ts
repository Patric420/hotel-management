import { executeQuery } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const checkIn = searchParams.get("check_in")
    const checkOut = searchParams.get("check_out")
    const bookingId = searchParams.get("booking_id")

    if (!checkIn || !checkOut) {
      return NextResponse.json({ error: "Check-in and check-out dates are required" }, { status: 400 })
    }

    let query = `
      SELECT * FROM ROOM r
      WHERE r.status != 'Under Maintenance'
      AND NOT EXISTS (
        SELECT 1 FROM BOOKING b
        WHERE b.room_id = r.room_id
        AND b.status IN ('Confirmed', 'Checked-In')
    `

    // If editing a booking, exclude the current booking from the check
    if (bookingId) {
      query += ` AND b.booking_id != ${bookingId} `
    }

    query += `
        AND (
          (b.check_in <= ? AND b.check_out >= ?) OR
          (b.check_in <= ? AND b.check_out >= ?) OR
          (b.check_in >= ? AND b.check_out <= ?)
        )
      )
      ORDER BY r.room_id
    `

    const availableRooms = await executeQuery({
      query,
      values: [checkIn, checkIn, checkOut, checkOut, checkIn, checkOut],
    })

    return NextResponse.json(availableRooms)
  } catch (error) {
    console.error("Error fetching available rooms:", error)
    return NextResponse.json({ error: "Failed to fetch available rooms" }, { status: 500 })
  }
}
