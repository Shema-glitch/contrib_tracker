import { format } from 'date-fns';
import * as XLSX from 'xlsx';

export function generateCSV(data: any[]) {
  if (!data.length) return '';

  const headers = Object.keys(data[0]);
  const rows = data.map(item => headers.map(header => {
    const value = item[header];
    if (value instanceof Date) {
      return format(value, 'yyyy-MM-dd');
    }
    return value?.toString() || '';
  }));

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
}

export function generateExcel(data: any[]) {
  if (!data.length) return Buffer.from('');

  const worksheet = XLSX.utils.json_to_sheet(data.map(item => ({
    ...item,
    date: item.date instanceof Date ? format(item.date, 'yyyy-MM-dd') : item.date
  })));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export function getFilename(format: 'csv' | 'excel' | 'pdf', filters: any): string {
  const date = new Date();
  const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
  const memberName = filters.member ? `_${filters.member.replace(/\s+/g, '_')}` : '';
  const month = filters.month ? `_${filters.month}` : '';
  const type = filters.type ? `_${filters.type}` : '';
  const status = filters.status ? `_${filters.status}` : '';
  
  const extension = format === 'excel' ? 'xlsx' : format;
  return `report${memberName}${month}${type}${status}_${formattedDate}.${extension}`;
} 