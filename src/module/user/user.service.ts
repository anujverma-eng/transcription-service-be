import { InjectModel } from "@nestjs/mongoose";
import { User } from "./user.entity";
import { Model, Types } from "mongoose";
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
      // If user exists with Google account (has googleId but no password)
      if (existingUser.googleId && !existingUser.password) {
        // Update the existing Google user with password
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        existingUser.password = hashedPassword;
        return existingUser.save();
      }

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

  async updateLastLogin(userId: Types.ObjectId | string) {
    const userIdObject = new Types.ObjectId(userId);
    await this.userModel.findByIdAndUpdate(userIdObject, {
      $set: { lastLogin: new Date() },
    });
  }

  async updatePassword(user: User, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.password = passwordHash;
    await user.save();
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.userModel.findOne({ googleId }).exec();
  }

  async createGoogleUser(googleId: string, email: string, name?: string) {
    const user = new this.userModel({
      email,
      googleId,
      name: name || "",
      password: "",
    });
    return user.save();
  }
}
