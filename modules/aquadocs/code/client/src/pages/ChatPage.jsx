import { useState, useRef, useEffect } from 'react';
import { searchService } from '../services/searchService';

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m AquaDocs, your SAWS document assistant. Ask me anything about SAWS policies, procedures, permits, or technical documents.',
      sources: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMessage = { role: 'user', content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      // Send only user/assistant messages (not system metadata) to the API
      const apiMessages = updatedMessages.map(({ role, content }) => ({ role, content }));
      const data = await searchService.chat(apiMessages);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          sources: data.sources || [],
        },
      ]);
    } catch (err) {
      setError('Failed to get a response. Please try again.');
      setMessages((prev) => prev.slice(0, -1)); // Remove the user message on error
      setInput(text);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>AI Document Assistant</h1>
        <span style={{ fontSize: 13, color: 'var(--saws-text-muted)' }}>
          Powered by Azure OpenAI + SAWS Document Index
        </span>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.role}`}>
              <div className="chat-bubble">{msg.content}</div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="chat-sources">
                  Sources: {msg.sources.map((s, j) => (
                    <span key={j}>
                      {j > 0 && ', '}
                      <em>{s.title || s}</em>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="chat-message assistant">
              <div className="chat-bubble" style={{ color: 'var(--saws-text-muted)', fontStyle: 'italic' }}>
                Searching documents...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form className="chat-input-row" onSubmit={handleSend}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about SAWS documents..."
            disabled={loading}
          />
          <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
