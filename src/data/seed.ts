import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

const initialProducts = [
  { name: '濃煮拿鐵', price: 60, description: '經典濃郁拿鐵' },
  { name: '綠茶凍濃煮拿鐵', price: 65, description: '搭配清爽綠茶凍' },
  { name: '鐵觀音拿鐵', price: 60, description: '炭焙茶香回甘' },
  { name: '玄米蕎麥拿鐵', price: 65, description: '無咖啡因，溫潤榖香' },
  { name: '琥珀烤拿鐵', price: 70, description: '琥珀般的焦香氣息' },
  { name: '茉莉綠茶拿鐵', price: 60, description: '茉莉花香四溢' },
  { name: '珍珠濃煮拿鐵', price: 60, description: 'Ｑ彈珍珠必點' },
];

export async function seedData() {
  const productsCol = collection(db, 'products');
  const snapshot = await getDocs(productsCol);
  
  if (snapshot.empty) {
    console.log('Seeding initial products...');
    for (const product of initialProducts) {
      await addDoc(productsCol, product);
    }
    console.log('Seeding complete.');
  }
}
