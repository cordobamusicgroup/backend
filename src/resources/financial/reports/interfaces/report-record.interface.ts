interface BelieveRecord {
  reportingMonth: string;
  salesMonth: string;
  platform: string;
  countryRegion: string;
  labelName: string;
  artistName: string;
  releaseTitle: string;
  trackTitle: string;
  upc: string;
  isrc: string;
  releaseCatalogNb: string;
  releaseType: string;
  salesType: string;
  quantity: number;
  clientPaymentCurrency: string;
  unitPrice: number;
  mechanicalFee: number;
  grossRevenue: number;
  clientShareRate: number;
  netRevenue: number;
}

interface KontorReportRecord {
  reportingMonth: string;
  salesMonth: string;
  store: string;
  channelType: string;
  channelId: string;
  country: string;
  labelName: string;
  productType: string;
  productTitle: string;
  productArtist: string;
  ean: string;
  isrc: string;
  grid: string;
  articleNumber: string;
  royalties: number;
  units: number;
}

type RoyaltyReportRecordType = BelieveRecord | KontorReportRecord;
