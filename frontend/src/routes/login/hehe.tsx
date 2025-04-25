import { createFileRoute } from '@tanstack/react-router'
import { CalendarIcon, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


export const Route = createFileRoute('/login/hehe')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/login/hehe"!</div>
}

export default function MedicalRecordsForm() {
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
      <div className="w-full md:w-1/2 p-8 md:p-16">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-[#000000] mb-3">Let's get to know you.</h1>
          <p className="text-[#707070] mb-8">These details help us personalize and organize your health records.</p>

          <div className="space-y-6">
            <div>
              <label htmlFor="nik" className="block text-sm font-medium text-[#5a5a5a] mb-1">
                NIK
              </label>
              <Input id="nik" placeholder="32XXXXXXXXXXXXXX" className="w-full border-[#d0d5dd] rounded-md" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-[#5a5a5a] mb-1">
                  FULL NAME
                </label>
                <Input
                  id="fullName"
                  placeholder="Owen Tobias Sinurat"
                  defaultValue="Owen Tobias Sinurat"
                  className="w-full border-[#d0d5dd] rounded-md"
                />
              </div>
              <div>
                <label htmlFor="bloodType" className="block text-sm font-medium text-[#5a5a5a] mb-1">
                  BLOOD TYPE
                </label>
                <Select defaultValue="b-plus">
                  <SelectTrigger className="w-full border-[#d0d5dd] rounded-md">
                    <SelectValue placeholder="Select blood type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a-plus">A+</SelectItem>
                    <SelectItem value="a-minus">A-</SelectItem>
                    <SelectItem value="b-plus">B+</SelectItem>
                    <SelectItem value="b-minus">B-</SelectItem>
                    <SelectItem value="ab-plus">AB+</SelectItem>
                    <SelectItem value="ab-minus">AB-</SelectItem>
                    <SelectItem value="o-plus">O+</SelectItem>
                    <SelectItem value="o-minus">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="birthdate" className="block text-sm font-medium text-[#5a5a5a] mb-1">
                  BIRTHDATE
                </label>
                <div className="relative">
                  <Input
                    id="birthdate"
                    placeholder="01/01/01"
                    defaultValue="01/01/01"
                    className="w-full border-[#d0d5dd] rounded-md pr-10"
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#707070] h-5 w-5" />
                </div>
              </div>
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-[#5a5a5a] mb-1">
                  GENDER
                </label>
                <Select defaultValue="male">
                  <SelectTrigger className="w-full border-[#d0d5dd] rounded-md">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#5a5a5a] mb-1">
                  EMAIL
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="owentobias@gmail.com"
                  defaultValue="owentobias@gmail.com"
                  className="w-full border-[#d0d5dd] rounded-md"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-[#5a5a5a] mb-1">
                  PHONE NUMBER
                </label>
                <Input
                  id="phone"
                  placeholder="08135221982"
                  defaultValue="08135221982"
                  className="w-full border-[#d0d5dd] rounded-md"
                />
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-[#df0004] font-bold">⚠</span>
                <p className="text-[#df0004] font-bold">PLEASE READ CAREFULLY</p>
              </div>
              <p className="text-[#707070] mb-4">
                Before continuing, please review and agree to the following terms related to how your medical data is
                stored and accessed.
              </p>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <Checkbox id="consent1" className="mt-1 border-[#d0d5dd]" defaultChecked />
                  <label htmlFor="consent1" className="text-sm text-[#2b2f32]">
                    I agree to allow Medilock to securely store and encrypt my medical records using blockchain
                    technology.
                  </label>
                </div>

                <div className="flex gap-3">
                  <Checkbox id="consent2" className="mt-1 border-[#d0d5dd]" defaultChecked />
                  <label htmlFor="consent2" className="text-sm text-[#2b2f32]">
                    I consent to emergency access to my medical data in life-threatening situations (e.g., accident,
                    unconsciousness, or when no guardian is present).
                  </label>
                </div>

                <div className="flex gap-3">
                  <Checkbox id="consent3" className="mt-1 border-[#d0d5dd]" defaultChecked />
                  <label htmlFor="consent3" className="text-sm text-[#2b2f32]">
                    I understand that I can manage, limit, or revoke access to my records at any time through my privacy
                    settings.
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <Button className="bg-[#1a81cd] hover:bg-[#1565a0] text-white px-8 py-2 rounded-md">
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
