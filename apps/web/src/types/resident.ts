export interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  apartment: string;
  building?: string;
  status: 'active' | 'inactive' | 'pending';
  role: 'owner' | 'tenant' | 'guest';
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  vehicles?: Vehicle[];
  pets?: Pet[];
  moveInDate: string;
  moveOutDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  parkingSpot?: string;
}

export interface Pet {
  id: string;
  name: string;
  type: 'dog' | 'cat' | 'bird' | 'fish' | 'other';
  breed?: string;
  weight?: number;
  vaccinated: boolean;
  notes?: string;
}

export interface ResidentFilters {
  search: string;
  status: 'all' | 'active' | 'inactive' | 'pending';
  role: 'all' | 'owner' | 'tenant' | 'guest';
  building: string;
}
