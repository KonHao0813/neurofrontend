<script lang="ts">
	import * as Avatar from "$lib/components/ui/avatar";
	import { ModeWatcher, toggleMode } from "mode-watcher";
	import "../app.pcss";
	import { Button } from "$lib/components/ui/button";
	import { Sun, Moon } from "lucide-svelte";
	import { Toaster } from "$lib/components/ui/sonner";
	import { onMount } from 'svelte';
	import { socket } from "$lib/socketio";
	import { bindSocketEvents, socketConnected, socketError } from '$lib/stores';

	// 連接狀態派生
	$: isConnected = $socketConnected;
	$: connectionStatus = isConnected ? "Connected" : "Disconnected";
	$: statusColor = isConnected ? "bg-green-500" : "bg-red-500";
	$: statusText = isConnected ? "連線中" : "已斷線";

	// 錯誤訊息監聽
	$: {
		if ($socketError) {
			console.error("Socket錯誤:", $socketError);
			// 這裡可以添加Toast通知
		}
	}

	onMount(() => {
		// 綁定所有Socket事件到stores
		bindSocketEvents(socket);

		// 自動連接（如果尚未連接）
		if (!socket.connected) {
			socket.connect();
		}

		return () => {
			// 清理時只移除全局監聽，保持Socket連接
			socket.off('connect');
			socket.off('disconnect');
			socket.off('connect_error');
		};
	});
</script>

<svelte:head>
	<title>Neuro 控制面板</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet">
	<meta name="description" content="Neuro VTuber 控制面板 - 中文版">
</svelte:head>

<Toaster richColors />
<ModeWatcher />

<div class="h-screen flex flex-col">
	<nav class="w-full p-5 justify-start items-start gap-[100px] inline-flex border-b">
		<div class="justify-start items-center gap-[25px] inline-flex grow">
			<h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight xl:text-5xl">
				Neuro 控制面板
			</h1>
			<div class="p-2.5 justify-start items-center gap-1 inline-flex">
				<Button variant="link" href="/" class="leading-7 [&.active]:font-bold">
					主控台
				</Button>
				<Button variant="link" href="/lobotomy" class="leading-7 [&.active]:font-bold">
					提示詞
				</Button>
				<Button variant="link" href="/moderation" class="leading-7 [&.active]:font-bold">
					過濾設定
				</Button>
				<Button variant="link" href="/memory" class="leading-7 [&.active]:font-bold">
					記憶庫
				</Button>
				<Button variant="link" href="/vtube" class="leading-7 [&.active]:font-bold">
					VTuber控制
				</Button>
				<Button variant="link" href="/zh-chat" class="leading-7 [&.active]:font-bold">
					中文聊天
				</Button>
			</div>
		</div>
		<div class="h-full flex justify-end items-center gap-4">
			<div class="flex items-center gap-2">
				<span class={`h-3 w-3 rounded-full ${statusColor}`} title={connectionStatus}></span>
				<span class="text-sm text-muted-foreground">{statusText}</span>
			</div>

			<div class="text-lg font-semibold">使用者: Admin</div>

			<Avatar.Root class="cursor-pointer">
				<Avatar.Image 
					src="https://www.kimjammer.com/icons/Logo.svg" 
					alt="使用者頭像"
					class="hover:opacity-80 transition-opacity"
				/>
				<Avatar.Fallback>Admin</Avatar.Fallback>
			</Avatar.Root>

			<Button 
				on:click={toggleMode} 
				variant="ghost" 
				size="icon"
				class="hover:bg-accent"
				title="切換主題"
			>
				<Sun class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"/>
				<Moon class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"/>
				<span class="sr-only">切換主題</span>
			</Button>
		</div>
	</nav>

	<main class="flex-1 overflow-auto p-4 bg-background text-foreground">
		<slot />
	</main>

	<footer class="p-2 text-center text-sm text-muted-foreground border-t">
		Neuro VTuber 控制系統 © {new Date().getFullYear()}
	</footer>
</div>

<style>
	:global(:root) {
		--radius: 0.5rem;
	}

	[data-theme='dark'] {
		--background: 222.2 84% 4.9%;
		--foreground: 210 40% 98%;
	}

	nav {
		background-color: hsl(var(--background));
		border-color: hsl(var(--border));
	}

	main {
		background-color: hsl(var(--background));
		color: hsl(var(--foreground));
	}
</style>