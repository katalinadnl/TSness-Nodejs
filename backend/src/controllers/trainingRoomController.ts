import { Request, Response } from 'express';
import { TrainingRoom } from '../models/TrainingRoom';
import { ExerciseType } from '../models/ExerciseType';
import { 
  CreateTrainingRoomRequest, 
  UpdateTrainingRoomRequest, 
  DifficultyLevel 
} from '../types';

export const getAllTrainingRooms = async (req: Request, res: Response): Promise<void> => {
  try {
    const rooms = await TrainingRoom.find()
      .populate('assignedExerciseTypeId', 'name description')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching training rooms',
      error: (error as Error).message
    });
  }
};

export const getTrainingRoomById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const room = await TrainingRoom.findById(id)
      .populate('assignedExerciseTypeId', 'name description targetedMuscles');
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Training room not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: room
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching training room',
      error: (error as Error).message
    });
  }
};

export const createTrainingRoom = async (req: Request, res: Response) => {
  try {
    const roomData: CreateTrainingRoomRequest = req.body;
    
    if (roomData.assignedExerciseTypeId) {
      const exerciseType = await ExerciseType.findById(roomData.assignedExerciseTypeId);
      if (!exerciseType) {
        return res.status(400).json({
          success: false,
          message: 'Invalid exercise type ID'
        });
      }
    }
    
    const room = new TrainingRoom(roomData);
    await room.save();
    
    await room.populate('assignedExerciseTypeId', 'name description');
    
    res.status(201).json({
      success: true,
      message: 'Training room created successfully',
      data: room
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating training room',
      error: (error as Error).message
    });
  }
};

export const updateTrainingRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: UpdateTrainingRoomRequest = req.body;
    
    if (updateData.assignedExerciseTypeId) {
      const exerciseType = await ExerciseType.findById(updateData.assignedExerciseTypeId);
      if (!exerciseType) {
        return res.status(400).json({
          success: false,
          message: 'Invalid exercise type ID'
        });
      }
    }
    
    const room = await TrainingRoom.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('assignedExerciseTypeId', 'name description');
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Training room not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Training room updated successfully',
      data: room
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating training room',
      error: (error as Error).message
    });
  }
};

export const deleteTrainingRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const room = await TrainingRoom.findByIdAndDelete(id);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Training room not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Training room deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting training room',
      error: (error as Error).message
    });
  }
};

export const approveTrainingRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;
    
    if (typeof isApproved !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isApproved must be a boolean value'
      });
    }
    
    const room = await TrainingRoom.findByIdAndUpdate(
      id,
      { isApproved },
      { new: true, runValidators: true }
    ).populate('assignedExerciseTypeId', 'name description');
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Training room not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Training room ${isApproved ? 'approved' : 'disapproved'} successfully`,
      data: room
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating approval status',
      error: (error as Error).message
    });
  }
};

export const assignExerciseType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { exerciseTypeId } = req.body;
    
    if (exerciseTypeId) {
      const exerciseType = await ExerciseType.findById(exerciseTypeId);
      if (!exerciseType) {
        return res.status(400).json({
          success: false,
          message: 'Invalid exercise type ID'
        });
      }
    }
    
    const room = await TrainingRoom.findByIdAndUpdate(
      id,
      { assignedExerciseTypeId: exerciseTypeId || null },
      { new: true, runValidators: true }
    ).populate('assignedExerciseTypeId', 'name description targetedMuscles');
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Training room not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: exerciseTypeId ? 'Exercise type assigned successfully' : 'Exercise type unassigned successfully',
      data: room
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error assigning exercise type',
      error: (error as Error).message
    });
  }
};

export const setDifficultyLevel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { difficultyLevel } = req.body;
    
    if (!Object.values(DifficultyLevel).includes(difficultyLevel)) {
      return res.status(400).json({
        success: false,
        message: `Invalid difficulty level. Must be one of: ${Object.values(DifficultyLevel).join(', ')}`
      });
    }
    
    const room = await TrainingRoom.findByIdAndUpdate(
      id,
      { difficultyLevel },
      { new: true, runValidators: true }
    ).populate('assignedExerciseTypeId', 'name description');
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Training room not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Difficulty level updated successfully',
      data: room
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating difficulty level',
      error: (error as Error).message
    });
  }
};
