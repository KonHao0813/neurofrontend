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
	  Sparkles
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
	  selectedAudio,
	  songs,
	  chineseMessages,
	  sendChineseText,
	  triggerVtuberAction,
	  vtuberStatus
	} from '$lib/stores';
  
	// 本地狀態
	let chineseInput = "";
	let audioFile = "";
  
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
	  }
	};
  
	// 控制功能
	const toggleModule = (module: string, enabled: boolean) => {
	  socket.emit(`${enabled ? 'enable' : 'disable'}_${module}`);
	  toast.success(`${module.toUpperCase()} ${enabled ? '已啟用' : '已禁用'}`);
	};
  
	// 音訊控制
	const handleAudio = (action: string) => {
	  if (action === 'play' && !audioFile) {
		toast.warning('請先選擇音訊檔');
		return;
	  }
	  socket.emit(`${action}_audio`, audioFile);
	};
  </script>
  
  <div class="w-full h-full flex flex-col p-4 gap-4">
	<!-- 主聊天區域 -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
	  <!-- 中文聊天框 -->
	  <Card.Root class="col-span-2">
		<Card.Header>
		  <Card.Title class="text-xl font-bold">中文對話介面</Card.Title>
		  <Card.Description>與AI進行中文交流</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
		  <div class="border rounded-lg p-3 h-64 overflow-y-auto">
			{#each $chineseMessages as msg}
			  <div class={`mb-2 p-2 rounded-lg ${msg.isUser ? 'bg-blue-100 ml-auto w-3/4' : 'bg-gray-100 mr-auto w-3/4'}`}>
				<div class="text-sm text-gray-500">
				  {msg.timestamp.toLocaleTimeString()}
				</div>
				<div>{msg.text}</div>
			  </div>
			{/each}
		  </div>
  
		  <div class="flex gap-2">
			<Textarea
			  bind:value={chineseInput}
			  placeholder="輸入您想說的話..."
			  class="flex-1"
			  rows={3}
			  on:keydown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
			/>
			<Button on:click={sendMessage} size="lg">
			  <Send class="mr-2" />
			  發送
			</Button>
		  </div>
		</Card.Content>
	  </Card.Root>
  
	  <!-- 系統狀態 -->
	  <div class="space-y-4">
		<Card.Root>
		  <Card.Header>
			<Card.Title>系統狀態</Card.Title>
		  </Card.Header>
		  <Card.Content class="space-y-2">
			<div class="flex items-center justify-between">
			  <span>AI思考中:</span>
			  <Toggle pressed={$AI_thinking} disabled>
				<BrainCircuit class="mr-2 h-4 w-4" />
				{$AI_thinking ? '進行中' : '空閒'}
			  </Toggle>
			</div>
  
			<div class="flex items-center justify-between">
			  <span>AI說話中:</span>
			  <Toggle pressed={$AI_speaking} disabled>
				<Volume2 class="mr-2 h-4 w-4" />
				{$AI_speaking ? '進行中' : '靜音'}
			  </Toggle>
			</div>
  
			<div class="flex items-center justify-between">
			  <span>用戶說話中:</span>
			  <Toggle pressed={$human_speaking} disabled>
				<Mic class="mr-2 h-4 w-4" />
				{$human_speaking ? '檢測到' : '安靜'}
			  </Toggle>
			</div>
  
			<div class="pt-2">
			  <Label>回應耐心值:</Label>
			  <Progress value={$patiencePercent} class="h-2" />
			  <div class="text-right text-sm text-gray-500">
				剩餘: {$total_time - (($total_time * $patiencePercent) / 100}秒
			  </div>
			</div>
		  </Card.Content>
		</Card.Root>
  
		<!-- VTuber控制 -->
		<Card.Root>
		  <Card.Header>
			<Card.Title>虛擬形象控制</Card.Title>
		  </Card.Header>
		  <Card.Content class="grid grid-cols-3 gap-2">
			<Button on:click={() => triggerVtuberAction('眨眼')} variant={$vtuberStatus.blink ? 'default' : 'outline'}>
			  <Eye class="mr-2 h-4 w-4" />
			  眨眼
			</Button>
			<Button on:click={() => triggerVtuberAction('點頭')} variant={$vtuberStatus.nod ? 'default' : 'outline'}>
			  <Smile class="mr-2 h-4 w-4" />
			  點頭
			</Button>
			<Button on:click={() => triggerVtuberAction('搖頭')} variant={$vtuberStatus.shake_head ? 'default' : 'outline'}>
			  <Meh class="mr-2 h-4 w-4" />
			  搖頭
			</Button>
		  </Card.Content>
		</Card.Root>
	  </div>
	</div>
  
	<!-- 控制台 -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
	  <!-- 模組控制 -->
	  <Card.Root>
		<Card.Header>
		  <Card.Title>模組開關</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-2">
		  <div class="flex items-center justify-between">
			<Label>語言模型(LLM):</Label>
			<Switch checked={$LLMEnabled} on:change={() => toggleModule('LLM', !$LLMEnabled)} />
		  </div>
		  <div class="flex items-center justify-between">
			<Label>語音合成(TTS):</Label>
			<Switch checked={$TTSEnabled} on:change={() => toggleModule('TTS', !$TTSEnabled)} />
		  </div>
		  <div class="flex items-center justify-between">
			<Label>語音辨識(STT):</Label>
			<Switch checked={$STTEnabled} on:change={() => toggleModule('STT', !$STTEnabled)} />
		  </div>
		  <div class="flex items-center justify-between">
			<Label>動作捕捉:</Label>
			<Switch checked={$movementEnabled} on:change={() => toggleModule('movement', !$movementEnabled)} />
		  </div>
		</Card.Content>
	  </Card.Root>
  
	  <!-- 音訊播放 -->
	  <Card.Root>
		<Card.Header>
		  <Card.Title>音訊控制</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-2">
		  <Select.Root bind:value={audioFile}>
			<Select.Trigger>
			  <Select.Value placeholder="選擇音訊檔" />
			</Select.Trigger>
			<Select.Content>
			  <Select.Group>
				{#each $songs as song}
				  <Select.Item value={song.value}>
					{song.label}
				  </Select.Item>
				{/each}
			  </Select.Group>
			</Select.Content>
		  </Select.Root>
  
		  <div class="grid grid-cols-2 gap-2 pt-2">
			<Button on:click={() => handleAudio('play')}>
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
  
	  <!-- 當前消息 -->
	  <Card.Root>
		<Card.Header>
		  <Card.Title>當前處理</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-2">
		  <Textarea
			disabled
			value={$currentMessage}
			class="min-h-[100px]"
			placeholder="當前無處理內容"
		  />
		  <Button on:click={() => socket.emit('abort_current_message')} variant="destructive" class="w-full">
			中止當前處理
		  </Button>
		</Card.Content>
	  </Card.Root>
  
	  <!-- 交互功能 -->
	  <Card.Root>
		<Card.Header>
		  <Card.Title>交互功能</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-2">
		  <Button on:click={() => socket.emit('fun_fact')} class="w-full">
			<Sparkles class="mr-2 h-4 w-4" />
			隨機趣聞
		  </Button>
  
		  <div class="flex gap-2">
			<Input bind:value={topic} placeholder="輸入新話題" />
			<Button on:click={() => {
			  socket.emit('new_topic', topic);
			  topic = '';
			}}>
			  切換話題
			</Button>
		  </div>
		</Card.Content>
	  </Card.Root>
	</div>
  </div>
  
  <style>
	/* 自訂樣式 */
	.text-muted {
	  color: hsl(var(--muted-foreground));
	}
	
	/* 消息氣泡動畫 */
	@keyframes fadeIn {
	  from { opacity: 0; transform: translateY(10px); }
	  to { opacity: 1; transform: translateY(0); }
	}
	
	.message {
	  animation: fadeIn 0.3s ease-out;
	}
  </style>
  