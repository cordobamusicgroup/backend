
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.6.0
 * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
 */
Prisma.prismaVersion = {
  client: "6.6.0",
  engine: "f676762280b54cd07c770017ed3711ddde35f37a"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.InitializationStatusScalarFieldEnum = {
  id: 'id',
  initialized: 'initialized',
  adminInit: 'adminInit'
};

exports.Prisma.S3FileScalarFieldEnum = {
  id: 'id',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  fileName: 'fileName',
  type: 'type',
  folder: 'folder',
  bucket: 'bucket',
  key: 'key'
};

exports.Prisma.LogScalarFieldEnum = {
  id: 'id',
  createdAt: 'createdAt',
  userId: 'userId',
  object: 'object',
  objectId: 'objectId',
  message: 'message',
  script: 'script',
  ip: 'ip'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  username: 'username',
  email: 'email',
  password: 'password',
  fullName: 'fullName',
  role: 'role',
  clientId: 'clientId'
};

exports.Prisma.PasswordResetTokenScalarFieldEnum = {
  id: 'id',
  token: 'token',
  expiresAt: 'expiresAt',
  userId: 'userId',
  createdAt: 'createdAt'
};

exports.Prisma.UserPreferencesScalarFieldEnum = {
  id: 'id',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  userId: 'userId',
  fontSize: 'fontSize',
  mainMenuCollapsed: 'mainMenuCollapsed',
  theme: 'theme',
  language: 'language'
};

exports.Prisma.UserCommsScalarFieldEnum = {
  id: 'id',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  userId: 'userId',
  type: 'type',
  value: 'value'
};

exports.Prisma.ClientScalarFieldEnum = {
  id: 'id',
  wp_id: 'wp_id',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  clientName: 'clientName',
  firstName: 'firstName',
  lastName: 'lastName',
  type: 'type',
  addressId: 'addressId',
  taxIdType: 'taxIdType',
  taxId: 'taxId',
  vatRegistered: 'vatRegistered',
  vatId: 'vatId',
  generalContactId: 'generalContactId',
  isBlocked: 'isBlocked',
  isPaymentsBlocked: 'isPaymentsBlocked',
  isPaymentInProgress: 'isPaymentInProgress',
  isPaymentDataInValidation: 'isPaymentDataInValidation'
};

exports.Prisma.ClientDMBScalarFieldEnum = {
  id: 'id',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  clientId: 'clientId',
  accessType: 'accessType',
  status: 'status',
  subclientName: 'subclientName',
  username: 'username'
};

exports.Prisma.ClientPaymentInformationScalarFieldEnum = {
  id: 'id',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  clientId: 'clientId',
  paymentMethod: 'paymentMethod',
  data: 'data'
};

exports.Prisma.ContractScalarFieldEnum = {
  id: 'id',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  clientId: 'clientId',
  uuid: 'uuid',
  type: 'type',
  ppd: 'ppd',
  status: 'status',
  docUrl: 'docUrl',
  startDate: 'startDate',
  endDate: 'endDate',
  signed: 'signed',
  signedAt: 'signedAt',
  signedBy: 'signedBy'
};

exports.Prisma.BalanceScalarFieldEnum = {
  id: 'id',
  clientId: 'clientId',
  currency: 'currency',
  amount: 'amount',
  amountRetain: 'amountRetain'
};

exports.Prisma.TransactionScalarFieldEnum = {
  id: 'id',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  type: 'type',
  description: 'description',
  amount: 'amount',
  balanceAmount: 'balanceAmount',
  reversed: 'reversed',
  distributor: 'distributor',
  balanceId: 'balanceId',
  baseReportId: 'baseReportId',
  userReportId: 'userReportId'
};

exports.Prisma.AddressScalarFieldEnum = {
  id: 'id',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  street: 'street',
  street2: 'street2',
  city: 'city',
  state: 'state',
  countryId: 'countryId',
  zip: 'zip'
};

exports.Prisma.CountryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  shortCode: 'shortCode',
  code: 'code'
};

exports.Prisma.LabelScalarFieldEnum = {
  id: 'id',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  clientId: 'clientId',
  name: 'name',
  status: 'status',
  website: 'website',
  countryId: 'countryId',
  beatportStatus: 'beatportStatus',
  traxsourceStatus: 'traxsourceStatus',
  beatportUrl: 'beatportUrl',
  traxsourceUrl: 'traxsourceUrl'
};

