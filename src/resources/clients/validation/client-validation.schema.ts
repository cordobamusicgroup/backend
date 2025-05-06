import { z } from 'zod';
import { isEmpty } from 'lodash';
import {
  ClientType,
  TaxIdType,
  ContractStatus,
  ContractType,
  AccessTypeDMB,
  DMBStatus,
} from 'generated/client';

const AddressSchema = z.object({
  street: z.string(),
  street2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  countryId: z.number(),
  zip: z.string(),
});

const DmbSchema = z.object({
  accessType: z.nativeEnum(AccessTypeDMB),
  status: z.nativeEnum(DMBStatus),
  subclientName: z.string().optional(),
  username: z.string().optional(),
});

const ContractSchema = z
  .object({
    type: z.nativeEnum(ContractType),
    ppd: z.number().optional(),
    status: z.nativeEnum(ContractStatus),
    docUrl: z.string().optional(),
    startDate: z.string(),
    endDate: z.string().optional(),
    signedAt: z.string().optional(),
    signedBy: z.string().optional(),
  })
  .superRefine((contract, ctx) => {
    // signed = status !== 'DRAFT'
    const signed = contract.status !== 'DRAFT';

    if (signed) {
      if (!contract.signedAt || isNaN(Date.parse(contract.signedAt))) {
        ctx.addIssue({
          path: ['signedAt'],
          code: z.ZodIssueCode.custom,
          message:
            'Signed at is required and must be a valid date if contract is signed',
        });
      }
      if (!contract.signedBy || contract.signedBy.trim() === '') {
        ctx.addIssue({
          path: ['signedBy'],
          code: z.ZodIssueCode.custom,
          message: 'Signed by is required if contract is signed',
        });
      }
    } else {
      // If not signed (DRAFT), signedAt and signedBy must NOT be present
      if (contract.signedAt) {
        ctx.addIssue({
          path: ['signedAt'],
          code: z.ZodIssueCode.custom,
          message:
            'signedAt must not be sent if contract is not signed (DRAFT)',
        });
      }
      if (contract.signedBy) {
        ctx.addIssue({
          path: ['signedBy'],
          code: z.ZodIssueCode.custom,
          message:
            'signedBy must not be sent if contract is not signed (DRAFT)',
        });
      }
    }
  });

export const ClientValidationSchema = z
  .object({
    clientName: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    type: z.nativeEnum(ClientType),
    taxIdType: z.nativeEnum(TaxIdType),
    taxId: z.string(),
    vatRegistered: z.boolean(),
    vatId: z.string().optional(),
    generalContactId: z.number().optional(),
    address: AddressSchema,
    dmb: DmbSchema,
    contract: ContractSchema,
  })
  .superRefine((data, ctx) => {
    // VAT ID required if vatRegistered is true
    if (data.vatRegistered && isEmpty(data.vatId)) {
      ctx.addIssue({
        path: ['vatId'],
        code: z.ZodIssueCode.custom,
        message: 'VAT ID is required if the client is VAT registered',
      });
    }

    // Contract date validations
    const { contract } = data;
    const isActive = contract.status === 'ACTIVE';
    const isTerminated = contract.status === 'TERMINATED';

    // startDate required and valid if ACTIVE or TERMINATED
    if (
      (isActive || isTerminated) &&
      (!contract.startDate || isNaN(Date.parse(contract.startDate)))
    ) {
      ctx.addIssue({
        path: ['contract', 'startDate'],
        code: z.ZodIssueCode.custom,
        message:
          'Start date is required and must be valid if contract is active or terminated',
      });
    }

    // endDate valid and after startDate if present
    if (contract.endDate) {
      if (isNaN(Date.parse(contract.endDate))) {
        ctx.addIssue({
          path: ['contract', 'endDate'],
          code: z.ZodIssueCode.custom,
          message: 'End date must be a valid date',
        });
      } else if (!contract.startDate || isNaN(Date.parse(contract.startDate))) {
        ctx.addIssue({
          path: ['contract', 'endDate'],
          code: z.ZodIssueCode.custom,
          message: 'Valid start date is required to validate end date',
        });
      } else if (new Date(contract.endDate) <= new Date(contract.startDate)) {
        ctx.addIssue({
          path: ['contract', 'endDate'],
          code: z.ZodIssueCode.custom,
          message: 'End date must be after start date',
        });
      }
    }

    // If contract is signed, signedAt and signedBy required
    // (Ya no se valida aquí porque signed se calcula en backend)

    // If contract is ACTIVE, ppd is required
    if (isActive && (contract.ppd === undefined || contract.ppd === null)) {
      ctx.addIssue({
        path: ['contract', 'ppd'],
        code: z.ZodIssueCode.custom,
        message: 'PPD is required for active contracts',
      });
    }
  });
