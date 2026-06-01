import { NextResponse } from "next/server";
import { createEditJob } from "@/lib/shotstack";
import { getD1, createTask } from "@/lib/d1";
import { mockTasks } from "@/lib/mock-data";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { urls } = body;
    
    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json({ error: "缺少视频URL" }, { status: 400 });
    }

    // 检查是否使用模拟模式
    const useMockMode = process.env.SHOTSTACK_API_KEY === "demo-sandbox-key";
    
    if (useMockMode || urls.includes("demo")) {
      console.log("使用模拟模式");
      
      // 生成模拟任务ID
      const taskId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // 存储模拟任务状态
      mockTasks.set(taskId, {
        status: "queued",
        createdAt: Date.now()
      });
      
      // 模拟状态更新
      setTimeout(() => {
        mockTasks.set(taskId, { status: "processing", createdAt: Date.now() });
      }, 1000);
      
      setTimeout(() => {
        mockTasks.set(taskId, { 
          status: "done", 
          url: "https://shotstack-assets.s3-ap-southeast-2.amazonaws.com/demos/hello-world.mp4",
          createdAt: Date.now() 
        });
      }, 5000);
      
      return NextResponse.json({ taskId, mock: true });
    }

    // 真实API模式
    console.log("使用真实 Shotstack API");
    const taskId = await createEditJob(urls);
    
    try {
      const db = getD1();
      await createTask(db, taskId, urls);
    } catch (dbError) {
      console.warn("D1 数据库不可用，跳过任务存储:", dbError);
    }
    
    return NextResponse.json({ taskId });
  } catch (error: any) {
    console.error("处理错误:", error);
    return NextResponse.json(
      { error: error?.message || "处理失败" }, 
      { status: 500 }
    );
  }
}
