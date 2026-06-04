import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserPayload {
  id: string;
  jti: string;
}

interface RequestWithCurrentUser {
  currentUser: CurrentUserPayload;
}

export const CurrentUserDec = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx.switchToHttp().getRequest<RequestWithCurrentUser>();
    return request.currentUser;
  },
);
