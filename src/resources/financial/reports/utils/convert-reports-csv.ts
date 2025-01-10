import { format } from '@fast-csv/format';
import * as stream from 'stream';

export async function convertReportsToCsv(
  records: any[],
  distributor: string,
): Promise<string> {
  let headers;
  if (distributor === 'KONTOR') {
    headers = [
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
      { value: 'units', label: 'Units' },
      { value: 'royalties', label: 'Royalties' },
      { value: 'cmg_clientRate', label: 'Client Share Rate' },
      { value: 'cmg_netRevenue', label: 'Net Revenue' },
    ];
  } else if (distributor === 'BELIEVE') {
    headers = [
      { value: 'reportingMonth', label: 'Reporting Month' },
      { value: 'salesMonth', label: 'Sales Month' },
      { value: 'platform', label: 'Store' },
      { value: 'countryRegion', label: 'Country' },
      { value: 'labelName', label: 'Label Name' },
      { value: 'artistName', label: 'Artist Name' },
      { value: 'releaseTitle', label: 'Release Title' },
      { value: 'trackTitle', label: 'Track Title' },
      { value: 'upc', label: 'UPC' },
      { value: 'isrc', label: 'ISRC' },
      { value: 'catalogNb', label: 'Release Catalog Number' },
      {
        value: 'streamingSubscriptionType',
        label: 'Streaming Subscription Type',
      },
      { value: 'releaseType', label: 'Release Type' },
      { value: 'salesType', label: 'Sales Type' },
      { value: 'quantity', label: 'Quantity' },
      { value: 'clientPaymentCurrency', label: 'Client Payment Currency' },
      { value: 'netRevenue', label: 'Royalties' },
      { value: 'cmg_clientRate', label: 'Client Share Rate' },
      { value: 'cmg_netRevenue', label: 'Net Revenue' },
    ];
  } else {
    throw new Error(`Unknown distributor: ${distributor}`);
  }

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
