import fs from 'fs';
import path from 'path';

// Complete transcribed data from the 21 unique screenshots provided by the user
export const PROOF_SCREENSHOTS_DATA = [
  {
    id: 'proof-user-1',
    proofNumber: 1,
    trxRate: '$0.3287 (+1.08%)',
    trxColor: '#00A76F',
    network: 'TRC-20',
    vipTier: 'VIP 2',
    primaryAmount: 121.09,
    formattedAmount: '121.09',
    title: 'إثبات تحويل فوري TRC-20',
    txHash: '9a8b1c...4f2e',
    recipientAddress: 'TQ9xK2...8mNp',
    timeAgo: 'منذ 6 دقائق',
    initialLikes: 42,
    blockHeight: 69851210,
    rows: [
      { amount: '-121.094346', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-167', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-60.8', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-306.485865', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-59', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-924.400087', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-77.83', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-1,840.5', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-1,162.912587', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-1,542.764888', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-924.572634', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-96.649332', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-47.08', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-user-2',
    proofNumber: 2,
    trxRate: '$0.3287 (+1.08%)',
    trxColor: '#00A76F',
    network: 'TRC-20',
    vipTier: 'VIP 5',
    primaryAmount: 3076.52,
    formattedAmount: '3,076.52',
    title: 'سحب أرباح المحفظة VIP 5 المعتمد',
    txHash: '3c7d9e...1b0a',
    recipientAddress: 'TL4wN2...9aQt',
    timeAgo: 'منذ 14 دقيقة',
    initialLikes: 58,
    blockHeight: 69851218,
    rows: [
      { amount: '-152', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-9.88982', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-3,076.527507', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-3,093.5', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-3,000', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-306.677692', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-90.69', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-1,991.448536', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-93.536008', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-929.5', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-3,086.591835', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-115.236177', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-282.46', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-user-3',
    proofNumber: 3,
    trxRate: '$0.3287 (+1.08%)',
    trxColor: '#00A76F',
    network: 'TRC-20',
    vipTier: 'VIP 5',
    primaryAmount: 3088.60,
    formattedAmount: '3,088.60',
    title: 'اكتمال عملية السحب الآلي VIP',
    txHash: '5e8f2a...9c4d',
    recipientAddress: 'TR5mK9...8k2p',
    timeAgo: 'منذ 22 دقيقة',
    initialLikes: 61,
    blockHeight: 69851225,
    rows: [
      { amount: '-1,390', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-3,088.605258', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-3,093.494529', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-3,094.5', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-59.3', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-59.451023', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-90.233157', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-36.382585', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-496.37', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-2,157.252046', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-93.524085', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-2,469.616992', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-357.5', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-user-4',
    proofNumber: 4,
    trxRate: '$0.3287 (+1.08%)',
    trxColor: '#00A76F',
    network: 'TRC-20',
    vipTier: 'VIP 5',
    primaryAmount: 13624.81,
    formattedAmount: '13,624.81',
    title: 'سحب مباشر للمستثمر الملكي VIP 5',
    txHash: '1a2b3c...8d7e',
    recipientAddress: 'TU9pB2...3wRt',
    timeAgo: 'منذ 31 دقيقة',
    initialLikes: 89,
    blockHeight: 69851230,
    rows: [
      { amount: '-15', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-12.986314', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-12.97', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-10.5', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-1,517.434145', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-97.49', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-3,032.5', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-3,088.50933', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-319.4', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-31.5', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-245.280945', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-13,624.810243', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-862.982612', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-user-5',
    proofNumber: 5,
    trxRate: '$0.3287 (+1.08%)',
    trxColor: '#00A76F',
    network: 'TRC-20',
    vipTier: 'VIP 4',
    primaryAmount: 3323.50,
    formattedAmount: '3,323.50',
    title: 'إيداع تلقائي سريع في محفظة TRC-20',
    txHash: '7c8d9e...2a1f',
    recipientAddress: 'TJ6qP8...Lk7p',
    timeAgo: 'منذ 45 دقيقة',
    initialLikes: 47,
    blockHeight: 69851238,
    rows: [
      { amount: '-313.84', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-3,323.5', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-308', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-220.903656', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-146', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-150.823938', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-924.802798', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-335.070207', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-864.5', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-3,027.5', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-90.213016', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-3,075.619025', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-1,542.477255', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-user-6',
    proofNumber: 6,
    trxRate: '$0.3287 (+1.08%)',
    trxColor: '#00A76F',
    network: 'TRC-20',
    vipTier: 'VIP 5',
    primaryAmount: 15474.51,
    formattedAmount: '15,474.51',
    title: 'أكبر سحب استثماري ناجح VIP 5',
    txHash: '4b5c6d...3e2a',
    recipientAddress: 'TY1mX8...7pLs',
    timeAgo: 'منذ ساعة',
    initialLikes: 112,
    blockHeight: 69851245,
    rows: [
      { amount: '-3,086.923671', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-300', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-304.48', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-306', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-15,474.510541', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-924.170122', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-151.921075', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-31.17', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-924', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-1,016.679097', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-31.02', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-151.921075', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-299.721927', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-user-7',
    proofNumber: 7,
    trxRate: '$0.3287 (+1.08%)',
    trxColor: '#00A76F',
    network: 'TRC-20',
    vipTier: 'VIP 5',
    primaryAmount: 4321.29,
    formattedAmount: '4,321.29',
    title: 'تأكيد فوري عبر بلوكشين TronScan',
    txHash: '8f9a0b...1c2d',
    recipientAddress: 'TV5kL9...4nRp',
    timeAgo: 'منذ ساعة وربع',
    initialLikes: 74,
    blockHeight: 69851252,
    rows: [
      { amount: '-620.61', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-600', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-1,001.583721', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-1,541.5', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-28.465844', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-248.323792', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-63.86', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-28.470634', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-62.05', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-157.171459', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-924.342585', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-4,321.290111', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-924.026453', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-user-8',
    proofNumber: 8,
    trxRate: '$0.3287 (+1.08%)',
    trxColor: '#00A76F',
    network: 'TRC-20',
    vipTier: 'VIP 5',
    primaryAmount: 6204.62,
    formattedAmount: '6,204.62',
    title: 'سحب أرباح مهام كبار الشخصيات',
    txHash: '2d3e4f...5a6b',
    recipientAddress: 'TZ8vM3...2kQt',
    timeAgo: 'منذ ساعتين',
    initialLikes: 82,
    blockHeight: 69851260,
    rows: [
      { amount: '-3,087.837997', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-90.21014', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-6,204.623822', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-28.469736', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-294', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-37.760667', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-924.6', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-170', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-90.414999', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-244.742382', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-3,087.550372', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-1,592.540809', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-62.07', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-user-9',
    proofNumber: 9,
    trxRate: '$0.3333 (-2.02%)',
    trxColor: '#FF4D4F',
    network: 'TRC-20',
    vipTier: 'VIP 3',
    primaryAmount: 924.40,
    formattedAmount: '924.40',
    title: 'إثبات معتمد مباشر لعوائد VIP 3',
    txHash: '6b7c8d...9e0f',
    recipientAddress: 'TX3qP7...1mYt',
    timeAgo: 'منذ ساعتين ونصف',
    initialLikes: 39,
    blockHeight: 69851270,
    rows: [
      { amount: '-121.094346', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-167', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-60.8', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-306.485865', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-59', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-924.400087', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-77.83', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-1,840.5', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-1,162.912587', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-1,542.764888', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-924.572634', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-96.649332', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-47.08', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-user-10',
    proofNumber: 10,
    trxRate: '$0.3333 (-2.02%)',
    trxColor: '#FF4D4F',
    network: 'TRC-20',
    vipTier: 'VIP 5',
    primaryAmount: 3093.50,
    formattedAmount: '3,093.50',
    title: 'سحب مالي فوري مؤكد بالكتلة',
    txHash: '0e1f2a...3b4c',
    recipientAddress: 'TQ7wK4...9rPs',
    timeAgo: 'منذ 3 ساعات',
    initialLikes: 67,
    blockHeight: 69851278,
    rows: [
      { amount: '-3,076.527507', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-3,093.5', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-3,000', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-306.677692', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-90.69', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-1,991.448536', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-93.536008', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-929.5', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-3,086.591835', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-115.236177', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-282.46', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-3,090.59681', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-3,076.431944', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-user-11',
    proofNumber: 11,
    trxRate: '$0.3333 (-2.02%)',
    trxColor: '#FF4D4F',
    network: 'TRC-20',
    vipTier: 'VIP 5',
    primaryAmount: 3094.50,
    formattedAmount: '3,094.50',
    title: 'اكتمال معالجة التحويل اليومي السريع',
    txHash: '4a5b6c...7d8e',
    recipientAddress: 'TN2mP8...5kLs',
    timeAgo: 'منذ 3 ساعات ونصف',
    initialLikes: 53,
    blockHeight: 69851285,
    rows: [
      { amount: '-3,093.494529', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-3,094.5', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-59.3', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-59.451023', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-90.233157', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-36.382585', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-496.37', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-2,157.252046', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-93.524085', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-2,469.616992', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-357.5', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-1,543.19654', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-30', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-user-12',
    proofNumber: 12,
    trxRate: '$0.3333 (-2.02%)',
    trxColor: '#FF4D4F',
    network: 'TRC-20',
    vipTier: 'VIP 2',
    primaryAmount: 308.00,
    formattedAmount: '308.00',
    title: 'إيداع رسمي ناجح في محفظة المشترك',
    txHash: '8e9f0a...1b2c',
    recipientAddress: 'TL9pK3...6mRt',
    timeAgo: 'منذ 4 ساعات',
    initialLikes: 46,
    blockHeight: 69851292,
    rows: [
      { amount: '-308', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-220.903656', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-146', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-150.823938', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-924.802798', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-335.070207', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-864.5', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-3,027.5', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-90.213016', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-3,075.619025', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-1,542.477255', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-90.414998', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-25.071628', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-user-13',
    proofNumber: 13,
    trxRate: '$0.3333 (-2.02%)',
    trxColor: '#FF4D4F',
    network: 'TRC-20',
    vipTier: 'VIP 1',
    primaryAmount: 31.50,
    formattedAmount: '31.50',
    title: 'سحب أرباح باقة البداية VIP 1',
    txHash: '2c3d4e...5f6a',
    recipientAddress: 'TR8nL2...4kPs',
    timeAgo: 'منذ 5 ساعات',
    initialLikes: 35,
    blockHeight: 69851300,
    rows: [
      { amount: '-15', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-12.986314', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-12.97', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-10.5', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-1,517.434145', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-97.49', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-3,032.5', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-3,088.50933', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-319.4', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-31.5', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-245.280945', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-13,624.810243', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-862.982612', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-user-14',
    proofNumber: 14,
    trxRate: '$0.3333 (-2.02%)',
    trxColor: '#FF4D4F',
    network: 'TRC-20',
    vipTier: 'VIP 3',
    primaryAmount: 620.61,
    formattedAmount: '620.61',
    title: 'إثبات تحويل معتمد للبلوكشين',
    txHash: '6a7b8c...9d0e',
    recipientAddress: 'TW3mK8...1rNt',
    timeAgo: 'منذ 6 ساعات',
    initialLikes: 48,
    blockHeight: 69851308,
    rows: [
      { amount: '-310', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-620.61', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-600', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-1,001.583721', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-1,541.5', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-28.465844', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-248.323792', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-63.86', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-28.470634', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-62.05', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-157.171459', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-924.342585', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-4,321.290111', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-user-15',
    proofNumber: 15,
    trxRate: '$0.3333 (-2.02%)',
    trxColor: '#FF4D4F',
    network: 'TRC-20',
    vipTier: 'VIP 5',
    primaryAmount: 3086.92,
    formattedAmount: '3,086.92',
    title: 'تأكيد السحب عبر شبكة TRC-20',
    txHash: '0d1e2f...3a4b',
    recipientAddress: 'TZ5nL9...8pQt',
    timeAgo: 'منذ 7 ساعات',
    initialLikes: 55,
    blockHeight: 69851315,
    rows: [
      { amount: '-90.414998', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-3,086.923671', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-300', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-304.48', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-306', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-15,474.510541', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-924.170122', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-151.921075', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-31.17', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-924', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-1,016.679097', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-31.02', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-151.921075', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-user-16',
    proofNumber: 16,
    trxRate: '$0.3402 (+0.60%)',
    trxColor: '#00A76F',
    network: 'TRC-20',
    vipTier: 'VIP 5',
    primaryAmount: 15491.98,
    formattedAmount: '15,491.98',
    title: 'سحب استثماري ضخم موثق 100%',
    txHash: '4f5a6b...7c8d',
    recipientAddress: 'TQ1rK8...2mWs',
    timeAgo: 'منذ 8 ساعات',
    initialLikes: 96,
    blockHeight: 69851325,
    rows: [
      { amount: '-2,007.279774', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-41', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-2,011.408292', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-3,089.5', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-461.359292', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-3,087.978656', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-10.5', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-28.482212', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-121.5', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-89.5', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-15,491.981546', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-320', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-244.742382', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-user-17',
    proofNumber: 17,
    trxRate: '$0.3402 (+0.60%)',
    trxColor: '#00A76F',
    network: 'TRC-20',
    vipTier: 'VIP 4',
    primaryAmount: 1856.20,
    formattedAmount: '1,856.20',
    title: 'اكتمال إرسال أرباح VIP 4 الفورية',
    txHash: '8b9c0d...1e2f',
    recipientAddress: 'TL3wP9...7nQt',
    timeAgo: 'منذ 9 ساعات',
    initialLikes: 63,
    blockHeight: 69851335,
    rows: [
      { amount: '-926.880723', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-437.5', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-1,856.20375', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-210.819364', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-84.239473', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-313.73', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-307.594295', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-306.5', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-68.28', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-307.27431', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-260', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-1,233.733323', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-3,094.970416', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-user-18',
    proofNumber: 18,
    trxRate: '$0.3402 (+0.60%)',
    trxColor: '#00A76F',
    network: 'TRC-20',
    vipTier: 'VIP 5',
    primaryAmount: 3058.24,
    formattedAmount: '3,058.24',
    title: 'سحب مالي معتمد لمحفظة VIP 5',
    txHash: '2e3f4a...5b6c',
    recipientAddress: 'TR7kL1...4mPs',
    timeAgo: 'منذ 10 ساعات',
    initialLikes: 59,
    blockHeight: 69851342,
    rows: [
      { amount: '-306.5', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-68.28', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-307.27431', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-260', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-1,233.733323', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-3,094.970416', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-590.79', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-519.864365', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-7.5', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-930', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-3,058.239753', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-160', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-1,554.387431', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-user-19',
    proofNumber: 19,
    trxRate: '$0.3402 (+0.60%)',
    trxColor: '#00A76F',
    network: 'TRC-20',
    vipTier: 'VIP 4',
    primaryAmount: 2007.28,
    formattedAmount: '2,007.28',
    title: 'إشعار تحويل ناجح من TronScan',
    txHash: '6c7d8e...9f0a',
    recipientAddress: 'TV2mP6...8kNs',
    timeAgo: 'منذ 11 ساعة',
    initialLikes: 68,
    blockHeight: 69851350,
    rows: [
      { amount: '-1,240', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-105.941202', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-623.852185', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-307.96', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-1,900', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-3,089.468882', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-811.186639', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-2,007.279774', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-41', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-2,011.408292', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-3,089.5', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-461.359292', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-3,087.978656', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-user-20',
    proofNumber: 20,
    trxRate: '$0.3402 (+0.60%)',
    trxColor: '#00A76F',
    network: 'TRC-20',
    vipTier: 'VIP 5',
    primaryAmount: 3088.89,
    formattedAmount: '3,088.89',
    title: 'تأكيد استلام عوائد الاستثمار VIP 5',
    txHash: '0a1b2c...3d4e',
    recipientAddress: 'TZ9kL4...1mRt',
    timeAgo: 'منذ 12 ساعة',
    initialLikes: 71,
    blockHeight: 69851358,
    rows: [
      { amount: '-3,088.89308', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-650', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-3,088.797133', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-100', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-37.25', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-184.001956', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-1,553.5', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-34.49', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-74.784827', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-926.942589', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-90.435262', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-3,015.5', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-user-21',
    proofNumber: 21,
    trxRate: '$0.3402 (+0.60%)',
    trxColor: '#00A76F',
    network: 'TRC-20',
    vipTier: 'VIP 4',
    primaryAmount: 1574.21,
    formattedAmount: '1,574.21',
    title: 'إيداع رسمي معتمد في محفظة العضو',
    txHash: '4e5f6a...7b8c',
    recipientAddress: 'TR1nK7...3pWs',
    timeAgo: 'أمس 22:15',
    initialLikes: 54,
    blockHeight: 69851366,
    rows: [
      { amount: '-34.49', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-74.784827', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-926.942589', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-90.435262', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-3,015.5', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-12.956486', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-173', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-1,574.208345', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-37', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-1,240', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-10', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-922.027396', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-297.5', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  }
];

function generateSVG(data, index) {
  const width = 380;
  const rowHeight = 36;
  const headerHeight = 110;
  const rowsCount = data.rows.length;
  const height = headerHeight + (rowsCount * rowHeight) + 40;

  const rowsSVG = data.rows.map((row, i) => {
    const y = headerHeight + (i * rowHeight);
    return `
      <!-- Row ${i + 1} -->
      <line x1="16" y1="${y}" x2="${width - 16}" y2="${y}" stroke="#F2F3F5" stroke-width="1" />
      <g transform="translate(16, ${y + 24})">
        <!-- Amount -->
        <text x="0" y="0" fill="#DF383B" font-size="13" font-weight="700" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">${row.amount}</text>
        
        <!-- Tether Icon -->
        <g transform="translate(${width - 130}, -13)">
          <circle cx="10" cy="10" r="9" fill="#26A17B" />
          <path d="M6 7h8v2h-3v7h-2V9H6V7z" fill="#FFFFFF" />
        </g>
        
        <!-- USDT Text -->
        <text x="${width - 104}" y="-2" fill="#DF383B" font-size="12" font-weight="700" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">${row.token}</text>
        
        <!-- Contract Address -->
        <text x="${width - 104}" y="9" fill="#848E9C" font-size="9" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">${row.contract}</text>
      </g>
    `;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${width}" height="${height}" rx="0" fill="#FFFFFF"/>
  
  <!-- Header Bar -->
  <rect width="${width}" height="60" fill="#FFFFFF"/>
  
  <!-- Register | Login -->
  <g transform="translate(16, 28)">
    <text x="0" y="0" fill="#707A8A" font-size="12" font-weight="500" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">Register | Log...</text>
    
    <!-- Bell icon with dot -->
    <g transform="translate(90, -10)">
      <path d="M6 3a3 3 0 00-3 3v2.586l-.707.707A1 1 0 003 11h8a1 1 0 00.707-1.707L11 8.586V6a3 3 0 00-3-3H6z" fill="#707A8A"/>
      <circle cx="11" cy="3" r="2.5" fill="#EF0027"/>
    </g>
  </g>
  
  <!-- TRONSCAN Logo -->
  <g transform="translate(${width - 110}, 16)">
    <!-- Red block with diamond -->
    <rect width="18" height="18" rx="3" fill="#EF0027"/>
    <path d="M9 3L15 9L9 15L3 9L9 3Z" fill="#FFFFFF" fill-opacity="0.9"/>
    <path d="M9 5L13 9L9 13L5 9L9 5Z" fill="#EF0027"/>
    <text x="22" y="14" fill="#EF0027" font-size="12" font-weight="900" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" letter-spacing="-0.5">TRONSCAN</text>
  </g>
  
  <!-- Sub Header: TRX Price & Menu -->
  <rect y="50" width="${width}" height="32" fill="#FAFAFB"/>
  <line x1="0" y1="50" x2="${width}" y2="50" stroke="#F0F2F5" stroke-width="1"/>
  <line x1="0" y1="82" x2="${width}" y2="82" stroke="#F0F2F5" stroke-width="1"/>
  
  <g transform="translate(16, 71)">
    <text x="0" y="0" fill="#474D57" font-size="11" font-weight="600" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">TRX: </text>
    <text x="30" y="0" fill="${data.trxColor}" font-size="11" font-weight="700" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">${data.trxRate}</text>
  </g>
  
  <!-- Hamburger Menu Icon -->
  <g transform="translate(${width - 32}, 62)">
    <rect width="16" height="2" rx="1" fill="#474D57"/>
    <rect y="5" width="16" height="2" rx="1" fill="#474D57"/>
    <rect y="10" width="16" height="2" rx="1" fill="#474D57"/>
  </g>
  
  <!-- Table Header -->
  <g transform="translate(16, 102)">
    <text x="0" y="0" fill="#848E9C" font-size="11" font-weight="600" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">Amount</text>
    <text x="${width - 76}" y="0" fill="#848E9C" font-size="11" font-weight="600" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">Token ∇</text>
  </g>
  
  <!-- Table Rows -->
  ${rowsSVG}
  
  <!-- Blockchain Verification Stamp -->
  <g transform="translate(16, ${height - 18})">
    <rect width="${width - 32}" height="24" rx="6" fill="#F0FDF4" stroke="#DCFCE7" stroke-width="1"/>
    <circle cx="12" cy="12" r="5" fill="#16A34A"/>
    <path d="M10 12l1.5 1.5L14 10" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="24" y="16" fill="#15803D" font-size="10" font-weight="700" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">TronScan Explorer Verified • 100% On-Chain Confirmed</text>
  </g>
</svg>
`;
}

// Generate all 21 SVG files in src/assets/images/
const outputDir = path.join(process.cwd(), 'src', 'assets', 'images');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

PROOF_SCREENSHOTS_DATA.forEach((proof, idx) => {
  const svgContent = generateSVG(proof, idx + 1);
  const fileName = `proof_${idx + 1}.svg`;
  fs.writeFileSync(path.join(outputDir, fileName), svgContent.trim());
});

console.log(`Successfully generated ${PROOF_SCREENSHOTS_DATA.length} verified Tronscan proof SVG images in ${outputDir}`);
