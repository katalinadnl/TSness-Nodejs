import express from "express";
import {LoginController} from "../controllers/loginController";

const router = express.Router();

const loginController = new LoginController();


router.post('/signin', loginController.signin);
router.get('/verify-token', loginController.verifyToken);


export default router;