import { executeQuery } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const staff = await executeQuery({
      query: "SELECT * FROM STAFF ORDER BY staff_id DESC",
    })

    return NextResponse.json(staff)
  } catch (error) {
    console.error("Error fetching staff:", error)
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, role, phone, salary } = await request.json()

    // Validate required fields
    if (!name || !role || !phone || !salary) {
      return NextResponse.json({ error: "Name, role, phone, and salary are required" }, { status: 400 })
    }

    // Check if phone already exists
    const existingStaff = (await executeQuery({
      query: "SELECT * FROM STAFF WHERE phone = ?",
      values: [phone],
    })) as any[]

    if (existingStaff.length > 0) {
      return NextResponse.json({ error: "A staff with this phone number already exists" }, { status: 400 })
    }

    // Insert new staff
    const result = (await executeQuery({
      query: "INSERT INTO STAFF (name, role, phone, salary) VALUES (?, ?, ?, ?)",
      values: [name, role, phone, salary],
    })) as any

    return NextResponse.json(
      {
        id: result.insertId,
        name,
        role,
        phone,
        salary,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating staff:", error)
    return NextResponse.json({ error: "Failed to create staff" }, { status: 500 })
  }
}
