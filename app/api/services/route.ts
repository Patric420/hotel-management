import { executeQuery } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const services = await executeQuery({
      query: "SELECT * FROM SERVICE ORDER BY service_id DESC",
    })

    return NextResponse.json(services)
  } catch (error) {
    console.error("Error fetching services:", error)
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { service_name, cost } = await request.json()

    // Validate required fields
    if (!service_name || !cost) {
      return NextResponse.json({ error: "Service name and cost are required" }, { status: 400 })
    }

    // Check if service name already exists
    const existingService = (await executeQuery({
      query: "SELECT * FROM SERVICE WHERE service_name = ?",
      values: [service_name],
    })) as any[]

    if (existingService.length > 0) {
      return NextResponse.json({ error: "A service with this name already exists" }, { status: 400 })
    }

    // Insert new service
    const result = (await executeQuery({
      query: "INSERT INTO SERVICE (service_name, cost) VALUES (?, ?)",
      values: [service_name, cost],
    })) as any

    return NextResponse.json(
      {
        id: result.insertId,
        service_name,
        cost,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating service:", error)
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 })
  }
}
