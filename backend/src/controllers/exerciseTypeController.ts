import { Request, Response } from 'express';
import express from 'express';
import { ExerciseType, CreateExerciseTypeRequest, UpdateExerciseTypeRequest } from '../models/ExerciseType';
import { TrainingRoom } from '../models/TrainingRoom';
import { authenticateToken } from '../middleware/auth';
import {requireRole} from "../middleware/requireRole";
import {UserRole} from "../models/common/enums";

export class ExerciseTypeController {

  async getAllExerciseTypes(req: Request, res: Response): Promise<void> {
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
  }

  async getExerciseTypeById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const exerciseType = await ExerciseType.findById(id);
      
      if (!exerciseType) {
        res.status(404).json({
          success: false,
          message: 'Exercise type not found'
        });
        return;
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
  }

  async createExerciseType(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, targetedMuscles }: CreateExerciseTypeRequest = req.body;
      
      if (!name || !description || !targetedMuscles) {
        res.status(400).json({
          success: false,
          message: 'All fields are required'
        });
        return;
      }
      
      const existingExerciseType = await ExerciseType.findOne({ name });
      if (existingExerciseType) {
        res.status(409).json({
          success: false,
          message: 'Exercise type with this name already exists'
        });
        return;
      }
      
      const exerciseType = await ExerciseType.create({
        name,
        description,
        targetedMuscles
      });
      
      res.status(201).json({
        success: true,
        message: 'Exercise type created successfully',
        data: exerciseType
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating exercise type',
        error: (error as Error).message
      });
    }
  }

  async updateExerciseType(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, targetedMuscles }: UpdateExerciseTypeRequest = req.body;
      
      if (!name && !description && !targetedMuscles) {
        res.status(400).json({
          success: false,
          message: 'At least one field is required for update'
        });
        return;
      }
      
      const existingExerciseType = await ExerciseType.findById(id);
      if (!existingExerciseType) {
        res.status(404).json({
          success: false,
          message: 'Exercise type not found'
        });
        return;
      }
      
      if (name && name !== existingExerciseType.name) {
        const duplicateExerciseType = await ExerciseType.findOne({ name });
        if (duplicateExerciseType) {
          res.status(409).json({
            success: false,
            message: 'Exercise type with this name already exists'
          });
          return;
        }
      }
      
      const updateData: Partial<UpdateExerciseTypeRequest> = {};
      if (name) updateData.name = name;
      if (description) updateData.description = description;
      if (targetedMuscles) updateData.targetedMuscles = targetedMuscles;
      
      const updatedExerciseType = await ExerciseType.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
      
      res.status(200).json({
        success: true,
        message: 'Exercise type updated successfully',
        data: updatedExerciseType
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating exercise type',
        error: (error as Error).message
      });
    }
  }

  async deleteExerciseType(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const exerciseType = await ExerciseType.findById(id);
      if (!exerciseType) {
        res.status(404).json({
          success: false,
          message: 'Exercise type not found'
        });
        return;
      }
      
      const associatedRooms = await TrainingRoom.find({ assignedExerciseTypeId: id });
      if (associatedRooms.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Cannot delete exercise type as it is assigned to training rooms',
          data: {
            associatedRooms: associatedRooms.map(room => ({
              id: room._id,
              name: room.name
            }))
          }
        });
        return;
      }
      
      await ExerciseType.findByIdAndDelete(id);
      
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
  }

  async getTrainingRoomsByExerciseType(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const exerciseType = await ExerciseType.findById(id);
      if (!exerciseType) {
        res.status(404).json({
          success: false,
          message: 'Exercise type not found'
        });
        return;
      }
      
      const trainingRooms = await TrainingRoom.find({ assignedExerciseTypeId: id })
        .populate('assignedExerciseTypeId', 'name description')
        .sort({ createdAt: -1 });
      
      res.status(200).json({
        success: true,
        exerciseType: exerciseType.name,
        count: trainingRooms.length,
        data: trainingRooms
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching training rooms by exercise type',
        error: (error as Error).message
      });
    }
  }

  async getExerciseTypesByMuscle(req: Request, res: Response): Promise<void> {
    try {
      const { muscle } = req.params;
      
      if (!muscle || muscle.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Muscle parameter is required'
        });
        return;
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
  }

  buildRoutes() {
    const router = express.Router();

    router.use(authenticateToken);
    router.use(requireRole([UserRole.SUPER_ADMIN]));

    router.get('/by-muscle/:muscle', this.getExerciseTypesByMuscle.bind(this));
    router.get('/', this.getAllExerciseTypes.bind(this));
    router.get('/:id', this.getExerciseTypeById.bind(this));
    router.post('/', this.createExerciseType.bind(this));
    router.put('/:id', this.updateExerciseType.bind(this));
    router.delete('/:id', this.deleteExerciseType.bind(this));
    router.get('/:id/training-rooms', this.getTrainingRoomsByExerciseType.bind(this));

    return router;
  }
}
