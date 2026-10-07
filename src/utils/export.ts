// Ekspor tabel ke Excel/CSV di browser. SheetJS dimuat dinamis agar tidak masuk bundle utama.

export type ExportFormat = 'xlsx' | 'csv';

export const exportSheet = async (
  filename: string,
  rows: Record<string, string | number | null | undefined>[],
  format: ExportFormat = 'xlsx'
) => {
  const XLSX = await import('xlsx');
  const sheet = XLSX.utils.json_to_sheet(rows);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Data');
  XLSX.writeFile(book, `${filename}.${format}`, { bookType: format });
};
