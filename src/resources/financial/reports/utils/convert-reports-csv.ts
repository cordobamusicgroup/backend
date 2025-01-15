import { format } from '@fast-csv/format';
import * as stream from 'stream';

export enum ReportType {
  USER = 'USER',
  BASE = 'BASE',
}

const commonHeaders = {
  KONTOR: [
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
  ],
  BELIEVE: [
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
  ],
};

const baseSpecificHeaders = {
  KONTOR: [
    { value: 'royalties', label: 'Royalties' },
    { value: 'cmg_clientRate', label: 'Client Share Rate' },
    { value: 'cmg_netRevenue', label: 'Net Revenue' },
  ],
  BELIEVE: [
    { value: 'netRevenue', label: 'Royalties' },
    { value: 'cmg_clientRate', label: 'Client Share Rate' },
    { value: 'cmg_netRevenue', label: 'Net Revenue' },
  ],
};

const userSpecificHeaders = {
  KONTOR: [{ value: 'cmg_netRevenue', label: 'Royalties' }],
  BELIEVE: [{ value: 'cmg_netRevenue', label: 'Royalties' }],
};

export async function convertReportsToCsv(
  records: any[],
  distributor: string,
  reportType: ReportType,
): Promise<string> {
  let headers;
  if (distributor === 'KONTOR' || distributor === 'BELIEVE') {
    headers = [...commonHeaders[distributor]];
    if (reportType === ReportType.USER) {
      headers = headers.concat(userSpecificHeaders[distributor]);
    } else if (reportType === ReportType.BASE) {
      headers = headers.concat(baseSpecificHeaders[distributor]);
    }
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
