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

interface StaffFormProps {
  staffId?: number
  staff?: {
    name: string
    role: string
    phone: string
    salary: number
  }
}

const staffRoles = ["Manager", "Receptionist", "Housekeeping", "Chef", "Waiter"]

export default function StaffForm({ staffId, staff }: StaffFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: staff?.name || "",
    role: staff?.role || "Receptionist",
    phone: staff?.phone || "",
    salary: staff?.salary || 30000,
  })

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
      const endpoint = staffId ? `/api/staff/${staffId}` : "/api/staff"

      const method = staffId ? "PUT" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to save staff")
      }

      toast({
        title: staffId ? "Staff updated" : "Staff created",
        description: staffId ? "The staff has been updated successfully." : "The staff has been created successfully.",
      })

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error saving staff:", error)
      toast({
        title: "Error",
        description: "There was a problem saving the staff.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!staffId) return

    if (!confirm("Are you sure you want to delete this staff?")) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/staff/${staffId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete staff")
      }

      toast({
        title: "Staff deleted",
        description: "The staff has been deleted successfully.",
      })

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error deleting staff:", error)
      toast({
        title: "Error",
        description: "There was a problem deleting the staff.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {staffId ? (
          <Button variant="ghost" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Staff
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{staffId ? "Edit Staff" : "Add Staff"}</DialogTitle>
          <DialogDescription>
            {staffId ? "Update the staff details below." : "Fill in the staff details below to create a new staff."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => handleSelectChange("role", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {staffRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="salary">Salary</Label>
              <Input
                id="salary"
                name="salary"
                type="number"
                value={formData.salary}
                onChange={handleChange}
                min={0}
                required
              />
            </div>
          </div>
          <DialogFooter className="flex items-center justify-between">
            {staffId && (
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
