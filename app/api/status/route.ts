import { NextResponse } from "next/server";
import { getJobStatus } from "@/lib/shotstack";
import { getD1, getTask, updateTaskStatus } from "@/lib/d1";
import { mockTasks } from "@/lib/mock-data";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");
    
    if (!taskId) {
      return NextResponse.json({ error: "缺少任务ID" }, { status: 400 });
    }

    // 检查是否是模拟任务
    if (taskId.startsWith("mock-")) {
      const mockTask = mockTasks.get(taskId);
      if (mockTask) {
        console.log("返回模拟任务状态:", mockTask);
        return NextResponse.json({
          status: mockTask.status,
          url: mockTask.url
        });
      }
    }
    
    const shotstackStatus = await getJobStatus(taskId);
    
    try {
      const db = getD1();
      const dbTask = await getTask(db, taskId);
      
      if (dbTask && shotstackStatus.status !== dbTask.status) {
        await updateTaskStatus(db, taskId, shotstackStatus.status, shotstackStatus.url);
      }
    } catch (dbError) {
      console.warn("D1 数据库不可用，跳过状态更新:", dbError);
    }
    
    return NextResponse.json(shotstackStatus);
  } catch (error: any) {
    console.error("状态查询错误:", error);
    return NextResponse.json(
      { error: error?.message || "查询失败" }, 
      { status: 500 }
    );
  }
}
