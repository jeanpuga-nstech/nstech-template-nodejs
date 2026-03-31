import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { EnvService } from "@/config/env/env.service";

@Injectable()
export class BucketService implements OnModuleInit {
  public bucketName!: string;
  private client!: S3Client;
  private expiresIn!: number;

  constructor(private readonly envService: EnvService) {}

  onModuleInit() {
    this.client = new S3Client({
      region: "us-east-1",
    });

    this.bucketName = this.envService.get("AWS_BUCKET_NAME");
    this.expiresIn = 60 * 15; // 15 minutos
  }

  async generateUploadUrl(folder: string, fileName: string, mimetype: string) {
    const ext = extname(fileName).toLowerCase();
    const directory = this.getFileDirectory(mimetype);

    const key = `${directory}/${folder}/${randomUUID()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: mimetype,
    });

    const presignedUrl = await getSignedUrl(this.client, command, {
      expiresIn: this.expiresIn,
    });

    return {
      url: presignedUrl,
      key,
      expiresIn: this.expiresIn,
    };
  }

  async deleteObjects(keys: string[]) {
    if (keys.length === 0) {
      return;
    }

    const formattedKeys = keys.map((key) => ({ Key: key }));

    const command = new DeleteObjectsCommand({
      Bucket: this.bucketName,
      Delete: {
        Objects: formattedKeys,
      },
    });

    await this.client.send(command);
  }

  async get(key: string) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const url = await getSignedUrl(this.client, command, { expiresIn: this.expiresIn });

    return url;
  }

  defineType(mimetype: string): "photo" | "video" | "file" {
    if (mimetype.includes("image")) {
      return "photo";
    }

    if (mimetype.includes("video")) {
      return "video";
    }

    return "file";
  }

  private getFileDirectory(mimetype: string): "images" | "videos" | "archives" {
    if (mimetype.includes("image")) {
      return "images";
    }

    if (mimetype.includes("video")) {
      return "videos";
    }

    return "archives";
  }
}
