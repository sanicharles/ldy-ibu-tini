import React, { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  parseISO
} from 'date-fns';
import { id } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';
import { Order } from './types';

interface CalendarProps {
  orders: Order[];
  onAddOrder: (date: Date) => void;
  onOrderClick: (order: Order) => void;
}

export const CalendarView: React.FC<CalendarProps> = ({ orders, onAddOrder, onOrderClick }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
          {format(currentMonth, 'MMMM yyyy', { locale: id })}
        </h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={nextMonth} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(currentMonth, { weekStartsOn: 1 });
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center font-bold text-xs text-slate-400 uppercase tracking-widest py-2">
          {format(addDays(startDate, i), 'EEE', { locale: id })}
        </div>
      );
    }
    return <div className="grid grid-cols-7 mb-2">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = '';

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd');
        const cloneDay = day;
        
        // Find orders for this day (using createdAt)
        const dayOrders = orders.filter(o => {
          try {
            return isSameDay(parseISO(o.createdAt), cloneDay);
          } catch(e) { return false; }
        });

        days.push(
          <div
            key={day.toString()}
            className={`min-h-[120px] p-2 border border-slate-100 dark:border-slate-800/50 relative group transition-all ${
              !isSameMonth(day, monthStart)
                ? 'bg-slate-50/50 dark:bg-slate-900/20 text-slate-300 dark:text-slate-600'
                : isSameDay(day, new Date())
                ? 'bg-blue-50/30 dark:bg-blue-900/10 text-blue-600 font-bold'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className={`text-sm ${isSameDay(day, new Date()) ? 'w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center' : ''}`}>
                {formattedDate}
              </span>
              <button 
                onClick={(e) => { e.stopPropagation(); onAddOrder(cloneDay); }}
                className="opacity-0 group-hover:opacity-100 p-1 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all"
              >
                <PlusCircle className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-1 overflow-y-auto max-h-[80px] scrollbar-hide">
              {dayOrders.map(order => (
                <div 
                  key={order.id}
                  onClick={() => onOrderClick(order)}
                  className={`text-[10px] p-1.5 rounded-md cursor-pointer truncate font-bold transition-all hover:scale-[1.02] ${
                    order.status === 'Baru' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                    order.status === 'Proses' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' :
                    'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                  }`}
                  title={`${order.customerName} - ${order.serviceType}`}
                >
                  {order.customerName}
                </div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="border-l border-t border-slate-100 dark:border-slate-800/50 rounded-2xl overflow-hidden">{rows}</div>;
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  );
};
