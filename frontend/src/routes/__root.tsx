import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { Wallet } from '../components/wallet'


export const Route = createRootRoute({
  component: () => (
    <>
    <Wallet>
      <div className="p-2 flex gap-2">
        <Link to="/" className="[&.active]:font-bold">
          Home
        </Link>{' '}
        <Link to="/about" className="[&.active]:font-bold">
          About
        </Link>{' '}
        <Link to="/dashboard/doctor" className="[&.active]:font-bold">
          Doctor
        </Link>
      </div>
      <hr />
      
      <Outlet /></Wallet>
    </>
  ),
})