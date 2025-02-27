// src/modules/plan/plan.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  Query,
  UseGuards,
} from "@nestjs/common";
import { PlanService } from "./plan.service";
import { CreatePlanDto, UpdatePlanDto } from "./plan.dto";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { RolesDecorator } from "src/common/decorators/role.decorator";
import { RoleGuard } from "src/common/guards/role.guard";
import { UserRole } from "src/common/utils/enum/util.enum";
import { NotificationService } from "../notifications/notification.service";
import {
  NotificationType,
  SendNotificationDto,
} from "../notifications/notification.dto";

/**
 * Admin-only endpoints for plan management
 */
@Controller("api/v1/admin/plans")
@UseGuards(JwtAuthGuard, RoleGuard)
@RolesDecorator(UserRole.ADMIN)
export class PlanController {
  constructor(
    private readonly planService: PlanService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Create a new plan
   */
  @Post()
  async create(@Body() dto: CreatePlanDto) {
    return this.planService.createPlan(dto);
  }

  /**
   * Get all plans, optionally including inactive
   */
  @Get()
  async findAll(@Query("includeInactive") includeInactive?: string) {
    const inc = includeInactive === "true";
    return this.planService.findAllPlans(inc);
  }

  /**
   * Get details of a single plan
   */
  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.planService.findPlanById(id);
  }

  /**
   * Update partial fields of a plan
   */
  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdatePlanDto) {
    return this.planService.updatePlan(id, dto);
  }

  /**
   * Soft-delete a plan => isActive=false
   */
  @Delete(":id")
  async softDelete(@Param("id") id: string) {
    return this.planService.softDeletePlan(id);
  }

  /**
   * List users who have this plan
   */
  // @Get(":id/users")
  // async getUsersForPlan(@Param("id") id: string) {
  //   return this.planService.getUsersForPlan(id);
  // }

  @Post("send-notification")
  async sendNotification(@Body() dto: SendNotificationDto) {
    await this.notificationService.sendEmail({
      type: NotificationType.TRANSCRIPTION_COMPLETED,
      to: dto.email,
      subject: "Your transcription is done!",
      fileName: dto.fileName,
      downloadUrl: dto.downloadUrl,
      // jobId: dto.jobId,
    });
  }
}
