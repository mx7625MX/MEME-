import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface UploadFileOptions {
  fileContent: Buffer;
  fileName: string;
  contentType: string;
}

export interface GeneratePresignedUrlOptions {
  key: string;
  expireTime?: number;
}

export class S3Storage {
  private client: S3Client;
  private bucketName: string;

  constructor(config: {
    endpointUrl?: string;
    accessKey: string;
    secretKey: string;
    bucketName: string;
    region?: string;
  }) {
    const { endpointUrl, accessKey, secretKey, bucketName, region = 'cn-beijing' } = config;

    this.client = new S3Client({
      endpoint: endpointUrl || `https://s3.${region}.amazonaws.com`,
      region,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: !!endpointUrl, // 对于自定义端点，使用路径样式
    });

    this.bucketName = bucketName;
  }

  /**
   * 上传文件到 S3
   */
  async uploadFile(options: UploadFileOptions): Promise<string> {
    const { fileContent, fileName, contentType } = options;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      Body: fileContent,
      ContentType: contentType,
    });

    try {
      await this.client.send(command);
      return fileName;
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error(
        `S3 上传失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  /**
   * 生成预签名 URL
   */
  async generatePresignedUrl(
    options: GeneratePresignedUrlOptions
  ): Promise<string> {
    const { key, expireTime = 3600 } = options;

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      const url = await getSignedUrl(this.client, command, {
        expiresIn: expireTime,
      });

      return url;
    } catch (error) {
      console.error('Generate presigned URL error:', error);
      throw new Error(
        `生成预签名 URL 失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(key: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      await this.client.send(command);
    } catch (error) {
      console.error('S3 delete error:', error);
      throw new Error(
        `S3 删除失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }
}
