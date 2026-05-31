import PageHeader from '../components/PageHeader';
import { Smartphone, Store, Zap, Users, CreditCard, UtensilsCrossed, Tag } from 'lucide-react';

const offers = [
  { icon: Smartphone,     title: 'Recharge Cashback',  desc: '10% cashback on Grameenphone recharge above ৳99',  tag: 'CASHBACK',  bg: 'bg-blue-50',   color: 'text-blue-600' },
  { icon: Store,          title: 'Merchant Offer',      desc: '৳20 off on payment at partner shops',               tag: 'OFFER',     bg: 'bg-purple-50', color: 'text-purple-600' },
  { icon: Zap,            title: 'Electricity Bill',    desc: 'Free service fee on electricity bill payment',       tag: 'FREE FEE',  bg: 'bg-yellow-50', color: 'text-yellow-600' },
  { icon: Users,          title: 'Refer & Earn',        desc: 'Earn ৳50 for every friend you refer to XCash',      tag: 'REFERRAL',  bg: 'bg-green-50',  color: 'text-green-600' },
  { icon: CreditCard,     title: 'Card Cashback',       desc: '2% cashback when you add money via card',            tag: 'CASHBACK',  bg: 'bg-teal-50',   color: 'text-teal-600' },
  { icon: UtensilsCrossed,title: 'Food Partners',       desc: 'Up to 30% off at Pathao Food & Shohoz Food',        tag: 'DISCOUNT',  bg: 'bg-orange-50', color: 'text-orange-500' },
];

const tagColors = {
  CASHBACK: 'bg-green-100 text-green-700',
  OFFER:    'bg-purple-100 text-purple-700',
  'FREE FEE':'bg-yellow-100 text-yellow-700',
  REFERRAL: 'bg-blue-100 text-blue-700',
  DISCOUNT: 'bg-orange-100 text-orange-700',
};

export default function Rewards() {
  return (
    <div className="flex flex-col min-h-screen bg-[#f5f3ff] pb-20">
      <div className="p-4 bg-white border-b border-violet-50 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-gray-800">Rewards & Offers</h1>
      </div>
      <div className="p-4 flex flex-col gap-3">
        <div className="bg-gradient-to-r from-violet-600 to-purple-700 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Tag size={16} className="text-violet-200" />
            <p className="text-xs text-violet-200">Total Cashback Earned</p>
          </div>
          <p className="text-3xl font-extrabold">৳0.00</p>
          <p className="text-xs text-violet-200 mt-1">Start transacting to earn rewards!</p>
        </div>

        <p className="text-sm font-semibold text-gray-600 mt-1">Available Offers</p>
        {offers.map((o, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm flex gap-3">
            <div className={`w-12 h-12 ${o.bg} rounded-xl flex items-center justify-center shrink-0`}>
              <o.icon size={22} className={o.color} strokeWidth={1.8} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <p className="font-semibold text-gray-800 text-sm">{o.title}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${tagColors[o.tag] || 'bg-gray-100 text-gray-600'}`}>{o.tag}</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{o.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
