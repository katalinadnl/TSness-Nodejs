import { Types } from 'mongoose';

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

export interface ITrainingRoom {
  id: string;
  name: string;
  capacity: number;
  equipment: string[];
  features: string[];
  isApproved: boolean;
  difficultyLevel: DifficultyLevel;
  assignedExerciseTypeId?: string;
    owner: string | Types.ObjectId;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IExerciseType {
  id: string;
  name: string;
  description: string;
  targetedMuscles: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateTrainingRoomRequest {
  name: string;
  capacity: number;
  equipment: string[];
  features: string[];
  difficultyLevel: DifficultyLevel;
  assignedExerciseTypeId?: string;
    owner: string | Types.ObjectId; 
  createdBy: string;
}

export interface UpdateTrainingRoomRequest {
  name?: string;
  capacity?: number;
  equipment?: string[];
  features?: string[];
  difficultyLevel?: DifficultyLevel;
  assignedExerciseTypeId?: string;
  owner?: string | Types.ObjectId; 
}

export interface CreateExerciseTypeRequest {
  name: string;
  description: string;
  targetedMuscles: string[];
}

export interface UpdateExerciseTypeRequest {
  name?: string;
  description?: string;
  targetedMuscles?: string[];
}
