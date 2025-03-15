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
  fileName: string;

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

  @IsString()
  @IsNotEmpty()
  sourceLanguage: string;

  @IsString()
  @IsNotEmpty()
  transcriptLanguage: string;
}

export class PresignRequestDto {
  @IsString()
  @IsNotEmpty()
  fileName: string; // e.g. "audio.mp3"

  @IsNumber()
  @IsNotEmpty()
  @Min(30, {
    message: "Duration must be at least 30 seconds",
  })
  duration: number; // in seconds

  @IsString()
  @IsNotEmpty()
  mimeType: string; // e.g. "audio/mpeg"
}

export class QueueJobDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  audioFileKey: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(30, {
    message: "Duration must be at least 30 seconds",
  })
  duration: number; // in seconds

  @IsString()
  @IsNotEmpty()
  sourceLanguage: string;

  @IsString()
  @IsNotEmpty()
  transcriptLanguage: string;
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
    return `${userId}/audios/${Date.now()}-${fileName}`;
  }
  // If not, look up the extension based on the MIME type.
  const extension = mimeToExtension[mimeType];
  return `${userId}/audios/${Date.now()}-${fileName}${extension}`;
}

export class SearchWithPaginationDto {
  @IsString()
  @IsNotEmpty()
  page: number;

  @IsString()
  @IsNotEmpty()
  limit: number;

  @IsOptional()
  @IsString()
  query?: string;
}

export interface UsageStats {
  date: string;
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  minutesDeducted: number;
  minutesRefunded: number;
}
