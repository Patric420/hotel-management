import { executeQuery } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const staff = (await executeQuery({
      query: "SELECT * FROM STAFF WHERE staff_id = ?",
      values: [id],
    })) as any[]

    if (!staff.length) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 })
    }

    return NextResponse.json(staff[0])
  } catch (error) {
    console.error("Error fetching staff:", error)
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const { name, role, phone, salary } = await request.json()

    // Validate required fields
    if (!name || !role || !phone || !salary) {
      return NextResponse.json({ error: "Name, role, phone, and salary are required" }, { status: 400 })
    }

    // Check if phone already exists for other staff
    const existingStaff = (await executeQuery({
      query: "SELECT * FROM STAFF WHERE phone = ? AND staff_id != ?",
      values: [phone, id],
    })) as any[]

    if (existingStaff.length > 0) {
      return NextResponse.json({ error: "Another staff with this phone number already exists" }, { status: 400 })
    }

    // Update staff
    await executeQuery({
      query: "UPDATE STAFF SET name = ?, role = ?, phone = ?, salary = ? WHERE staff_id = ?",
      values: [name, role, phone, salary, id],
    })

    return NextResponse.json({
      id,
      name,
      role,
      phone,
      salary,
    })
  } catch (error) {
    console.error("Error updating staff:", error)
    return NextResponse.json({ error: "Failed to update staff" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Check if staff exists
    const staff = (await executeQuery({
      query: "SELECT * FROM STAFF WHERE staff_id = ?",
      values: [id],
    })) as any[]

    if (!staff.length) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 })
    }

    // Delete staff
    await executeQuery({
      query: "DELETE FROM STAFF WHERE staff_id = ?",
      values: [id],
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting staff:", error)
    return NextResponse.json({ error: "Failed to delete staff" }, { status: 500 })
  }
}
