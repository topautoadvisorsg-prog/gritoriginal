export function parseCSV(content: string): { headers: string[]; data: Record<string, string>[] } {
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
  const data = lines.slice(1).map((line) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/"/g, ""));
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/"/g, ""));
    
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = values[i] || "";
    });
    return row;
  });
  return { headers, data };
}
