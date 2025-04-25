import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/marketplace/$poolId/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/marketplace/$poolId/"!</div>
}
