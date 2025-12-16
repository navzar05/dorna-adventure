import { type Media } from "./media";

export interface LocationDetails {
  address?: string;
  city: string;
  latitude?: number;
  longitude?: number;
  postalCode?: string;
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
  locationDetails?: LocationDetails;
  category: Category;
  active: boolean;
  imageUrls: string[];
  videoUrls: string[];
  mediaList?: Media[];
}

export interface Category {
  id: number;
  name: string;
  description: string;
  slug: string;
  iconUrl?: string;
  activityCount?: number;
  displayOrder?: number;
  active?: boolean;
  maxParticipantsPerGuide: number;
}