function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** DD/MM/YYYY, HH:mm:ss — consistent on server and client */
export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** DD/MM/YYYY */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}
