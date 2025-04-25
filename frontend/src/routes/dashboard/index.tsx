import { createFileRoute } from '@tanstack/react-router'
import {
    Bell,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Download,
    Filter,
    Home,
    LogOut,
    Menu,
    Search,
    Zap,
  } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/')({
  component: MedicalRecordArchive,
})
  
  export default function MedicalRecordArchive() {
    return (
      <div className="flex min-h-screen bg-[#fbfbfb]">
        {/* Sidebar */}
        <div className="w-[232px] border-r border-[#e6e7ec] bg-white">
          <div className="p-4 border-b border-[#e6e7ec]">
            <div className="flex items-center gap-2 text-[#1a81cd]">
              <Menu className="h-5 w-5" />
              <span className="text-sm font-medium">Collapse menu</span>
            </div>
          </div>
  
          <nav className="p-2 space-y-1">
            <Link to="/" className="flex items-center gap-3 p-2 rounded-md text-[#5a5a5a] hover:bg-[#f5f5f5]">
              <Home className="h-5 w-5" />
              <span className="text-sm font-medium">Dashboard</span>
            </Link>
  
            <Link to="/" className="flex items-center gap-3 p-2 rounded-md bg-[#e8f4fc] text-[#1a81cd]">
              <div className="h-5 w-5 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M16.25 3.125H3.75C3.40482 3.125 3.125 3.40482 3.125 3.75V16.25C3.125 16.5952 3.40482 16.875 3.75 16.875H16.25C16.5952 16.875 16.875 16.5952 16.875 16.25V3.75C16.875 3.40482 16.5952 3.125 16.25 3.125Z"
                    stroke="#1a81cd"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6.875 7.5H13.125"
                    stroke="#1a81cd"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6.875 10H13.125"
                    stroke="#1a81cd"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6.875 12.5H10"
                    stroke="#1a81cd"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium">Medical Records</span>
            </Link>
  
            <Link to="/" className="flex items-center gap-3 p-2 rounded-md text-[#5a5a5a] hover:bg-[#f5f5f5]">
              <div className="h-5 w-5 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M8.75 11.875C10.8211 11.875 12.5 10.1961 12.5 8.125C12.5 6.05393 10.8211 4.375 8.75 4.375C6.67893 4.375 5 6.05393 5 8.125C5 10.1961 6.67893 11.875 8.75 11.875Z"
                    stroke="#5a5a5a"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15 15.625C15 13.8991 12.2713 12.5 8.75 12.5C5.22875 12.5 2.5 13.8991 2.5 15.625"
                    stroke="#5a5a5a"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15 8.125H17.5"
                    stroke="#5a5a5a"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16.25 6.875V9.375"
                    stroke="#5a5a5a"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium">Access</span>
            </Link>
  
            <Link to="/" className="flex items-center gap-3 p-2 rounded-md text-[#5a5a5a] hover:bg-[#f5f5f5]">
              <div className="h-5 w-5 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M2.5 3.75H17.5V16.25H2.5V3.75Z"
                    stroke="#5a5a5a"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2.5 7.5H17.5"
                    stroke="#5a5a5a"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6.25 11.25H13.75"
                    stroke="#5a5a5a"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium">Marketplace</span>
            </Link>
          </nav>
  
          <div className="absolute bottom-0 w-[232px] border-t border-[#e6e7ec]">
            <Link to="/" className="flex items-center gap-3 p-4 text-[#df0004]">
              <LogOut className="h-5 w-5" />
              <span className="text-sm font-medium">Log out</span>
            </Link>
          </div>
        </div>
  
        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <header className="flex items-center justify-between px-6 py-3 border-b border-[#e6e7ec] bg-white">
            <div className="flex items-center gap-2">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M16 28C22.6274 28 28 22.6274 28 16C28 9.37258 22.6274 4 16 4C9.37258 4 4 9.37258 4 16C4 22.6274 9.37258 28 16 28Z"
                  stroke="#1a81cd"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 10.6667V16L19.3333 19.3333"
                  stroke="#1a81cd"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 28C22.6274 28 28 22.6274 28 16C28 9.37258 22.6274 4 16 4C9.37258 4 4 9.37258 4 16C4 22.6274 9.37258 28 16 28Z"
                  fill="#e8f4fc"
                  fillOpacity="0.3"
                  stroke="#1a81cd"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 10.6667V16L19.3333 19.3333"
                  fill="#e8f4fc"
                  fillOpacity="0.3"
                  stroke="#1a81cd"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-xl font-bold text-[#1a81cd]">MediLock</span>
            </div>
  
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="h-5 w-5 text-[#5a5a5a]" />
              </Button>
  
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Owen Tobias</span>
                <ChevronDown className="h-4 w-4 text-[#5a5a5a]" />
              </div>
            </div>
          </header>
  
          {/* Content */}
          <main className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#313233] mb-2">Medical Record Archive</h1>
              <p className="text-[#5a5a5a]">
                Access and manage your verified health records with end-to-end encryption and full data control.
              </p>
            </div>
  
            {/* Filters */}
            <div className="flex items-center gap-3 mb-6">
              <Button variant="outline" size="sm" className="gap-2 text-[#5a5a5a] border-[#d9d9d9]">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
  
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#5a5a5a]" />
                <Input placeholder="Search" className="pl-10 h-9 w-[200px] border-[#d9d9d9] text-sm" />
              </div>
  
              <Button variant="outline" size="sm" className="gap-2 text-[#5a5a5a] border-[#d9d9d9]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 7.33333H2.66667V12H4V7.33333Z" fill="#5a5a5a" />
                  <path d="M8.66667 4H7.33333V12H8.66667V4Z" fill="#5a5a5a" />
                  <path d="M13.3333 2H12V12H13.3333V2Z" fill="#5a5a5a" />
                  <path d="M1.33333 13.3333H14.6667V14.6667H1.33333V13.3333Z" fill="#5a5a5a" />
                  <path d="M1.33333 1.33333H14.6667V2.66667H1.33333V1.33333Z" fill="#5a5a5a" />
                </svg>
                Start date - End date
              </Button>
  
              <div className="ml-auto">
                <Button className="gap-2 bg-[#1a81cd] hover:bg-[#1a81cd]/90">
                  Share Records Access
                  <Zap className="h-4 w-4" />
                </Button>
              </div>
            </div>
  
            {/* Records Table */}
            <div className="bg-white rounded-md border border-[#e6e7ec] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#edeef3]">
                    <th className="px-4 py-3 text-left text-sm font-medium text-[#5a5a5a]">
                      <div className="flex items-center gap-1">
                        Date
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[#5a5a5a]">
                      <div className="flex items-center gap-1">
                        Record Type
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[#5a5a5a]">
                      <div className="flex items-center gap-1">
                        Doctor
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[#5a5a5a]">
                      <div className="flex items-center gap-1">
                        Hospital
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[#5a5a5a]">
                      <div className="flex items-center gap-1">
                        Diagnosis
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[#5a5a5a]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {Array(10)
                    .fill(0)
                    .map((_, index) => (
                      <tr key={index} className="border-t border-[#e6e7ec]">
                        <td className="px-4 py-3 text-sm text-[#313233]">Apr 24, 2025</td>
                        <td className="px-4 py-3 text-sm text-[#313233]">Blood Test Report</td>
                        <td className="px-4 py-3 text-sm text-[#313233]">Dr. Andi Kusuma</td>
                        <td className="px-4 py-3 text-sm text-[#313233]">MedikaCare Clinic</td>
                        <td className="px-4 py-3 text-sm text-[#313233]">Anemia (Mild)</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                              <Search className="h-4 w-4 text-[#5a5a5a]" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                              <Download className="h-4 w-4 text-[#5a5a5a]" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
  
              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#e6e7ec]">
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-md">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 rounded-md bg-[#1a81cd] text-white border-[#1a81cd]"
                  >
                    1
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 rounded-md">
                    2
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 rounded-md">
                    3
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 rounded-md">
                    4
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 rounded-md">
                    5
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-md bg-[#1a81cd] text-white border-[#1a81cd]"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
  
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#5a5a5a]">Result per page</span>
                  <div className="flex items-center gap-1 border rounded px-2 py-1">
                    <span className="text-sm">10</span>
                    <ChevronDown className="h-4 w-4 text-[#5a5a5a]" />
                  </div>
                </div>
              </div>
  
              <div className="px-4 py-2 text-xs text-[#5a5a5a]">1-50 of 1,250</div>
            </div>
          </main>
        </div>
      </div>
    )
  }
  