import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import type { StudentFees } from '@stackedu/shared'
import { CreditCard, Eye, Wallet } from 'lucide-react'
import { DataTable } from '@/components/DataTable'
import { IconActionButton } from '@/components/IconActionButton'
import { StudentShell } from '@/components/StudentShell'
import { StatTile } from '@/components/StatTile'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import { getStudentFees, studentFeesQueryKey } from '@/lib/api/student'
import { apiErrorMessage } from '@/lib/api/client'

export const Route = createFileRoute('/_auth/student/fees')({
  component: FeeStatementPage,
})

type InvoiceRow = StudentFees['invoices'][number]

function invoiceStatusStyle(status: string) {
  if (status === 'Paid') return { bg: 'var(--success-bg)', color: 'var(--success)' }
  if (status === 'PartiallyPaid') return { bg: 'var(--warning-bg)', color: 'var(--warning)' }
  return { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
}

function InvoiceDetailSheet({ invoice, onClose }: { invoice: InvoiceRow; onClose: () => void }) {
  return (
    <div style={{ padding: '28px 24px 40px' }}>
      <h2
        className="mb-1"
        style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 700, color: 'var(--foreground)' }}
      >
        Invoice details
      </h2>
      <p className="t-mono mb-6" style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>{invoice.invoiceNumber}</p>

      <div
        className="rounded-xl p-4 mb-5"
        style={{ backgroundColor: 'var(--muted)', border: '1px solid var(--border)' }}
      >
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--foreground)' }}>{invoice.description}</p>
        <p className="t-caption" style={{ color: 'var(--muted-foreground)' }}>
          Due {invoice.dueDate ? formatDateShort(invoice.dueDate) : 'TBC'}
          {' · '}
          {invoice.allowPartial ? 'Partial payments allowed' : 'Full payment required'}
        </p>
      </div>

      <p className="t-label mb-2" style={{ color: 'var(--muted-foreground)' }}>FEE BREAKDOWN</p>
      <div className="rounded-xl overflow-hidden mb-5" style={{ border: '1px solid var(--border)' }}>
        {invoice.lineItems.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            className="flex items-center justify-between gap-3 px-4 py-3"
            style={{ borderBottom: index < invoice.lineItems.length - 1 ? '1px solid var(--border)' : 'none' }}
          >
            <div className="min-w-0">
              <span className="text-sm block" style={{ color: 'var(--foreground)' }}>{item.name}</span>
              {item.dueDate ? (
                <span className="t-caption" style={{ color: 'var(--muted-foreground)' }}>Due {formatDateShort(item.dueDate)}</span>
              ) : null}
            </div>
            <span className="text-sm font-medium whitespace-nowrap">{formatCurrency(item.amount)}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
          <p className="t-caption mb-1" style={{ color: 'var(--muted-foreground)' }}>Paid</p>
          <p className="text-sm font-semibold">{formatCurrency(invoice.amountPaid)}</p>
        </div>
        <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
          <p className="t-caption mb-1" style={{ color: 'var(--muted-foreground)' }}>Outstanding</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--warning)' }}>{formatCurrency(invoice.outstanding)}</p>
        </div>
      </div>

      {invoice.outstanding > 0 ? (
        <Link
          to="/student/payment"
          search={{ invoiceId: invoice.id }}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-ink)' }}
          onClick={onClose}
        >
          <Wallet style={{ width: 16, height: 16 }} />
          Pay now
        </Link>
      ) : null}
    </div>
  )
}

