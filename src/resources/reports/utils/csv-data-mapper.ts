// src/resources/reports/utils/csv-data-mapper.ts

export const mapKontorData = (record: any) => {
  return {
    labelName: record['Labelname'],
    isrc: record['ISRC'],
    ean: record['EAN/UPC'],
    artist: record['Artist'],
    productTitle: record['Producttitle'],
    trackTitle: record['Tracktitle'],
    articleNo: record['Art.No.'],
    grid: record['GRid'],
    licensee: record['Licensee'],
    outletname: record['Outletname'],
    format: record['Format'],
    distributionChannel: record['Distribution Channel'],
    territory: record['Territory'],
    salesPeriod: record['Sales Period'],
    ppd: parseFloat(record['PPD'].replace(',', '.')),
    shareCustomer: parseFloat(record['Share Customer %'].replace(',', '.')),
    royaltyValuePerUnit: parseFloat(
      record['Royalty value per unit'].replace(',', '.'),
    ),
    units: parseInt(record['Units'], 10),
    netRevenue: parseFloat(record['Net Revenue'].replace(',', '.')),
    royaltyRate: parseFloat(
      record['Royalty Rate Customer %'].replace(',', '.'),
    ),
    royaltyAmountBeforeCopyrightDed: parseFloat(
      record['Roy.Amount before Copyright Ded.'].replace(',', '.'),
    ),
    royaltyAmountCustomer: parseFloat(
      record['Royalty Amount Customer'].replace(',', '.'),
    ),
    dmbRetailerName: record['DMB Retailer Name'],
    dmbStoreName: record['DMB Store Name'],
  };
};

export const mapBelieveData = (record: any) => {
  return {
    reportingMonth: record['Reporting month'],
    salesMonth: record['Sales Month'],
    platform: record['Platform'],
    countryRegion: record['Country / Region'],
    labelName: record['Label Name'],
    artistName: record['Artist Name'],
    releaseTitle: record['Release title'],
    trackTitle: record['Track title'],
    upc: record['UPC'],
    isrc: record['ISRC'],
    catalogNb: record['Release Catalog nb'],
    streamingSubscriptionType: record['Streaming Subscription Type'],
    releaseType: record['Release type'],
    salesType: record['Sales Type'],
    quantity: record['Quantity'],
    clientPaymentCurrency: record['Client Payment Currency'],
    unitPrice: parseFloat(record['Unit Price'].replace(',', '.')),
    mechanicalFee: parseFloat(record['Mechanical Fee'].replace(',', '.')),
    grossRevenue: parseFloat(record['Gross Revenue'].replace(',', '.')),
    clientShareRate: parseFloat(record['Client share rate'].replace(',', '.')),
    netRevenue: parseFloat(record['Net Revenue'].replace(',', '.')),
  };
};
