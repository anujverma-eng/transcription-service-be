import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AppConfigModule } from "./common/config/config.module";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./module/auth/auth.module";

@Module({
  imports: [
    AppConfigModule, //Global Config,
    DatabaseModule, //Database Module,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
