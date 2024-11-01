// src/resources/financial/utils/csv-mapper.util.ts

import { Distributor } from '@prisma/client';

export function mapCsvToRecord(row: any, distributor: Distributor) {
  if (distributor === Distributor.KONTOR) {
    return {
      salesMonth: row['Sales Period'],
      store: row['Store'],
      chType: row['Ch.-Type'],
      channelId: row['Channel ID'],
      country: row['Country'],
      labelName: row['Label'],
      productType: row['Product Type'],
      productTitle: row['Product Title'],
      productArtist: row['Product Artist'],
      ean: row['EAN'],
      isrc: row['ISRC'],
      grid: row['GRID'],
      articleNo: row['Article No'],
      royalties: parseFloat(row['Royalties']),
      units: parseInt(row['Units'], 10),
    };
  } else if (distributor === Distributor.BELIEVE) {
    return {
      reportingMonth: row['Reporting month'],
      salesMonth: row['Sales Month'],
      platform: row['Platform'],
      countryRegion: row['Country / Region'],
      labelName: row['Label Name'],
      artistName: row['Artist Name'],
      releaseTitle: row['Release title'],
      trackTitle: row['Track title'],
      upc: row['UPC'],
      isrc: row['ISRC'],
      catalogNb: row['Release Catalog nb'],
      streamingSubscriptionType: row['Streaming Subscription Type'],
      releaseType: row['Release type'],
      salesType: row['Sales Type'],
      quantity: row['Quantity'],
      clientPaymentCurrency: row['Client Payment Currency'],
      unitPrice: parseFloat(row['Unit Price']),
      mechanicalFee: parseFloat(row['Mechanical Fee']),
      grossRevenue: parseFloat(row['Gross Revenue']),
      clientShareRate: parseFloat(row['Client share rate']),
      netRevenue: parseFloat(row['Net Revenue']),
    };
  }
  throw new Error(`Unknown distributor: ${distributor}`);
}
