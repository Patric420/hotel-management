import { executeQuery } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const customer = (await executeQuery({
      query: "SELECT * FROM CUSTOMER WHERE customer_id = ?",
      values: [id],
    })) as any[]

    if (!customer.length) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    return NextResponse.json(customer[0])
  } catch (error) {
    console.error("Error fetching customer:", error)
    return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const { name, email, phone, address } = await request.json()

    // Validate required fields
    if (!name || !email || !phone) {
      return NextResponse.json({ error: "Name, email, and phone are required" }, { status: 400 })
    }

    // Check if email or phone already exists for other customers
    const existingCustomer = (await executeQuery({
      query: "SELECT * FROM CUSTOMER WHERE (email = ? OR phone = ?) AND customer_id != ?",
      values: [email, phone, id],
    })) as any[]

    if (existingCustomer.length > 0) {
      return NextResponse.json({ error: "Another customer with this email or phone already exists" }, { status: 400 })
    }

    // Update customer
    await executeQuery({
      query: "UPDATE CUSTOMER SET name = ?, email = ?, phone = ?, address = ? WHERE customer_id = ?",
      values: [name, email, phone, address || "", id],
    })

    return NextResponse.json({
      id,
      name,
      email,
      phone,
      address,
    })
  } catch (error) {
    console.error("Error updating customer:", error)
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Check if customer exists
    const customer = (await executeQuery({
      query: "SELECT * FROM CUSTOMER WHERE customer_id = ?",
      values: [id],
    })) as any[]

    if (!customer.length) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    // Delete customer
    await executeQuery({
      query: "DELETE FROM CUSTOMER WHERE customer_id = ?",
      values: [id],
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting customer:", error)
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 })
  }
}
