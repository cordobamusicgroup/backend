import { plainToInstance } from 'class-transformer';

/**
 * Utility method to convert an entity to a DTO.
 * Uses the plainToInstance method from class-transformer to perform the conversion.
 *
 * @param entity - The entity to be converted
 * @param dto - The DTO class to convert to
 * @returns The converted DTO
 */
export async function convertToDto<T, K>(
  entity: T,
  dto: new () => K,
): Promise<K> {
  return plainToInstance(dto, entity, {
    excludeExtraneousValues: true,
    exposeUnsetFields: false,
  });
}
