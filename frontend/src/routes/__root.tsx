import { createRootRoute,  Outlet,  } from '@tanstack/react-router'
import { Wallet } from '../components/wallet'
import Sidebar from '@/components/Sidebar'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <Wallet>
      <div className="flex min-h-screen bg-[#fbfbfb]">
        <Sidebar />
        {/* Main Content */}
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </Wallet>
  );
}