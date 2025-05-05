import { executeQuery } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Call the stored procedure to apply discount
    await executeQuery({
      query: "CALL apply_service_discount()",
    })

    return NextResponse.json({
      success: true,
      message: "10% discount applied to all services",
    })
  } catch (error) {
    console.error("Error applying discount:", error)
    return NextResponse.json({ error: "Failed to apply discount" }, { status: 500 })
  }
}
