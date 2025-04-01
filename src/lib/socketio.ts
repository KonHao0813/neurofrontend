import { writable } from 'svelte/store';
import { io, type Socket } from 'socket.io-client';
import { toast } from 'svelte-sonner';

// ====================== 型別宣告 ======================
interface SocketEvents {
  // 基礎事件
  "error": (data: string) => void;
  "connect": () => void;
  "disconnect": (reason: string) => void;
  "connect_error": (err: Error) => void;

  // 中文支持事件
  "chinese_text": (data: { text: string }) => void;
  "chinese_response": (data: { text: string }) => void;
  "vtuber_action": (action: string) => void;
  "action_feedback": (data: { action: string; status: string }) => void;

  // 原始事件（完全保留）
  "current_message": (message: string) => void;
  "reset_next_message": () => void;
  "next_chunk": (message: string) => void;
  "AI_thinking": (message: boolean) => void;
  "AI_speaking": (message: boolean) => void;
  "human_speaking": (message: boolean) => void;
  "patience_update": (message: { crr_time: number; total_time: number }) => void;
  "recent_twitch_messages": (message: string[]) => void;
  "twitch_status": (message: boolean) => void;
  "LLM_status": (message: boolean) => void;
  "TTS_status": (message: boolean) => void;
  "STT_status": (message: boolean) => void;
  "movement_status": (message: boolean) => void;
  "multimodal_status": (message: boolean) => void;
  "audio_list": (message: string[]) => void;
  "full_prompt": (message: string) => void;
  "get_custom_prompt": (message: { prompt: string; priority: number }) => void;
  "get_memories": (data: any[]) => void;
  "get_blacklist": (data: string[]) => void;
  "get_hotkeys": (data: any[]) => void;
}

// ====================== Socket 初始化 ======================
export const socket: Socket<SocketEvents> = io("http://localhost:8080", {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ["websocket"],
  autoConnect: true
});

// ====================== 錯誤處理 ======================
socket.on("error", (data) => {
  toast.error(`Socket錯誤: ${data}`);
});

socket.on("connect_error", (err) => {
  console.error("連接失敗:", err.message);
  toast.error(`連接失敗: ${err.message}`);
});

socket.on("disconnect", (reason) => {
  console.warn("連接斷開:", reason);
  if (reason === "io server disconnect") {
    toast.warning("伺服器主動斷開連接");
  }
});

// ====================== 中文消息支援 ======================
export const chineseMessage = writable("");
export const chineseResponse = writable("");

socket.on("chinese_response", (data) => {
  chineseResponse.set(data.text);
  console.log("AI回復:", data.text);
});

// ====================== VTuber 控制支援 ======================
export const vtuberStatus = writable<{
  blink: boolean;
  nod: boolean;
  shake_head: boolean;
  [key: string]: boolean;
}>({
  blink: false,
  nod: false,
  shake_head: false
});

socket.on("action_feedback", (data) => {
  vtuberStatus.update(status => ({
    ...status,
    [data.action]: data.status === "executed"
  }));
  console.log(`動作 ${data.action} 執行狀態: ${data.status}`);
});

// ====================== 原始狀態管理（完全保留） ======================

// 當前消息部分
export const currentMessage = writable("");
socket.on("current_message", (message) => {
  currentMessage.set(message);
});

// 下一個消息部分
export const nextMessage = writable("");
socket.on("reset_next_message", () => {
  nextMessage.set("");
});
socket.on("next_chunk", (message) => {
  nextMessage.update(n => n + message);
});

// 信號部分
export const AI_thinking = writable(false);
socket.on("AI_thinking", (message) => {
  AI_thinking.set(message);
});

export const AI_speaking = writable(false);
socket.on("AI_speaking", (message) => {
  AI_speaking.set(message);
});

export const human_speaking = writable(false);
socket.on("human_speaking", (message) => {
  human_speaking.set(message);
});

export const patiencePercent = writable(0);
export const total_time = writable(0);
socket.on("patience_update", (message) => {
  patiencePercent.set((message.crr_time / message.total_time) * 100);
  total_time.set(message.total_time);
});

// Twitch 聊天部分
export const twitchChat = writable("");
export const twitchChatEnabled = writable(true);
socket.on("recent_twitch_messages", (message) => {
  twitchChat.set(message.join("\n"));
});
socket.on("twitch_status", (message) => {
  twitchChatEnabled.set(message);
});

// 控制部分
export const LLMEnabled = writable(true);
export const TTSEnabled = writable(true);
export const STTEnabled = writable(true);
export const movementEnabled = writable(true);
export const multimodalEnabled = writable(true);
socket.on("LLM_status", (message) => {
  LLMEnabled.set(message);
});
socket.on("TTS_status", (message) => {
  TTSEnabled.set(message);
});
socket.on("STT_status", (message) => {
  STTEnabled.set(message);
});
socket.on("movement_status", (message) => {
  movementEnabled.set(message);
});
socket.on("multimodal_status", (message) => {
  multimodalEnabled.set(message);
});

// 音訊部分
export const selectedAudio = writable<any>(null);
export const songs = writable([{ value: "", label: "Loading..." }]);
socket.on("audio_list", (message) => {
  const songList = message.map((song: string) => ({
    value: song,
    label: song
  }));
  songs.set(songList);
});

// Lobotomy 部分
export const lobotomy = writable("");
socket.on("full_prompt", (message) => {
  lobotomy.set(message);
});

// 自訂提示部分
export const priority = writable(200);
export const customPrompt = writable("");
socket.on("get_custom_prompt", (message) => {
  customPrompt.set(message.prompt);
  priority.set(message.priority);
});

// 記憶部分
export const memories = writable<any[]>([]);
export const searchQuery = writable("");
socket.on("get_memories", (data) => {
  memories.set(data);
});

// 審核部分
export const blacklist = writable("");
socket.on("get_blacklist", (data) => {
  blacklist.set(data.join("\n"));
});

// VTuber 控制部分
export const hotkeys = writable<any[]>([]);
socket.on("get_hotkeys", (data) => {
  hotkeys.set(data);
});

// ====================== 工具函數 ======================
export const sendChineseText = (text: string) => {
  if (text.trim()) {
    socket.emit("chinese_text", { text });
    chineseMessage.set(text);
    console.log("已發送中文消息:", text);
  }
};

export const triggerVtuberAction = (action: string) => {
  const actionMap: Record<string, string> = {
    "眨眼": "blink",
    "點頭": "nod",
    "搖頭": "shake_head"
  };
  
  const command = actionMap[action] || action;
  socket.emit("vtuber_action", command);
  console.log("已觸發VTuber動作:", command);
};

// ====================== 連接管理 ======================
export const manualConnect = () => {
  if (socket.disconnected) {
    socket.connect();
    toast.info("正在手動連接Socket...");
  }
};

export const manualDisconnect = () => {
  if (socket.connected) {
    socket.disconnect();
    toast.warning("已手動斷開Socket連接");
  }
};

// 開發調試用：將socket實例掛載到window
if (import.meta.env.DEV) {
  (window as any).socket = socket;
}
