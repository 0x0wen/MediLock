import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/$patientId/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/patients/$patientId/"!</div>
}
