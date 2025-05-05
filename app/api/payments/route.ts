import { executeQuery } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const payments = await executeQuery({
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
        ORDER BY p.payment_id DESC
      `,
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error("Error fetching payments:", error)
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { booking_id, payment_method, amount } = await request.json()

    // Validate required fields
    if (!booking_id || !payment_method || !amount) {
      return NextResponse.json({ error: "Booking, payment method, and amount are required" }, { status: 400 })
    }

    // Check if booking exists
    const booking = (await executeQuery({
      query: "SELECT * FROM BOOKING WHERE booking_id = ?",
      values: [booking_id],
    })) as any[]

    if (!booking.length) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Check if payment already exists for this booking
    const existingPayment = (await executeQuery({
      query: "SELECT * FROM PAYMENT WHERE booking_id = ?",
      values: [booking_id],
    })) as any[]

    if (existingPayment.length > 0) {
      return NextResponse.json({ error: "A payment already exists for this booking" }, { status: 400 })
    }

    // Insert new payment
    const result = (await executeQuery({
      query: "INSERT INTO PAYMENT (booking_id, payment_method, amount) VALUES (?, ?, ?)",
      values: [booking_id, payment_method, amount],
    })) as any

    return NextResponse.json(
      {
        id: result.insertId,
        booking_id,
        payment_method,
        amount,
        payment_date: new Date(),
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating payment:", error)
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 })
  }
}
