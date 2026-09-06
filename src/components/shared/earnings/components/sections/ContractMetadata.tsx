import { Badge } from "@/components/ui/badge";

interface ContractMetadataProps {
  type: string;
  scheme: string;
  rate: number;
  rateType: string;
  startDate: string;
  endDate: string | null;
  projectName?: string | null;
}

export function ContractMetadata({ type, scheme, rate, rateType, startDate, endDate, projectName }: ContractMetadataProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-GB", { 
      day: '2-digit',
      month: 'short', 
      year: 'numeric' 
    });
  };

  return (
    <div className="space-y-4">
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Contract Information</h4>
      <div className="grid grid-cols-2 gap-y-4 gap-x-2">
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase font-medium">Project</p>
          <p className="text-xs font-bold text-slate-700 truncate" title={projectName || "-"}>{projectName || "-"}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase font-medium">Contract Type</p>
          <Badge variant="outline" className="bg-slate-50 border-[#E2E8F0] text-[10px] font-bold uppercase px-2 py-0">
            {type}
          </Badge>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase font-medium">Payment Scheme</p>
          <p className="text-xs font-bold text-slate-700 capitalize">{scheme.replace(/_/g, " ")}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase font-medium">Rate Amount</p>
          <p className="text-xs font-bold text-[#4B7BEC]">
            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(rate)}
            <span className="text-[10px] text-muted-foreground font-normal ml-1">/ {rateType}</span>
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase font-medium">Contract Period</p>
          <p className="text-[10px] font-bold text-slate-700">
            {formatDate(startDate)} - {endDate ? formatDate(endDate) : "Present"}
          </p>
        </div>
      </div>
    </div>
  );
}
