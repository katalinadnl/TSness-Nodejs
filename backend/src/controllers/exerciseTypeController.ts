import { Request, Response } from 'express';
import { ExerciseType } from '../models/ExerciseType';
import { TrainingRoom } from '../models/TrainingRoom';
import { 
  CreateExerciseTypeRequest, 
  UpdateExerciseTypeRequest 
} from '../types';

export const getAllExerciseTypes = async (req: Request, res: Response) => {
  try {
    const exerciseTypes = await ExerciseType.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: exerciseTypes.length,
      data: exerciseTypes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching exercise types',
      error: (error as Error).message
    });
  }
};

export const getExerciseTypeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const exerciseType = await ExerciseType.findById(id);
    
    if (!exerciseType) {
      return res.status(404).json({
        success: false,
        message: 'Exercise type not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: exerciseType
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching exercise type',
      error: (error as Error).message
    });
  }
};

export const createExerciseType = async (req: Request, res: Response) => {
  try {
    const exerciseTypeData: CreateExerciseTypeRequest = req.body;
    
    const existingExerciseType = await ExerciseType.findOne({ 
      name: { $regex: new RegExp(`^${exerciseTypeData.name}$`, 'i') }
    });
    
    if (existingExerciseType) {
      return res.status(400).json({
        success: false,
        message: 'Exercise type with this name already exists'
      });
    }
    
    const exerciseType = new ExerciseType(exerciseTypeData);
    await exerciseType.save();
    
    res.status(201).json({
      success: true,
      message: 'Exercise type created successfully',
      data: exerciseType
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating exercise type',
      error: (error as Error).message
    });
  }
};

export const updateExerciseType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: UpdateExerciseTypeRequest = req.body;
    
    if (updateData.name) {
      const existingExerciseType = await ExerciseType.findOne({ 
        name: { $regex: new RegExp(`^${updateData.name}$`, 'i') },
        _id: { $ne: id }
      });
      
      if (existingExerciseType) {
        return res.status(400).json({
          success: false,
          message: 'Exercise type with this name already exists'
        });
      }
    }
    
    const exerciseType = await ExerciseType.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!exerciseType) {
      return res.status(404).json({
        success: false,
        message: 'Exercise type not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Exercise type updated successfully',
      data: exerciseType
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating exercise type',
      error: (error as Error).message
    });
  }
};

export const deleteExerciseType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const assignedRooms = await TrainingRoom.find({ assignedExerciseTypeId: id });
    
    if (assignedRooms.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete exercise type. It is assigned to ${assignedRooms.length} training room(s). Please unassign it first.`,
        assignedRooms: assignedRooms.map(room => ({ id: room._id, name: room.name }))
      });
    }
    
    const exerciseType = await ExerciseType.findByIdAndDelete(id);
    
    if (!exerciseType) {
      return res.status(404).json({
        success: false,
        message: 'Exercise type not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Exercise type deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting exercise type',
      error: (error as Error).message
    });
  }
};

export const getTrainingRoomsByExerciseType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const exerciseType = await ExerciseType.findById(id);
    if (!exerciseType) {
      return res.status(404).json({
        success: false,
        message: 'Exercise type not found'
      });
    }
    
    const trainingRooms = await TrainingRoom.find({ assignedExerciseTypeId: id })
      .populate('assignedExerciseTypeId', 'name description')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      exerciseType: {
        id: exerciseType._id,
        name: exerciseType.name,
        description: exerciseType.description
      },
      count: trainingRooms.length,
      data: trainingRooms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching training rooms',
      error: (error as Error).message
    });
  }
};

export const getExerciseTypesByMuscle = async (req: Request, res: Response) => {
  try {
    const { muscle } = req.params;
    
    if (!muscle || muscle.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Muscle parameter is required'
      });
    }
    
    const exerciseTypes = await ExerciseType.find({
      targetedMuscles: { 
        $regex: new RegExp(muscle.trim(), 'i') 
      }
    }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      muscle: muscle.trim(),
      count: exerciseTypes.length,
      data: exerciseTypes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching exercise types by muscle',
      error: (error as Error).message
    });
  }
};
