import { PrismaService } from 'src/resources/prisma/prisma.service';

/**
 * Helper method to get the country name from its ID.
 *
 * @param prisma - The PrismaService instance
 * @param countryId - The ID of the country
 * @returns The country name or 'Unknown' if not found
 */
export const getCountryName = async (
  prisma: PrismaService,
  countryId: number,
): Promise<string> => {
  const country = await prisma.country.findUnique({
    where: { id: countryId },
  });
  return country ? country.name : 'Unknown';
};
