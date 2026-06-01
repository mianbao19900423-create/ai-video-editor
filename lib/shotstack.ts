
import axios from "axios";

const SHOTSTACK_API_KEY = process.env.SHOTSTACK_API_KEY || "";
const SHOTSTACK_API_URL = process.env.SHOTSTACK_API_URL || "https://api.shotstack.io/v1/render";

export async function createEditJob(videoUrls: string[]): Promise<string> {
  const isDemoMode = SHOTSTACK_API_KEY === "demo-sandbox-key";
  
  if (isDemoMode) {
    console.log("使用模拟模式，不调用真实 API");
    const mockTaskId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return mockTaskId;
  }

  const clips = videoUrls.map((url, index) => ({
    asset: {
      type: "video",
      src: url,
    },
    start: index * 4,
    length: 4,
    transition: index > 0 ? {
      in: "fade",
    } : undefined,
  }));

  const timeline = {
    background: "#000000",
    tracks: [
      {
        clips,
      },
    ],
  };

  const output = {
    format: "mp4",
    resolution: "sd",
    quality: "standard",
  };

  console.log("发送到 Shotstack 的数据:", JSON.stringify({ timeline, output }, null, 2));

  try {
    const response = await axios.post(
      SHOTSTACK_API_URL,
      { timeline, output },
      {
        headers: {
          "x-api-key": SHOTSTACK_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Shotstack 响应:", JSON.stringify(response.data, null, 2));

    if (response.data?.response?.id) {
      return response.data.response.id;
    }

    throw new Error("Shotstack 未返回任务ID");
  } catch (error: any) {
    if (error.response) {
      console.error("Shotstack API 错误状态:", error.response.status);
      console.error("Shotstack API 错误数据:", JSON.stringify(error.response.data, null, 2));
      
      const errorMessage = error.response.data?.response?.message || 
                          error.response.data?.message || 
                          `Shotstack API 返回错误 ${error.response.status}`;
      throw new Error(errorMessage);
    }
    throw error;
  }
}

export async function getJobStatus(taskId: string): Promise<{
  status: string;
  url?: string;
}> {
  if (taskId.startsWith("mock-")) {
    const mockTasks = require("./mock-data").mockTasks;
    const mockTask = mockTasks.get(taskId);
    
    if (mockTask) {
      return {
        status: mockTask.status,
        url: mockTask.url,
      };
    }
    
    return { status: "queued" };
  }

  const statusUrl = `https://api.shotstack.io/v1/render/${taskId}`;

  const response = await axios.get(statusUrl, {
    headers: {
      "x-api-key": SHOTSTACK_API_KEY,
    },
  });

  const status = response.data.response.status;
  const url = response.data.response.url;

  return { status, url };
}
