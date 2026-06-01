import { NextResponse } from "next/server";
import { writeFile, mkdir, existsSync } from "fs";
import { join } from "path";
import { promisify } from "util";
import { uploadToR2 } from "@/lib/r2";

const writeFileAsync = promisify(writeFile);
const mkdirAsync = promisify(mkdir);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "没有上传文件" }, { status: 400 });
    }

    const uploadedUrls: string[] = [];
    
    // 检查是否配置了 R2
    const useR2 = process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY;
    
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // 生成唯一文件名
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.name}`;
      
      if (useR2) {
        // 上传到 R2
        const url = await uploadToR2(fileName, buffer, file.type || "video/mp4");
        uploadedUrls.push(url);
        console.log("已上传到 R2:", url);
      } else {
        // 本地存储（开发模式）
        const uploadDir = join(process.cwd(), "uploads");
        if (!existsSync(uploadDir)) {
          await mkdirAsync(uploadDir, { recursive: true });
        }
        
        const filePath = join(uploadDir, fileName);
        await writeFileAsync(filePath, buffer);
        uploadedUrls.push(`/api/uploads/${fileName}`);
        console.log("已保存到本地:", filePath);
      }
    }
    
    return NextResponse.json({ urls: uploadedUrls });
  } catch (error: any) {
    console.error("上传错误:", error);
    return NextResponse.json(
      { error: error?.message || "上传失败" }, 
      { status: 500 }
    );
  }
}
