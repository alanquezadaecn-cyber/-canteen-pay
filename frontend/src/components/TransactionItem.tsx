import React from 'react';
import { ShoppingCart, TrendingUp, RotateCcw } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'PURCHASE' | 'RECHARGE' | 'REFUND';
  amount: string;
  description: string;
  createdAt: string;
}

interface TransactionItemProps {
  transaction: Transaction;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction
}) => {
  const getIcon = () => {
    switch (transaction.type) {
      case 'PURCHASE':
        return <ShoppingCart className="w-5 h-5" />;
      case 'RECHARGE':
        return <TrendingUp className="w-5 h-5" />;
      case 'REFUND':
        return <RotateCcw className="w-5 h-5" />;
    }
  };

  const getColor = () => {
    switch (transaction.type) {
      case 'PURCHASE':
        return 'text-red-600 bg-red-50';
      case 'RECHARGE':
        return 'text-emerald-600 bg-emerald-50';
      case 'REFUND':
        return 'text-blue-600 bg-blue-50';
    }
  };

  const getAmountSign = () => {
    if (transaction.type === 'PURCHASE' || transaction.type === 'REFUND') {
      return '-';
    }
    return '+';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
      <div className="flex items-center gap-4 flex-1">
        <div className={`p-3 rounded-lg ${getColor()}`}>
          {getIcon()}
        </div>
        <div className="flex-1">
          <p className="font-medium text-slate-900">{transaction.description}</p>
          <p className="text-xs text-slate-500">{formatDate(transaction.createdAt)}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-semibold ${
          transaction.type === 'RECHARGE' ? 'text-emerald-600' : 'text-red-600'
        }`}>
          {getAmountSign()}${parseFloat(transaction.amount).toFixed(2)}
        </p>
      </div>
    </div>
  );
};
