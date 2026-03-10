export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'focus-x2',
    name: 'Thẻ Tập Trung x2',
    description: 'Nhân đôi điểm tập trung trong 1 giờ.',
    price: 50,
    icon: '🎯'
  },
  {
    id: 'hint-solve',
    name: 'Gợi Ý Giải Bài',
    description: 'Hệ thống sẽ hướng dẫn chi tiết một bài tập khó.',
    price: 100,
    icon: '💡'
  },
  {
    id: 'energy-boost',
    name: 'Năng Lượng Tức Thì',
    description: 'Hồi phục 10 điểm Thể lực ngay lập tức.',
    price: 30,
    icon: '⚡'
  },
  {
    id: 'rest-pass',
    name: 'Quyền Nghỉ Ngơi',
    description: 'Được phép bỏ qua 1 nhiệm vụ hàng ngày không bị phạt.',
    price: 150,
    icon: '☕'
  },
  {
    id: 'brain-boost',
    name: 'Tăng Trí Lực',
    description: 'Cộng 5 điểm Trí lực ngay lập tức.',
    price: 200,
    icon: '🧠'
  }
];
