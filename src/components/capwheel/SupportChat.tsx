/**
 * SupportChat - Enterprise AI Support Widget
 * 
 * Premium floating chat widget with AI-powered support
 * Design Principles Applied:
 *   - Directed Spotlight: Clear CTA button with high contrast
 *   - Bio-Mimetic Physics: Smooth spring animations, tactile feedback
 *   - Responsive Empathy: Typing indicators, instant feedback
 *   - Aesthetic Validity: Premium dark theme, harmonious palette
 *   - Radical Visibility: High contrast, accessible touch targets (44px+)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  AlertTriangle,
  Ticket,
  ChevronDown,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { usePortfolioStore } from '../../store/usePortfolioStore';

// ============================================
// Types
// ============================================

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isError?: boolean;
  isEscalation?: boolean;
}

interface QuickAction {
  label: string;
  query: string;
  icon: React.ReactNode;
}

// ============================================
// System Prompt - Comprehensive Platform Knowledge
// Used when integrating with AI backend (Workers AI, OpenAI, etc.)
// Exported for use in backend AI integration
// ============================================

export const ARIA_SYSTEM_PROMPT = `You are Aria, the intelligent support assistant for CapWheel - a premium enterprise trading platform. You speak with confidence, warmth, and precision. Your personality is professional yet approachable - like a knowledgeable financial concierge.

## PLATFORM OVERVIEW
CapWheel is an enterprise-grade investment platform offering automated trading strategies through strategy pools. Users deposit funds, select a strategy tier, and earn daily ROI from algorithmic trading.

## STRATEGY POOLS
Users choose from 4 tiers based on their investment amount:

| Tier | Name | Minimum | Daily ROI | Capital Lock |
|------|------|---------|-----------|--------------|
| ANCHOR | Anchor | $100 | 0.8% - 0.96% | 40 days |
| VECTOR | Vector | $4,000 | 0.96% - 1.12% | 45 days |
| KINETIC | Kinetic | $25,000 | 1.12% - 1.28% | 65 days |
| HORIZON | Horizon | $50,000 | 1.8% (fixed) | 85 days |

Key points:
- ROI is calculated daily and credited to the user's wallet
- Trading operates 8 hours/day, 6 days/week
- ROI can be withdrawn after 24 hours
- Capital is locked for the specified period before withdrawal
- Higher tiers = higher returns but longer lock periods
- Horizon is invite-only for institutional investors

## WALLET SYSTEM
- **Available Balance**: Funds ready for withdrawal or staking
- **Locked Balance**: Funds staked in strategy pools (capital lock)
- **Pending Balance**: Deposits awaiting confirmation

Deposits:
- Minimum deposit: $20
- Supported: BTC, ETH, LTC, USDT (TRC20)
- Crypto deposits are confirmed automatically via NowPayments
- Processing typically takes 10-30 minutes depending on network

Withdrawals:
- ROI earnings can be withdrawn 24 hours after being credited
- Capital can be withdrawn after the lock period expires
- Withdrawals are processed within 24-48 hours

## PARTNER NETWORK (Referral System)
5-tier referral commission structure:
- Tier 1 (Direct): 10% of referred user's deposits
- Tier 2: 5%
- Tier 3: 3%
- Tier 4: 2%
- Tier 5: 1%

Users can:
- Share their unique referral code
- Generate invite codes from Profile page
- View their network tree in Partner Network
- Track earnings by tier level

## KEY PLATFORM FEATURES

### Dashboard
- Real-time portfolio overview
- Wealth chart showing growth over time
- Transaction ledger
- Strategy performance metrics
- Quick deposit button

### Strategy Pools
- Browse available Kinetic strategies
- Select tier based on available balance
- View projected returns calculator
- Monitor active stakes

### Trading Agent
- Live market data visualization
- Real-time trade execution logs
- Performance tracking

### Profile
- Account settings
- Generate invite codes (valid for 7 days)
- View personal referral code
- Timezone and notification preferences

### Security
- JWT-based authentication
- Session management
- Password requirements: minimum 8 characters

## COMMON USER QUESTIONS

Q: "How do I change my strategy tier?"
A: Your tier is determined by your staked amount. To upgrade, deposit more funds and stake in a higher tier pool from Strategy Pools.

Q: "When can I withdraw my capital?"
A: Capital is locked for the period specified by your tier (40-85 days). After this period, you can withdraw from your wallet.

Q: "Why hasn't my deposit appeared?"
A: Crypto deposits require network confirmations. BTC typically takes 3-6 confirmations (~30-60 min). Check your transaction history for status.

Q: "How is ROI calculated?"
A: Daily ROI is calculated on your staked amount. For example, $10,000 at Anchor (0.8%) = $80/day minimum.

Q: "Can I stake in multiple pools?"
A: Yes, you can have multiple active stakes across different tiers.

Q: "What's an invite code?"
A: Invite codes are single-use codes you generate to invite new users. They expire after 7 days.

## RESPONSE GUIDELINES

1. **Be Helpful**: Answer questions directly and completely
2. **Be Accurate**: Only state what you know for certain
3. **Be Concise**: Respect user's time with clear, focused answers
4. **Be Human**: Use conversational language, not robotic responses
5. **Acknowledge Limits**: If you don't know something, say so clearly

## ESCALATION TRIGGERS
If any of these apply, offer to create a support ticket:
- Account access issues
- Missing deposits after 2+ hours
- Withdrawal processing delays beyond 48 hours
- Technical errors or bugs
- Disputes or complaints
- KYC/verification issues
- Anything you cannot answer confidently

When escalating, say something like:
"I want to make sure you get the help you need. Let me create a support ticket so our team can look into this directly. They typically respond within 24 hours."

## THINGS YOU DON'T KNOW
- Individual user's exact balance or transaction details
- Future platform changes or roadmap
- Specific trading algorithms or strategies used
- Legal/regulatory advice
- Tax implications
- Comparison to competitors

For these, be honest: "I don't have access to that information, but I'd recommend [alternative]."

Remember: You're here to help users navigate CapWheel successfully. Be their trusted guide.`;

// ============================================
// Quick Actions
// ============================================

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Strategy Tiers', query: 'Explain the Kinetic strategy tiers and their ROI rates', icon: <Zap className="w-3.5 h-3.5" /> },
  { label: 'Deposits', query: 'How do I deposit funds?', icon: <HelpCircle className="w-3.5 h-3.5" /> },
  { label: 'Withdrawals', query: 'When can I withdraw my capital?', icon: <HelpCircle className="w-3.5 h-3.5" /> },
  { label: 'Referrals', query: 'How does the partner referral program work?', icon: <HelpCircle className="w-3.5 h-3.5" /> },
];

// ============================================
// Chat Message Component
// ============================================

const ChatBubble = ({ message }: { message: ChatMessage }) => {
  const isUser = message.role === 'user';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`
        w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center
        ${isUser 
          ? 'bg-gradient-to-br from-[#00FF9D] to-[#00B8D4]' 
          : 'bg-gradient-to-br from-[#6B7FD7] to-[#8B5CF6]'}
      `}>
        {isUser ? (
          <User className="w-4 h-4 text-black" />
        ) : (
          <Sparkles className="w-4 h-4 text-white" />
        )}
      </div>
      
      {/* Message Bubble */}
      <div className={`
        max-w-[80%] rounded-2xl px-4 py-2.5 
        ${isUser 
          ? 'bg-[#00FF9D] text-black rounded-br-sm' 
          : 'bg-[#1A1F26] text-white border border-white/5 rounded-bl-sm'}
        ${message.isError ? 'border-red-500/50 bg-red-500/10' : ''}
        ${message.isEscalation ? 'border-amber-500/50 bg-amber-500/10' : ''}
      `}>
        {message.isError && (
          <div className="flex items-center gap-1.5 text-red-400 text-xs mb-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Error</span>
          </div>
        )}
        {message.isEscalation && (
          <div className="flex items-center gap-1.5 text-amber-400 text-xs mb-1">
            <Ticket className="w-3 h-3" />
            <span>Support Ticket</span>
          </div>
        )}
        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isUser ? 'text-black' : 'text-slate-200'}`}>
          {message.content}
        </p>
        <p className={`text-[10px] mt-1 ${isUser ? 'text-black/50' : 'text-slate-500'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
};

