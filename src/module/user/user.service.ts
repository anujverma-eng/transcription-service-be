import { InjectModel } from "@nestjs/mongoose";
import { User } from "./user.entity";
import { Model } from "mongoose";
import { CreateUserDto } from "./user.dto";
import { BadRequestException } from "@nestjs/common";
import * as bcrypt from "bcrypt";

export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email,
    });

    if (existingUser) {
      throw new BadRequestException("Email already in use.");
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.userModel.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async updateLastLogin(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, {
      $set: { lastLogin: new Date() },
    });
  }
}
