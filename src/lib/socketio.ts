import { writable, type Writable } from 'svelte/store';
import { io, type Socket } from 'socket.io-client';
import { toast } from 'svelte-sonner';
import { browser } from '$app/environment';

// ====================== 型別宣告 ======================
interface SocketEvents {
  // 基礎事件
  'error': (data: string) => void;
  'connect': () => void;
  'disconnect': (reason: string) => void;
  'connect_error': (err: Error) => void;

  // 中文支持事件
  'chinese_text': (data: { text: string }) => void;
  'chinese_response': (data: { text: string }) => void;
  'vtuber_action': (action: string) => void;
  'action_feedback': (data: { action: string; status: 'executed' | 'failed' }) => void;

  // 系統狀態事件
  'current_message': (message: string) => void;
  'next_chunk': (message: string) => void;
  'AI_thinking': (state: boolean) => void;
  'AI_speaking': (state: boolean) => void;
  // ...其他事件類型...
}

// ====================== Store 類型 ======================
interface VtuberStatus {
  blink: boolean;
  nod: boolean;
  shake_head: boolean;
  [key: string]: boolean;
}

interface AudioItem {
  value: string;
  label: string;
}

// ====================== Socket 初始化 ======================
const SOCKET_URL = browser 
  ? import.meta.env.VITE_SOCKET_URL || 'http://localhost:8080'
  : '';

export const socket: Socket<SocketEvents> = io(SOCKET_URL, {
  reconnection: true,
  reconnectionAttempts: Infinity, // 無限重試
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  randomizationFactor: 0.5,
  timeout: 20000,
  transports: ['websocket'],
  autoConnect: browser, // 僅在流覽器環境自動連接
  withCredentials: true,
  extraHeaders: {
    'X-Client-Type': 'neurofrontend'
  }
});

// ====================== 狀態存儲 ======================
export const socketConnected = writable(false);
export const socketError = writable<string | null>(null);

// 中文聊天
export const chineseMessages = writable<Array<{
  text: string;
  isUser: boolean;
  timestamp: Date;
}>>([]);

// VTuber 控制
export const vtuberStatus: Writable<VtuberStatus> = writable({
  blink: false,
  nod: false,
  shake_head: false
});

// 系統狀態
export const currentMessage = writable('');
export const nextMessage = writable('');
export const AI_thinking = writable(false);
export const AI_speaking = writable(false);
export const human_speaking = writable(false);
export const patiencePercent = writable(0);
export const total_time = writable(0);

// 模組開關
export const LLMEnabled = writable(true);
export const TTSEnabled = writable(true);
export const STTEnabled = writable(true);
export const movementEnabled = writable(true);
export const multimodalEnabled = writable(true);
export const twitchChatEnabled = writable(false);

// 音訊控制
export const selectedAudio: Writable<string | null> = writable(null);
export const songs: Writable<AudioItem[]> = writable([]);
export const twitchChat = writable('');

// ====================== 事件綁定 ======================
const bindSocketEvents = () => {
  // 連接狀態
  socket.on('connect', () => {
    socketConnected.set(true);
    socketError.set(null);
    toast.success('已連接到伺服器');
  });

  socket.on('disconnect', (reason) => {
    socketConnected.set(false);
    console.warn('連接斷開:', reason);
    
    if (reason === 'io server disconnect') {
      toast.warning('伺服器主動斷開連接');
    }
  });

  socket.on('connect_error', (err) => {
    socketError.set(err.message);
    toast.error(`連接錯誤: ${err.message}`);
  });

  // 中文消息處理
  socket.on('chinese_response', (data) => {
    chineseMessages.update(messages => [
      ...messages,
      {
        text: data.text,
        isUser: false,
        timestamp: new Date()
      }
    ]);
  });

  // VTuber 動作回饋
  socket.on('action_feedback', (data) => {
    vtuberStatus.update(status => ({
      ...status,
      [data.action]: data.status === 'executed'
    }));
    
    if (data.status === 'failed') {
      toast.error(`動作執行失敗: ${data.action}`);
    }
  });

  // 系統狀態更新
  socket.on('current_message', (msg) => currentMessage.set(msg));
  socket.on('next_chunk', (chunk) => nextMessage.update(prev => prev + chunk));
  socket.on('AI_thinking', (state) => AI_thinking.set(state));
  socket.on('AI_speaking', (state) => AI_speaking.set(state));
  socket.on('human_speaking', (state) => human_speaking.set(state));
  
  socket.on('patience_update', ({ crr_time, total_time: total }) => {
    patiencePercent.set((crr_time / total) * 100);
    total_time.set(total);
  });

  // 模組狀態同步
  socket.on('LLM_status', (state) => LLMEnabled.set(state));
  socket.on('TTS_status', (state) => TTSEnabled.set(state));
  socket.on('STT_status', (state) => STTEnabled.set(state));
  socket.on('movement_status', (state) => movementEnabled.set(state));
  socket.on('multimodal_status', (state) => multimodalEnabled.set(state));
  socket.on('twitch_status', (state) => twitchChatEnabled.set(state));

  // 音訊列表更新
  socket.on('audio_list', (files) => {
    songs.set(files.map(file => ({
      value: file,
      label: file.replace(/\.[^/.]+$/, '') // 移除文件副檔名
    })));
  });

  // Twitch 消息處理
  socket.on('recent_twitch_messages', (messages) => {
    twitchChat.set(messages.join('\n'));
  });
};

// ====================== 工具函數 ======================
export const sendChineseText = (text: string) => {
  if (!text.trim()) return;
  
  socket.emit('chinese_text', { text });
  chineseMessages.update(messages => [
    ...messages,
    {
      text,
      isUser: true,
      timestamp: new Date()
    }
  ]);
};

export const triggerVtuberAction = (action: string) => {
  const actionMap: Record<string, string> = {
    '眨眼': 'blink',
    '點頭': 'nod',
    '搖頭': 'shake_head'
  };
  
  const command = actionMap[action] || action;
  socket.emit('vtuber_action', command);
};

export const toggleModule = (module: string, enabled: boolean) => {
  const moduleMap: Record<string, string> = {
    'LLM': '語言模型',
    'TTS': '語音合成',
    'STT': '語音辨識',
    'movement': '動作捕捉',
    'multimodal': '多模態輸入',
    'twitch': 'Twitch 聊天'
  };
  
  socket.emit(`${enabled ? 'enable' : 'disable'}_${module.toLowerCase()}`);
  toast.success(`${moduleMap[module]} ${enabled ? '已啟用' : '已禁用'}`);
};

// ====================== 生命週期管理 ======================
if (browser) {
  bindSocketEvents();
  
  // 開發調試用
  if (import.meta.env.DEV) {
    (window as any).socket = socket;
  }
}

// ====================== 連接控制 ======================
export const reconnectSocket = () => {
  if (socket.disconnected) {
    socket.connect();
  } else {
    socket.disconnect().connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
