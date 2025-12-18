import { ArrowDownCircle, ArrowUpCircle, Check, X, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface TransactionItemProps {
  id: string;
  type: 'pay_in' | 'pay_out';
  amount: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  transactionId?: string | null;
  methodName?: string | null;
  methodNumber?: string | null;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  isProcessing?: boolean;
}

export function TransactionItem({ 
  id, 
  type, 
  amount, 
  status, 
  createdAt,
  transactionId,
  methodName,
  methodNumber,
  onAccept, 
  onReject,
  isProcessing = false
}: TransactionItemProps) {
  const isPayIn = type === 'pay_in';
  const isPending = status === 'pending';

  return (
    <div className="card-3d rounded-xl bg-card p-4 animate-scale-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            isPayIn ? "gradient-success" : "gradient-warning"
          )}>
            {isPayIn ? (
              <ArrowDownCircle className="w-5 h-5 text-success-foreground" />
            ) : (
              <ArrowUpCircle className="w-5 h-5 text-warning-foreground" />
            )}
          </div>
          <div>
            <p className="font-semibold text-foreground">{isPayIn ? 'Pay In' : 'Pay Out'}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className={cn(
            "text-lg font-bold",
            isPayIn ? "text-success" : "text-warning"
          )}>
            {isPayIn ? '+' : '-'}৳{amount.toLocaleString()}
          </p>
          {!isPending && (
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              status === 'accepted' ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            )}>
              {status}
            </span>
          )}
        </div>
      </div>

      {/* Transaction ID for Pay In */}
      {transactionId && (
        <div className="mb-3 p-2 rounded-lg bg-muted/30">
          <p className="text-xs text-muted-foreground">Transaction ID</p>
          <p className="text-sm font-medium text-foreground">{transactionId}</p>
        </div>
      )}

      {/* Method Name and Number for Pay Out */}
      {(methodName || methodNumber) && (
        <div className="mb-3 p-2 rounded-lg bg-muted/30 space-y-1">
          {methodName && (
            <div>
              <p className="text-xs text-muted-foreground">Method</p>
              <p className="text-sm font-medium text-foreground">{methodName}</p>
            </div>
          )}
          {methodNumber && (
            <div>
              <p className="text-xs text-muted-foreground">Number</p>
              <p className="text-sm font-medium text-foreground">{methodNumber}</p>
            </div>
          )}
        </div>
      )}

      {isPending && onAccept && onReject && (
        <div className="flex gap-2 pt-3 border-t border-border">
          <Button 
            onClick={() => onAccept(id)}
            className="flex-1 gradient-success text-success-foreground btn-3d"
            size="sm"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-1" />
            )}
            {isProcessing ? 'Processing...' : 'Accept'}
          </Button>
          <Button 
            onClick={() => onReject(id)}
            variant="outline"
            className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
            size="sm"
            disabled={isProcessing}
          >
            <X className="w-4 h-4 mr-1" />
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}
