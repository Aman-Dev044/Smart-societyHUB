import { body, validationResult } from "express-validator";
import { flatsFromBody } from "../utils/flatNumbers.js";

export const createStaffValidation = [
  body("staffName").notEmpty().withMessage("Staff name is required").trim(),

  body("mobileNumber")
    .notEmpty()
    .withMessage("Mobile number is required")
    .isMobilePhone()
    .withMessage("Invalid mobile number")
    .trim(),

  body("role").notEmpty().withMessage("Role is required").trim(),

  // Staff ek se zyada flats me kaam kar sakta hai. `flatNumbers` (array ya
  // comma-separated) ya legacy `flatNumber` - dono me se kuch to aana chahiye.
  body().custom((_, { req }) => {
    if (flatsFromBody(req.body).length === 0) {
      throw new Error("Kam se kam ek flat number zaroori hai");
    }
    return true;
  }),
];

export const validationMiddleware = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: errors.array(),
    });
  }

  next();
};
