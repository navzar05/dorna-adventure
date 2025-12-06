export interface LocationDetails {
  address?: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  postalCode?: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  slug: string;
  iconUrl?: string;
  activityCount?: number;
}

export interface Activity {
  id: number;
  name: string;
  description: string;
  minParticipants: number;
  maxParticipants: number;
  pricePerPerson: number;
  depositAmount: number;
  depositPercent: number;
  duration: string;
  durationMinutes: number;
  location: string;
  category: Category;
  active: boolean;
  imageUrls: string[];
  videoUrls: string[];
}