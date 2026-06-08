import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { UsersTable } from "@/components/users-table"
import { query } from "@/lib/db"

import data from "./data.json"

async function getUsers() {
  try {
    const result = await query<{
      id: number
      name: string
      email: string
      role: string
      status: string
      created_at: string
    }>("SELECT id, name, email, role, status, created_at FROM users ORDER BY id")
    return result.rows
  } catch {
    return []
  }
}

export default async function Page() {
  const users = await getUsers()

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>
          <UsersTable users={users} />
          <DataTable data={data} />
        </div>
      </div>
    </div>
  )
}
