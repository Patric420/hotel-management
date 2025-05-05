"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Edit, Plus, Trash } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface BookingFormProps {
  bookingId?: number
  booking?: any
}

export default function BookingForm({ bookingId, booking }: BookingFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [availableRooms, setAvailableRooms] = useState<any[]>([])
  const [formData, setFormData] = useState({
    customer_id: booking?.customer_id || "",
    room_id: booking?.room_id || "",
    check_in: booking?.check_in ? new Date(booking.check_in) : new Date(),
    check_out: booking?.check_out ? new Date(booking.check_out) : new Date(Date.now() + 86400000), // tomorrow
    status: booking?.status || "Confirmed",
  })

  useEffect(() => {
    // Fetch customers and rooms when dialog opens
    if (open) {
      fetchCustomers()
      fetchAvailableRooms()
    }
  }, [open])

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers")
      if (!response.ok) throw new Error("Failed to fetch customers")
      const data = await response.json()
      setCustomers(data)
    } catch (error) {
      console.error("Error fetching customers:", error)
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      })
    }
  }

  const fetchAvailableRooms = async () => {
    try {
      // If editing, we need to include the current room in the available rooms
      const url = bookingId
        ? `/api/rooms/available?check_in=${format(formData.check_in, "yyyy-MM-dd")}&check_out=${format(formData.check_out, "yyyy-MM-dd")}&booking_id=${bookingId}`
        : `/api/rooms/available?check_in=${format(formData.check_in, "yyyy-MM-dd")}&check_out=${format(formData.check_out, "yyyy-MM-dd")}`

      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch available rooms")
      const data = await response.json()
      setAvailableRooms(data)
    } catch (error) {
      console.error("Error fetching available rooms:", error)
      toast({
        title: "Error",
        description: "Failed to load available rooms",
        variant: "destructive",
      })
    }
  }

  const handleDateChange = (field: string, date: Date | undefined) => {
    if (!date) return

    setFormData((prev) => ({ ...prev, [field]: date }))

    // Refetch available rooms when dates change
    if (field === "check_in" || field === "check_out") {
      setTimeout(() => {
        fetchAvailableRooms()
      }, 100)
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const endpoint = bookingId ? `/api/bookings/${bookingId}` : "/api/bookings"

      const method = bookingId ? "PUT" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          check_in: format(formData.check_in, "yyyy-MM-dd"),
          check_out: format(formData.check_out, "yyyy-MM-dd"),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save booking")
      }

      toast({
        title: bookingId ? "Booking updated" : "Booking created",
        description: bookingId
          ? "The booking has been updated successfully."
          : "The booking has been created successfully.",
      })

      setOpen(false)
      router.refresh()
    } catch (error: any) {
      console.error("Error saving booking:", error)
      toast({
        title: "Error",
        description: error.message || "There was a problem saving the booking.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!bookingId) return

    if (!confirm("Are you sure you want to delete this booking?")) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete booking")
      }

      toast({
        title: "Booking deleted",
        description: "The booking has been deleted successfully.",
      })

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error deleting booking:", error)
      toast({
        title: "Error",
        description: "There was a problem deleting the booking.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {bookingId ? (
          <Button variant="ghost" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{bookingId ? "Edit Booking" : "New Booking"}</DialogTitle>
          <DialogDescription>
            {bookingId
              ? "Update the booking details below."
              : "Fill in the booking details below to create a new booking."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="customer_id">Customer</Label>
              <Select
                value={formData.customer_id.toString()}
                onValueChange={(value) => handleSelectChange("customer_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.customer_id} value={customer.customer_id.toString()}>
                      {customer.name} ({customer.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Check-In Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.check_in && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.check_in ? format(formData.check_in, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.check_in}
                      onSelect={(date) => handleDateChange("check_in", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <Label>Check-Out Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.check_out && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.check_out ? format(formData.check_out, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.check_out}
                      onSelect={(date) => handleDateChange("check_out", date)}
                      initialFocus
                      disabled={(date) => date < formData.check_in}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="room_id">Room</Label>
              <Select
                value={formData.room_id.toString()}
                onValueChange={(value) => handleSelectChange("room_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  {availableRooms.map((room) => (
                    <SelectItem key={room.room_id} value={room.room_id.toString()}>
                      {room.room_type} - ₹{room.price} ({room.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="Checked-In">Checked-In</SelectItem>
                  <SelectItem value="Checked-Out">Checked-Out</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex items-center justify-between">
            {bookingId && (
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={isLoading}>
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