function FeeStatementPage() {
  const navigate = useNavigate()
  const [viewInvoice, setViewInvoice] = useState<InvoiceRow | null>(null)
  const { data, isPending, error } = useQuery({
    queryKey: studentFeesQueryKey,
    queryFn: getStudentFees,
  })

  return (
    <StudentShell pageTitle="Fees" guide="Your invoices and payments. Pay the balance from this statement. A fee hold from the Bursar can block registration.">
      <div className="animate-fade-up" style={{ padding: '24px 16px 56px' }}>
        <div className="flex flex-wrap justify-between gap-4 mb-6">
          <h1 className="t-h1" style={{ fontFamily: 'var(--font-display)' }}>Fee statement</h1>
          {data && data.balance > 0 ? (
            <Link
              to="/student/payment"
              search={{ invoiceId: data.invoices.find((row) => row.outstanding > 0)?.id }}
              className="text-sm font-semibold"
              style={{ color: 'var(--success)' }}
            >
              Make a payment →
            </Link>
          ) : null}
        </div>
        {isPending ? (
          <p className="t-body" style={{ color: 'var(--muted-foreground)' }}>Loading fees…</p>
        ) : error ? (
          <p className="t-body" style={{ color: 'var(--error)' }}>{apiErrorMessage(error, 'Could not load fees.')}</p>
        ) : data ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <StatTile icon={CreditCard} iconColor="var(--info)" iconBg="var(--info-bg)" label="CHARGED" value={formatCurrency(data.totalCharged)} />
              <StatTile icon={CreditCard} iconColor="var(--success)" iconBg="var(--success-bg)" label="PAID" value={formatCurrency(data.totalPaid)} />
              <StatTile icon={CreditCard} iconColor="var(--warning)" iconBg="var(--warning-bg)" label="BALANCE" value={formatCurrency(data.balance)} />
            </div>
            <h2 className="t-h3 mb-3">Invoices</h2>
            <div className="mb-6">
              <DataTable
                rows={data.invoices}
                rowKey={(invoice) => invoice.id}
                searchPlaceholder="Search invoices…"
                searchFilter={(invoice, query) =>
                  invoice.invoiceNumber.toLowerCase().includes(query)
                  || invoice.description.toLowerCase().includes(query)
                }
                filters={[{ id: 'status', label: 'statuses', getValue: (invoice) => invoice.status }]}
                empty="No invoices yet."
                columns={[
                  {
                    id: 'number',
                    header: 'Invoice',
                    value: (invoice) => invoice.invoiceNumber,
                    sortable: true,
                    cell: (invoice) => <span className="font-medium">{invoice.invoiceNumber}</span>,
                  },
                  {
                    id: 'description',
                    header: 'Description',
                    value: (invoice) => invoice.description,
                    cell: (invoice) => (
                      <span className="text-sm truncate block" style={{ color: 'var(--foreground)', maxWidth: 220 }}>
                        {invoice.description}
                      </span>
                    ),
                  },
                  {
                    id: 'status',
                    header: 'Status',
                    value: (invoice) => invoice.status,
                    cell: (invoice) => {
                      const style = invoiceStatusStyle(invoice.status)
                      return (
                        <span className="t-label px-2 py-0.5 rounded-full" style={{ backgroundColor: style.bg, color: style.color }}>
                          {invoice.status}
                        </span>
                      )
                    },
                  },
                  {
                    id: 'due',
                    header: 'Due',
                    value: (invoice) => invoice.dueDate ?? 'TBC',
                    cell: (invoice) => invoice.dueDate ? formatDateShort(invoice.dueDate) : 'TBC',
                  },
                  {
                    id: 'paid',
                    header: 'Paid',
                    value: (invoice) => invoice.amountPaid,
                    sortable: true,
                    sortValue: (invoice) => invoice.amountPaid,
                    cell: (invoice) => formatCurrency(invoice.amountPaid),
                  },
                  {
                    id: 'dueAmt',
                    header: 'Outstanding',
                    value: (invoice) => invoice.outstanding,
                    sortable: true,
                    sortValue: (invoice) => invoice.outstanding,
                    cell: (invoice) => (
                      <span className="font-semibold" style={{ color: invoice.outstanding > 0 ? 'var(--warning)' : 'var(--success)' }}>
                        {formatCurrency(invoice.outstanding)}
                      </span>
                    ),
                  },
                  {
                    id: 'actions',
                    header: 'Actions',
                    cell: (invoice) => (
                      <div className="flex items-center gap-1.5">
                        <IconActionButton label="View invoice" icon={Eye} onClick={() => setViewInvoice(invoice)} />
                        {invoice.outstanding > 0 ? (
                          <IconActionButton
                            label="Pay now"
                            icon={Wallet}
                            onClick={() => void navigate({ to: '/student/payment', search: { invoiceId: invoice.id } })}
                          />
                        ) : null}
                      </div>
                    ),
                  },
                ]}
              />
            </div>
            <h2 className="t-h3 mb-3">Payments</h2>
            <DataTable
              rows={data.payments}
              rowKey={(payment) => payment.id}
              searchPlaceholder="Search payments…"
              filters={[
                { id: 'status', label: 'statuses', getValue: (payment) => payment.status },
                { id: 'method', label: 'methods', getValue: (payment) => payment.method },
              ]}
              empty="No payments yet."
              columns={[
                { id: 'ref', header: 'Reference', value: (payment) => payment.reference, sortable: true, cell: (payment) => <span className="font-medium">{payment.reference}</span> },
                { id: 'method', header: 'Method', value: (payment) => payment.method, cell: (payment) => payment.method },
                { id: 'status', header: 'Status', value: (payment) => payment.status, cell: (payment) => payment.status },
                { id: 'amount', header: 'Amount', value: (payment) => payment.amount, sortable: true, sortValue: (payment) => payment.amount, cell: (payment) => formatCurrency(payment.amount) },
                {
                  id: 'receipt',
                  header: '',
                  cell: (payment) => payment.status === 'Completed'
                    ? <Link to="/student/receipt" search={{ id: payment.id }} className="t-caption" style={{ color: 'var(--success)' }}>Receipt</Link>
                    : null,
                  className: 'text-right',
                },
              ]}
            />
          </>
        ) : null}
      </div>

      <Sheet open={!!viewInvoice} onOpenChange={(open) => !open && setViewInvoice(null)}>
        <SheetContent className="overflow-y-auto sheet-lg" style={{ padding: 0 }}>
          {viewInvoice ? <InvoiceDetailSheet invoice={viewInvoice} onClose={() => setViewInvoice(null)} /> : null}
        </SheetContent>
      </Sheet>
    </StudentShell>
  )
}
