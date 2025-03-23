import { Body, Controller, Post } from "@nestjs/common";
import { ContactUsService } from "./contact-us.service";
import { ContactUs } from "./contact-us.entity";
import { CreateContactUsDto } from "./contact-us.dto";

@Controller("api/v1/contact-us")
export class ContactUsController {
  constructor(private readonly contactUsService: ContactUsService) {}

  @Post("/public/create")
  async createContactUs(@Body() dto: CreateContactUsDto): Promise<ContactUs> {
    return this.contactUsService.createContactUs(dto);
  }
}
