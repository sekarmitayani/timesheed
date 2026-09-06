import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PaymentLog {
  id: string;
  name: string;
  amount: number;
  paid_at: string;
  description: string;
}

interface PaymentHistoryTableProps {
  payments: PaymentLog[];
  paymentStatus?: "pending" | "paid" | "partially_paid";
}

export function PaymentHistoryTable({ payments = [], paymentStatus = "pending" }: PaymentHistoryTableProps) {
  const [selectedPayment, setSelectedPayment] = useState<PaymentLog | null>(null);

  const formatCurrency = (amount: number | null | undefined) => {
    const val = Number(amount);
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(isNaN(val) ? 0 : val);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-GB", { 
      day: '2-digit',
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString("en-GB", { 
      day: '2-digit',
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "paid":
        return { label: "Fully Paid", className: "bg-emerald-50 text-emerald-600 border-emerald-100" };
      case "partially_paid":
        return { label: "Partially Paid", className: "bg-amber-50 text-amber-600 border-amber-100" };
      default:
        return { label: "Payment Pending", className: "bg-slate-50 text-slate-500 border-slate-100" };
    }
  };

  const status = getStatusConfig(paymentStatus);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Payment Log</h4>
        <Badge variant="outline" className={`${status.className} text-[9px] font-bold uppercase py-0 px-2`}>
          {status.label}
        </Badge>
      </div>
      <div className="border border-[#E2E8F0] rounded-md overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="text-[10px] uppercase font-bold py-2">Date</TableHead>
              <TableHead className="text-[10px] uppercase font-bold py-2">Name</TableHead>
              <TableHead className="text-[10px] uppercase font-bold py-2">Description</TableHead>
              <TableHead className="text-right text-[10px] uppercase font-bold py-2">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-20 text-center text-[10px] text-muted-foreground italic">
                  No payment history available.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow 
                  key={payment.id} 
                  className="hover:bg-slate-50/30 cursor-pointer transition-colors"
                  onClick={() => setSelectedPayment(payment)}
                >
                  <TableCell className="py-2 text-[10px] font-medium text-slate-600">
                    {formatDate(payment.paid_at)}
                  </TableCell>
                  <TableCell className="py-2 text-[10px] font-bold text-slate-700">
                    {payment.name}
                  </TableCell>
                  <TableCell className="py-2 text-[10px] text-slate-500 max-w-[150px] truncate">
                    {payment.description}
                  </TableCell>
                  <TableCell className="py-2 text-[10px] font-bold text-[#4B7BEC] text-right">
                    {formatCurrency(payment.amount)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedPayment} onOpenChange={(open) => !open && setSelectedPayment(null)}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-[#e2e8f0] gap-0 rounded-md shadow-xl bg-white">
          <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4 pr-12 flex flex-col gap-1">
            <DialogTitle className="text-base font-bold text-slate-800">Payment Details</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              Complete information for transaction #{selectedPayment?.id.slice(0, 8)}
            </DialogDescription>
          </div>
          
          {selectedPayment && (
            <div className="px-6 pt-3.5 pb-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Date & Time
                  </p>
                  <p className="text-xs font-semibold text-slate-700">{formatDateTime(selectedPayment.paid_at)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Payment Name
                  </p>
                  <p className="text-xs font-bold text-slate-800">{selectedPayment.name}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Description
                </p>
                <div className="p-3 bg-slate-50 rounded-md border border-[#E2E8F0]">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedPayment.description || "No description provided."}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex justify-between items-center">
                <p className="text-sm font-bold text-slate-800">Total Amount</p>
                <p className="text-lg font-bold text-[#4B7BEC]">{formatCurrency(selectedPayment.amount)}</p>
              </div>
            </div>
          )}

          <div className="px-6 py-3.5 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setSelectedPayment(null)} className="rounded-md">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
