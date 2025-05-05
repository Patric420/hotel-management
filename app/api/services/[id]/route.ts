import { executeQuery } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const service = (await executeQuery({
      query: "SELECT * FROM SERVICE WHERE service_id = ?",
      values: [id],
    })) as any[]

    if (!service.length) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    return NextResponse.json(service[0])
  } catch (error) {
    console.error("Error fetching service:", error)
    return NextResponse.json({ error: "Failed to fetch service" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const { service_name, cost } = await request.json()

    // Validate required fields
    if (!service_name || !cost) {
      return NextResponse.json({ error: "Service name and cost are required" }, { status: 400 })
    }

    // Check if service name already exists for other services
    const existingService = (await executeQuery({
      query: "SELECT * FROM SERVICE WHERE service_name = ? AND service_id != ?",
      values: [service_name, id],
    })) as any[]

    if (existingService.length > 0) {
      return NextResponse.json({ error: "Another service with this name already exists" }, { status: 400 })
    }

    // Update service
    await executeQuery({
      query: "UPDATE SERVICE SET service_name = ?, cost = ? WHERE service_id = ?",
      values: [service_name, cost, id],
    })

    return NextResponse.json({
      id,
      service_name,
      cost,
    })
  } catch (error) {
    console.error("Error updating service:", error)
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Check if service exists
    const service = (await executeQuery({
      query: "SELECT * FROM SERVICE WHERE service_id = ?",
      values: [id],
    })) as any[]

    if (!service.length) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    // Check if service is being used in customer_service
    const customerService = (await executeQuery({
      query: "SELECT * FROM CUSTOMER_SERVICE WHERE service_id = ?",
      values: [id],
    })) as any[]

    if (customerService.length > 0) {
      return NextResponse.json({ error: "Cannot delete service as it is assigned to customers" }, { status: 400 })
    }

    // Delete service
    await executeQuery({
      query: "DELETE FROM SERVICE WHERE service_id = ?",
      values: [id],
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting service:", error)
    return NextResponse.json({ error: "Failed to delete service" }, { status: 500 })
  }
}
