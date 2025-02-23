import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { TranscriptionStatus } from "src/common/utils/enum/util.enum";

export class CreateTranscriptionJobDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  audioFileKey: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  durationInSeconds: number;

  @IsOptional()
  @IsEnum(TranscriptionStatus)
  status?: TranscriptionStatus;

  @IsOptional()
  @IsString()
  transcriptionText?: string;

  @IsOptional()
  @IsInt()
  usageMinutes?: number;

  @IsOptional()
  @IsString()
  error?: string;

  @IsOptional()
  @IsString()
  durationText?: string;
}

export class PresignRequestDto {
  @IsString()
  @IsNotEmpty()
  fileName: string; // e.g. "audio.mp3"

  @IsNumber()
  @IsNotEmpty()
  @Min(60, {
    message: "Duration must be at least 1 minute",
  })
  duration: number; // in seconds

  @IsString()
  @IsNotEmpty()
  mimeType: string; // e.g. "audio/mpeg"
}

export class QueueJobDto {
  @IsString()
  @IsNotEmpty()
  audioFileKey: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(60, {
    message: "Duration must be at least 1 minute",
  })
  duration: number; // in seconds
}

// A simple mapping for demonstration purposes.
const mimeToExtension: { [mime: string]: string } = {
  "audio/mpeg": ".mp3",
  "audio/wav": ".wav",
  "audio/ogg": ".ogg",
  // add more mappings as needed...
};

export function getS3Key(
  userId: string,
  fileName: string,
  mimeType: string,
): string {
  // Check if the fileName already has an extension.
  if (fileName.includes(".")) {
    return fileName;
  }
  // If not, look up the extension based on the MIME type.
  const extension = mimeToExtension[mimeType];
  return `${userId}/audios/${Date.now()}-${fileName}${extension}`;
}
