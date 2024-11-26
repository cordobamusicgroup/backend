import {
  ClientType,
  ContractStatus,
  ContractType,
  DMBStatus,
} from '@prisma/client';

export function mapClientCsvToIntermediate(row: any) {
  return {
    clientData: {
      wp_id: parseInt(row['ID']),
      clientName: row['Username'],
      firstName: row['First Name'],
      lastName: row['Last Name'],
      type: ClientType.PERSON,
      taxIdType: row['user_kyc_type'],
      taxId: row['user_kyc_idnumber'],
      isBlocked: row['is_blocked'] === 'TRUE',
    },
    contractData: {
      contractType: ContractType.DISTRIBUTION_NONEXCLUSIVE,
      status: ContractStatus.DRAFT,
      ppd: parseFloat(row['distribution_fee']),
    },
    dmbData: {
      accessType: row['permission_level'],
      status: DMBStatus.PENDING,
    },
    addressData: {
      street: row['user_address'],
      city: row['user_city'],
      state: row['user_state'],
      zip: row['user_zip'],
      countryName: row['user_country'],
    },
  };
}
