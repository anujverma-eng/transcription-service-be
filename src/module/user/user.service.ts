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
    return this.userModel.findOne({ email }).lean().exec();
  }

  async findById(id: string): Promise<User | null> {
    const userIdObject = new Types.ObjectId(id);
    return this.userModel.findById(userIdObject).lean().exec();
  }

  async updateLastLogin(userId: Types.ObjectId | string) {
    const userIdObject = new Types.ObjectId(userId);
    await this.userModel.findByIdAndUpdate(userIdObject, {
      $set: { lastLogin: new Date() },
    });
  }

  async updatePassword(user: User, newPassword: string) {
    try {
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await this.userModel.findByIdAndUpdate(user._id, {
        $set: { password: passwordHash },
      });
    } catch (error) {
      console.log(error);
      throw new BadRequestException("Error updating password");
    }
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.userModel.findOne({ googleId }).lean().exec();
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