exports.Prisma.ImportedRoyaltyReportScalarFieldEnum = {
  id: 'id',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  distributor: 'distributor',
  reportingMonth: 'reportingMonth',
  importStatus: 'importStatus',
  s3FileId: 's3FileId'
};

exports.Prisma.BaseRoyaltyReportScalarFieldEnum = {
  id: 'id',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  currency: 'currency',
  distributor: 'distributor',
  reportingMonth: 'reportingMonth',
  totalRoyalties: 'totalRoyalties',
  totalEarnings: 'totalEarnings',
  debitState: 'debitState',
  paidOn: 'paidOn',
  s3FileId: 's3FileId'
};

exports.Prisma.UserRoyaltyReportScalarFieldEnum = {
  id: 'id',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  currency: 'currency',
  distributor: 'distributor',
  reportingMonth: 'reportingMonth',
  totalRoyalties: 'totalRoyalties',
  debitState: 'debitState',
  paidOn: 'paidOn',
  s3FileId: 's3FileId',
  baseReportId: 'baseReportId',
  clientId: 'clientId'
};

exports.Prisma.KontorRoyaltyReportScalarFieldEnum = {
  id: 'id',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  currency: 'currency',
  labelId: 'labelId',
  reportingMonth: 'reportingMonth',
  salesMonth: 'salesMonth',
  store: 'store',
  chType: 'chType',
  channelId: 'channelId',
  country: 'country',
  labelName: 'labelName',
  productType: 'productType',
  productTitle: 'productTitle',
  productArtist: 'productArtist',
  ean: 'ean',
  isrc: 'isrc',
  grid: 'grid',
  articleNo: 'articleNo',
  royalties: 'royalties',
  units: 'units',
  cmg_clientRate: 'cmg_clientRate',
  cmg_netRevenue: 'cmg_netRevenue',
  baseReportId: 'baseReportId',
  userReportId: 'userReportId',
  importedReportId: 'importedReportId'
};

exports.Prisma.BelieveRoyaltyReportScalarFieldEnum = {
  id: 'id',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  currency: 'currency',
  labelId: 'labelId',
  reportingMonth: 'reportingMonth',
  salesMonth: 'salesMonth',
  platform: 'platform',
  countryRegion: 'countryRegion',
  labelName: 'labelName',
  artistName: 'artistName',
  releaseTitle: 'releaseTitle',
  trackTitle: 'trackTitle',
  upc: 'upc',
  isrc: 'isrc',
  catalogNb: 'catalogNb',
  streamingSubscriptionType: 'streamingSubscriptionType',
  releaseType: 'releaseType',
  salesType: 'salesType',
  quantity: 'quantity',
  clientPaymentCurrency: 'clientPaymentCurrency',
  unitPrice: 'unitPrice',
  mechanicalFee: 'mechanicalFee',
  grossRevenue: 'grossRevenue',
  clientShareRate: 'clientShareRate',
  netRevenue: 'netRevenue',
  cmg_clientRate: 'cmg_clientRate',
  cmg_netRevenue: 'cmg_netRevenue',
  baseReportId: 'baseReportId',
  userReportId: 'userReportId',
  importedReportId: 'importedReportId'
};

exports.Prisma.UnlinkedReportScalarFieldEnum = {
  id: 'id',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  distributor: 'distributor',
  reportingMonth: 'reportingMonth',
  labelName: 'labelName',
  count: 'count'
};

exports.Prisma.UnlinkedReportDetailScalarFieldEnum = {
  id: 'id',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  unlinkedReportId: 'unlinkedReportId',
  data: 'data'
};

exports.Prisma.FailedReportDetailScalarFieldEnum = {
  id: 'id',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  distributor: 'distributor',
  reportingMonth: 'reportingMonth',
  failedReason: 'failedReason',
  data: 'data'
};

