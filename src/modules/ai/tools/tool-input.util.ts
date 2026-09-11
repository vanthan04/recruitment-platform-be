import { BadRequestException } from '@nestjs/common';

/**
 * Tool arguments come from the LLM's JSON generation, not a validated DTO —
 * malformed/missing fields are a routine, expected failure mode (not a bug)
 * and must fail loudly here rather than propagate a `TypeError` several
 * layers down. Thrown as a plain NestJS exception (not a DomainException):
 * this is a malformed *tool call*, not a business-rule violation, and
 * AiToolExecutor catches it to build the tool_result the model sees.
 */
export function requireString(
  input: Record<string, unknown>,
  key: string,
): string {
  const value = input[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestException(
      `Tool argument "${key}" must be a non-empty string`,
    );
  }
  return value;
}

export function optionalStringArray(
  input: Record<string, unknown>,
  key: string,
): string[] {
  const value = input[key];
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || !value.every((v) => typeof v === 'string')) {
    throw new BadRequestException(
      `Tool argument "${key}" must be an array of strings`,
    );
  }
  return value;
}

export function optionalNumber(
  input: Record<string, unknown>,
  key: string,
): number | undefined {
  const value = input[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new BadRequestException(`Tool argument "${key}" must be a number`);
  }
  return value;
}
