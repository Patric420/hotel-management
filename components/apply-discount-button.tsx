"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Percent } from "lucide-react"

export default function ApplyDiscountButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleApplyDiscount = async () => {
    if (!confirm("Are you sure you want to apply a 10% discount to all services?")) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/services/apply-discount", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to apply discount")
      }

      toast({
        title: "Discount applied",
        description: "A 10% discount has been applied to all services.",
      })

      router.refresh()
    } catch (error) {
      console.error("Error applying discount:", error)
      toast({
        title: "Error",
        description: "There was a problem applying the discount.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleApplyDiscount} disabled={isLoading}>
      <Percent className="mr-2 h-4 w-4" />
      {isLoading ? "Applying..." : "Apply 10% Discount"}
    </Button>
  )
}
