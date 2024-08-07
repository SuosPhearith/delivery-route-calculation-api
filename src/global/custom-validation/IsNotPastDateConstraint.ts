import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
class IsNotPastDateConstraint implements ValidatorConstraintInterface {
  validate(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time part for comparison
    return date >= today;
  }

  defaultMessage(): string {
    return 'Date must be today or in the future';
  }
}

export function IsNotPastDate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNotPastDateConstraint,
    });
  };
}
