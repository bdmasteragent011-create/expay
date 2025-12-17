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
    <div className="card-3d rounded-2xl bg-card p-4 animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
          <MessageSquare className="w-4 h-4 text-accent-foreground" />
        </div>
        <h3 className="font-semibold text-foreground">Message From Admin</h3>
      </div>

      {messages.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No messages yet</p>
      ) : (
        <div className="space-y-3 max-h-48 overflow-y-auto">
          {messages.map((message) => (
            <div 
              key={message.id}
              className={`p-3 rounded-xl border transition-all ${
                message.is_read 
                  ? 'bg-muted/50 border-border/50' 
                  : 'bg-accent/5 border-accent/20'
              }`}
            >
              <p className="text-sm text-foreground mb-2">{message.content}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
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
