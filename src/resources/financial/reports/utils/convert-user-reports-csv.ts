import { format } from '@fast-csv/format';
import * as stream from 'stream';

export async function convertUserReportsToCsv(records: any[]): Promise<string> {
  const headers = [
    { value: 'reportingMonth', label: 'Reporting Month' },
    { value: 'salesMonth', label: 'Sales Month' },
    { value: 'store', label: 'Store' },
    { value: 'chType', label: 'Channel Type' },
    { value: 'channelId', label: 'Channel ID' },
    { value: 'country', label: 'Country' },
    { value: 'labelName', label: 'Label Name' },
    { value: 'productType', label: 'Product Type' },
    { value: 'productTitle', label: 'Product Title' },
    { value: 'productArtist', label: 'Product Artist' },
    { value: 'ean', label: 'EAN' },
    { value: 'isrc', label: 'ISRC' },
    { value: 'grid', label: 'GRID' },
    { value: 'articleNo', label: 'Article Number' },
    { value: 'cmg_netRevenue', label: 'Royalties' },
    { value: 'units', label: 'Units' },
  ];

  const csvRows = records.map((record) => {
    const row: any = {};
    headers.forEach((header) => {
      row[header.label] = record[header.value] || '';
    });
    return row;
  });

  const csvStream = format({
    headers: headers.map((h) => h.label),
    delimiter: ';',
  });
  const writableStream = new stream.PassThrough();
  csvStream.pipe(writableStream);

  csvRows.forEach((row) => csvStream.write(row));
  csvStream.end();

  let csvContent = '';
  writableStream.on('data', (chunk) => {
    csvContent += chunk.toString();
  });

  await new Promise((resolve) => writableStream.on('end', resolve));
  return csvContent;
}
