import { executeQuery } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const customers = await executeQuery({
      query: "SELECT * FROM CUSTOMER ORDER BY customer_id DESC",
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.error("Error fetching customers:", error)
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, address } = await request.json()

    // Validate required fields
    if (!name || !email || !phone) {
      return NextResponse.json({ error: "Name, email, and phone are required" }, { status: 400 })
    }

    // Check if email or phone already exists
    const existingCustomer = (await executeQuery({
      query: "SELECT * FROM CUSTOMER WHERE email = ? OR phone = ?",
      values: [email, phone],
    })) as any[]

    if (existingCustomer.length > 0) {
      return NextResponse.json({ error: "A customer with this email or phone already exists" }, { status: 400 })
    }

    // Insert new customer
    const result = (await executeQuery({
      query: "INSERT INTO CUSTOMER (name, email, phone, address) VALUES (?, ?, ?, ?)",
      values: [name, email, phone, address || ""],
    })) as any

    return NextResponse.json(
      {
        id: result.insertId,
        name,
        email,
        phone,
        address,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating customer:", error)
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
  }
}
