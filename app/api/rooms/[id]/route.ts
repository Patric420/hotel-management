import { executeQuery } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const room = (await executeQuery({
      query: "SELECT * FROM ROOM WHERE room_id = ?",
      values: [id],
    })) as any[]

    if (!room.length) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    return NextResponse.json(room[0])
  } catch (error) {
    console.error("Error fetching room:", error)
    return NextResponse.json({ error: "Failed to fetch room" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const { room_type, price, status } = await request.json()

    // Validate required fields
    if (!room_type || !price) {
      return NextResponse.json({ error: "Room type and price are required" }, { status: 400 })
    }

    // Update room
    await executeQuery({
      query: "UPDATE ROOM SET room_type = ?, price = ?, status = ? WHERE room_id = ?",
      values: [room_type, price, status || "Available", id],
    })

    return NextResponse.json({
      id,
      room_type,
      price,
      status: status || "Available",
    })
  } catch (error) {
    console.error("Error updating room:", error)
    return NextResponse.json({ error: "Failed to update room" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Check if room exists
    const room = (await executeQuery({
      query: "SELECT * FROM ROOM WHERE room_id = ?",
      values: [id],
    })) as any[]

    if (!room.length) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    // Check if room is being used in any bookings
    const bookings = (await executeQuery({
      query: "SELECT * FROM BOOKING WHERE room_id = ? AND status IN ('Confirmed', 'Checked-In')",
      values: [id],
    })) as any[]

    if (bookings.length > 0) {
      return NextResponse.json({ error: "Cannot delete room as it has active bookings" }, { status: 400 })
    }

    // Delete room
    await executeQuery({
      query: "DELETE FROM ROOM WHERE room_id = ?",
      values: [id],
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting room:", error)
    return NextResponse.json({ error: "Failed to delete room" }, { status: 500 })
  }
}
