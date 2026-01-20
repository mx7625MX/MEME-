import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';

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

    // 初始化 S3Storage
    const storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: '',
      secretKey: '',
      bucketName: process.env.COZE_BUCKET_NAME,
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
