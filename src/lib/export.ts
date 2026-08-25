import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

function csvCell(value: string | number) {
  const text = String(value ?? "");
  if (/[;"\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export function exportExcel(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
) {
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportPdf(
  title: string,
  headers: string[],
  rows: (string | number)[][],
) {
  const doc = new jsPDF({ orientation: headers.length > 5 ? "landscape" : "portrait" });
  doc.setFontSize(16);
  doc.text(title, 14, 18);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Orbio CRM · ${new Date().toLocaleString("pt-BR")}`, 14, 24);
  autoTable(doc, {
    head: [headers],
    body: rows.map((row) => row.map(String)),
    startY: 30,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [28, 28, 28] },
  });
  doc.save(`${title.toLowerCase().replaceAll(" ", "-")}.pdf`);
}
