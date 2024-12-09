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

export class UnlinkedReportsExistException extends CustomHttpException {
  constructor() {
    super(
      1004,
      'Unable to proceed, there are unlinked reports for the given period and distributor.',
      HttpStatus.CONFLICT,
    );
  }
}

export class BaseReportAlreadyExistsException extends CustomHttpException {
  constructor() {
    super(
      1005,
      'Base report already exists for the given distributor and reporting month.',
      HttpStatus.CONFLICT,
    );
  }
}

export class UserRoyaltyReportsAlreadyExistException extends CustomHttpException {
  constructor(baseReportId: number) {
    super(
      1006,
      `User royalty reports already exist for baseReportId: ${baseReportId}`,
      HttpStatus.CONFLICT,
    );
  }
}

export class NoReportsFoundException extends CustomHttpException {
  constructor() {
    super(
      1008,
      'No reports found for the given distributor and reporting month.',
      HttpStatus.NOT_FOUND,
    );
  }
}

export class BaseReportNotFoundException extends CustomHttpException {
  constructor() {
    super(
      1009,
      'Base report does not exist for the given distributor and reporting month.',
      HttpStatus.NOT_FOUND,
    );
  }
}

export class UserAlreadyExistsException extends CustomHttpException {
  constructor() {
    super(1010, 'User already exists', HttpStatus.CONFLICT);
  }
}

export class EmailAlreadyExistsException extends CustomHttpException {
  constructor() {
    super(1011, 'Email already exists', HttpStatus.CONFLICT);
  }
}

export class PasswordTooWeakException extends CustomHttpException {
  constructor() {
    super(1012, 'Password is too weak', HttpStatus.BAD_REQUEST);
  }
}

export class InvalidOrExpiredTokenException extends CustomHttpException {
  constructor() {
    super(1013, 'Invalid or expired token', HttpStatus.UNAUTHORIZED);
  }
}

export class RecordNotFoundException extends CustomHttpException {
  constructor(entity: string) {
    super(1014, `${entity} not found`, HttpStatus.NOT_FOUND);
  }
}

export class UnauthorizedException extends CustomHttpException {
  constructor() {
    super(1015, 'Unauthorized access', HttpStatus.UNAUTHORIZED);
  }
}

export class ValidationException extends CustomHttpException {
  constructor(message: string) {
    super(1016, message, HttpStatus.BAD_REQUEST);
  }
}
