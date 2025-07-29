// src/types/blindbox.ts

export interface BlindBoxItem {
    id: number;
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
    stock: number;
    isActive: boolean;
    creator: { id: number; username: string };
    items: { name: string; description: string; rarity: string }[];
    tags?: string[];
    userId?: number;
    createdAt: Date;
    category?: string;
}