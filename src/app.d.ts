// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
	  // interface Error {}
	  // interface Locals {}
	  // interface PageData {}
	  // interface PageState {}
	  // interface Platform {}
  
	  // 擴展全域 Socket.IO 事件類型
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
		"abort_current_message": () => void;
		"cancel_next_message": () => void;
		"enable_twitch": () => void;
		"disable_twitch": () => void;
		"enable_LLM": () => void;
		"disable_LLM": () => void;
		"enable_TTS": () => void;
		"disable_TTS": () => void;
		"enable_STT": () => void;
		"disable_STT": () => void;
		"enable_movement": () => void;
		"disable_movement": () => void;
		"enable_multimodal": () => void;
		"disable_multimodal": () => void;
		"play_audio": (file: string) => void;
		"pause_audio": () => void;
		"resume_audio": () => void;
		"abort_audio": () => void;
		"fun_fact": () => void;
		"new_topic": (topic: string) => void;
	  }
  
	  // 擴展 Window 介面用於開發調試
	  interface Window {
		socket?: import('socket.io-client').Socket<SocketEvents>;
	  }
	}
  
	// 聲明全域 Socket.IO 用戶端類型
	type SocketIOClient = import('socket.io-client').Socket<App.SocketEvents>;
  }
  
  export {};
  