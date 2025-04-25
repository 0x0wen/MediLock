"use client"

import { useState } from "react"
import { CalendarIcon, ChevronRight } from 'lucide-react'
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute('/register/ui')({
    component: MedicalRecordsForm,
  })
  
export default function MedicalRecordsForm() {
  // Form state
  const [formData, setFormData] = useState({
    nik: "",
    fullName: "Owen Tobias Sinurat",
    bloodType: "B+",
    birthdate: new Date("2001-01-01"),
    gender: "male",
    email: "owentobias@gmail.com",
    phone: "08135221982",
    consentStorage: true,
    consentEmergency: true,
    consentPrivacy: true,
  })

  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Handle input change
  const handleChange = (field: string, value: string | boolean | Date) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    
    // Clear error when field is changed
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.nik) newErrors.nik = "NIK is required"
    if (!formData.fullName) newErrors.fullName = "Full name is required"
    if (!formData.bloodType) newErrors.bloodType = "Blood type is required"
    if (!formData.gender) newErrors.gender = "Gender is required"
    
    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email address"
    }
    
    if (!formData.phone) newErrors.phone = "Phone number is required"
    if (!formData.consentStorage) newErrors.consentStorage = "You must agree to the storage terms"
    if (!formData.consentEmergency) newErrors.consentEmergency = "You must agree to emergency access"
    if (!formData.consentPrivacy) newErrors.consentPrivacy = "You must understand the privacy settings"
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      console.log("Form submitted:", formData)
      // Process form submission
    }
  }

  return (
    <div className="flex min-h-screen bg-[#fbfbfb]">
      {/* Left side - Blue gradient with text */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#4aa5e7] to-[#1565a0] p-8 items-center justify-center relative">
        <div className="text-white text-4xl font-medium max-w-md">
          <p>Your medical records are tamper-proof, encrypted, and always within reach — powered by blockchain.</p>
        </div>
        <div className="absolute bottom-0 w-full">
          <img src="/placeholder.svg?height=400&width=600" alt="Medical dashboard preview" className="w-full" />
        </div>
      </div>

      {/* Right side - Registration form */}
      <div className="w-full md:w-1/2 p-4 md:p-16 overflow-y-auto">
        <div className="max-w-md mx-auto">
          <Card className="border-0 shadow-none">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-3xl font-bold text-[#000000]">Let's get to know you.</CardTitle>
              <CardDescription className="text-[#707070]">
                These details help us personalize and organize your health records.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="nik" className="text-xs font-medium text-[#5a5a5a]">NIK</Label>
                  <Input 
                    id="nik" 
                    placeholder="32XXXXXXXXXXXXXX" 
                    className={cn("border-[#d0d5dd] rounded-md", errors.nik && "border-red-500")}
                    value={formData.nik}
                    onChange={(e) => handleChange("nik", e.target.value)}
                  />
                  {errors.nik && <p className="text-xs text-red-500 mt-1">{errors.nik}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName" className="text-xs font-medium text-[#5a5a5a]">FULL NAME</Label>
                    <Input 
                      id="fullName" 
                      className={cn("border-[#d0d5dd] rounded-md", errors.fullName && "border-red-500")}
                      value={formData.fullName}
                      onChange={(e) => handleChange("fullName", e.target.value)}
                    />
                    {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                  </div>

                  <div>
                    <Label htmlFor="bloodType" className="text-xs font-medium text-[#5a5a5a]">BLOOD TYPE</Label>
                    <Select 
                      value={formData.bloodType} 
                      onValueChange={(value) => handleChange("bloodType", value)}
                    >
                      <SelectTrigger className={cn("border-[#d0d5dd] rounded-md", errors.bloodType && "border-red-500")}>
                        <SelectValue placeholder="Select blood type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.bloodType && <p className="text-xs text-red-500 mt-1">{errors.bloodType}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="birthdate" className="text-xs font-medium text-[#5a5a5a]">BIRTHDATE</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="birthdate"
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal border-[#d0d5dd] rounded-md",
                            errors.birthdate && "border-red-500"
                          )}
                        >
                          {formData.birthdate ? format(formData.birthdate, "MM/dd/yy") : <span>01/01/01</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.birthdate}
                          onSelect={(date) => date && handleChange("birthdate", date)}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.birthdate && <p className="text-xs text-red-500 mt-1">{errors.birthdate}</p>}
                  </div>

                  <div>
                    <Label htmlFor="gender" className="text-xs font-medium text-[#5a5a5a]">GENDER</Label>
                    <Select 
                      value={formData.gender} 
                      onValueChange={(value) => handleChange("gender", value)}
                    >
                      <SelectTrigger className={cn("border-[#d0d5dd] rounded-md", errors.gender && "border-red-500")}>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email" className="text-xs font-medium text-[#5a5a5a]">EMAIL</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      className={cn("border-[#d0d5dd] rounded-md", errors.email && "border-red-500")}
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-xs font-medium text-[#5a5a5a]">PHONE NUMBER</Label>
                    <Input 
                      id="phone" 
                      className={cn("border-[#d0d5dd] rounded-md", errors.phone && "border-red-500")}
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                    />
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                  </div>
                </div>

                <div className="mt-8">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-[#df0004] font-bold">⚠</span>
                    <p className="text-[#df0004] font-bold">PLEASE READ CAREFULLY</p>
                  </div>
                  <p className="text-[#707070] mb-4">
                    Before continuing, please review and agree to the following terms related to how your medical data
                    is stored and accessed.
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox 
                        id="consentStorage" 
                        className={cn("mt-1 border-[#d0d5dd]", errors.consentStorage && "border-red-500")}
                        checked={formData.consentStorage}
                        onCheckedChange={(checked) => handleChange("consentStorage", checked === true)}
                      />
                      <div>
                        <Label 
                          htmlFor="consentStorage" 
                          className="text-sm font-normal text-[#2b2f32]"
                        >
                          I agree to allow Medilock to securely store and encrypt my medical records using
                          blockchain technology.
                        </Label>
                        {errors.consentStorage && <p className="text-xs text-red-500 mt-1">{errors.consentStorage}</p>}
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox 
                        id="consentEmergency" 
                        className={cn("mt-1 border-[#d0d5dd]", errors.consentEmergency && "border-red-500")}
                        checked={formData.consentEmergency}
                        onCheckedChange={(checked) => handleChange("consentEmergency", checked === true)}
                      />
                      <div>
                        <Label 
                          htmlFor="consentEmergency" 
                          className="text-sm font-normal text-[#2b2f32]"
                        >
                          I consent to emergency access to my medical data in life-threatening situations (e.g.,
                          accident, unconsciousness, or when no guardian is present).
                        </Label>
                        {errors.consentEmergency && <p className="text-xs text-red-500 mt-1">{errors.consentEmergency}</p>}
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox 
                        id="consentPrivacy" 
                        className={cn("mt-1 border-[#d0d5dd]", errors.consentPrivacy && "border-red-500")}
                        checked={formData.consentPrivacy}
                        onCheckedChange={(checked) => handleChange("consentPrivacy", checked === true)}
                      />
                      <div>
                        <Label 
                          htmlFor="consentPrivacy" 
                          className="text-sm font-normal text-[#2b2f32]"
                        >
                          I understand that I can manage, limit, or revoke access to my records at any time
                          through my privacy settings.
                        </Label>
                        {errors.consentPrivacy && <p className="text-xs text-red-500 mt-1">{errors.consentPrivacy}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-8">
                  <Button type="submit" className="bg-[#1a81cd] hover:bg-[#1565a0] text-white px-8 py-2 rounded-md">
                    Next <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
