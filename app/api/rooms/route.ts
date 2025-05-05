import { executeQuery } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const rooms = await executeQuery({
      query: "SELECT * FROM ROOM ORDER BY room_id DESC",
    })

    return NextResponse.json(rooms)
  } catch (error) {
    console.error("Error fetching rooms:", error)
    return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { room_type, price, status } = await request.json()

    // Validate required fields
    if (!room_type || !price) {
      return NextResponse.json({ error: "Room type and price are required" }, { status: 400 })
    }

    // Insert new room
    const result = (await executeQuery({
      query: "INSERT INTO ROOM (room_type, price, status) VALUES (?, ?, ?)",
      values: [room_type, price, status || "Available"],
    })) as any

    return NextResponse.json(
      {
        id: result.insertId,
        room_type,
        price,
        status: status || "Available",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating room:", error)
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 })
  }
}
