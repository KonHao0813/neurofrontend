import { writable } from 'svelte/store';
import type { Socket } from 'socket.io-client';

// 全局 Socket 實例狀態
export const socketConnected = writable<boolean>(false);
export const socketError = writable<string | null>(null);

// 中文聊天記錄 (格式範例)
export interface ChineseMessage {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export const chineseMessages = writable<ChineseMessage[]>([]);

// VTuber 動作狀態
export const vtuberActions = writable<{
  blink: boolean;
  nod: boolean;
  shakeHead: boolean;
}>({
  blink: false,
  nod: false,
  shakeHead: false
});

// 音頻播放狀態
export const audioState = writable<{
  isPlaying: boolean;
  currentTrack: string | null;
}>({
  isPlaying: false,
  currentTrack: null
});

// 與 socketio.ts 的整合
export function bindSocketEvents(socket: Socket) {
  socket.on('connect', () => {
    socketConnected.set(true);
    socketError.set(null);
  });

  socket.on('disconnect', () => {
    socketConnected.set(false);
  });

  socket.on('connect_error', (err) => {
    socketError.set(err.message);
  });

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

  socket.on('action_feedback', (data) => {
    vtuberActions.update(actions => ({
      ...actions,
      [data.action]: data.status === 'executed'
    }));
  });
}