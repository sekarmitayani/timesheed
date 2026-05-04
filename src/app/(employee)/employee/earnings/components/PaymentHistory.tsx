import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar as CalendarIcon,
  Clock,
  CreditCard,
  FileText
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

interface Payment {
  id: string;
  amount: number;
  date: string;
  projectName: string;
  contractType: string;
  description?: string;
}

interface PaymentHistoryProps {
  payments: Payment[];
}

export function PaymentHistory({ payments }: PaymentHistoryProps) {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-GB", {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // 1. Filtering Logic
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const pDate = new Date(p.date).getTime();
      if (startDate && pDate < new Date(startDate).getTime()) return false;
      if (endDate && pDate > new Date(endDate).getTime()) return false;
      return true;
    });
  }, [payments, startDate, endDate]);

  // 2. Pagination Logic
  const totalPages = Math.ceil(filteredPayments.length / pageSize);
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPayments.slice(start, start + pageSize);
  }, [filteredPayments, currentPage, pageSize]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <Card className="border-[#E2E8F0] shadow-none rounded-md">
      <CardHeader className="px-5 pt-2 pb-0 space-y-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2 m-0 leading-none">
            <DollarSign className="h-4 w-4 text-[#4B7BEC]" /> Payment History
          </CardTitle>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground font-medium">Rows:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}
              >
                <SelectTrigger className="h-7 w-16 text-[10px] border-[#E2E8F0] bg-slate-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="h-4 w-px bg-[#E2E8F0] hidden sm:block" />

            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-md border border-[#E2E8F0]">
              <CalendarIcon className="h-3 w-3 text-muted-foreground ml-1" />
              <input
                type="date"
                className="bg-transparent text-[10px] outline-none border-none focus:ring-0 w-28 h-6"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
              />
              <span className="text-[10px] text-muted-foreground">to</span>
              <input
                type="date"
                className="bg-transparent text-[10px] outline-none border-none focus:ring-0 w-28 h-6"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
              />
              {(startDate || endDate) && (
                <button
                  onClick={() => { setStartDate(""); setEndDate(""); setCurrentPage(1); }}
                  className="text-[10px] text-red-500 font-bold px-2 hover:bg-red-50 rounded"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-[#F8FAFC] sticky top-0 z-10 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
              <TableRow className="hover:bg-transparent border-[#E2E8F0] bg-[#F8FAFC]">
                <TableHead className="bg-[#F8FAFC] w-[140px] text-[10px] font-bold text-muted-foreground uppercase py-2.5 pl-6 tracking-wider">Date</TableHead>
                <TableHead className="bg-[#F8FAFC] text-[10px] font-bold text-muted-foreground uppercase py-2.5 tracking-wider">Project & Type</TableHead>
                <TableHead className="bg-[#F8FAFC] text-[10px] font-bold text-muted-foreground uppercase py-2.5 tracking-wider">Amount</TableHead>
                <TableHead className="bg-[#F8FAFC] text-right text-[10px] font-bold text-muted-foreground uppercase py-2.5 tracking-wider">Status</TableHead>
                <TableHead className="bg-[#F8FAFC] w-[60px] pr-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground text-xs italic">
                    <div className="flex flex-col items-center justify-center space-y-2 opacity-60">
                      <Search className="h-6 w-6 text-slate-400" />
                      <p>No payment records found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPayments.map((payment) => (
                  <TableRow
                    key={payment.id}
                    className="hover:bg-[#F8FAFC] cursor-pointer group border-[#E2E8F0] transition-colors"
                    onClick={() => setSelectedPayment(payment)}
                  >
                    <TableCell className="py-2 pl-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#0f172a]">{new Date(payment.date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</span>
                        <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight">{new Date(payment.date).toLocaleDateString("en-US", { weekday: "long" })}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold truncate max-w-[200px] group-hover:text-[#4B7BEC] transition-colors">
                          {payment.projectName}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {payment.contractType} Contract
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2 font-bold text-xs text-[#4B7BEC]">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-tight">
                        Released
                      </span>
                    </TableCell>
                    <TableCell className="py-2 text-right pr-6">
                      <div className="flex justify-end">
                        <div className="h-7 w-7 rounded-full flex items-center justify-center bg-white opacity-0 group-hover:opacity-100 transition-all border border-[#E2E8F0] shadow-sm">
                          <ChevronRight className="h-3.5 w-3.5 text-[#4B7BEC]" />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className="border-t border-[#e2e8f0] bg-white px-4 py-3 flex items-center justify-between shrink-0">
          <div className="text-xs text-muted-foreground">
            Showing <span className="font-medium text-[#0f172a]">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-medium text-[#0f172a]">{Math.min(currentPage * pageSize, filteredPayments.length)}</span> of <span className="font-medium text-[#0f172a]">{filteredPayments.length}</span> records
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 w-8 p-0" 
              disabled={currentPage <= 1} 
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-xs font-medium px-2">Page {currentPage} of {totalPages || 1}</div>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 w-8 p-0" 
              disabled={currentPage >= totalPages} 
              onClick={() => handlePageChange(currentPage + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>

      <Dialog open={!!selectedPayment} onOpenChange={(open) => !open && setSelectedPayment(null)}>
        <DialogContent className="max-w-md bg-white border-none rounded-[6px] shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-800">Payment Detail</DialogTitle>
            <DialogDescription className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
              Transaction ID: #{selectedPayment?.id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="py-4 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                    <Clock className="h-3 w-3 text-[#4B7BEC]" /> Date & Time
                  </p>
                  <p className="text-xs font-bold text-slate-700">{formatDateTime(selectedPayment.date)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                    <CreditCard className="h-3 w-3 text-[#4B7BEC]" /> Project
                  </p>
                  <p className="text-xs font-bold text-slate-800">{selectedPayment.projectName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-[#4B7BEC]" /> Amount
                  </p>
                  <p className="text-sm font-bold text-[#4B7BEC]">{formatCurrency(selectedPayment.amount)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Contract Type</p>
                  <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${selectedPayment.contractType === 'Project'
                    ? 'bg-blue-50 text-blue-600 border-blue-100'
                    : 'bg-slate-50 text-slate-500 border-slate-100'
                    }`}>
                    {selectedPayment.contractType}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                  <FileText className="h-3 w-3 text-[#4B7BEC]" /> Description
                </p>
                <div className="p-3 bg-slate-50 rounded-[4px] border border-[#E2E8F0]">
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {selectedPayment.description || "No description provided for this payment."}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSelectedPayment(null)} className="h-8 rounded-[4px] font-bold text-[11px] uppercase">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
