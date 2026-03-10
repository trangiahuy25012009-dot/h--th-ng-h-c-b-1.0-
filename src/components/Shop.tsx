import React from 'react';
import { SHOP_ITEMS } from '../constants/shopItems';

interface ShopProps {
  points: number;
  setPoints: React.Dispatch<React.SetStateAction<number>>;
}

export default function Shop({ points, setPoints }: ShopProps) {
  const handlePurchase = (item: typeof SHOP_ITEMS[0]) => {
    if (points >= item.price) {
      setPoints(prev => prev - item.price);
      alert(`Đã mua thành công: ${item.name}!`);
      // Here you would add logic to apply the item's effect
    } else {
      alert('Không đủ Tích phân!');
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-md border border-zinc-200">
      <h2 className="text-2xl font-bold mb-4 text-zinc-900">Cửa Hàng Hệ Thống</h2>
      <p className="mb-6 text-zinc-600">Tích phân hiện tại: <span className="font-bold text-emerald-600">{points}</span></p>
      <div className="grid grid-cols-1 gap-4">
        {SHOP_ITEMS.map(item => (
          <div key={item.id} className="flex items-center justify-between p-4 border border-zinc-100 rounded-xl hover:bg-zinc-50 transition">
            <div className="flex items-center gap-4">
              <span className="text-3xl">{item.icon}</span>
              <div>
                <h3 className="font-semibold text-zinc-900">{item.name}</h3>
                <p className="text-sm text-zinc-500">{item.description}</p>
              </div>
            </div>
            <button
              onClick={() => handlePurchase(item)}
              className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-700 transition font-medium"
            >
              {item.price} Tích phân
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
