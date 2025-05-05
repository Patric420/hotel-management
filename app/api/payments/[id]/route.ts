import { executeQuery } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const payment = (await executeQuery({
      query: `
        SELECT 
          p.payment_id, 
          p.booking_id,
          c.name AS customer_name,
          r.room_type,
          b.check_in,
          b.check_out,
          p.payment_date, 
          p.payment_method, 
          p.amount
        FROM PAYMENT p
        JOIN BOOKING b ON p.booking_id = b.booking_id
        JOIN CUSTOMER c ON b.customer_id = c.customer_id
        JOIN ROOM r ON b.room_id = r.room_id
        WHERE p.payment_id = ?
      `,
      values: [id],
    })) as any[]

    if (!payment.length) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    return NextResponse.json(payment[0])
  } catch (error) {
    console.error("Error fetching payment:", error)
    return NextResponse.json({ error: "Failed to fetch payment" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const { payment_method, amount } = await request.json()

    // Validate required fields
    if (!payment_method || !amount) {
      return NextResponse.json({ error: "Payment method and amount are required" }, { status: 400 })
    }

    // Check if payment exists
    const payment = (await executeQuery({
      query: "SELECT * FROM PAYMENT WHERE payment_id = ?",
      values: [id],
    })) as any[]

    if (!payment.length) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Update payment
    await executeQuery({
      query: "UPDATE PAYMENT SET payment_method = ?, amount = ? WHERE payment_id = ?",
      values: [payment_method, amount, id],
    })

    return NextResponse.json({
      id,
      payment_method,
      amount,
    })
  } catch (error) {
    console.error("Error updating payment:", error)
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Check if payment exists
    const payment = (await executeQuery({
      query: "SELECT * FROM PAYMENT WHERE payment_id = ?",
      values: [id],
    })) as any[]

    if (!payment.length) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Delete payment
    await executeQuery({
      query: "DELETE FROM PAYMENT WHERE payment_id = ?",
      values: [id],
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting payment:", error)
    return NextResponse.json({ error: "Failed to delete payment" }, { status: 500 })
  }
}
