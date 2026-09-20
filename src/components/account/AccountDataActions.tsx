import { Download } from 'lucide-react'
import { AccountDeletionControls } from '@/components/account/AccountDeletionControls'
import { Button } from '@/components/ui/button'
import { routes } from '@/lib/routes'

export function AccountDataActions() {
  return (
    <div className="flex flex-col items-start gap-3">
      <Button asChild variant="outline">
        <a href={routes.member.accountExport} download>
          <Download className="mr-2 h-4 w-4" />
          Download my data
        </a>
      </Button>
      <AccountDeletionControls />
    </div>
  )
}
