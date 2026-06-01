import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Next.js 15 要求 params 是异步
export async function GET(request: Request, context: any) {
  try {
    const params = await context.params;
    const uploadDir = process.env.LOCAL_STORAGE_DIR || "./uploads";
    const filePath = path.join(uploadDir, params.path);
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "文件不存在" }, { status: 404 });
    }
    
    const fileBuffer = fs.readFileSync(filePath);
    const contentType = "video/mp4";
    
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${params.path}"`,
      },
    });
  } catch (error) {
    console.error("文件读取错误:", error);
    return NextResponse.json({ error: "文件读取失败" }, { status: 500 });
  }
}
