"use client";

import { useState } from "react";

export default function Home() {
  const [urls, setUrls] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  const addUrl = () => {
    console.log("添加 URL:", urlInput);
    
    if (urlInput.trim() === "") {
      alert("请输入视频链接！");
      return;
    }
    
    if (!urlInput.startsWith("http")) {
      alert("链接必须以 http:// 或 https:// 开头！");
      return;
    }
    
    setUrls((prev) => [...prev, urlInput.trim()]);
    setUrlInput("");
  };

  const removeUrl = (index: number) => {
    setUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setUrls([]);
    setProcessing(false);
    setProgress(0);
    setStatus("");
    setError("");
    setVideoUrl("");
    setDebugLogs([]);
  };

  const addSampleUrls = () => {
    setUrls([
      "https://shotstack-assets.s3-ap-southeast-2.amazonaws.com/footage/1.mp4",
      "https://shotstack-assets.s3-ap-southeast-2.amazonaws.com/footage/2.mp4",
    ]);
  };

  const startProcessing = async (useDemo = false) => {
    try {
      setProcessing(true);
      setProgress(0);
      setStatus("");
      setError("");
      setVideoUrl("");
      setDebugLogs([]);

      let videoUrlsToProcess: string[];

      if (useDemo) {
        addDebugLog("使用演示视频模式（不实际上传文件）");
        videoUrlsToProcess = [
          "https://shotstack-assets.s3-ap-southeast-2.amazonaws.com/footage/1.mp4",
          "https://shotstack-assets.s3-ap-southeast-2.amazonaws.com/footage/2.mp4",
        ];
      } else {
        if (urls.length === 0) {
          setError("请至少添加一个视频 URL");
          setProcessing(false);
          return;
        }
        videoUrlsToProcess = urls;
      }

      addDebugLog("开始调用 Shotstack API 处理视频...");
      addDebugLog(`视频数量: ${videoUrlsToProcess.length}`);
      setProgress(30);
      setStatus("创建编辑任务...");

      const processResponse = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: videoUrlsToProcess, demo: useDemo }),
      });

      if (!processResponse.ok) {
        const err = await processResponse.json();
        throw new Error(err.error || "处理失败");
      }

      const { taskId, mock } = await processResponse.json();
      addDebugLog(`任务创建成功，Task ID: ${taskId}`);
      if (mock) addDebugLog("使用模拟模式");

      setProgress(50);
      setStatus("处理中...");

      let attempts = 0;
      const maxAttempts = 60;

      while (attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, 2000));
        attempts++;

        addDebugLog(`查询任务状态 (${attempts}/${maxAttempts}): ${taskId}`);
        const statusResponse = await fetch(`/api/status?taskId=${taskId}`);

        if (!statusResponse.ok) {
          throw new Error("状态查询失败");
        }

        const statusData = await statusResponse.json();
        addDebugLog(`状态: ${statusData.status}`);

        if (statusData.status === "done" || statusData.status === "completed") {
          setProgress(100);
          setStatus("完成！");
          setVideoUrl(statusData.url);
          addDebugLog("视频生成成功！");
          break;
        } else if (statusData.status === "failed") {
          throw new Error("视频处理失败");
        } else if (statusData.status === "queued") {
          setProgress(30);
          setStatus("排队中...");
        } else if (statusData.status === "processing") {
          setProgress(30 + Math.min(attempts * 1, 60));
          setStatus("渲染中...");
        }
      }

      if (attempts >= maxAttempts) {
        throw new Error("处理超时，请稍后重试");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "处理失败");
      addDebugLog(`错误: ${err?.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-500 to-cyan-400 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            AI 自动视频剪辑工具
          </h1>
          <p className="text-white/80 text-lg">
            添加视频 URL，AI 自动剪辑拼接，一键导出
          </p>
        </div>

        {error && (
          <div className="bg-red-500/90 text-white p-6 rounded-2xl mb-6 shadow-xl">
            <h3 className="font-bold text-lg mb-2">❌ 错误</h3>
            <p>{error}</p>
          </div>
        )}

        {debugLogs.length > 0 && (
          <div className="bg-gray-800/90 text-green-400 p-6 rounded-2xl mb-6 shadow-xl">
            <h3 className="font-bold text-lg mb-3">🔍 调试信息</h3>
            <div className="font-mono text-sm space-y-1 max-h-40 overflow-y-auto">
              {debugLogs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-8">
          {videoUrl ? (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                ✅ 剪辑完成！
              </h2>
              <div className="aspect-video bg-black rounded-2xl overflow-hidden mb-6">
                <video src={videoUrl} controls className="w-full h-full" />
              </div>
              <div className="flex gap-4 justify-center">
                <a
                  href={videoUrl}
                  download
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-xl transition-all transform hover:scale-105"
                >
                  📥 下载视频
                </a>
                <button
                  onClick={clearAll}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-xl transition-all"
                >
                  🔄 重新开始
                </button>
              </div>
            </div>
          ) : processing ? (
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-800">{status}</h2>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-gray-500 mt-3">{progress}%</p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                添加视频 URL
              </h2>

              <div className="mb-6">
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addUrl();
                      }
                    }}
                    placeholder="粘贴视频链接 (https://...)"
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                  />
                  <button
                    onClick={() => {
                      console.log("点击添加按钮");
                      addUrl();
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-all"
                  >
                    添加
                  </button>
                </div>
              </div>

              {urls.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-3">
                    已添加 {urls.length} 个视频：
                  </h3>
                  <div className="space-y-2">
                    {urls.map((url, index) => (
                      <div
                        key={index}
                        className="bg-gray-100 p-4 rounded-xl flex items-center justify-between"
                      >
                        <span className="text-gray-700 text-sm truncate flex-1 mr-4">
                          {url}
                        </span>
                        <button
                          onClick={() => removeUrl(index)}
                          className="text-red-500 hover:text-red-600 font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => startProcessing(false)}
                  disabled={urls.length === 0}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                >
                  🎬 开始 AI 剪辑
                </button>
                <button
                  onClick={() => startProcessing(true)}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105"
                >
                  🎭 演示模式
                </button>
              </div>

              <div className="mt-6 flex gap-4">
                <button
                  onClick={addSampleUrls}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition-all"
                >
                  ➕ 添加示例视频
                </button>
                <button
                  onClick={clearAll}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition-all"
                >
                  🗑️ 清空
                </button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                <h4 className="font-semibold text-blue-800 mb-2">
                  💡 你可以使用的测试视频：
                </h4>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>
                    <strong>示例1：</strong>
                    https://shotstack-assets.s3-ap-southeast-2.amazonaws.com/footage/1.mp4
                  </li>
                  <li>
                    <strong>示例2：</strong>
                    https://shotstack-assets.s3-ap-southeast-2.amazonaws.com/footage/2.mp4
                  </li>
                  <li>
                    <strong>示例3：</strong>
                    https://www.w3schools.com/html/mov_bbb.mp4
                  </li>
                </ul>
                <p className="text-blue-600 text-xs mt-2">
                  提示：点击添加示例视频按钮可以快速添加两个测试视频
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
