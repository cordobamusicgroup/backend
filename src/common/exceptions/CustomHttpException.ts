import { HttpException, HttpStatus } from '@nestjs/common';

export class CustomHttpException extends HttpException {
  constructor(
    public readonly code: number,
    message: string,
    statusCode: HttpStatus,
  ) {
    super({ code, message }, statusCode);
  }
}

export class UserNotFoundException extends CustomHttpException {
  constructor() {
    super(1001, 'User not found', HttpStatus.NOT_FOUND);
  }
}

export class InvalidCredentialsException extends CustomHttpException {
  constructor() {
    super(1002, 'Invalid credentials', HttpStatus.UNAUTHORIZED);
  }
}

export class ConflictRecordsException extends CustomHttpException {
  constructor() {
    super(
      1003,
      "Unable to delete the record, it's still needed by other records.",
      HttpStatus.CONFLICT,
    );
  }
}
