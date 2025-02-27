// src/modules/feedback/feedback.controller.ts

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { RolesDecorator } from "src/common/decorators/role.decorator";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { RoleGuard } from "src/common/guards/role.guard";
import { UserRole } from "src/common/utils/enum/util.enum";
import {
  AdminSelectFeedbackDto,
  CreateFeedbackDto,
  UpdateFeedbackDto,
} from "./feedback.dto";
import { FeedbackService } from "./feedback.service";
import { AuthRequest } from "../auth/auth.interface";

@Controller("api/v1/feedback")
export class FeedbackController {
  constructor(private feedbackService: FeedbackService) {}

  /**
   * USER ROUTES
   * User can post one feedback
   */

  @RolesDecorator(UserRole.USER)
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Post()
  async createMyFeedback(
    @Req() req: AuthRequest,
    @Body() dto: CreateFeedbackDto,
  ) {
    const userId = req.user._id as string;
    return this.feedbackService.createFeedback(userId, dto);
  }

  @RolesDecorator(UserRole.USER)
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Get("me")
  async getMyFeedback(@Req() req: AuthRequest) {
    const userId = req.user._id as string;
    return this.feedbackService.getMyFeedback(userId);
  }

  @RolesDecorator(UserRole.USER)
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Patch("me")
  async updateMyFeedback(
    @Req() req: AuthRequest,
    @Body() dto: UpdateFeedbackDto,
  ) {
    const userId = req.user._id as string;
    return this.feedbackService.updateMyFeedback(userId, dto);
  }

  @RolesDecorator(UserRole.USER)
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Delete("me")
  async deleteMyFeedback(@Req() req: AuthRequest) {
    const userId = req.user._id as string;
    return this.feedbackService.deleteMyFeedback(userId);
  }

  /**
   * ADMIN ROUTES
   * Admin can select/deselect feedback to show on the frontend
   */

  @RolesDecorator(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Patch(":id/select")
  async adminSelectFeedback(
    @Param("id") feedbackId: string,
    @Body() body: AdminSelectFeedbackDto,
  ) {
    return this.feedbackService.adminSelectFeedback(
      feedbackId,
      body.adminSelected,
    );
  }

  /**
   * PUBLIC ROUTE
   * get up to 15 admin selected feedback
   */
  @Get("public")
  async getPublicFeedback() {
    return this.feedbackService.getSelectedFeedback();
  }
}
