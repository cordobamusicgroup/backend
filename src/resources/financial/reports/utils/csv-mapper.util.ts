// src/resources/financial/utils/csv-mapper.util.ts

import { Distributor } from '@prisma/client';
import * as dayjs from 'dayjs';
import Decimal from 'decimal.js';

export function mapCsvToRecord(row: any, distributor: Distributor) {
  if (distributor === Distributor.KONTOR) {
    return {
      salesMonth: String(row['Sales Period']),
      store: String(row['Store']),
      chType: String(row['Ch.-Type']),
      channelId: String(row['Channel ID']),
      country: String(row['Country']),
      labelName: String(row['Label']),
      productType: String(row['Product Type']),
      productTitle: String(row['Product Title']),
      productArtist: String(row['Product Artist']),
      ean: String(row['EAN']),
      isrc: String(row['ISRC']),
      grid: String(row['GRID']),
      articleNo: String(row['Article No']),
      royalties: new Decimal(row['Royalties'].replace(',', '.'))
        .toDP(10)
        .toFixed(),
      units: parseInt(row['Units'], 10),
    };
  } else if (distributor === Distributor.BELIEVE) {
    return {
      salesMonth: dayjs(String(row['Sales Month'])).format('YYYYMM'),
      platform: String(row['Platform']),
      countryRegion: String(row['Country / Region']),
      labelName: String(row['Label Name']),
      artistName: String(row['Artist Name']),
      releaseTitle: String(row['Release title']),
      trackTitle: String(row['Track title']),
      upc: String(row['UPC']),
      isrc: String(row['ISRC']),
      catalogNb: String(row['Release Catalog nb']),
      streamingSubscriptionType: String(row['Streaming Subscription Type']),
      releaseType: String(row['Release type']),
      salesType: String(row['Sales Type']),
      quantity: String(row['Quantity']),
      clientPaymentCurrency: String(row['Client Payment Currency']),
      unitPrice: new Decimal(row['Unit Price'].replace(',', '.'))
        .toDP(10)
        .toFixed(),
      mechanicalFee: new Decimal(row['Mechanical Fee'].replace(',', '.'))
        .toDP(10)
        .toFixed(),
      grossRevenue: new Decimal(row['Gross Revenue'].replace(',', '.'))
        .toDP(10)
        .toFixed(),
      clientShareRate: new Decimal(row['Client share rate'].replace(',', '.'))
        .toDP(10)
        .toFixed(),
      netRevenue: new Decimal(row['Net Revenue'].replace(',', '.'))
        .toDP(10)
        .toFixed(),
    };
  }
  throw new Error(`Unknown distributor: ${distributor}`);
}
