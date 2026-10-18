import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';

export const authRouter = Router();

authRouter.post('/login', (req, res, next) => authController.login(req, res, next));
authRouter.post('/register', (req, res, next) => authController.register(req, res, next));
authRouter.post('/verify-code', (req, res, next) => authController.verifyCode(req, res, next));
authRouter.post('/resend-code', (req, res, next) => authController.resendCode(req, res, next));
authRouter.get('/session', (req, res, next) => authController.getSession(req, res, next));
authRouter.get('/me', (req, res, next) => authController.getSession(req, res, next));
authRouter.post('/logout', (req, res, next) => authController.logout(req, res, next));
