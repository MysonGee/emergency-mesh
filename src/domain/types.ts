export type UnitId = "harbour" | "ridge" | "valley";
export type SourceAvailabilityState = "ONLINE" | "OFFLINE" | "IN_USE";
export type AssetStatus = "AVAILABLE" | "OFFLINE_UNTIL" | "UNSERVICEABLE" | "MAINTENANCE_DUE" | "IN_USE";
export type AssetType = "SPECIALIST_TRUCK" | "STORM_TRUCK" | "RESCUE_VEHICLE" | "FLOOD_BOAT" | "GENERATOR" | "CHAINSAW" | "FORWARD_COMMAND_VEHICLE" | "DRONE" | "RADIO_CACHE" | "GENERAL_PURPOSE_VEHICLE" | "COMMANDER_UTE" | "GAZEBO";
export type TrainingCurrency = "CURRENT" | "REVIEW_REQUIRED" | "LAPSED";
export type CapabilityId = "FLOOD_RESCUE" | "CHAINSAW" | "SPECIALIST_TRUCK" | "STORM";

export interface TimeWindow { startAt: string; endAt: string; }

export interface Unit {
  id: UnitId;
  name: string;
  minimumReadiness: number;
  neighbouringUnitIds: UnitId[];
}

export interface Member {
  id: string;
  unitId: UnitId;
  name: string;
  competencies: string[];
  licences: string[];
  availableFrom: string;
  availableUntil: string;
  activityHoursBeforeWindow: number;
  maximumContinuousHours: number;
  /** Currency is an imported source-system status; Emergency Mesh does not manage training. */
  trainingCurrency?: TrainingCurrency;
  trainingSummary?: string;
  experienceYears?: number;
  /** Source-system offer state. Deployed means not available for this capability offer. */
  sourceStatus?: SourceAvailabilityState;
}

export interface Asset {
  id: string;
  unitId: UnitId;
  name: string;
  type: AssetType;
  status: AssetStatus;
  offlineUntil?: string;
  /** Fictional source timestamp; evidence only, never live tracking. */
  offlineSince?: string;
  /** Fictional source explanation for the review state. */
  offlineReason?: string;
  remainingUsageHours?: number;
  /** Imported asset description/capacity for evidence display only. */
  capacity?: string;
  sourceCondition?: "CURRENT" | "REVIEW_REQUIRED";
}

export interface CapabilityDefinition {
  id: CapabilityId;
  name: string;
  requiredCompetencies: Array<{ code: string; quantity: number }>;
  requiredAssets: Array<{ type: Asset["type"]; quantity: number; expectedUsageHours?: number }>;
}

export interface CapabilityDemand { capabilityId: CapabilityId; quantity: number; priority: number; }

export type ConstraintType = "FATIGUE_LIMIT" | "SHARED_MEMBER_CONFLICT" | "ASSET_OFFLINE" | "ASSET_MAINTENANCE_HORIZON" | "INSUFFICIENT_QUALIFIED_MEMBERS" | "INSUFFICIENT_ASSETS";

export interface BindingConstraint {
  type: ConstraintType;
  message: string;
  resourceIds?: string[];
  earliestConstraintAt?: string;
}

export interface Allocation { demand: CapabilityId; role: string; memberId?: string; assetId?: string; }

export interface CapabilityPlanResult {
  feasible: boolean;
  allocations: Allocation[];
  bindingConstraints: BindingConstraint[];
  warnings: string[];
  assumptions: string[];
}
