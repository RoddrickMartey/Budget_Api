import prisma from "../utils/prismaConfig.js";
import jwt from "jsonwebtoken";

export const loginUser = async (req, res) => {
  const { name, email } = req.body;

  try {
    // Check if the user already exists
    let user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        balance: true,
        createdAt: true,
      },
    });

    if (!user) {
      // Create a new user if not found
      user = await prisma.user.create({
        data: { name, email },
        select: {
          id: true,
          name: true,
          email: true,
          balance: true,
          createdAt: true,
        },
      });
    }

    // Generate JWT token using user ID
    const token = jwt.sign(
      { id: user.id }, // Payload (user ID)
      process.env.JWT_SECRET, // Secret key (store in .env)
      { expiresIn: "7d" } // Token expires in 7 days
    );

    // Set cookie before sending JSON response
    res.cookie("token", token, {
      httpOnly: true, // Prevents access from JavaScript
      secure: process.env.NODE_ENV === "production", // Secure in production
      sameSite: "strict", // Prevent CSRF attacks
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Send response after setting cookie
    return res.status(200).json({ user });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return res.status(200);
};

export const getUserTransaction = async (req, res) => {
  const { id } = req.user; // Extract user ID from request

  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: id },
      orderBy: { date: "desc" }, // Get latest transactions first
      take: 10, // Fetch at least 10 transactions
    });

    res.status(200).json({ transactions });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getUserAllTransaction = async (req, res) => {
  const { id } = req.user; // Extract user ID from request

  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: id },
      orderBy: { date: "desc" }, // Get latest transactions first
    });

    res.status(200).json({ transactions });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createTransaction = async (req, res) => {
  const { type, amount, category, detail, name } = req.body;
  const { id } = req.user; // User ID from authentication

  try {
    // Create the transaction
    const newTransaction = await prisma.transaction.create({
      data: {
        userId: id,
        detail,
        name,
        type,
        amount,
        category,
      },
      select: {
        id: true,
        detail: true,
        name: true,
        type: true,
        amount: true,
        category: true,
      },
    });

    // Adjust the user's balance
    const user = await prisma.user.findUnique({
      where: { id },
      select: { balance: true },
    });

    let updatedBalance = user.balance;

    if (type === "EXPENSE") {
      updatedBalance -= amount;
    } else if (type === "INCOME") {
      updatedBalance += amount;
    }

    // Update the user's balance in the database
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { balance: updatedBalance },
      select: { balance: true },
    });

    return res.status(201).json({
      message: "Transaction created successfully",
      balance: updatedUser.balance,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteTransaction = async (req, res) => {
  const { transactionId } = req.params; // Get transaction ID from URL params
  const { id: userId } = req.user; // Authenticated user ID

  try {
    // Find the transaction first
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: { amount: true, type: true, userId: true },
    });

    // Check if transaction exists and belongs to the authenticated user
    if (!transaction || transaction.userId !== userId) {
      return res
        .status(404)
        .json({ message: "Transaction not found or unauthorized" });
    }

    // Adjust the user's balance before deleting
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });

    let updatedBalance = user.balance;
    if (transaction.type === "EXPENSE") {
      updatedBalance += transaction.amount; // Refund expense
    } else if (transaction.type === "INCOME") {
      updatedBalance -= transaction.amount; // Remove income
    }

    // Delete the transaction
    await prisma.transaction.delete({ where: { id: transactionId } });

    // Update user's balance
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { balance: updatedBalance },
      select: { balance: true },
    });

    return res.status(200).json({
      message: "Transaction deleted successfully",
      balance: updatedUser.balance,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const clearAll = async (req, res) => {
  const { id } = req.user; // Extract user ID from request

  try {
    // Delete all transactions for the user
    await prisma.transaction.deleteMany({
      where: { userId: id },
    });

    // Reset the user's balance
    const resetBalance = await prisma.user.update({
      where: { id },
      data: { balance: 0.0 },
    });

    // Send success response with updated user balance
    res.status(200).json({
      message: "All transactions cleared successfully",
      user: resetBalance.balance,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
