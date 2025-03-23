import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ContactUs } from "./contact-us.entity";
import { Model } from "mongoose";
import { CreateContactUsDto } from "./contact-us.dto";

@Injectable()
export class ContactUsService {
  constructor(
    @InjectModel(ContactUs.name) private contactUsModel: Model<ContactUs>,
  ) {}

  async createContactUs(dto: CreateContactUsDto): Promise<ContactUs> {
    const contactUs = new this.contactUsModel(dto);
    return contactUs.save();
  }
}
