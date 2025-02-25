import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TranscriptionErrorService } from "./transcription-error.service";
import {
  TranscriptionError,
  TranscriptionErrorSchema,
} from "./transcription-error.entity";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TranscriptionError.name, schema: TranscriptionErrorSchema },
    ]),
  ],
  providers: [TranscriptionErrorService],
  exports: [TranscriptionErrorService], // Export the service if needed in other modules
})
export class TranscriptionErrorModule {}
