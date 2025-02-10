// src/imports/imports.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'fast-csv';
import { PrismaService } from '../prisma/prisma.service';
import { mapClientCsvToIntermediate } from './utils/client-csv-mapper.util';
import { mapLabelCsvToIntermediate } from './utils/label-csv-mapper.util';
import { mapClientBalanceCsvToTransaction } from './utils/client-balance-csv-mapper.util';
import { TransactionType } from '@prisma/client';
import Decimal from 'decimal.js';

@Injectable()
export class ImportsService {
  private readonly logger = new Logger(ImportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async importClientsFromCsv(filePath: string) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }
    const errorLogPath = path.join(
      path.dirname(filePath),
      `error_log_client_${Date.now()}.txt`,
    );
    const records = await this.readCsvFile(
      filePath,
      mapClientCsvToIntermediate,
    );
    if (records.length === 0) {
      throw new Error(`No records to process in CSV file.`);
    }
    this.logger.log(`Total records loaded: ${records.length}.`);
    for (const [i, record] of records.entries()) {
      const { clientData, contractData, dmbData, addressData } = record;
      try {
        const country = await this.prisma.country.findFirst({
          where: { name: addressData.countryName },
        });
        if (!country) {
          throw new Error(`Country not found: ${addressData.countryName}`);
        }
        delete addressData.countryName;
        await this.prisma.client.create({
          data: {
            ...clientData,
            address: {
              create: {
                ...addressData,
                country: { connect: { id: country.id } },
              },
            },
            contract: { create: { ...contractData } },
            dmb: { create: { ...dmbData } },
          },
        });
      } catch (error) {
        this.logger.error(`Row ${i + 1}: ${error.message}`);
      }
    }
    this.cleanUp(filePath, errorLogPath);
    return { message: 'Client CSV processed successfully.' };
  }

  async importLabelsFromCsv(filePath: string) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }
    const errorLogPath = path.join(
      path.dirname(filePath),
      `error_log_label_${Date.now()}.txt`,
    );
    const records = await this.readCsvFile(filePath, mapLabelCsvToIntermediate);
    if (records.length === 0) {
      throw new Error(`No records to process in CSV file.`);
    }
    this.logger.log(`Total records loaded: ${records.length}.`);
    for (const [i, record] of records.entries()) {
      const { labelData, wp_id } = record;
      try {
        const client = await this.prisma.client.findUnique({
          where: { wp_id: wp_id },
        });
        this.logger.log(
          `wp_id: ${wp_id}, client: ${client ? client.id : 'No encontrado'}`,
        );
        if (!client) {
          throw new Error(`Cliente con wp_id ${wp_id} no encontrado.`);
        }
        const existingLabel = await this.prisma.label.findUnique({
          where: { name: labelData.name },
        });
        if (!existingLabel) {
          await this.prisma.label.create({
            data: { ...labelData, clientId: client.id },
          });
        } else {
          throw new Error(`Label "${labelData.name}" already exists`);
        }
      } catch (error) {
        this.logger.error(`Row ${i + 1}: ${error.message}`);
      }
    }
    this.cleanUp(filePath, errorLogPath);
    return { message: 'Label CSV processed successfully.' };
  }

  async importClientBalanceFromCsv(tempFilePath: string) {
    return new Promise<{ message: string }>((resolve, reject) => {
      const results: any[] = [];
      fs.createReadStream(tempFilePath)
        .pipe(parse({ headers: true, ignoreEmpty: true, delimiter: ',' }))
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          for (const row of results) {
            let mapped;
            try {
              mapped = mapClientBalanceCsvToTransaction(row);
            } catch (error) {
              this.logger.error(`Error mapping row: ${error.message}`);
              continue;
            }
            const { wp_id, transactionData, isDisabled } = mapped;
            const client = await this.prisma.client.findUnique({
              where: { wp_id },
            });
            if (!client) continue;
            if (isDisabled) {
              await this.prisma.client.update({
                where: { id: client.id },
                data: { isBlocked: true },
              });
              this.logger.warn(`Client with wp_id ${wp_id} is now blocked.`);
              continue;
            }
            let balance = await this.prisma.balance.findFirst({
              where: { clientId: client.id, currency: 'USD' },
            });
            if (!balance) {
              balance = await this.prisma.balance.create({
                data: {
                  clientId: client.id,
                  currency: 'USD',
                  amount: new Decimal(0),
                  amountRetain: new Decimal(0),
                },
              });
            }
            const newAmount = balance.amount.add(transactionData.amount);
            await this.prisma.transaction.create({
              data: {
                type: TransactionType.OTHER,
                description: transactionData.description,
                amount: transactionData.amount,
                balanceAmount: newAmount,
                balance: { connect: { id: balance.id } },
              },
            });
            await this.prisma.balance.update({
              where: { id: balance.id },
              data: { amount: newAmount },
            });
          }
          resolve({ message: 'Client balances imported successfully.' });
        })
        .on('error', (err) => reject(err));
    });
  }

  private async readCsvFile<T>(
    filePath: string,
    mapFn: (row: any) => T,
  ): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const records: T[] = [];
      fs.createReadStream(filePath)
        .pipe(parse({ headers: true, ignoreEmpty: true, delimiter: ',' }))
        .on('data', (row) => records.push(mapFn(row)))
        .on('end', () => resolve(records))
        .on('error', (error) => reject(error));
    });
  }

  private cleanUp(filePath: string, errorLogPath: string) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    this.logger.log(`Temporary file ${filePath} deleted successfully.`);
    if (fs.existsSync(errorLogPath)) {
      this.logger.log(`Error log saved at ${errorLogPath}`);
    }
  }
}
