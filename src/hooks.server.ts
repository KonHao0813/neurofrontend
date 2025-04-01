import type { Handle } from '@sveltejs/kit';
import { socketConnected } from '$lib/stores';

// 基本伺服器端 Socket.IO 握手處理
export const handle: Handle = async ({ event, resolve }) => {
  // 如果是 Socket.IO 連接請求
  if (event.url.pathname.startsWith('/socket.io')) {
    console.log('Socket.IO 握手請求');
    
    // 這裡可以添加認證邏輯
    const session = event.cookies.get('session');
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  // 處理常規請求
  const response = await resolve(event);

  // 實時更新連接狀態 (SSE 範例)
  if (event.url.pathname === '/api/connection-status') {
    const stream = new ReadableStream({
      start(controller) {
        const unsubscribe = socketConnected.subscribe(connected => {
          controller.enqueue(`data: ${JSON.stringify({ connected })}\n\n`);
        });

        return () => unsubscribe();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  }

  return response;
};

// 可選：處理 WebSocket 升級
export const handleUpgrade: Handle = async ({ event }) => {
  if (event.url.pathname.startsWith('/socket.io')) {
    console.log('WebSocket 升級請求');
    // 添加自訂升級邏輯
  }
};