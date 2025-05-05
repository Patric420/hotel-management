"use client"

import type React from "react"

import { useState } from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit, Plus, Trash } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency, formatDate } from "@/lib/utils"

interface PaymentFormProps {
  paymentId?: number
  payment?: any
  unpaidBookings: any[]
}

const paymentMethods = ["Cash", "Credit Card", "Debit Card", "UPI", "Net Banking"]

export default function PaymentForm({ paymentId, payment, unpaidBookings }: PaymentFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    booking_id: payment?.booking_id || "",
    payment_method: payment?.payment_method || "Cash",
    amount: payment?.amount || 0,
  })
  const [selectedBooking, setSelectedBooking] = useState<any>(null)

  const handleBookingChange = (bookingId: string) => {
    const booking = unpaidBookings.find((b) => b.booking_id.toString() === bookingId)
    setSelectedBooking(booking)
    setFormData((prev) => ({
      ...prev,
      booking_id: bookingId,
      amount: booking ? booking.price : 0,
    }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const endpoint = paymentId ? `/api/payments/${paymentId}` : "/api/payments"

      const method = paymentId ? "PUT" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to save payment")
      }

      toast({
        title: paymentId ? "Payment updated" : "Payment created",
        description: paymentId
          ? "The payment has been updated successfully."
          : "The payment has been created successfully.",
      })

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error saving payment:", error)
      toast({
        title: "Error",
        description: "There was a problem saving the payment.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!paymentId) return

    if (!confirm("Are you sure you want to delete this payment?")) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete payment")
      }

      toast({
        title: "Payment deleted",
        description: "The payment has been deleted successfully.",
      })

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error deleting payment:", error)
      toast({
        title: "Error",
        description: "There was a problem deleting the payment.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {paymentId ? (
          <Button variant="ghost" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Payment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{paymentId ? "Edit Payment" : "Add Payment"}</DialogTitle>
          <DialogDescription>
            {paymentId
              ? "Update the payment details below."
              : "Fill in the payment details below to create a new payment."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {!paymentId && (
              <div className="grid gap-2">
                <Label htmlFor="booking_id">Booking</Label>
                <Select value={formData.booking_id.toString()} onValueChange={handleBookingChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select booking" />
                  </SelectTrigger>
                  <SelectContent>
                    {unpaidBookings.map((booking) => (
                      <SelectItem key={booking.booking_id} value={booking.booking_id.toString()}>
                        #{booking.booking_id} - {booking.customer_name} ({booking.room_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedBooking && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    <div>Room: {selectedBooking.room_type}</div>
                    <div>
                      Stay: {formatDate(selectedBooking.check_in)} to {formatDate(selectedBooking.check_out)}
                    </div>
                    <div>Amount: {formatCurrency(selectedBooking.price)}</div>
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => handleSelectChange("payment_method", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                min={0}
                required
              />
            </div>
          </div>
          <DialogFooter className="flex items-center justify-between">
            {paymentId && (
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={isLoading}>
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || (!paymentId && !formData.booking_id)}>
                {isLoading ? "Saving..." : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
