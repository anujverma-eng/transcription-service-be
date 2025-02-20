import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { UserRole } from "src/common/utils/enum/util.enum";
import { ROLES_KEY } from "../decorators/role.decorator";

interface RequestUser {
  role: UserRole;
}

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles are required, allow access
    if (!requiredRoles) {
      return true;
    }

    // If roles are required, check if the user has one of them
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as RequestUser;
    if (!user) {
      throw new ForbiddenException("User role not found");
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(
        `User with role (${user.role}) is not authorized to access this resource`,
      );
    }

    return true;
  }
}
