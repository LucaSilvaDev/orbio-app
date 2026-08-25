import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { exportExcel, exportPdf } from "@/lib/export";

export function ExportMenu({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: (string | number)[][];
}) {
  return (
    <div className="flex gap-1">
      <Button
        size="sm"
        variant="outline"
        onClick={() => exportExcel(title, headers, rows)}
      >
        <Download className="h-3.5 w-3.5" />
        Excel
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => exportPdf(title, headers, rows)}
      >
        <Download className="h-3.5 w-3.5" />
        PDF
      </Button>
    </div>
  );
}
