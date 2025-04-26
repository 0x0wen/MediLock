import { Route as rootRoute } from './routes/__root'
import { Route as DashboardRoute } from './routes/dashboard'
import { Route as DashboardAddRoute } from './routes/dashboard/add'
import { Route as AddRecordRoute } from './routes/add-record'
import { Route as AccessRoute } from './routes/access'

export const routeTree = rootRoute.addChildren([
  DashboardRoute,
  DashboardAddRoute,
  AddRecordRoute,
  AccessRoute,
]) 