// src/components/AIPilot.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Bot, X, Send, Minimize2, Maximize2, Sparkles, Trash2
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

const AIPilot: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ===== AUTO-SCROLL TO BOTTOM =====
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // ===== CONTEXT-AWARE INITIAL GREETING =====
  useEffect(() => {
    const path = location.pathname;
    let greeting = "How can I help you with your data today?";

    if (path.includes('/quality')) {
      greeting = "Ready to analyze data quality anomalies.";
    } else if (path.includes('/lineage')) {
      greeting = "I can help trace data dependencies.";
    } else if (path.includes('/catalog')) {
      greeting = "Let me help you explore your data catalog.";
    } else if (path.includes('/enrichment')) {
      greeting = "I can assist with data enrichment and validation.";
    } else if (path.includes('/incidents')) {
      greeting = "I'm here to help you manage data incidents.";
    }

    // Set initial welcome message
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: `👋 Hi! I'm your **AI Data Copilot**. ${greeting}`,
        timestamp: new Date(),
      },
    ]);
  }, [location.pathname]);

  // ===== STREAMING TEXT ANIMATION (TYPEWRITER EFFECT) =====
  const streamResponse = async (fullText: string, messageId: string) => {
    const chars = fullText.split('');
    let currentText = '';

    for (let i = 0; i < chars.length; i++) {
      currentText += chars[i];
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, content: currentText, isStreaming: true }
            : msg
        )
      );

      // Speed: 20ms per character (adjustable)
      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    // Mark streaming complete
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, isStreaming: false } : msg
      )
    );
  };

  // ===== CONTEXT-AWARE AI RESPONSES =====
  const getAIResponse = (userQuery: string): string => {
    const query = userQuery.toLowerCase();
    const path = location.pathname;

    // Quality Page Context
    if (path.includes('/quality')) {
      if (query.includes('scan') || query.includes('check')) {
        return "I can initiate a data quality scan for you. Which table would you like to scan? I'll check for:\n\n• Null values\n• Duplicate records\n• Data type mismatches\n• PII exposure\n• Schema violations\n\nJust provide the table name and I'll start the scan immediately.";
      }
      if (query.includes('anomaly') || query.includes('issue')) {
        return "I've detected 3 active anomalies in your data:\n\n1. **Customers table**: 120 duplicate email addresses\n2. **Orders table**: 45 null values in delivery_date\n3. **Logs table**: 5 PII leaks detected in error messages\n\nWould you like me to generate a remediation plan for any of these?";
      }
      if (query.includes('rule') || query.includes('validation')) {
        return "Let's create a validation rule! I can help you set up:\n\n• **Uniqueness constraints** (e.g., unique emails)\n• **Range validations** (e.g., age between 0-120)\n• **Pattern matching** (e.g., valid phone numbers)\n• **Cross-field checks** (e.g., end_date > start_date)\n\nWhat type of rule would you like to create?";
      }
      return "I specialize in data quality analysis. I can help you scan tables, detect anomalies, create validation rules, or generate quality reports. What would you like to do?";
    }

    // Lineage Page Context
    if (path.includes('/lineage')) {
      if (query.includes('trace') || query.includes('dependency') || query.includes('upstream') || query.includes('downstream')) {
        return "I can trace data lineage for any asset! For example:\n\n**Upstream** (where data comes from):\nMySQL Production DB → Python ETL Script → Customers Table\n\n**Downstream** (where data flows to):\nCustomers Table → PowerBI Dashboard → Email Reports\n\nWhich asset would you like me to trace?";
      }
      if (query.includes('impact') || query.includes('affected')) {
        return "Impact analysis helps you understand what will be affected if you modify a data asset. I can show you:\n\n• All downstream tables and reports\n• Active consumers (dashboards, APIs)\n• Dependencies and breaking changes\n\nWhich table are you planning to modify?";
      }
      return "I can help you explore data lineage, trace dependencies, analyze impact, and visualize data flows. What would you like to know?";
    }

    // Catalog Page Context
    if (path.includes('/catalog')) {
      if (query.includes('search') || query.includes('find')) {
        return "I can help you search the data catalog! I have access to:\n\n• 45 tables across 5 databases\n• 1,200+ columns with metadata\n• Business glossary terms\n• Data owners and stewards\n\nWhat are you looking for?";
      }
      if (query.includes('metadata') || query.includes('description')) {
        return "I can generate metadata descriptions automatically! I'll analyze:\n\n• Column names and data types\n• Sample values and patterns\n• Business context from usage\n• Relationships with other tables\n\nWhich table needs documentation?";
      }
      return "I can help you browse the catalog, search for assets, generate metadata descriptions, and manage data documentation. How can I assist?";
    }

    // Enrichment Page Context
    if (path.includes('/enrichment')) {
      if (query.includes('address') || query.includes('geocode') || query.includes('validate')) {
        return "I can enrich your address data with:\n\n✅ **Standardization** (format consistency)\n✅ **Validation** (deliverability check)\n✅ **Geocoding** (latitude/longitude)\n✅ **Timezone detection**\n\nJust upload a CSV with address columns and I'll handle the rest!";
      }
      return "I specialize in data enrichment! I can validate addresses, add geocoding, detect timezones, and standardize formats. What data needs enriching?";
    }

    // Incidents Page Context
    if (path.includes('/incidents')) {
      if (query.includes('open') || query.includes('active')) {
        return "You have **3 open incidents**:\n\n🔴 **INC-001**: PII leak in logs (Critical)\n🟡 **INC-002**: Duplicate records in customers (High)\n🟢 **INC-003**: Schema mismatch in staging (Medium)\n\nWould you like me to prioritize these or generate a resolution plan?";
      }
      return "I can help you track, prioritize, and resolve data incidents. I'll suggest remediation steps and track resolution progress. What do you need?";
    }

    // General Context
    if (query.includes('dashboard') || query.includes('overview')) {
      return "I can show you key metrics:\n\n• **Data Quality Score**: 87%\n• **Active Scans**: 12 today\n• **Open Incidents**: 3\n• **Compliance Status**: 94% CNDP compliant\n\nWould you like to drill down into any of these?";
    }

    if (query.includes('compliance') || query.includes('cndp') || query.includes('gdpr')) {
      return "I can help you with data compliance! Morocco's **CNDP 09-08** law requires:\n\n✅ PII identification and protection\n✅ Consent tracking\n✅ Data retention policies\n✅ Breach notification procedures\n\nI can scan your data for compliance gaps and generate audit reports. Shall I start?";
    }

    if (query.includes('help') || query.includes('what can you do')) {
      return "I'm your AI-powered data copilot! I can help you with:\n\n🛡️ **Data Quality**: Scan tables, detect anomalies, create rules\n🌳 **Data Lineage**: Trace dependencies, impact analysis\n📚 **Catalog Management**: Search assets, generate metadata\n📍 **Data Enrichment**: Validate addresses, geocoding\n⚠️ **Incident Management**: Track and resolve issues\n📊 **Compliance**: CNDP/GDPR audits and reports\n\nJust ask me anything!";
    }

    // Default response
    return "I understand you're asking about data governance. Could you be more specific? For example:\n\n• \"Scan the customers table\"\n• \"Show me data lineage for orders\"\n• \"What are my open incidents?\"\n• \"Help me with CNDP compliance\"\n\nI'm here to help! 😊";
  };

  // ===== HANDLE SEND MESSAGE =====
  const handleSend = () => {
    if (!inputValue.trim() || isThinking) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    // Show "Thinking..." animation
    setIsThinking(true);

    // Simulate AI thinking delay (1.5 seconds)
    setTimeout(() => {
      setIsThinking(false);

      const responseContent = getAIResponse(inputValue);
      const aiMessageId = (Date.now() + 1).toString();

      const aiResponse: Message = {
        id: aiMessageId,
        role: 'assistant',
        content: '', // Start empty for streaming
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, aiResponse]);

      // Stream the response character by character
      streamResponse(responseContent, aiMessageId);
    }, 1500); // 1.5s thinking time
  };

  // ===== HANDLE ENTER KEY =====
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ===== CLEAR CHAT =====
  const handleClearChat = () => {
    const path = location.pathname;
    let greeting = "How can I help you with your data today?";

    if (path.includes('/quality')) {
      greeting = "Ready to analyze data quality anomalies.";
    } else if (path.includes('/lineage')) {
      greeting = "I can help trace data dependencies.";
    }

    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: `👋 Chat cleared! ${greeting}`,
        timestamp: new Date(),
      },
    ]);
  };

  // ===== TOGGLE WIDGET =====
  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (isMinimized) setIsMinimized(false);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={toggleOpen}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50 group"
        >
          <Bot className="w-8 h-8 text-white" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
          
          {/* Tooltip */}
          <div className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Ask AI Copilot
          </div>
        </button>
      )}

      {/* Floating Chat Window - TALLER */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl shadow-2xl transition-all duration-300 z-50 ${
            isMinimized ? 'h-16 w-96' : 'h-[650px] w-96'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-gray-800 bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">AI Data Copilot</h3>
                <p className="text-xs text-white/80">Always ready to help</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearChat}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title="Clear Chat"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                {isMinimized ? (
                  <Maximize2 className="w-4 h-4 text-white" />
                ) : (
                  <Minimize2 className="w-4 h-4 text-white" />
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Messages Area (Hidden when minimized) */}
          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="h-[480px] overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-gray-800 text-slate-900 dark:text-white'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          {msg.content.split('\n').map((line, idx) => {
                            if (line.startsWith('•')) {
                              return (
                                <div key={idx} className="flex items-start gap-2 mb-1">
                                  <span className="text-purple-600 dark:text-purple-400">•</span>
                                  <span>{line.substring(1).trim()}</span>
                                </div>
                              );
                            }
                            if (line.match(/^\d+\./)) {
                              return (
                                <div key={idx} className="flex items-start gap-2 mb-1">
                                  <span className="font-bold text-purple-600 dark:text-purple-400">
                                    {line.match(/^\d+/)?.[0]}.
                                  </span>
                                  <span>{line.replace(/^\d+\./, '').trim()}</span>
                                </div>
                              );
                            }
                            if (line.includes('**')) {
                              const parts = line.split('**');
                              return (
                                <p key={idx} className="mb-2">
                                  {parts.map((part, i) =>
                                    i % 2 === 1 ? (
                                      <strong key={i} className="font-bold text-purple-600 dark:text-purple-400">
                                        {part}
                                      </strong>
                                    ) : (
                                      part
                                    )
                                  )}
                                </p>
                              );
                            }
                            return line ? <p key={idx} className="mb-2">{line}</p> : <br key={idx} />;
                          })}
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      )}
                      <p className="text-xs opacity-60 mt-2">
                        {msg.timestamp.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Thinking Animation */}
                {isThinking && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-slate-100 dark:bg-gray-800">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div
                            className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"
                            style={{ animationDelay: '0ms' }}
                          />
                          <div
                            className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"
                            style={{ animationDelay: '150ms' }}
                          />
                          <div
                            className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"
                            style={{ animationDelay: '300ms' }}
                          />
                        </div>
                        <span className="text-sm text-slate-600 dark:text-gray-400">
                          Thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-slate-200 dark:border-gray-800">
                <div className="flex items-end gap-2">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about your data..."
                    className="flex-1 px-4 py-3 bg-slate-100 dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 rounded-xl resize-none outline-none focus:ring-2 focus:ring-purple-600 transition-all"
                    rows={2}
                    disabled={isThinking}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isThinking}
                    className={`p-3 rounded-xl transition-all ${
                      inputValue.trim() && !isThinking
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg'
                        : 'bg-slate-200 dark:bg-gray-700 text-slate-400 dark:text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-gray-500 mt-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Context-aware AI • Press Enter to send
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default AIPilot;
