import { Router } from "express";
import {
  clearAll,
  createTransaction,
  deleteTransaction,
  getUserAllTransaction,
  getUserTransaction,
  loginUser,
  logout,
} from "../controllers/userController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { validationResult } from "express-validator";
import {
  validateTransaction,
  validateUser,
} from "../middleware/validateRequestBody.js";

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const router = Router();

/* User Routes */
router.post("/user/login", validateUser, handleValidationErrors, loginUser);
router.post("/user/logout", logout);

/* Transaction Routes */
router.get("/user/transactions", verifyToken, getUserTransaction);
router.get("/user/all/transactions", verifyToken, getUserAllTransaction);
router.post(
  "/user/transactions",
  verifyToken,
  validateTransaction,
  handleValidationErrors,
  createTransaction
);
router.post("/user/reset", verifyToken, clearAll);
router.delete(
  "/user/transactions/:transactionId",
  verifyToken,
  deleteTransaction
);

export default router;
