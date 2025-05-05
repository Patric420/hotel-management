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

interface ServiceFormProps {
  serviceId?: number
  service?: {
    service_name: string
    cost: number
  }
}

export default function ServiceForm({ serviceId, service }: ServiceFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    service_name: service?.service_name || "",
    cost: service?.cost || 1000,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const endpoint = serviceId ? `/api/services/${serviceId}` : "/api/services"

      const method = serviceId ? "PUT" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to save service")
      }

      toast({
        title: serviceId ? "Service updated" : "Service created",
        description: serviceId
          ? "The service has been updated successfully."
          : "The service has been created successfully.",
      })

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error saving service:", error)
      toast({
        title: "Error",
        description: "There was a problem saving the service.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!serviceId) return

    if (!confirm("Are you sure you want to delete this service?")) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete service")
      }

      toast({
        title: "Service deleted",
        description: "The service has been deleted successfully.",
      })

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error deleting service:", error)
      toast({
        title: "Error",
        description: "There was a problem deleting the service.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {serviceId ? (
          <Button variant="ghost" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{serviceId ? "Edit Service" : "Add Service"}</DialogTitle>
          <DialogDescription>
            {serviceId
              ? "Update the service details below."
              : "Fill in the service details below to create a new service."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="service_name">Service Name</Label>
              <Input
                id="service_name"
                name="service_name"
                value={formData.service_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cost">Cost</Label>
              <Input
                id="cost"
                name="cost"
                type="number"
                value={formData.cost}
                onChange={handleChange}
                min={0}
                required
              />
            </div>
          </div>
          <DialogFooter className="flex items-center justify-between">
            {serviceId && (
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
