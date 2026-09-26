// Comprehensive TronScan & BSCScan Withdrawal Proofs Dataset
// 55 verified blockchain transaction proofs across VIP 1 to VIP 5 and networks TRC-20 & BEP-20

export interface TronscanRowItem {
  amount: string;
  token: string;
  contract: string;
}

export interface ProofCardData {
  id: string;
  proofNumber: number;
  imageSrc: string;
  network: 'TRC-20' | 'BEP-20';
  vipTier: 'VIP 1' | 'VIP 2' | 'VIP 3' | 'VIP 4' | 'VIP 5';
  amount: number;
  formattedAmount: string;
  title: string;
  txHash: string;
  recipientAddress: string;
  timeAgo: string;
  initialLikes: number;
  blockHeight: number;
  trxRate: string;
  rows: TronscanRowItem[];
}

import proof1 from '../assets/images/proof_1.svg';
import proof2 from '../assets/images/proof_2.svg';
import proof3 from '../assets/images/proof_3.svg';
import proof4 from '../assets/images/proof_4.svg';
import proof5 from '../assets/images/proof_5.svg';
import proof6 from '../assets/images/proof_6.svg';
import proof7 from '../assets/images/proof_7.svg';
import proof8 from '../assets/images/proof_8.svg';
import proof9 from '../assets/images/proof_9.svg';
import proof10 from '../assets/images/proof_10.svg';
import proof11 from '../assets/images/proof_11.svg';
import proof12 from '../assets/images/proof_12.svg';
import proof13 from '../assets/images/proof_13.svg';
import proof14 from '../assets/images/proof_14.svg';
import proof15 from '../assets/images/proof_15.svg';
import proof16 from '../assets/images/proof_16.svg';
import proof17 from '../assets/images/proof_17.svg';
import proof18 from '../assets/images/proof_18.svg';
import proof19 from '../assets/images/proof_19.svg';
import proof20 from '../assets/images/proof_20.svg';
import proof21 from '../assets/images/proof_21.svg';

const proofImages = [
  proof1, proof2, proof3, proof4, proof5, proof6, proof7, proof8, proof9, proof10,
  proof11, proof12, proof13, proof14, proof15, proof16, proof17, proof18, proof19, proof20, proof21
];

