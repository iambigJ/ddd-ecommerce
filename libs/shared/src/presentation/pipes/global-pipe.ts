import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { CError } from '../../kernel/errors/c-error';

const formatValidationErrors = (errors: ValidationError[]): string[] => {
  const result: string[] = [];

  errors.forEach((error) => {
    if (error.constraints) {
      Object.values(error.constraints).forEach((message) =>
        result.push(String(message)),
      );
    }

    if (error.children && error.children.length) {
      result.push(...formatValidationErrors(error.children));
    }
  });

  return [...result];
};

export function globalPipeRules() {
  return new ValidationPipe({
    whitelist: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
    forbidNonWhitelisted: true,

    exceptionFactory: (errors: ValidationError[]) => {
      const formattedErrors = formatValidationErrors(errors);

      return new CError({
        message: formattedErrors.toString(),
        status: HttpStatus.BAD_REQUEST,
      });
    },
  });
}
