export interface CategoryClub {
  id: number;
  code: string;
  name: string;
  description?: string;
  imageUrl?: string;
  teams?: any[];
  createdAt: string; // Keep as string for Redux serialization
  updatedAt: string; // Keep as string for Redux serialization
}

export interface CreateCategoryClubDTO {
  code: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface UpdateCategoryClubDTO {
  code?: string;
  name?: string;
  description?: string;
  imageUrl?: string;
}