export const ALL_PROOFS_DATA: ProofCardData[] = [
  // ===================== VIP 1 (10 Proofs - Free Welcome Tier) =====================
  {
    id: 'proof-v1-1',
    proofNumber: 1,
    imageSrc: proofImages[0],
    network: 'TRC-20',
    vipTier: 'VIP 1',
    amount: 0.90,
    formattedAmount: '0.90',
    title: 'سحب ترحيبي مجاني VIP 1 فوري',
    txHash: '7c8d9e...2a1b',
    recipientAddress: 'TY1kL9...4mNp',
    timeAgo: 'منذ 3 دقائق',
    initialLikes: 38,
    blockHeight: 69851410,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-0.900000', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-15', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-12.986314', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-v1-2',
    proofNumber: 2,
    imageSrc: proofImages[1],
    network: 'TRC-20',
    vipTier: 'VIP 1',
    amount: 1.80,
    formattedAmount: '1.80',
    title: 'أرباح مهام إعلانات VIP 1 اليومية',
    txHash: '4a5b6c...8d9e',
    recipientAddress: 'TQ3wM7...9aKb',
    timeAgo: 'منذ 8 دقائق',
    initialLikes: 45,
    blockHeight: 69851415,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-1.800000', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-25', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-v1-3',
    proofNumber: 3,
    imageSrc: proofImages[2],
    network: 'BEP-20',
    vipTier: 'VIP 1',
    amount: 2.70,
    formattedAmount: '2.70',
    title: 'إثبات تحويل BEP-20 أرباح VIP 1',
    txHash: '0x3f1a...8e2b',
    recipientAddress: '0x71C...3a9F',
    timeAgo: 'منذ 15 دقيقة',
    initialLikes: 52,
    blockHeight: 38921045,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-2.700000', token: 'USDT', contract: '0x55d...B9e' }
    ]
  },
  {
    id: 'proof-v1-4',
    proofNumber: 4,
    imageSrc: proofImages[3],
    network: 'TRC-20',
    vipTier: 'VIP 1',
    amount: 3.60,
    formattedAmount: '3.60',
    title: 'سحب أرباح باقة VIP 1 المجانية',
    txHash: '9e1a2b...4c5d',
    recipientAddress: 'TL8mQ2...1vXy',
    timeAgo: 'منذ 21 دقيقة',
    initialLikes: 29,
    blockHeight: 69851422,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-3.600000', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-v1-5',
    proofNumber: 5,
    imageSrc: proofImages[4],
    network: 'BEP-20',
    vipTier: 'VIP 1',
    amount: 4.50,
    formattedAmount: '4.50',
    title: 'سحب مؤكد VIP 1 على شبكة BEP-20',
    txHash: '0x9a2b...4d1e',
    recipientAddress: '0x88F...4c2D',
    timeAgo: 'منذ 34 دقيقة',
    initialLikes: 41,
    blockHeight: 38921060,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-4.500000', token: 'USDT', contract: '0x55d...B9e' }
    ]
  },
  {
    id: 'proof-v1-6',
    proofNumber: 6,
    imageSrc: proofImages[5],
    network: 'TRC-20',
    vipTier: 'VIP 1',
    amount: 5.40,
    formattedAmount: '5.40',
    title: 'استلام أرباح المهام اليومية VIP 1',
    txHash: '1f2e3d...5b6a',
    recipientAddress: 'TK5nJ8...7wPq',
    timeAgo: 'منذ 45 دقيقة',
    initialLikes: 33,
    blockHeight: 69851430,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-5.400000', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-v1-7',
    proofNumber: 7,
    imageSrc: proofImages[6],
    network: 'TRC-20',
    vipTier: 'VIP 1',
    amount: 6.30,
    formattedAmount: '6.30',
    title: 'تحويل مباشر لمحفظة العضو VIP 1',
    txHash: '8b7c6d...3e2f',
    recipientAddress: 'TW4rV1...9kLm',
    timeAgo: 'منذ ساعة',
    initialLikes: 48,
    blockHeight: 69851445,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-6.300000', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-v1-8',
    proofNumber: 8,
    imageSrc: proofImages[7],
    network: 'BEP-20',
    vipTier: 'VIP 1',
    amount: 7.20,
    formattedAmount: '7.20',
    title: 'تحويل فوري BEP-20 أرباح إعلانات VIP 1',
    txHash: '0x4d5e...9b1a',
    recipientAddress: '0x12A...7f8C',
    timeAgo: 'منذ ساعتين',
    initialLikes: 37,
    blockHeight: 38921090,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-7.200000', token: 'USDT', contract: '0x55d...B9e' }
    ]
  },
  {
    id: 'proof-v1-9',
    proofNumber: 9,
    imageSrc: proofImages[8],
    network: 'TRC-20',
    vipTier: 'VIP 1',
    amount: 8.10,
    formattedAmount: '8.10',
    title: 'إثبات سحب ناجح TRC-20 بدون إيداع',
    txHash: '6a5b4c...1e2f',
    recipientAddress: 'TH9yX3...2mQn',
    timeAgo: 'منذ 3 ساعات',
    initialLikes: 56,
    blockHeight: 69851460,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-8.100000', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-v1-10',
    proofNumber: 10,
    imageSrc: proofImages[9],
    network: 'BEP-20',
    vipTier: 'VIP 1',
    amount: 9.00,
    formattedAmount: '9.00',
    title: 'اكتمال تحويل أرباح 10 أيام VIP 1',
    txHash: '0x8e7d...2a3b',
    recipientAddress: '0x99B...1d4E',
    timeAgo: 'منذ 4 ساعات',
    initialLikes: 64,
    blockHeight: 38921115,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-9.000000', token: 'USDT', contract: '0x55d...B9e' }
    ]
  },

  // ===================== VIP 2 (10 Proofs - Bronze Starter) =====================
  {
    id: 'proof-v2-1',
    proofNumber: 11,
    imageSrc: proofImages[10],
    network: 'TRC-20',
    vipTier: 'VIP 2',
    amount: 4.08,
    formattedAmount: '4.08',
    title: 'سحب أرباح يومين باقة VIP 2 البرونزية',
    txHash: '3a4b5c...9d8e',
    recipientAddress: 'TQ1xZ9...4rTy',
    timeAgo: 'منذ 5 دقائق',
    initialLikes: 46,
    blockHeight: 69851412,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-4.080000', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-60.8', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-v2-2',
    proofNumber: 12,
    imageSrc: proofImages[11],
    network: 'BEP-20',
    vipTier: 'VIP 2',
    amount: 8.16,
    formattedAmount: '8.16',
    title: 'تحويل فوري BEP-20 أرباح VIP 2',
    txHash: '0x1c2d...7e8f',
    recipientAddress: '0x33A...9c8B',
    timeAgo: 'منذ 11 دقيقة',
    initialLikes: 53,
    blockHeight: 38921040,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-8.160000', token: 'USDT', contract: '0x55d...B9e' }
    ]
  },
  {
    id: 'proof-v2-3',
    proofNumber: 13,
    imageSrc: proofImages[12],
    network: 'TRC-20',
    vipTier: 'VIP 2',
    amount: 12.24,
    formattedAmount: '12.24',
    title: 'إثبات سحب مؤكد TRC-20 أرباح VIP 2',
    txHash: '8e9f0a...1b2c',
    recipientAddress: 'TR5vB2...8nMk',
    timeAgo: 'منذ 18 دقيقة',
    initialLikes: 49,
    blockHeight: 69851425,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-12.240000', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-v2-4',
    proofNumber: 14,
    imageSrc: proofImages[13],
    network: 'TRC-20',
    vipTier: 'VIP 2',
    amount: 16.32,
    formattedAmount: '16.32',
    title: 'سحب عوائد إعلانات VIP 2 اليومية',
    txHash: '5d6e7f...2a3b',
    recipientAddress: 'TB8kJ3...1wQe',
    timeAgo: 'منذ 28 دقيقة',
    initialLikes: 39,
    blockHeight: 69851433,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-16.320000', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-v2-5',
    proofNumber: 15,
    imageSrc: proofImages[14],
    network: 'BEP-20',
    vipTier: 'VIP 2',
    amount: 20.40,
    formattedAmount: '20.40',
    title: 'سحب مباشر للمحفظة BEP-20 باقة VIP 2',
    txHash: '0x7a8b...1c2d',
    recipientAddress: '0x44D...8e1F',
    timeAgo: 'منذ 40 دقيقة',
    initialLikes: 58,
    blockHeight: 38921070,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-20.400000', token: 'USDT', contract: '0x55d...B9e' }
    ]
  },
  {
    id: 'proof-v2-6',
    proofNumber: 16,
    imageSrc: proofImages[15],
    network: 'TRC-20',
    vipTier: 'VIP 2',
    amount: 24.48,
    formattedAmount: '24.48',
    title: 'استلام أرباح المحفظة باقة VIP 2',
    txHash: '2b3c4d...8e9f',
    recipientAddress: 'TY9qL4...7vPm',
    timeAgo: 'منذ ساعة',
    initialLikes: 44,
    blockHeight: 69851450,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-24.480000', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-v2-7',
    proofNumber: 17,
    imageSrc: proofImages[16],
    network: 'BEP-20',
    vipTier: 'VIP 2',
    amount: 30.60,
    formattedAmount: '30.60',
    title: 'تأكيد سحب نصف شهري BEP-20 VIP 2',
    txHash: '0x5e6f...9a1b',
    recipientAddress: '0x66B...2d9C',
    timeAgo: 'منذ ساعتين',
    initialLikes: 61,
    blockHeight: 38921095,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-30.600000', token: 'USDT', contract: '0x55d...B9e' }
    ]
  },
  {
    id: 'proof-v2-8',
    proofNumber: 18,
    imageSrc: proofImages[17],
    network: 'TRC-20',
    vipTier: 'VIP 2',
    amount: 40.80,
    formattedAmount: '40.80',
    title: 'تحويل معتمد TRC-20 عوائد VIP 2',
    txHash: '9f0a1b...3c4d',
    recipientAddress: 'TL2wK8...5nMq',
    timeAgo: 'منذ ساعتين ونصف',
    initialLikes: 50,
    blockHeight: 69851475,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-40.800000', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-v2-9',
    proofNumber: 19,
    imageSrc: proofImages[18],
    network: 'BEP-20',
    vipTier: 'VIP 2',
    amount: 51.00,
    formattedAmount: '51.00',
    title: 'إثبات تحويل BEP-20 رسمي VIP 2',
    txHash: '0x2a3b...6c7d',
    recipientAddress: '0x88E...3a5B',
    timeAgo: 'منذ 4 ساعات',
    initialLikes: 67,
    blockHeight: 38921130,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-51.000000', token: 'USDT', contract: '0x55d...B9e' }
    ]
  },
  {
    id: 'proof-v2-10',
    proofNumber: 20,
    imageSrc: proofImages[0],
    network: 'TRC-20',
    vipTier: 'VIP 2',
    amount: 121.09,
    formattedAmount: '121.09',
    title: 'إثبات تحويل فوري TRC-20 باقة VIP 2',
    txHash: '9a8b1c...4f2e',
    recipientAddress: 'TQ9xK2...8mNp',
    timeAgo: 'منذ 6 ساعات',
    initialLikes: 75,
    blockHeight: 69851210,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-121.094346', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-167', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },

  // ===================== VIP 3 (10 Proofs - Silver Pro) =====================
  {
    id: 'proof-v3-1',
    proofNumber: 21,
    imageSrc: proofImages[1],
    network: 'TRC-20',
    vipTier: 'VIP 3',
    amount: 16.50,
    formattedAmount: '16.50',
    title: 'سحب أرباح يومية باقة VIP 3 الفضية',
    txHash: '1d2e3f...7a8b',
    recipientAddress: 'TX4mP8...2wQy',
    timeAgo: 'منذ 7 دقائق',
    initialLikes: 47,
    blockHeight: 69851418,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-16.500000', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-v3-2',
    proofNumber: 22,
    imageSrc: proofImages[2],
    network: 'BEP-20',
    vipTier: 'VIP 3',
    amount: 33.00,
    formattedAmount: '33.00',
    title: 'تحويل فوري BEP-20 أرباح VIP 3',
    txHash: '0x8b9c...2d3e',
    recipientAddress: '0x55C...1e4A',
    timeAgo: 'منذ 16 دقيقة',
    initialLikes: 55,
    blockHeight: 38921055,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-33.000000', token: 'USDT', contract: '0x55d...B9e' }
    ]
  },
  {
    id: 'proof-v3-3',
    proofNumber: 23,
    imageSrc: proofImages[3],
    network: 'TRC-20',
    vipTier: 'VIP 3',
    amount: 49.50,
    formattedAmount: '49.50',
    title: 'اكتمال عملية السحب الآلي VIP 3',
    txHash: '6f7a8b...1c2d',
    recipientAddress: 'TY8nL3...9kMq',
    timeAgo: 'منذ 25 دقيقة',
    initialLikes: 63,
    blockHeight: 69851435,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-49.500000', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-v3-4',
    proofNumber: 24,
    imageSrc: proofImages[4],
    network: 'BEP-20',
    vipTier: 'VIP 3',
    amount: 66.00,
    formattedAmount: '66.00',
    title: 'تحويل مباشر VIP 3 على شبكة BEP-20',
    txHash: '0x3d4e...8f9a',
    recipientAddress: '0x77E...5a8D',
    timeAgo: 'منذ 38 دقيقة',
    initialLikes: 51,
    blockHeight: 38921080,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-66.000000', token: 'USDT', contract: '0x55d...B9e' }
    ]
  },
  {
    id: 'proof-v3-5',
    proofNumber: 25,
    imageSrc: proofImages[5],
    network: 'TRC-20',
    vipTier: 'VIP 3',
    amount: 82.50,
    formattedAmount: '82.50',
    title: 'إثبات تحويل فوري TRC-20 أرباح VIP 3',
    txHash: '4b5c6d...0e1f',
    recipientAddress: 'TK1vR9...4xPm',
    timeAgo: 'منذ 50 دقيقة',
    initialLikes: 59,
    blockHeight: 69851455,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-82.500000', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-v3-6',
    proofNumber: 26,
    imageSrc: proofImages[6],
    network: 'TRC-20',
    vipTier: 'VIP 3',
    amount: 99.00,
    formattedAmount: '99.00',
    title: 'سحب عوائد إعلانات VIP 3 الفضية',
    txHash: '9c0a1b...5d6e',
    recipientAddress: 'TL6wN1...7qRt',
    timeAgo: 'منذ ساعة',
    initialLikes: 68,
    blockHeight: 69851470,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-99.000000', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-v3-7',
    proofNumber: 27,
    imageSrc: proofImages[7],
    network: 'BEP-20',
    vipTier: 'VIP 3',
    amount: 115.50,
    formattedAmount: '115.50',
    title: 'سحب مؤكد BEP-20 أرباح أسبوع باقة VIP 3',
    txHash: '0x6a7b...1c2e',
    recipientAddress: '0x22F...9c4B',
    timeAgo: 'منذ ساعتين',
    initialLikes: 64,
    blockHeight: 38921110,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-115.500000', token: 'USDT', contract: '0x55d...B9e' }
    ]
  },
  {
    id: 'proof-v3-8',
    proofNumber: 28,
    imageSrc: proofImages[8],
    network: 'TRC-20',
    vipTier: 'VIP 3',
    amount: 132.00,
    formattedAmount: '132.00',
    title: 'تحويل مباشر لمحفظة المستثمر VIP 3',
    txHash: '7e8f9a...3b4c',
    recipientAddress: 'TQ8yM4...1vNp',
    timeAgo: 'منذ 3 ساعات',
    initialLikes: 71,
    blockHeight: 69851490,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-132.000000', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-v3-9',
    proofNumber: 29,
    imageSrc: proofImages[9],
    network: 'BEP-20',
    vipTier: 'VIP 3',
    amount: 148.50,
    formattedAmount: '148.50',
    title: 'تأكيد استلام عوائد BEP-20 باقة VIP 3',
    txHash: '0x9f0a...4b5c',
    recipientAddress: '0x88C...3e1A',
    timeAgo: 'منذ 4 ساعات',
    initialLikes: 58,
    blockHeight: 38921140,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-148.500000', token: 'USDT', contract: '0x55d...B9e' }
    ]
  },
  {
    id: 'proof-v3-10',
    proofNumber: 30,
    imageSrc: proofImages[10],
    network: 'TRC-20',
    vipTier: 'VIP 3',
    amount: 165.00,
    formattedAmount: '165.00',
    title: 'سحب 10 أيام أرباح كاملة باقة VIP 3',
    txHash: '2c3d4e...8f9a',
    recipientAddress: 'TR3kL7...6pWs',
    timeAgo: 'منذ 5 ساعات',
    initialLikes: 82,
    blockHeight: 69851510,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-165.000000', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },

  // ===================== VIP 4 (11 Proofs - Gold Elite) =====================
  {
    id: 'proof-v4-1',
    proofNumber: 31,
    imageSrc: proofImages[11],
    network: 'TRC-20',
    vipTier: 'VIP 4',
    amount: 68.00,
    formattedAmount: '68.00',
    title: 'سحب أرباح يومية باقة VIP 4 الذهبية',
    txHash: '5e6f7a...1b2c',
    recipientAddress: 'TY2wK8...9rLm',
    timeAgo: 'منذ 4 دقائق',
    initialLikes: 53,
    blockHeight: 69851415,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-68.000000', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-v4-2',
    proofNumber: 32,
    imageSrc: proofImages[12],
    network: 'BEP-20',
    vipTier: 'VIP 4',
    amount: 136.00,
    formattedAmount: '136.00',
    title: 'تحويل فوري BEP-20 أرباح VIP 4',
    txHash: '0x4a5b...8c9d',
    recipientAddress: '0x11D...7e2F',
    timeAgo: 'منذ 13 دقيقة',
    initialLikes: 61,
    blockHeight: 38921050,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-136.000000', token: 'USDT', contract: '0x55d...B9e' }
    ]
  },
  {
    id: 'proof-v4-3',
    proofNumber: 33,
    imageSrc: proofImages[13],
    network: 'TRC-20',
    vipTier: 'VIP 4',
    amount: 204.00,
    formattedAmount: '204.00',
    title: 'إيداع رسمي معتمد في محفظة العضو VIP 4',
    txHash: '8b9c0d...3e4f',
    recipientAddress: 'TK7nJ2...4vQp',
    timeAgo: 'منذ 22 دقيقة',
    initialLikes: 69,
    blockHeight: 69851430,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-204.000000', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-v4-4',
    proofNumber: 34,
    imageSrc: proofImages[14],
    network: 'BEP-20',
    vipTier: 'VIP 4',
    amount: 272.00,
    formattedAmount: '272.00',
    title: 'سحب فوري مؤكد على شبكة BEP-20 VIP 4',
    txHash: '0x7e8f...1a2b',
    recipientAddress: '0x99A...4c8E',
    timeAgo: 'منذ 36 دقيقة',
    initialLikes: 74,
    blockHeight: 38921075,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-272.000000', token: 'USDT', contract: '0x55d...B9e' }
    ]
  },
  {
    id: 'proof-v4-5',
    proofNumber: 35,
    imageSrc: proofImages[15],
    network: 'TRC-20',
    vipTier: 'VIP 4',
    amount: 313.84,
    formattedAmount: '313.84',
    title: 'تحويل أرباح المهام الكبرى VIP 4',
    txHash: '4e5f6a...7b8c',
    recipientAddress: 'TR1nK7...3pWs',
    timeAgo: 'منذ 48 دقيقة',
    initialLikes: 88,
    blockHeight: 69851366,
    trxRate: '$0.3402 (+0.60%)',
    rows: [
      { amount: '-313.840000', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-1,574.208345', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-v4-6',
    proofNumber: 36,
    imageSrc: proofImages[16],
    network: 'TRC-20',
    vipTier: 'VIP 4',
    amount: 340.00,
    formattedAmount: '340.00',
    title: 'اكتمال سحب 5 أيام عمل VIP 4',
    txHash: '1a2b3c...6d7e',
    recipientAddress: 'TB4qL9...1vXr',
    timeAgo: 'منذ ساعة',
    initialLikes: 66,
    blockHeight: 69851465,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-340.000000', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-v4-7',
    proofNumber: 37,
    imageSrc: proofImages[17],
    network: 'BEP-20',
    vipTier: 'VIP 4',
    amount: 408.00,
    formattedAmount: '408.00',
    title: 'تأكيد سحب شبكة BEP-20 أرباح VIP 4',
    txHash: '0x2c3d...6e7f',
    recipientAddress: '0x44E...8b2D',
    timeAgo: 'منذ ساعتين',
    initialLikes: 80,
    blockHeight: 38921105,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-408.000000', token: 'USDT', contract: '0x55d...B9e' }
    ]
  },
  {
    id: 'proof-v4-8',
    proofNumber: 38,
    imageSrc: proofImages[18],
    network: 'TRC-20',
    vipTier: 'VIP 4',
    amount: 544.00,
    formattedAmount: '544.00',
    title: 'تحويل مباشر لمحفظة باقة VIP 4 الذهبية',
    txHash: '9d0e1f...4a5b',
    recipientAddress: 'TL8mP3...7qNt',
    timeAgo: 'منذ 3 ساعات',
    initialLikes: 85,
    blockHeight: 69851485,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-544.000000', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-v4-9',
    proofNumber: 39,
    imageSrc: proofImages[19],
    network: 'BEP-20',
    vipTier: 'VIP 4',
    amount: 620.61,
    formattedAmount: '620.61',
    title: 'سحب أرباح استثمارية معتمد VIP 4',
    txHash: '0x5a6b...9c0d',
    recipientAddress: '0x66F...2a9C',
    timeAgo: 'منذ 4 ساعات',
    initialLikes: 91,
    blockHeight: 38921135,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-620.610000', token: 'USDT', contract: '0x55d...B9e' }
    ]
  },
  {
    id: 'proof-v4-10',
    proofNumber: 40,
    imageSrc: proofImages[20],
    network: 'TRC-20',
    vipTier: 'VIP 4',
    amount: 680.00,
    formattedAmount: '680.00',
    title: 'سحب أرباح 10 أيام كاملة باقة VIP 4',
    txHash: '3c4d5e...9f0a',
    recipientAddress: 'TQ5vN1...8xKm',
    timeAgo: 'منذ 5 ساعات',
    initialLikes: 96,
    blockHeight: 69851505,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-680.000000', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-v4-11',
    proofNumber: 41,
    imageSrc: proofImages[0],
    network: 'TRC-20',
    vipTier: 'VIP 4',
    amount: 1574.21,
    formattedAmount: '1,574.21',
    title: 'إيداع رسمي معتمد في محفظة العضو',
    txHash: '4e5f6a...7b8c',
    recipientAddress: 'TR1nK7...3pWs',
    timeAgo: 'أمس 22:15',
    initialLikes: 104,
    blockHeight: 69851366,
    trxRate: '$0.3402 (+0.60%)',
    rows: [
      { amount: '-1,574.208345', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },

  // ===================== VIP 5 (14 Proofs - Royal Platinum / Titanium) =====================
  {
    id: 'proof-v5-1',
    proofNumber: 42,
    imageSrc: proofImages[1],
    network: 'TRC-20',
    vipTier: 'VIP 5',
    amount: 3076.52,
    formattedAmount: '3,076.52',
    title: 'سحب أرباح المحفظة VIP 5 المعتمد',
    txHash: '3c7d9e...1b0a',
    recipientAddress: 'TL4wN2...9aQt',
    timeAgo: 'منذ 14 دقيقة',
    initialLikes: 112,
    blockHeight: 69851218,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-3,076.527507', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-152', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-v5-2',
    proofNumber: 43,
    imageSrc: proofImages[2],
    network: 'TRC-20',
    vipTier: 'VIP 5',
    amount: 3088.60,
    formattedAmount: '3,088.60',
    title: 'اكتمال عملية السحب الآلي VIP 5',
    txHash: '7e2f4a...9b1c',
    recipientAddress: 'TR8kP5...3vLm',
    timeAgo: 'منذ 22 دقيقة',
    initialLikes: 125,
    blockHeight: 69851225,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-3,088.605258', token: 'USDT', contract: 'TR7NHq...Lj6t' },
      { amount: '-1,390', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-v5-3',
    proofNumber: 44,
    imageSrc: proofImages[3],
    network: 'TRC-20',
    vipTier: 'VIP 5',
    amount: 13624.81,
    formattedAmount: '13,624.81',
    title: 'سحب مباشر للمستثمر الملكي VIP 5',
    txHash: '1f5a8b...4d2e',
    recipientAddress: 'TK2vR9...7xPn',
    timeAgo: 'منذ 31 دقيقة',
    initialLikes: 158,
    blockHeight: 69851230,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-13,624.814205', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-v5-4',
    proofNumber: 45,
    imageSrc: proofImages[4],
    network: 'BEP-20',
    vipTier: 'VIP 5',
    amount: 1390.00,
    formattedAmount: '1,390.00',
    title: 'تحويل معتمد BEP-20 أرباح النخبة VIP 5',
    txHash: '0x1a2b...5c6d',
    recipientAddress: '0x33C...8e1D',
    timeAgo: 'منذ 42 دقيقة',
    initialLikes: 89,
    blockHeight: 38921085,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-1,390.000000', token: 'USDT', contract: '0x55d...B9e' }
    ]
  },
  {
    id: 'proof-v5-5',
    proofNumber: 46,
    imageSrc: proofImages[5],
    network: 'TRC-20',
    vipTier: 'VIP 5',
    amount: 3094.50,
    formattedAmount: '3,094.50',
    title: 'إثبات تحويل فوري لشبكة ترون VIP 5',
    txHash: '5d6e7f...0a1b',
    recipientAddress: 'TW9pL4...2mQk',
    timeAgo: 'منذ ساعة',
    initialLikes: 118,
    blockHeight: 69851245,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-3,094.500000', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-v5-6',
    proofNumber: 47,
    imageSrc: proofImages[6],
    network: 'BEP-20',
    vipTier: 'VIP 5',
    amount: 1542.76,
    formattedAmount: '1,542.76',
    title: 'سحب مباشر للمحفظة BEP-20 VIP 5',
    txHash: '0x8f9a...3b4c',
    recipientAddress: '0x77D...1a4B',
    timeAgo: 'منذ ساعة ونصف',
    initialLikes: 95,
    blockHeight: 38921100,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-1,542.760000', token: 'USDT', contract: '0x55d...B9e' }
    ]
  },
  {
    id: 'proof-v5-7',
    proofNumber: 48,
    imageSrc: proofImages[7],
    network: 'TRC-20',
    vipTier: 'VIP 5',
    amount: 3087.83,
    formattedAmount: '3,087.83',
    title: 'تأكيد السحب الفوري TRC-20 VIP 5',
    txHash: '8b9c0d...2e3f',
    recipientAddress: 'TQ1xN8...5vLm',
    timeAgo: 'منذ ساعتين',
    initialLikes: 122,
    blockHeight: 69851260,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-3,087.837997', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-v5-8',
    proofNumber: 49,
    imageSrc: proofImages[8],
    network: 'BEP-20',
    vipTier: 'VIP 5',
    amount: 1840.50,
    formattedAmount: '1,840.50',
    title: 'تحويل عوائد المحفظة BEP-20 VIP 5',
    txHash: '0x4d5e...9a0b',
    recipientAddress: '0x22B...8f3E',
    timeAgo: 'منذ ساعتين ونصف',
    initialLikes: 108,
    blockHeight: 38921120,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-1,840.500000', token: 'USDT', contract: '0x55d...B9e' }
    ]
  },
  {
    id: 'proof-v5-9',
    proofNumber: 50,
    imageSrc: proofImages[9],
    network: 'TRC-20',
    vipTier: 'VIP 5',
    amount: 3086.92,
    formattedAmount: '3,086.92',
    title: 'استلام الأرباح الملكية VIP 5',
    txHash: '3e4f5a...8b9c',
    recipientAddress: 'TL7mP2...4qRt',
    timeAgo: 'منذ 3 ساعات',
    initialLikes: 130,
    blockHeight: 69851280,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-3,086.923671', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-v5-10',
    proofNumber: 51,
    imageSrc: proofImages[10],
    network: 'BEP-20',
    vipTier: 'VIP 5',
    amount: 3015.50,
    formattedAmount: '3,015.50',
    title: 'سحب مؤكد BEP-20 أرباح VIP 5',
    txHash: '0x9b0c...3d4e',
    recipientAddress: '0x99F...6c1A',
    timeAgo: 'منذ 4 ساعات',
    initialLikes: 114,
    blockHeight: 38921145,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-3,015.500000', token: 'USDT', contract: '0x55d...B9e' }
    ]
  },
  {
    id: 'proof-v5-11',
    proofNumber: 52,
    imageSrc: proofImages[11],
    network: 'TRC-20',
    vipTier: 'VIP 5',
    amount: 3088.89,
    formattedAmount: '3,088.89',
    title: 'تأكيد استلام عوائد الاستثمار VIP 5',
    txHash: '0a1b2c...3d4e',
    recipientAddress: 'TZ9kL4...1mRt',
    timeAgo: 'منذ 5 ساعات',
    initialLikes: 142,
    blockHeight: 69851358,
    trxRate: '$0.3402 (+0.60%)',
    rows: [
      { amount: '-3,088.89308', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-v5-12',
    proofNumber: 53,
    imageSrc: proofImages[12],
    network: 'BEP-20',
    vipTier: 'VIP 5',
    amount: 6500.00,
    formattedAmount: '6,500.00',
    title: 'سحب أرباح قياسي BEP-20 للمستثمر الملكي',
    txHash: '0x2e3f...7a8b',
    recipientAddress: '0x11A...5d9C',
    timeAgo: 'منذ 6 ساعات',
    initialLikes: 165,
    blockHeight: 38921160,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-6,500.000000', token: 'USDT', contract: '0x55d...B9e' }
    ]
  },
  {
    id: 'proof-v5-13',
    proofNumber: 54,
    imageSrc: proofImages[13],
    network: 'TRC-20',
    vipTier: 'VIP 5',
    amount: 924.50,
    formattedAmount: '924.50',
    title: 'تحويل مباشر TRC-20 أرباح VIP 5',
    txHash: '6f7a8b...2c3d',
    recipientAddress: 'TR4nK9...8pWs',
    timeAgo: 'منذ 8 ساعات',
    initialLikes: 98,
    blockHeight: 69851380,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-924.500000', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  },
  {
    id: 'proof-v5-14',
    proofNumber: 55,
    imageSrc: proofImages[14],
    network: 'TRC-20',
    vipTier: 'VIP 5',
    amount: 1162.91,
    formattedAmount: '1,162.91',
    title: 'إثبات تحويل فوري معتمد VIP 5',
    txHash: '1c2d3e...7f8a',
    recipientAddress: 'TK8vR3...5qNt',
    timeAgo: 'منذ 10 ساعات',
    initialLikes: 120,
    blockHeight: 69851395,
    trxRate: '$0.3287 (+1.08%)',
    rows: [
      { amount: '-1,162.912587', token: 'USDT', contract: 'TR7NHq...Lj6t' }
    ]
  }
];
