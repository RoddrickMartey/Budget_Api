import { body } from "express-validator";

export const validateUser = [
  body("name").isString().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
];

export const validateTransaction = [
  body("type")
    .isIn(["INCOME", "EXPENSE"])
    .withMessage('Type must be either "INCOME" or "EXPENSE"'),

  body("amount")
    .isFloat({ gt: 0 })
    .withMessage("Amount must be a positive number"),

  body("category").isString().notEmpty().withMessage("Category is required"),

  body("detail").isString().notEmpty().withMessage("Detail is required"),

  body("name").isString().notEmpty().withMessage("Name is required"),
];
