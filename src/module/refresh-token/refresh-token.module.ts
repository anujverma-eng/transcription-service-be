import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { RefreshToken, RefreshTokenSchema } from "./refresh-token.entity";
import { RefreshTokenService } from "./refresh-token.service";
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: RefreshToken.name,
        schema: RefreshTokenSchema,
      },
    ]),
  ],
  providers: [RefreshTokenService],
  exports: [RefreshTokenService],
})
export class RefreshTokenModule {}
