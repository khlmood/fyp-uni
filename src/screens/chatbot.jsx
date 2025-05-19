// src/screens/chatbot.jsx
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AlertCircle, Image, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { fetchWithAuth } from "./fetchHelper";

const GROQ_API_KEY = "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";
const GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"; // Updated to vision-capable model

// Simple spinner component
const Spinner = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };
  const spinnerSize = sizeClasses[size] || sizeClasses.md;
  return (
    <div role="status" className={className}>
      <svg
        aria-hidden="true"
        className={`${spinnerSize} text-gray-200 animate-spin dark:text-gray-600 fill-blue-600`}
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
          fill="currentColor"
        />
        <path
          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
          fill="currentFill"
        />
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Simple avatar component
const Avatar = ({ children, className = "" }) => (
  <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}>
    <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
      {children}
    </div>
  </div>
);

// Typing animation component
const TypingAnimation = ({ fullText, speed = 20, onComplete }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + fullText[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      
      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, fullText, speed, onComplete]);
  
  // Split by newlines and render paragraphs
  return (
    <>
      {displayedText.split('\n').map((line, i) => (
        <p key={i} className={i > 0 ? 'mt-2' : ''}>
          {line}
          {i === displayedText.split('\n').length - 1 && currentIndex < fullText.length && (
            <span className="animate-pulse">|</span>
          )}
        </p>
      ))}
    </>
  );
};

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [portfolioData, setPortfolioData] = useState(null);
  const [watchlistData, setWatchlistData] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [animatingMessageIndex, setAnimatingMessageIndex] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch user's portfolio, watchlist, and profile data on mount
  useEffect(() => {
    async function fetchUserData() {
      try {
        setIsLoading(true);
        
        // Fetch portfolio
        const portfolioResponse = await fetchWithAuth("/api/portfolio");
        setPortfolioData(portfolioResponse?.portfolio || {});
        
        // Fetch watchlist
        const watchlistSymbols = await fetchWithAuth("/api/watch?category=watchlist");
        
        // Fetch quotes for watchlist symbols if we have any
        let watchlistWithQuotes = [];
        if (watchlistSymbols && watchlistSymbols.length > 0) {
          watchlistWithQuotes = await fetchWithAuth(`/api/quotes?symbols=${watchlistSymbols.join(",")}`);
        }
        setWatchlistData(watchlistWithQuotes || []);
        
        // Fetch user profile
        const profileResponse = await fetchWithAuth("/api/getProfile");
        setUserProfile(profileResponse || {});
        
        // Add welcome message - this will be animated
        const welcomeMessage = {
          role: "assistant",
          content: "Hello! I'm your StockSense AI advisor. I can help you with financial advice, stock analysis, and portfolio management. What would you like to know today?",
          isAnimating: true
        };
        setMessages([welcomeMessage]);
        setAnimatingMessageIndex(0);
        
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load your financial data. Some advisor features may be limited.");
        
        // Still add welcome message even if data fetch fails
        const welcomeMessage = {
          role: "assistant",
          content: "Hello! I'm your StockSense AI advisor. I can help you with financial advice, stock analysis, and portfolio management. What would you like to know today?",
          isAnimating: true
        };
        setMessages([welcomeMessage]);
        setAnimatingMessageIndex(0);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUserData();
  }, []);

  // Auto-scroll to bottom of chat when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, animatingMessageIndex]);

  const handleAnimationComplete = (index) => {
    setMessages(prevMessages => prevMessages.map((msg, i) => 
      i === index ? { ...msg, isAnimating: false } : msg
    ));
    setAnimatingMessageIndex(null);
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setError("Please select an image file.");
      return;
    }
    
    if (file.size > 4 * 1024 * 1024) { // 4MB limit
      setError("Image size should be less than 4MB.");
      return;
    }
    
    setSelectedImage(file);
    
    // Create preview for the UI
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Remove selected image
  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Convert image to base64
  const imageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImage) || isLoading || animatingMessageIndex !== null) return;
    
    const userMessage = input.trim();
    setInput("");
    
    // Create message content object
    let messageContent;
    
    if (selectedImage) {
      // Create preview URL for display in chat
      const objectUrl = URL.createObjectURL(selectedImage);
      
      // If we have both text and image
      if (userMessage) {
        messageContent = {
          text: userMessage,
          image: objectUrl
        };
      } else {
        // Just image
        messageContent = {
          image: objectUrl
        };
      }
    } else {
      // Just text
      messageContent = userMessage;
    }
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: "user", content: messageContent }]);
    setIsLoading(true);
    setError(null);
    
    try {
      // Prepare context about user's portfolio
      const portfolioSummary = createPortfolioSummary(portfolioData);
      const watchlistSummary = createWatchlistSummary(watchlistData);
      
      // Call Groq API with or without image
      const response = await callGroqAPI(userMessage, selectedImage, portfolioSummary, watchlistSummary, userProfile);
      
      // Add AI response to chat with animation flag
      const newMessageIndex = messages.length + 1; // +1 for the user message we just added
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: response,
        isAnimating: true 
      }]);
      setAnimatingMessageIndex(newMessageIndex);
      
      // Clear the selected image after sending
      removeSelectedImage();
      
    } catch (err) {
      console.error("Error calling AI:", err);
      setError("Sorry, I couldn't process your request. Please try again later.");
      
      // Add a fallback message with animation
      const newMessageIndex = messages.length + 1;
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "I apologize, but I'm having trouble connecting to my financial analysis services right now. Please try again in a moment.",
        isAnimating: true
      }]);
      setAnimatingMessageIndex(newMessageIndex);
    } finally {
      setIsLoading(false);
    }
  };

  // Format portfolio data for the AI
  const createPortfolioSummary = (portfolio) => {
    if (!portfolio || Object.keys(portfolio).length === 0) {
      return "User has no stocks in their portfolio.";
    }
    
    const stocks = Object.entries(portfolio).map(([symbol, data]) => {
      return `${symbol}: ${data.netShares} shares, invested $${data.invested.toFixed(2)}`;
    }).join("; ");
    
    return `User's portfolio: ${stocks}`;
  };

  // Format watchlist data for the AI
  const createWatchlistSummary = (watchlist) => {
    if (!watchlist || watchlist.length === 0) {
      return "User has no stocks in their watchlist.";
    }
    
    const stocks = watchlist.map(stock => {
      return `${stock.symbol} (${stock.name || 'Unknown'}): $${stock.price?.toFixed(2) || 'N/A'}`;
    }).join("; ");
    
    return `User's watchlist: ${stocks}`;
  };

  // Make the API call to Groq with or without image
  const callGroqAPI = async (message, image, portfolioSummary, watchlistSummary, profile) => {
    const systemPrompt = `You are StockSense AI, a sophisticated financial advisor specializing in stock market analysis and portfolio management. 

Current date: ${new Date().toLocaleDateString()}.

USER CONTEXT:
- Username: ${profile?.username || 'Unknown'}
- Account Balance: $${profile?.balance?.toFixed(2) || 'Unknown'}
- ${portfolioSummary}
- ${watchlistSummary}

Your role is to provide personalized financial advice based on the user's current holdings and market conditions. Be concise and friendly, but professional. Focus on actionable insights rather than generic advice.

When discussing stocks:
1. Analyze portfolio diversity and risk exposure
2. Suggest improvements or rebalancing when appropriate
3. Answer questions about specific stocks in context of the user's goals
4. Avoid making absolute predictions about stock prices
5. For specific stock advice, clarify that you're providing analysis, not financial guarantees
6. Consider current market trends and economic indicators when giving advice
7. Remember to tailor advice based on the user's current holdings

If the user shares an image, analyze what you see in the context of financial advice:
1. If the image shows a stock chart, analyze the pattern and provide insights
2. If the image shows a financial statement, analyze key figures and ratios
3. If the image shows a news article about a company, summarize the key points and their potential impact
4. If the image is not finance-related, politely mention that and try to connect it to financial topics if possible

IMPORTANT: If the user asks about a stock not in their portfolio or watchlist, clearly state you have limited information about that specific stock.

Remember that you are a financial advisor for a stock trading platform. Maintain a professional tone while being conversational. Your responses should be informative yet concise, ideally 2-4 paragraphs.`;
    
    // Prepare messages array
    const messagesArray = [];
    
    // Add system prompt
    messagesArray.push({ role: 'system', content: systemPrompt });
    
    // Add previous messages
    for (const msg of messages) {
      if (msg.role === 'user' && typeof msg.content === 'object') {
        // Skip messages with images for simplicity (would need special handling)
        if (msg.content.text) {
          messagesArray.push({ role: 'user', content: msg.content.text });
        }
      } else {
        messagesArray.push({ role: msg.role, content: msg.content });
      }
    }
    
    // Add current message with or without image
    if (image) {
      // Convert image to base64
      const base64Image = await imageToBase64(image);
      
      // Add current message with image
      messagesArray.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: message || 'What do you see in this image?' // Default text if no message provided
          },
          {
            type: 'image_url',
            image_url: {
              url: base64Image
            }
          }
        ]
      });
    } else {
      // Add text-only message
      messagesArray.push({ role: 'user', content: message });
    }
    
    try {
      // Direct API call to Groq
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: messagesArray,
          temperature: 0.7,
          max_tokens: 800
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error("Groq API error:", data);
        throw new Error(data.error?.message || "Failed to get response from AI");
      }
      
      return data.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
    } catch (error) {
      console.error("API call error:", error);
      throw error;
    }
  };

  // Render message content based on type
  const renderMessageContent = (msg) => {
    if (typeof msg.content === 'object') {
      return (
        <div>
          {msg.content.text && (
            <div className="mb-2">{msg.content.text}</div>
          )}
          {msg.content.image && (
            <div className="mt-2">
              <img 
                src={msg.content.image} 
                alt="User uploaded" 
                className="max-w-full rounded-md max-h-64 object-contain"
              />
            </div>
          )}
        </div>
      );
    } else if (msg.isAnimating) {
      return (
        <TypingAnimation 
          fullText={msg.content} 
          speed={15}
          onComplete={() => handleAnimationComplete(messages.indexOf(msg))}
        />
      );
    } else {
      return msg.content.split('\n').map((line, i) => (
        <p key={i} className={i > 0 ? 'mt-2' : ''}>
          {line}
        </p>
      ));
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col">
      <h1 className="text-2xl font-bold mb-4">🤖 StockSense Advisor</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Messages container */}
      <Card className="flex-grow overflow-y-auto mb-4 p-4">
        {messages.length === 0 && isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Spinner size="lg" />
            <p className="ml-2">Loading your financial data...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <Avatar className={`${msg.role === 'user' ? 'ml-2' : 'mr-2'} h-8 w-8`}>
                    {msg.role === 'user' ? 'U' : 'AI'}
                  </Avatar>
                  <div 
                    className={`rounded-lg p-3 ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                  >
                    {renderMessageContent(msg)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
            
            {/* Loading indicator for responses */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex max-w-[80%]">
                  <Avatar className="mr-2 h-8 w-8">
                    AI
                  </Avatar>
                  <div className="rounded-lg p-4 bg-gray-100 dark:bg-gray-800 flex items-center">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
      
      {/* Image preview */}
      {imagePreview && (
        <div className="mb-2 relative w-fit">
          <img 
            src={imagePreview} 
            alt="Preview" 
            className="h-20 rounded-md object-cover border border-gray-300"
          />
          <button 
            onClick={removeSelectedImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
            aria-label="Remove image"
          >
            <X size={16} />
          </button>
        </div>
      )}
      
      {/* Input form */}
      <form onSubmit={sendMessage} className="flex space-x-2">
        <div className="relative flex-grow">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your portfolio, stock recommendations, or market advice..."
            disabled={isLoading || animatingMessageIndex !== null}
            className="flex-grow pr-10"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            disabled={isLoading || animatingMessageIndex !== null}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            aria-label="Attach image"
          >
            <Image size={20} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
            disabled={isLoading || animatingMessageIndex !== null}
          />
        </div>
        <Button 
          type="submit" 
          disabled={isLoading || (!input.trim() && !selectedImage) || animatingMessageIndex !== null}
        >
          {isLoading ? <Spinner size="sm" /> : "Send"}
        </Button>
      </form>
    </div>
  );
}
