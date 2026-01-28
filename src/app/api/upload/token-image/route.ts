import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from '@/storage/s3';

// 支持的图片类型
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    // 验证文件
    if (!file) {
      return NextResponse.json(
        { success: false, error: '未选择文件' },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `不支持的文件类型。仅支持: ${ALLOWED_TYPES.join(', ')}`
        },
        { status: 400 }
      );
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `文件过大。最大支持 ${MAX_FILE_SIZE / 1024 / 1024}MB`
        },
        { status: 400 }
      );
    }

    // 转换文件为 Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 检查环境变量
    const endpointUrl = process.env.COZE_BUCKET_ENDPOINT_URL;
    const bucketName = process.env.COZE_BUCKET_NAME;
    const accessKey = process.env.AWS_ACCESS_KEY_ID;
    const secretKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!endpointUrl || !bucketName || !accessKey || !secretKey) {
      console.error('Missing S3 environment variables:', {
        hasEndpoint: !!endpointUrl,
        hasBucket: !!bucketName,
        hasAccessKey: !!accessKey,
        hasSecretKey: !!secretKey,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'S3 配置不完整，请联系管理员配置存储服务'
        },
        { status: 500 }
      );
    }

    // 初始化 S3Storage
    const storage = new S3Storage({
      endpointUrl,
      accessKey,
      secretKey,
      bucketName,
      region: 'cn-beijing',
    });

    // 上传文件
    const timestamp = Date.now();
    const key = await storage.uploadFile({
      fileContent: buffer,
      fileName: `token-images/${timestamp}-${file.name}`,
      contentType: file.type,
    });

    // 生成访问 URL
    const imageUrl = await storage.generatePresignedUrl({
      key,
      expireTime: 86400 * 30, // 30 天有效期
    });

    return NextResponse.json({
      success: true,
      data: {
        key,
        imageUrl,
        fileName: file.name,
        size: file.size,
        type: file.type
      }
    });

  } catch (error) {
    console.error('Token image upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '图片上传失败'
      },
      { status: 500 }
    );
  }
}
