import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AppConfigModule } from "./common/config/config.module";
import { DatabaseModule } from "./database/database.module";

@Module({
  imports: [
    AppConfigModule, //Global Config,
    DatabaseModule, //Database Module
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
