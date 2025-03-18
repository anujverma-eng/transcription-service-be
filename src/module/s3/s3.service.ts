import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly logger = new Logger(S3Service.name);

  constructor(private readonly configService: ConfigService) {
    this.bucketName =
      this.configService.get<string>("S3_BUCKET_NAME") || "default-bucket-name";

    this.s3Client = new S3Client({
      region: this.configService.get<string>("AWS_REGION"),
      credentials: {
        accessKeyId: this.configService.get<string>("AWS_ACCESS_KEY_ID"),
        secretAccessKey: this.configService.get<string>(
          "AWS_SECRET_ACCESS_KEY",
        ),
      },
    });
  }

  async getPresignedPutUrl(key: string, contentType: string) {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
      });

      return await getSignedUrl(this.s3Client, command, {
        expiresIn: 60 * 60 * 12, // 12 hours
      });
    } catch (error) {
      this.logger.error("Error generating presigned put url", error);
      throw new InternalServerErrorException("Could not generate put url");
    }
  }

  async getPresignedGetUrl(key: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: 60 * 60 * 12, // 12 hours
      });
      return url;
    } catch (error) {
      this.logger.error("Error generating presigned get url", error);
      throw new InternalServerErrorException("Could not generate get url");
    }
  }
}
