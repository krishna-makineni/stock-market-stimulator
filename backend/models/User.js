const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    balance: {
      type: Number,
      default: 100000, // $100,000 virtual money
    },
    portfolio: [
      {
        symbol: { type: String, required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 0 },
        avgBuyPrice: { type: Number, required: true },
        totalInvested: { type: Number, required: true },
      },
    ],
    totalDeposited: {
      type: Number,
      default: 100000,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual: total portfolio value (computed on demand)
userSchema.methods.getNetWorth = function (currentPrices = {}) {
  const portfolioValue = this.portfolio.reduce((total, holding) => {
    const price = currentPrices[holding.symbol] || holding.avgBuyPrice;
    return total + holding.quantity * price;
  }, 0);
  return this.balance + portfolioValue;
};

module.exports = mongoose.model("User", userSchema);
