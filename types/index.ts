// ==========================================
// SAJAG / PRAKOP - CITIZEN PORTAL TYPES
// ==========================================

export type TransportType = 'MQTT' | 'LORA_SIM';
export type DeviceStatus = 'ONLINE' | 'OFFLINE';

export type DisasterType = 
  | 'EARTHQUAKE' 
  | 'FLOOD' 
  | 'LANDSLIDE' 
  | 'FOREST_FIRE' 
  | 'STORM' 
  | 'OTHER';

export type SeverityLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type DisasterEventStatus = 
  | 'DETECTED' 
  | 'ANALYZING' 
  | 'CONFIRMED' 
  | 'NOTIFYING' 
  | 'RESOLVED';

export type AlertStatus = 
  | 'NOTIFYING' 
  | 'WAITING_RESPONSE' 
  | 'SAFE' 
  | 'UNSAFE' 
  | 'NO_RESPONSE' 
  | 'ESCALATED';

export type CitizenSafetyStatus = 'SAFE' | 'UNSAFE' | 'NO_RESPONSE' | 'UNKNOWN';
export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type UserRole = 
  | 'CITIZEN' 
  | 'RESPONDER' 
  | 'RESCUE_TEAM' 
  | 'AUTHORITY' 
  | 'ADMIN' 
  | 'SUPER_ADMIN';

export type SOSStatus = 
  | 'PENDING' 
  | 'ACKNOWLEDGED' 
  | 'ASSIGNED' 
  | 'IN_PROGRESS' 
  | 'RESOLVED' 
  | 'CANCELLED';

export type MedicalUrgency = 'NONE' | 'MINOR' | 'SEVERE' | 'CRITICAL';

export type ReportStatus = 
  | 'SUBMITTED' 
  | 'UNDER_REVIEW' 
  | 'VERIFIED' 
  | 'REJECTED' 
  | 'RESOLVED';

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface DisasterEventEntity {
  id: string;
  type: DisasterType;
  riskScore: number;
  severity: SeverityLevel;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  status: DisasterEventStatus;
  createdAt: string;
  title?: string;
  description?: string;
}

export interface ShelterEntity {
  id: string;
  name: string;
  nameNe?: string;
  latitude: number;
  longitude: number;
  address: string;
  totalCapacity: number;
  currentOccupancy: number;
  hasMedicalFacility: boolean;
  hasFoodWater: boolean;
  hasBackupPower: boolean;
  isActive: boolean;
  distanceMeters?: number;
  availableBeds?: number;
}

export interface UserEntity {
  id: string;
  name: string;
  email?: string;
  phone: string;
  latitude: number;
  longitude: number;
  status: CitizenSafetyStatus;
  role?: UserRole;
  municipalityId?: string;
}

export interface SOSRequestEntity {
  id: string;
  userId?: string;
  user?: UserEntity;
  latitude: number;
  longitude: number;
  addressText?: string;
  description: string;
  numberOfPeople: number;
  medicalEmergency: MedicalUrgency;
  status: SOSStatus;
  contactNumber: string;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface CitizenReportEntity {
  id: string;
  userId?: string;
  disasterType: DisasterType;
  latitude: number;
  longitude: number;
  addressText?: string;
  description: string;
  mediaUrls: string[];
  status: ReportStatus;
  createdAt: string;
}

export interface SensorValues {
  acceleration: number;
  waterLevel: number;
  soilMoisture: number;
  rainfall: number;
}
