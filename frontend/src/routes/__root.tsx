import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { Wallet } from '../components/wallet'


export const Route = createRootRoute({
  component: () => (
    <>
    <Wallet>
      <Outlet /></Wallet>
    </>
  ),
})