import { MessageSquare, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface MessageBoxProps {
  messages: Message[];
}

export function MessageBox({ messages }: MessageBoxProps) {
  return (
    <div 
      className="rounded-2xl p-4 animate-slide-up"
      style={{
        background: '#ffffff',
        boxShadow: '0 18px 45px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #8a63ff, #c7b8ff)',
            boxShadow: '0 6px 16px rgba(138,99,255,0.25)',
          }}
        >
          {/* Glossy highlight */}
          <div 
            className="absolute top-0 left-0 right-0 h-[1px]"
            style={{
              background: 'linear-gradient(to right, rgba(255,255,255,0.4), rgba(255,255,255,0.1), rgba(255,255,255,0.4))',
            }}
          />
          <MessageSquare className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-semibold" style={{ color: '#1a1a2e' }}>Message From Admin</h3>
      </div>

      {messages.length === 0 ? (
        <p className="text-sm text-center py-6" style={{ color: '#7a7f99' }}>No messages yet</p>
      ) : (
        <div className="space-y-3 max-h-48 overflow-y-auto">
          {messages.map((message) => (
            <div 
              key={message.id}
              className="p-3 rounded-xl transition-all"
              style={{
                background: message.is_read ? '#f4f5f7' : 'rgba(138,99,255,0.08)',
                border: `1px solid ${message.is_read ? 'rgba(0,0,0,0.04)' : 'rgba(138,99,255,0.2)'}`,
              }}
            >
              <p className="text-sm mb-2" style={{ color: '#1a1a2e' }}>{message.content}</p>
              <div className="flex items-center gap-1 text-xs" style={{ color: '#7a7f99' }}>
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
