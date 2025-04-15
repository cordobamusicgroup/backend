import { Distributor } from 'src/generated/client';
import * as dayjs from 'dayjs';
import Decimal from 'decimal.js';

/**
 * Validates and converts a value to a Decimal object with financial precision.
 * @param value The value to validate and convert.
 * @param fieldName The name of the field (for error messages).
 * @param removeThousandsSeparator Whether to remove thousands separator (commas) from the value.
 * @returns A Decimal object with 10 decimal places precision.
 * @throws Error if the value is invalid and cannot be converted.
 */
function validateDecimal(
  value: string | number | null | undefined,
  fieldName: string,
  removeThousandsSeparator = false,
): Decimal {
  // Handle empty or undefined values
  if (value === undefined || value === null || value === '') {
    return new Decimal(0);
  }

  try {
    // Process string values
    if (typeof value === 'string') {
      const processedValue = removeThousandsSeparator
        ? value.replace(/,/g, '')
        : value;

      // Check if the string is a valid number
      if (!/^-?\d*\.?\d*$/.test(processedValue.trim())) {
        throw new Error(`Invalid numeric format for ${fieldName}: "${value}"`);
      }

      return new Decimal(processedValue).toDP(10);
    }

    // Process numeric values
    if (typeof value === 'number') {
      if (!isFinite(value)) {
        throw new Error(`Invalid numeric value for ${fieldName}: "${value}"`);
      }
      return new Decimal(value).toDP(10);
    }

    throw new Error(`Unsupported type for ${fieldName}: ${typeof value}`);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error processing ${fieldName}: ${error.message}`);
    }
    throw new Error(`Failed to process ${fieldName}: "${value}"`);
  }
}

/**
 * Safely parses an integer from a string, removing thousands separators.
 * @param value The value to parse
 * @param fieldName The field name for error messages
 * @returns The parsed integer or 0 if invalid
 */
function safeParseInt(value: any, fieldName: string): number {
  if (value === undefined || value === null || value === '') {
    return 0;
  }

  try {
    if (typeof value === 'number') {
      return Math.floor(value);
    }

    if (typeof value === 'string') {
      const cleaned = value.replace(/,/g, '');
      const result = parseInt(cleaned, 10);
      return isNaN(result) ? 0 : result;
    }

    return 0;
  } catch (error) {
    console.warn(`Error parsing integer for ${fieldName}:`, error);
    return 0;
  }
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
    royalties: validateDecimal(row['Royalties'], 'Royalties', true).toFixed(),
    units: safeParseInt(row['Units'], 'Units'),
  };
}

/**
 * Maps a CSV row to a record object for the BELIEVE distributor.
 * @param row The CSV row.
 * @returns A mapped object with the row data.
 */
function mapBelieveCsvToRecord(row: any) {
  const salesMonth = row['Sales Month'] ?? '';

  return {
    salesMonth: dayjs(String(salesMonth)).format('YYYYMM'),
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
  if (!row) {
    throw new Error('Cannot map empty or null CSV row');
  }

  switch (distributor) {
    case Distributor.KONTOR:
      return mapKontorCsvToRecord(row);
    case Distributor.BELIEVE:
      return mapBelieveCsvToRecord(row);
    default:
      throw new Error(`Unknown distributor: ${distributor}`);
  }
}
