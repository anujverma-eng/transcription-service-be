import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ContactUs, ContactUsSchema } from "./contact-us.entity";
import { ContactUsController } from "./contact-us.controller";
import { ContactUsService } from "./contact-us.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ContactUs.name, schema: ContactUsSchema },
    ]),
  ],
  controllers: [ContactUsController],
  providers: [ContactUsService],
})
export class ContactUsModule {}
