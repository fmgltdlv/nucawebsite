/** Escape a single CSV cell per RFC 4180, neutralizing spreadsheet formulas. */
export function csvCell(value: string): string {
  let cell = value
  if (/^[=+\-@\t\r]/.test(cell)) {
    cell = `'${cell}`
  }
  if (/[",\n\r]/.test(cell)) {
    return `"${cell.replace(/"/g, '""')}"`
  }
  return cell
}

/** Build a CSV document from rows of string cells. */
export function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n'
}
