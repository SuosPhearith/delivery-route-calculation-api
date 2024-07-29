import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsEnumOrNull(
  enumObj: object,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isEnumOrNull',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return value === null || Object.values(enumObj).includes(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid enum value or null`;
        },
      },
    });
  };
}
