export type ParsedCsv = {
  headers: string[];
  rows: Record<string, string>[];
  errors: string[];
};

function parseLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

export function parseCsv(text: string): ParsedCsv {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { headers: [], rows: [], errors: ["CSV is empty."] };
  }

  const headers = parseLine(lines[0] ?? "").map((header) => header.trim());
  const rows: Record<string, string>[] = [];
  const errors: string[] = [];

  for (const [lineIndex, line] of lines.slice(1).entries()) {
    const values = parseLine(line);
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });

    if (!row.name && !row.company && !row.organization) {
      errors.push(`Line ${lineIndex + 2}: missing company name.`);
    }

    rows.push(row);
  }

  return { headers, rows, errors };
}
