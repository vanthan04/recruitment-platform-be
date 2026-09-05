import { registerDecorator, ValidationOptions } from 'class-validator';

export const PASSWORD_MIN_LENGTH = 8;

// Not a full zxcvbn-style strength meter — just a floor that rejects the
// weakest common passwords (all-digit PINs, a single bare dictionary word)
// without demanding special characters most users find obnoxious.
const PASSWORD_STRENGTH_REGEX = /^(?=.*[A-Za-z])(?=.*\d).+$/;

/** Requires at least one letter and one digit. Pair with @MinLength(PASSWORD_MIN_LENGTH). */
export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return (
            typeof value === 'string' && PASSWORD_STRENGTH_REGEX.test(value)
          );
        },
        defaultMessage(): string {
          return 'Password must contain at least one letter and one number';
        },
      },
    });
  };
}
