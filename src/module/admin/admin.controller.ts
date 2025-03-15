import {
  Body,
  Controller,
  Get,
  Injectable,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { UserService } from "../user/user.service";
import { RolesDecorator } from "src/common/decorators/role.decorator";
import { UserRole } from "src/common/utils/enum/util.enum";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { RoleGuard } from "src/common/guards/role.guard";
import { SearchWithPaginationDto } from "../transcription-job/transcription-job.dto";
import { AdminSelectFeedbackDto } from "../feedback/feedback.dto";
import { FeedbackService } from "../feedback/feedback.service";

@Injectable()
@Controller("api/v1/admin")
export class AdminController {
  constructor(
    private readonly userService: UserService,
    private readonly feedbackService: FeedbackService,
  ) {}

  @RolesDecorator(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Get("/users/search")
  async getUsers(@Query() query: SearchWithPaginationDto) {
    return this.userService.getUsers(query);
  }

  @RolesDecorator(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Patch("/users/block/:id")
  async blockUser(@Param("id") userId: string) {
    return this.userService.blockUser(userId);
  }

  @RolesDecorator(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Get("/feedback/search")
  async getFeedbacks(@Query() query: SearchWithPaginationDto) {
    return await this.feedbackService.getFeedbacks(query);
  }

  @RolesDecorator(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Patch("/feedback/select/:id")
  async adminSelectFeedback(
    @Param("id") feedbackId: string,
    @Body() body: AdminSelectFeedbackDto,
  ) {
    return await this.feedbackService.adminSelectFeedback(
      feedbackId,
      body.adminSelected,
    );
  }
}