exports.Prisma.RefreshTokenScalarFieldEnum = {
  id: 'id',
  token: 'token',
  userId: 'userId',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  isRevoked: 'isRevoked'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.Role = exports.$Enums.Role = {
  ADMIN: 'ADMIN',
  ADMIN_CONTENT: 'ADMIN_CONTENT',
  ADMIN_LEGAL: 'ADMIN_LEGAL',
  ADMIN_MANAGER: 'ADMIN_MANAGER',
  USER: 'USER'
};

exports.CommsChannels = exports.$Enums.CommsChannels = {
  MOBILE: 'MOBILE',
  PHONE: 'PHONE',
  SKYPE: 'SKYPE',
  X_TWITTER: 'X_TWITTER',
  FACEBOOK: 'FACEBOOK',
  INSTAGRAM: 'INSTAGRAM',
  TIKTOK: 'TIKTOK',
  TWITCH: 'TWITCH',
  VK: 'VK'
};

exports.ClientType = exports.$Enums.ClientType = {
  PERSON: 'PERSON',
  BUSINESS: 'BUSINESS'
};

exports.TaxIdType = exports.$Enums.TaxIdType = {
  COMPANY_NUMBER: 'COMPANY_NUMBER',
  NATIONAL_ID: 'NATIONAL_ID',
  PASSPORT: 'PASSPORT',
  RESIDENT_PERMIT: 'RESIDENT_PERMIT',
  ID_CARD: 'ID_CARD',
  DRIVERS_LICENSE: 'DRIVERS_LICENSE'
};

exports.AccessTypeDMB = exports.$Enums.AccessTypeDMB = {
  STANDARD: 'STANDARD',
  ADVANCED: 'ADVANCED'
};

exports.DMBStatus = exports.$Enums.DMBStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  PENDING: 'PENDING'
};

exports.PaymentMethod = exports.$Enums.PaymentMethod = {
  BANK_TRANSFER: 'BANK_TRANSFER',
  PAYPAL: 'PAYPAL',
  CRYPTO: 'CRYPTO'
};

exports.ContractType = exports.$Enums.ContractType = {
  DISTRIBUTION_NONEXCLUSIVE: 'DISTRIBUTION_NONEXCLUSIVE',
  DISTRIBUTION_EXCLUSIVE: 'DISTRIBUTION_EXCLUSIVE',
  LICENSING: 'LICENSING',
  PUBLISHING: 'PUBLISHING',
  MANAGEMENT: 'MANAGEMENT',
  PRODUCTION: 'PRODUCTION',
  PROMOTION: 'PROMOTION',
  OTHER: 'OTHER'
};

exports.ContractStatus = exports.$Enums.ContractStatus = {
  ACTIVE: 'ACTIVE',
  TERMINATED: 'TERMINATED',
  EXPIRED: 'EXPIRED',
  DRAFT: 'DRAFT'
};

exports.Currency = exports.$Enums.Currency = {
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP'
};

exports.TransactionType = exports.$Enums.TransactionType = {
  PAYMENT: 'PAYMENT',
  ROYALTIES: 'ROYALTIES',
  RECALLED_PAYMENT: 'RECALLED_PAYMENT',
  BOUNCEDBACK_PAYMENT: 'BOUNCEDBACK_PAYMENT',
  OTHER: 'OTHER'
};

exports.Distributor = exports.$Enums.Distributor = {
  BELIEVE: 'BELIEVE',
  KONTOR: 'KONTOR'
};

exports.LabelStatus = exports.$Enums.LabelStatus = {
  ACTIVE: 'ACTIVE',
  DISABLED: 'DISABLED'
};

exports.LabelRegistrationStatus = exports.$Enums.LabelRegistrationStatus = {
  NO_REGISTRATION: 'NO_REGISTRATION',
  PENDING: 'PENDING',
  REJECTED: 'REJECTED',
  ACTIVE: 'ACTIVE'
};

exports.DebitState = exports.$Enums.DebitState = {
  PAID: 'PAID',
  UNPAID: 'UNPAID',
  OPEN: 'OPEN'
};

exports.Prisma.ModelName = {
  InitializationStatus: 'InitializationStatus',
  S3File: 'S3File',
  Log: 'Log',
  User: 'User',
  PasswordResetToken: 'PasswordResetToken',
  UserPreferences: 'UserPreferences',
  UserComms: 'UserComms',
  Client: 'Client',
  ClientDMB: 'ClientDMB',
  ClientPaymentInformation: 'ClientPaymentInformation',
  Contract: 'Contract',
  Balance: 'Balance',
  Transaction: 'Transaction',
  Address: 'Address',
  Country: 'Country',
  Label: 'Label',
  ImportedRoyaltyReport: 'ImportedRoyaltyReport',
  BaseRoyaltyReport: 'BaseRoyaltyReport',
  UserRoyaltyReport: 'UserRoyaltyReport',
  KontorRoyaltyReport: 'KontorRoyaltyReport',
  BelieveRoyaltyReport: 'BelieveRoyaltyReport',
  UnlinkedReport: 'UnlinkedReport',
  UnlinkedReportDetail: 'UnlinkedReportDetail',
  FailedReportDetail: 'FailedReportDetail',
  RefreshToken: 'RefreshToken'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }

        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
