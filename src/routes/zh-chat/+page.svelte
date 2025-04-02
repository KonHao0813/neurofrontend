<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import { Textarea } from "$lib/components/ui/textarea";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Progress } from "$lib/components/ui/progress";
	import { Label } from "$lib/components/ui/label";
	import { Switch } from "$lib/components/ui/switch";
	import * as Select from "$lib/components/ui/select";
	import { toast } from "svelte-sonner";
	import { onMount } from 'svelte';
  
	import {
	  BrainCircuit,
	  Volume2,
	  Mic,
	  Move,
	  Play,
	  Send,
	  X,
	  Pause,
	  Eye,
	  Smile,
	  Meh,
	  Sparkles,
	  Twitch,
	  Image
	} from "lucide-svelte";
  
	import {
	  socket,
	  currentMessage,
	  nextMessage,
	  AI_thinking,
	  AI_speaking,
	  human_speaking,
	  patiencePercent,
	  total_time,
	  LLMEnabled,
	  TTSEnabled,
	  STTEnabled,
	  movementEnabled,
	  multimodalEnabled,
	  selectedAudio,
	  songs,
	  chineseMessages,
	  sendChineseText,
	  triggerVtuberAction,
	  vtuberStatus,
	  twitchChat,
	  twitchChatEnabled
	} from '$lib/stores';
  
	// 本地狀態
	let chineseInput = "";
	let audioFile = "";
	let topic = "";
	let isScrolling = false;
  
	// 發送中文消息
	const sendMessage = () => {
	  if (chineseInput.trim()) {
		sendChineseText(chineseInput);
		chineseMessages.update(messages => [
		  ...messages,
		  {
			text: chineseInput,
			isUser: true,
			timestamp: new Date()
		  }
		]);
		chineseInput = "";
		scrollToBottom();
	  }
	};
  
	// 自動滾動到底部
	const scrollToBottom = () => {
	  const container = document.querySelector('.message-container');
	  if (container && !isScrolling) {
		isScrolling = true;
		container.scrollTo({
		  top: container.scrollHeight,
		  behavior: 'smooth'
		});
		setTimeout(() => isScrolling = false, 500);
	  }
	};
  
	// 控制功能
	const toggleModule = (module: string, enabled: boolean) => {
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
  
	// 音訊控制
	const handleAudio = (action: string) => {
	  if (action === 'play' && !$selectedAudio) {
		toast.warning('請先選擇音訊檔');
		return;
	  }
	  socket.emit(`${action}_audio`, $selectedAudio);
	};
  
	// 初始化
	onMount(() => {
	  // 預設啟用必要模組
	  if (!$LLMEnabled) toggleModule('LLM', true);
	  if (!$TTSEnabled) toggleModule('TTS', true);
	});
  </script>
  
  <div class="w-full h-full flex flex-col p-4 gap-4 bg-background text-foreground">
	<!-- 主聊天區域 -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
	  <!-- 中文聊天框 -->
	  <Card.Root class="col-span-2">
		<Card.Header>
		  <Card.Title class="text-xl font-bold flex items-center gap-2">
			<span>中文對話介面</span>
			{#if !$socketConnected}
			  <span class="text-sm text-red-500">(離線中)</span>
			{/if}
		  </Card.Title>
		  <Card.Description>與AI進行即時中文交流</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
		  <div class="message-container border rounded-lg p-3 h-64 overflow-y-auto bg-muted/10">
			{#each $chineseMessages as msg (msg.timestamp)}
			  <div class:user-message={msg.isUser} class:ai-message={!msg.isUser} class="message mb-3">
				<div class="flex justify-between items-baseline">
				  <span class="font-medium">{msg.isUser ? '您' : 'AI'}</span>
				  <span class="text-xs text-muted-foreground">
					{msg.timestamp.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
				  </span>
				</div>
				<div class="mt-1 whitespace-pre-wrap">{msg.text}</div>
			  </div>
			{:else}
			  <div class="text-center text-muted-foreground py-8">尚未開始對話</div>
			{/each}
		  </div>
  
		  <form on:submit|preventDefault={sendMessage} class="flex gap-2">
			<Textarea
			  bind:value={chineseInput}
			  placeholder="輸入訊息，按 Enter 發送..."
			  class="flex-1 min-h-[80px]"
			  rows={2}
			  disabled={!$socketConnected}
			/>
			<Button type="submit" size="lg" disabled={!chineseInput.trim() || !$socketConnected}>
			  <Send class="mr-2" />
			  發送
			</Button>
		  </form>
		</Card.Content>
	  </Card.Root>
  
	  <!-- 右側控制面板 -->
	  <div class="space-y-4">
		<!-- 系統狀態卡片 -->
		<Card.Root>
		  <Card.Header>
			<Card.Title class="flex items-center gap-2">
			  <span>系統狀態</span>
			  <span class={`h-2 w-2 rounded-full ${$socketConnected ? 'bg-green-500' : 'bg-red-500'}`} />
			</Card.Title>
		  </Card.Header>
		  <Card.Content class="space-y-3">
			<div class="flex items-center justify-between p-2 rounded-lg bg-muted/10">
			  <Label class="flex items-center gap-2">
				<BrainCircuit class="h-4 w-4" />
				<span>AI思考中</span>
			  </Label>
			  <span class:thinking={$AI_thinking} class="status-indicator">
				{$AI_thinking ? '進行中' : '待命'}
			  </span>
			</div>
  
			<div class="flex items-center justify-between p-2 rounded-lg bg-muted/10">
			  <Label class="flex items-center gap-2">
				<Volume2 class="h-4 w-4" />
				<span>AI說話中</span>
			  </Label>
			  <span class:active={$AI_speaking} class="status-indicator">
				{$AI_speaking ? '輸出中' : '靜音'}
			  </span>
			</div>
  
			<div class="flex items-center justify-between p-2 rounded-lg bg-muted/10">
			  <Label class="flex items-center gap-2">
				<Mic class="h-4 w-4" />
				<span>用戶說話</span>
			  </Label>
			  <span class:active={$human_speaking} class="status-indicator">
				{$human_speaking ? '檢測到' : '安靜'}
			  </span>
			</div>
  
			<div class="pt-2">
			  <div class="flex justify-between text-sm mb-1">
				<span>回應耐心值</span>
				<span>剩餘: {Math.max(0, Math.round($total_time - ($total_time * $patiencePercent / 100)))}秒</span>
			  </div>
			  <Progress value={Math.min(100, $patiencePercent)} class="h-2" />
			</div>
		  </Card.Content>
		</Card.Root>
  
		<!-- VTuber控制卡片 -->
		<Card.Root>
		  <Card.Header>
			<Card.Title>虛擬形象控制</Card.Title>
		  </Card.Header>
		  <Card.Content class="grid grid-cols-3 gap-2">
			<Button 
			  on:click={() => triggerVtuberAction('眨眼')} 
			  variant={$vtuberStatus.blink ? 'default' : 'outline'}
			  class="flex-col h-auto py-2"
			>
			  <Eye class="mb-1 h-5 w-5" />
			  <span class="text-xs">眨眼</span>
			</Button>
			<Button 
			  on:click={() => triggerVtuberAction('點頭')} 
			  variant={$vtuberStatus.nod ? 'default' : 'outline'}
			  class="flex-col h-auto py-2"
			>
			  <Smile class="mb-1 h-5 w-5" />
			  <span class="text-xs">點頭</span>
			</Button>
			<Button 
			  on:click={() => triggerVtuberAction('搖頭')} 
			  variant={$vtuberStatus.shake_head ? 'default' : 'outline'}
			  class="flex-col h-auto py-2"
			>
			  <Meh class="mb-1 h-5 w-5" />
			  <span class="text-xs">搖頭</span>
			</Button>
		  </Card.Content>
		</Card.Root>
  
		<!-- Twitch 聊天卡片 -->
		<Card.Root>
		  <Card.Header>
			<Card.Title class="flex items-center gap-2">
			  <Twitch class="h-5 w-5" />
			  <span>Twitch 聊天</span>
			</Card.Title>
		  </Card.Header>
		  <Card.Content class="space-y-2">
			<div class="flex items-center justify-between">
			  <Label>啟用 Twitch 聊天:</Label>
			  <Switch 
				checked={$twitchChatEnabled} 
				on:change={() => toggleModule('twitch', !$twitchChatEnabled)} 
			  />
			</div>
			{#if $twitchChatEnabled}
			  <Textarea 
				value={$twitchChat} 
				disabled 
				class="h-24 text-sm" 
				placeholder="Twitch 聊天訊息將顯示於此"
			  />
			{/if}
		  </Card.Content>
		</Card.Root>
	  </div>
	</div>
  
	<!-- 底部控制台 -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
	  <!-- 模組控制卡片 -->
	  <Card.Root>
		<Card.Header>
		  <Card.Title>模組開關</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-3">
		  {#each [
			{ name: 'LLM', label: '語言模型', icon: BrainCircuit, enabled: $LLMEnabled },
			{ name: 'TTS', label: '語音合成', icon: Volume2, enabled: $TTSEnabled },
			{ name: 'STT', label: '語音辨識', icon: Mic, enabled: $STTEnabled },
			{ name: 'movement', label: '動作捕捉', icon: Move, enabled: $movementEnabled },
			{ name: 'multimodal', label: '多模態輸入', icon: Image, enabled: $multimodalEnabled }
		  ] as item}
			<div class="flex items-center justify-between p-2 rounded-lg hover:bg-muted/10">
			  <Label class="flex items-center gap-2">
				<item.icon class="h-4 w-4" />
				<span>{item.label}</span>
			  </Label>
			  <Switch 
				checked={item.enabled} 
				on:change={() => toggleModule(item.name, !item.enabled)}
			  />
			</div>
		  {/each}
		</Card.Content>
	  </Card.Root>
  
	  <!-- 音訊控制卡片 -->
	  <Card.Root>
		<Card.Header>
		  <Card.Title>音訊控制</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-3">
		  <Select.Root bind:value={$selectedAudio}>
			<Select.Trigger>
			  <Select.Value placeholder="選擇音訊檔" />
			</Select.Trigger>
			<Select.Content>
			  <Select.Group>
				{#each $songs as song (song.value)}
				  <Select.Item value={song.value}>
					{song.label.replace('.mp3', '').replace('.wav', '')}
				  </Select.Item>
				{/each}
			  </Select.Group>
			</Select.Content>
		  </Select.Root>
  
		  <div class="grid grid-cols-2 gap-2 pt-2">
			<Button on:click={() => handleAudio('play')} disabled={!$selectedAudio}>
			  <Play class="mr-2 h-4 w-4" />
			  播放
			</Button>
			<Button on:click={() => handleAudio('pause')} variant="secondary">
			  <Pause class="mr-2 h-4 w-4" />
			  暫停
			</Button>
			<Button on:click={() => handleAudio('resume')}>
			  <Play class="mr-2 h-4 w-4" />
			  繼續
			</Button>
			<Button on:click={() => handleAudio('abort')} variant="destructive">
			  <X class="mr-2 h-4 w-4" />
			  停止
			</Button>
		  </div>
		</Card.Content>
	  </Card.Root>
  
	  <!-- 即時訊息卡片 -->
	  <Card.Root>
		<Card.Header>
		  <Card.Title>即時處理</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-3">
		  <div class="space-y-1">
			<Label>當前處理:</Label>
			<Textarea
			  disabled
			  value={$currentMessage}
			  class="min-h-[60px] text-sm"
			  placeholder="等待處理..."
			/>
		  </div>
		  <div class="space-y-1">
			<Label>下條訊息:</Label>
			<Textarea
			  disabled
			  value={$nextMessage}
			  class="min-h-[60px] text-sm"
			  placeholder="無待處理訊息"
			/>
		  </div>
		  <div class="flex gap-2 pt-1">
			<Button 
			  on:click={() => socket.emit('abort_current_message')} 
			  variant="destructive" 
			  size="sm"
			  class="flex-1"
			>
			  中止當前
			</Button>
			<Button 
			  on:click={() => socket.emit('cancel_next_message')} 
			  variant="outline" 
			  size="sm"
			  class="flex-1"
			>
			  取消下條
			</Button>
		  </div>
		</Card.Content>
	  </Card.Root>
  
	  <!-- 互動功能卡片 -->
	  <Card.Root>
		<Card.Header>
		  <Card.Title>互動功能</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-3">
		  <Button 
			on:click={() => socket.emit('fun_fact')} 
			variant="outline" 
			class="w-full"
		  >
			<Sparkles class="mr-2 h-4 w-4" />
			隨機趣聞
		  </Button>
  
		  <div class="space-y-1">
			<Label>快速切換話題:</Label>
			<div class="flex gap-2">
			  <Input 
				bind:value={topic} 
				placeholder="輸入新話題..." 
				class="flex-1"
			  />
			  <Button 
				on:click={() => {
				  if (topic.trim()) {
					socket.emit('new_topic', topic);
					topic = '';
				  }
				}}
				disabled={!topic.trim()}
			  >
				切換
			  </Button>
			</div>
		  </div>
		</Card.Content>
	  </Card.Root>
	</div>
  </div>
  
  <style>
	/* 消息樣式 */
	.message-container {
	  scrollbar-width: thin;
	  scrollbar-color: hsl(var(--border)) transparent;
	}
  
	.message-container::-webkit-scrollbar {
	  width: 6px;
	}
  
	.message-container::-webkit-scrollbar-thumb {
	  background-color: hsl(var(--border));
	  border-radius: 3px;
	}
  
	.user-message {
	  background-color: hsl(var(--primary) / 0.1);
	  border-left: 3px solid hsl(var(--primary));
	  margin-left: auto;
	  max-width: 90%;
	}
  
	.ai-message {
	  background-color: hsl(var(--muted) / 0.1);
	  border-left: 3px solid hsl(var(--muted));
	  margin-right: auto;
	  max-width: 90%;
	}
  
	/* 狀態指示器 */
	.status-indicator {
	  @apply text-sm px-2 py-1 rounded-full;
	}
  
	.thinking, .active {
	  @apply bg-green-500/10 text-green-600 dark:text-green-400;
	}
  
	/* 動畫效果 */
	@keyframes fadeIn {
	  from { opacity: 0; transform: translateY(5px); }
	  to { opacity: 1; transform: translateY(0); }
	}
  
	.message {
	  animation: fadeIn 0.2s ease-out;
	}
  
	/* 暗黑模式適配 */
	[data-theme='dark'] {
	  .user-message {
		background-color: hsl(var(--primary) / 0.15);
	  }
  
	  .ai-message {
		background-color: hsl(var(--muted) / 0.15);
	  }
	}
  </style>