// ============================================
// Typing Indicator
// ============================================

const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="flex gap-2.5"
  >
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6B7FD7] to-[#8B5CF6] flex-shrink-0 flex items-center justify-center">
      <Sparkles className="w-4 h-4 text-white" />
    </div>
    <div className="bg-[#1A1F26] border border-white/5 rounded-2xl rounded-bl-sm px-4 py-3">
      <div className="flex gap-1">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0 }}
          className="w-2 h-2 rounded-full bg-[#00FF9D]"
        />
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
          className="w-2 h-2 rounded-full bg-[#00FF9D]"
        />
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
          className="w-2 h-2 rounded-full bg-[#00FF9D]"
        />
      </div>
    </div>
  </motion.div>
);

// ============================================
// Main Chat Widget Component
// ============================================

export const SupportChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { user, isAuthenticated } = useAuthStore();
  const { currentTier } = usePortfolioStore();

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
      setHasUnread(false);
    }
  }, [isOpen]);

  // Welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `Hi${user?.email ? ` ${user.email.split('@')[0]}` : ''}! 👋 I'm Aria, your CapWheel assistant.\n\nI can help you with:\n• Understanding strategy tiers & ROI\n• Deposits & withdrawals\n• Partner referral program\n• Account questions\n\nHow can I assist you today?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length, user?.email]);

  // Call Gemini AI API for intelligent responses
  const generateResponse = useCallback(async (userMessage: string, conversationHistory: ChatMessage[]): Promise<string> => {
    const GEMINI_API_URL = 'https://key.ematthew477.workers.dev/v1beta/models/gemini-2.5-flash:generateContent';
    
    // Build conversation context for Gemini
    const contents = [
      // System instruction as first user message (Gemini pattern)
      {
        role: 'user',
        parts: [{ text: ARIA_SYSTEM_PROMPT }]
      },
      {
        role: 'model',
        parts: [{ text: 'Understood. I am Aria, the CapWheel support assistant. I will help users with strategy tiers, deposits, withdrawals, referrals, and account questions. I will be professional, helpful, and escalate issues I cannot resolve.' }]
      },
      // Add conversation history
      ...conversationHistory
        .filter(msg => msg.role !== 'system' && msg.id !== 'welcome')
        .map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        })),
      // Add current user message
      {
        role: 'user',
        parts: [{ text: userMessage }]
      }
    ];

    // Add user context if available
    const userContext = currentTier 
      ? `\n\n[User Context: Currently on ${currentTier.toUpperCase()} strategy tier]` 
      : '';
    
    if (userContext && contents.length > 2) {
      const lastUserMsg = contents[contents.length - 1];
      if (lastUserMsg.role === 'user') {
        lastUserMsg.parts[0].text += userContext;
      }
    }

    const payload = {
      contents,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ]
    };

    try {
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error('Gemini API error:', response.status, response.statusText);
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Extract text from Gemini response
      const candidates = data.candidates;
      if (candidates && candidates.length > 0 && candidates[0].content?.parts?.length > 0) {
        return candidates[0].content.parts[0].text || 'I apologize, but I could not generate a response. Please try again.';
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Gemini API call failed:', error);
      // Fallback response if API fails
      return `I'm having trouble connecting right now. Here's what I can tell you:\n\n• **Strategy Pools**: Anchor ($100), Vector ($4k), Kinetic ($25k), Horizon ($50k)\n• **Deposits**: Minimum $20, supports BTC/ETH/LTC/USDT\n• **Withdrawals**: ROI after 24hrs, capital after lock period\n\nPlease try again or contact support if this persists.`;
    }
  }, [currentTier]);

  // Handle sending a message
  const handleSend = useCallback(async () => {
    if (!input.trim() || isTyping) return;
    
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };
    
    // Capture current messages before updating state
    const currentMessages = [...messages, userMessage];
    
    setMessages(currentMessages);
    setInput('');
    setIsTyping(true);
    
    try {
      // Call Gemini AI with conversation history
      const response = await generateResponse(userMessage.content, messages);
      
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        isEscalation: response.includes('support ticket') || response.includes('escalate') || response.includes('ticket'),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment, or contact our support team directly.",
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, messages, generateResponse]);

  // Handle quick action
  const handleQuickAction = useCallback((action: QuickAction) => {
    setInput(action.query);
    setTimeout(() => handleSend(), 100);
  }, [handleSend]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Hide chat widget for unauthenticated users (must be after all hooks)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Chat Button - Fixed Bottom Right */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-20 right-6 sm:bottom-6 z-50 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#00FF9D] to-[#00B8D4] shadow-lg shadow-[#00FF9D]/25 flex items-center justify-center group"
            aria-label="Open support chat"
          >
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-[#00FF9D] animate-ping opacity-25" />
            
            {/* Icon */}
            <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-black transition-transform group-hover:scale-110" />
            
            {/* Unread indicator */}
            {hasUnread && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                1
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 sm:hidden"
            />
            
            {/* Chat Window */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed z-50 
                         bottom-0 left-0 right-0 h-[85vh] 
                         sm:bottom-6 sm:right-6 sm:left-auto sm:h-[600px] sm:w-[400px] sm:rounded-2xl
                         bg-[#0B1015] border border-white/10 shadow-2xl shadow-black/50
                         flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex-shrink-0 h-16 px-4 flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-[#0F1419] to-[#0B1015]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6B7FD7] to-[#8B5CF6] flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      Aria
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-[#00FF9D]/20 text-[#00FF9D]">
                        AI
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500">CapWheel Support Assistant</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Minimize button - mobile only */}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="sm:hidden p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                  
                  {/* Close button */}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                    aria-label="Close chat"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {messages.map((message) => (
                  <ChatBubble key={message.id} message={message} />
                ))}
                
                {/* Typing indicator */}
                <AnimatePresence>
                  {isTyping && <TypingIndicator />}
                </AnimatePresence>
                
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions - show when no user messages yet */}
              {messages.length <= 1 && (
                <div className="flex-shrink-0 px-4 pb-2">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Quick Questions</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_ACTIONS.map((action) => (
                      <button
                        key={action.label}
                        onClick={() => handleQuickAction(action)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all"
                      >
                        {action.icon}
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="flex-shrink-0 p-4 border-t border-white/10 bg-[#0F1419]">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={isTyping}
                    className="flex-1 h-11 px-4 rounded-xl bg-[#1A1F26] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#00FF9D]/50 focus:ring-2 focus:ring-[#00FF9D]/20 transition-all disabled:opacity-50"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                    className="h-11 w-11 rounded-xl bg-[#00FF9D] text-black flex items-center justify-center hover:bg-[#00E88A] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    aria-label="Send message"
                  >
                    {isTyping ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
                
                <p className="text-[10px] text-slate-600 text-center mt-2">
                  Aria is an AI assistant. For complex issues, request a support ticket.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default SupportChat;
