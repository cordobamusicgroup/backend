import { Distributor } from '@prisma/client';
import * as dayjs from 'dayjs';
import Decimal from 'decimal.js';

/**
 * Validates and converts a value to a Decimal object.
 * @param value The value to validate and convert.
 * @param fieldName The name of the field (for error messages).
 * @returns A Decimal object.
 * @throws Error if the value is invalid and cannot be converted.
 */
function validateDecimal(value: string | number, fieldName: string): Decimal {
  // Handle empty or undefined values
  if (value === undefined || value === null || value === '') {
    return new Decimal(0);
  }

  // Attempt to convert to a number
  let numericValue: number;
  if (typeof value === 'string') {
    numericValue = parseFloat(value);
  } else if (typeof value === 'number') {
    numericValue = value;
  } else {
    throw new Error(`Invalid value for ${fieldName}: "${value}"`);
  }

  // Validate if the conversion was successful
  if (isNaN(numericValue)) {
    throw new Error(`Invalid value for ${fieldName}: "${value}"`);
  }

  // Create the Decimal object with standard precision and return it
  return new Decimal(numericValue).toDP(10);
}

/**
 * Maps a CSV row to a record object for the KONTOR distributor.
 * @param row The CSV row.
 * @returns A mapped object with the row data.
 */
function mapKontorCsvToRecord(row: any) {
  return {
    salesMonth: String(row['Sales Period'] ?? ''),
    store: String(row['Store'] ?? ''),
    chType: String(row['Ch.-Type'] ?? ''),
    channelId: String(row['Channel ID'] ?? ''),
    country: String(row['Country'] ?? ''),
    labelName: String(row['Label'] ?? ''),
    productType: String(row['Product Type'] ?? ''),
    productTitle: String(row['Product Title'] ?? ''),
    productArtist: String(row['Product Artist'] ?? ''),
    ean: String(row['EAN'] ?? ''),
    isrc: String(row['ISRC'] ?? ''),
    grid: String(row['GRID'] ?? ''),
    articleNo: String(row['Article No'] ?? ''),
    royalties: validateDecimal(row['Royalties'], 'Royalties').toFixed(),
    units: parseInt(row['Units'], 10) || 0,
  };
}

/**
 * Maps a CSV row to a record object for the BELIEVE distributor.
 * @param row The CSV row.
 * @returns A mapped object with the row data.
 */
function mapBelieveCsvToRecord(row: any) {
  return {
    salesMonth: dayjs(String(row['Sales Month'] ?? '')).format('YYYYMM'),
    platform: String(row['Platform'] ?? ''),
    countryRegion: String(row['Country / Region'] ?? ''),
    labelName: String(row['Label Name'] ?? ''),
    artistName: String(row['Artist Name'] ?? ''),
    releaseTitle: String(row['Release title'] ?? ''),
    trackTitle: String(row['Track title'] ?? ''),
    upc: String(row['UPC'] ?? ''),
    isrc: String(row['ISRC'] ?? ''),
    catalogNb: String(row['Release Catalog nb'] ?? ''),
    streamingSubscriptionType: String(row['Streaming Subscription Type'] ?? ''),
    releaseType: String(row['Release type'] ?? ''),
    salesType: String(row['Sales Type'] ?? ''),
    quantity: String(row['Quantity'] ?? ''),
    clientPaymentCurrency: String(row['Client Payment Currency'] ?? ''),
    unitPrice: validateDecimal(row['Unit Price'], 'Unit Price').toFixed(),
    mechanicalFee: validateDecimal(
      row['Mechanical Fee'],
      'Mechanical Fee',
    ).toFixed(),
    grossRevenue: validateDecimal(
      row['Gross Revenue'],
      'Gross Revenue',
    ).toFixed(),
    clientShareRate: validateDecimal(
      row['Client share rate'],
      'Client share rate',
    ).toFixed(),
    netRevenue: validateDecimal(row['Net Revenue'], 'Net Revenue').toFixed(),
  };
}

/**
 * Maps a CSV row to a record object, depending on the distributor.
 * @param row The CSV row.
 * @param distributor The distributor of the record.
 * @returns A mapped object with the row data.
 * @throws Error if the distributor is unknown.
 */
export function mapCsvToRecord(row: any, distributor: Distributor) {
  switch (distributor) {
    case Distributor.KONTOR:
      return mapKontorCsvToRecord(row);
    case Distributor.BELIEVE:
      return mapBelieveCsvToRecord(row);
    default:
      throw new Error(`Unknown distributor: ${distributor}`);
  }
}
