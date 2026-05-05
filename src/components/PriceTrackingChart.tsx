import React from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from "recharts";

const data = [
  { name: "01 م", price: 120, avg: 110 },
  { name: "05 م", price: 140, avg: 115 },
  { name: "10 م", price: 110, avg: 118 },
  { name: "15 م", price: 160, avg: 120 },
  { name: "20 م", price: 180, avg: 125 },
  { name: "25 م", price: 155, avg: 128 },
  { name: "30 م", price: 145, avg: 130 },
];

export function PriceTrackingChart() {
  return (
    <div className="w-full h-[350px] bg-brand-card p-8 rounded-[32px] shadow-2xl border border-white/5 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-success to-brand-accent opacity-50"></div>
      <div className="flex items-center justify-between mb-8" dir="rtl">
        <div>
          <h3 className="text-xl font-bold text-white italic">تتبع أسعار البطاطس (30 يوم)</h3>
          <p className="text-[10px] uppercase tracking-wider text-white/30 mt-1 font-black">MARKET INDEX ANALYTICS</p>
        </div>
        <div className="flex gap-4 text-[10px] font-black uppercase tracking-tighter">
          <div className="flex items-center gap-1.5 text-brand-success">
            <span className="w-2 h-2 rounded-full bg-brand-success"></span>
            السعر حالياً
          </div>
          <div className="flex items-center gap-1.5 text-white/20">
            <span className="w-2 h-2 rounded-full bg-white/20"></span>
            المتوسط
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="75%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.2)', fontWeight: 'bold' }} 
          />
          <YAxis 
            hide 
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#0c110d',
              borderRadius: '16px', 
              border: '1px solid rgba(255,255,255,0.1)', 
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
              direction: 'rtl',
              fontSize: '12px'
            }}
            itemStyle={{ color: '#eab308' }}
          />
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke="#22c55e" 
            strokeWidth={4}
            fillOpacity={1} 
            fill="url(#colorPrice)" 
          />
          <Line 
            type="monotone" 
            dataKey="avg" 
            stroke="rgba(255,255,255,0.1)" 
            strokeDasharray="5 5" 
            strokeWidth={2}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
