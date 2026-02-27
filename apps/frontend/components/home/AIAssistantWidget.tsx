'use client';

import { useState } from 'react';
import { Sparkles, X, Zap, ChevronUp, ChevronDown, Loader2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useEntitlements } from '@/hooks/useEntitlements';
import { generateAIContent } from '@/lib/api/client';

interface AIGenerationHistory {
  id: string;
  prompt: string;
  result: string;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export default function AIAssistantWidget() {
  const { aiLimit, aiRemaining, isUnlimited, isLoading, mutate: mutateEntitlements } = useEntitlements();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationHistory, setGenerationHistory] = useState<AIGenerationHistory[]>([]);
  const [prompt, setPrompt] = useState('');

  // 计算已使用数量
  const aiUsed = aiLimit !== null && aiLimit !== undefined 
    ? (isUnlimited ? 0 : Math.max(0, aiLimit - aiRemaining))
    : 0;

  // 计算使用百分比（无限额度时显示为 0）
  const usagePercentage = isUnlimited || !aiLimit 
    ? 0 
    : aiLimit > 0 
      ? Math.min(100, (aiUsed / aiLimit) * 100)
      : 0;

  // 格式化时间 - 显示具体的年月日时分秒
  const formatTime = (date: Date) => {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  // 处理 AI 生成
  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    const generationId = Date.now().toString();
    const timestamp = new Date();

    try {
      const response = await generateAIContent('text_generation', prompt.trim());
      
      // 添加成功记录
      const newHistory: AIGenerationHistory = {
        id: generationId,
        prompt: prompt.trim(),
        result: response.data,
        timestamp,
        success: true,
      };

      setGenerationHistory(prev => [newHistory, ...prev]);
      setPrompt('');

      // 刷新配额信息
      mutateEntitlements();
    } catch (error) {
      // 添加失败记录
      const newHistory: AIGenerationHistory = {
        id: generationId,
        prompt: prompt.trim(),
        result: '',
        timestamp,
        success: false,
        error: error instanceof Error ? error.message : '生成失败',
      };

      setGenerationHistory(prev => [newHistory, ...prev]);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return null; // 加载时不显示
  }

  const latestGeneration = generationHistory[0];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isMinimized ? (
        // 最小化状态：只显示图标
        <button
          onClick={() => setIsMinimized(false)}
          className="w-14 h-14 bg-gradient-to-br from-[#FF6B3D] to-[#FF9E7D] rounded-full shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all duration-300 group"
        >
          <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          {!isUnlimited && aiRemaining < 5 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">{aiRemaining}</span>
            </span>
          )}
        </button>
      ) : (
        // 展开状态：显示完整信息
        <div className="bg-white rounded-2xl shadow-2xl shadow-slate-900/10 border border-slate-200/50 backdrop-blur-xl overflow-hidden w-80 animate-fade-in-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#FF6B3D] to-[#FF9E7D] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold font-brand text-sm">AI 助手</h3>
                <p className="text-white/80 text-xs">生成额度</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            {/* 额度信息卡片 */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-4 border border-orange-200/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-700">剩余额度</span>
                {isUnlimited ? (
                  <span className="text-xs font-bold text-[#FF6B3D] bg-white px-2 py-1 rounded-full">
                    无限
                  </span>
                ) : (
                  <span className={`text-lg font-bold font-brand ${
                    aiRemaining < 5 ? 'text-red-500' : aiRemaining < 20 ? 'text-orange-500' : 'text-[#FF6B3D]'
                  }`}>
                    {aiRemaining}
                  </span>
                )}
              </div>

              {/* 进度条 */}
              {!isUnlimited && aiLimit !== null && (
                <>
                  <div className="w-full bg-slate-200 rounded-full h-2 mb-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FF6B3D] to-[#FF9E7D] rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${usagePercentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>已使用: {aiUsed}</span>
                    <span>总计: {aiLimit}</span>
                  </div>
                </>
              )}

              {isUnlimited && (
                <div className="flex items-center gap-2 mt-2">
                  <Zap className="w-4 h-4 text-[#FF6B3D]" />
                  <span className="text-xs text-slate-600">您拥有无限 AI 生成额度</span>
                </div>
              )}
            </div>

            {/* 展开的详细信息 */}
            {isExpanded && (
              <div className="space-y-3 pt-3 border-t border-slate-200 animate-fade-in-up">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">总生成次数</span>
                  <span className="font-bold text-slate-900">{aiUsed}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">剩余次数</span>
                  <span className={`font-bold ${
                    aiRemaining < 5 ? 'text-red-500' : aiRemaining < 20 ? 'text-orange-500' : 'text-slate-900'
                  }`}>
                    {isUnlimited ? '∞' : aiRemaining}
                  </span>
                </div>
                {!isUnlimited && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">使用率</span>
                    <span className="font-bold text-slate-900">{usagePercentage.toFixed(1)}%</span>
                  </div>
                )}
                
                {/* 低额度警告 */}
                {!isUnlimited && aiRemaining < 5 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                    <p className="text-xs text-red-700 font-medium">
                      ⚠️ 您的 AI 生成额度即将用完，请考虑升级套餐
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 最新生成结果 */}
            {latestGeneration && (
              <div className={`rounded-xl p-3 border ${
                latestGeneration.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start gap-2">
                  {latestGeneration.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-700">
                        {latestGeneration.success ? '生成成功' : '生成失败'}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(latestGeneration.timestamp)}
                      </span>
                    </div>
                    {latestGeneration.success ? (
                      <div className="bg-white rounded-lg p-2 border border-green-200">
                        <p className="text-sm text-slate-800 font-medium">
                          {latestGeneration.result}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-red-600">
                        {latestGeneration.error}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 输入框和生成按钮 */}
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleGenerate();
                  }
                }}
                placeholder="输入提示词..."
                disabled={isGenerating}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B3D]/50 focus:border-[#FF6B3D] resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                rows={2}
              />
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="w-full bg-gradient-to-r from-[#FF6B3D] to-[#FF9E7D] text-white py-2.5 rounded-xl font-bold font-brand text-sm hover:shadow-lg hover:shadow-orange-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>生成中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>使用 AI 生成</span>
                  </>
                )}
              </button>
              <p className="text-xs text-slate-400 text-center">
                按 Cmd/Ctrl + Enter 快速生成
              </p>
            </div>

            {/* 生成历史（展开时显示） */}
            {isExpanded && generationHistory.length > 0 && (
              <div className="pt-3 border-t border-slate-200 space-y-2 max-h-48 overflow-y-auto">
                <div className="text-xs font-semibold text-slate-600 mb-2">生成历史</div>
                {generationHistory.slice(1, 6).map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-lg p-2 border text-xs ${
                      item.success
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-red-50/50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {item.success ? (
                        <CheckCircle className="w-3 h-3 text-green-600" />
                      ) : (
                        <XCircle className="w-3 h-3 text-red-600" />
                      )}
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(item.timestamp)}
                      </span>
                    </div>
                    <p className="text-slate-700 font-medium mb-1 line-clamp-1">
                      {item.prompt}
                    </p>
                    {item.success && (
                      <p className="text-slate-600 line-clamp-2">
                        {item.result}
                      </p>
                    )}
                    {!item.success && (
                      <p className="text-red-600">
                        {item.error}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

