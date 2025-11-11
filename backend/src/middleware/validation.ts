import { NextFunction, Request, Response } from 'express';
import { body, ValidationChain, validationResult } from 'express-validator';

/**
 * Middleware to check validation results and return errors
 */
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('[Validation] Validation failed:', {
      path: req.path,
      method: req.method,
      errors: errors.array(),
    });
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

/**
 * Sanitizes text input to prevent XSS attacks
 * Removes HTML tags and trims whitespace
 */
const sanitizeText = (value: string): string => {
  if (typeof value !== 'string') return '';

  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]+>/g, '') // Remove all HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers (onclick, onerror, etc.)
    .trim();
};

/**
 * Validation rules for profile creation
 */
export const validateProfileCreation: ValidationChain[] = [
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters')
    .customSanitizer(sanitizeText),

  body('bio')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Bio must be between 1 and 500 characters')
    .customSanitizer(sanitizeText),

  body('gender')
    .isIn(['female', 'male', 'non-binary'])
    .withMessage('Invalid gender value'),

  body('birthdate')
    .isISO8601()
    .withMessage('Invalid birthdate format')
    .custom((value) => {
      const birthdate = new Date(value);
      const age =
        (Date.now() - birthdate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (age < 18) {
        throw new Error('You must be 18 or older to use REDI');
      }
      if (age > 100) {
        throw new Error('Invalid birthdate');
      }
      return true;
    }),

  body('year')
    .isIn([
      'Freshman',
      'Sophomore',
      'Junior',
      'Senior',
      'Graduate',
      'PhD',
      'Post-Doc',
    ])
    .withMessage('Invalid year value'),

  body('school')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('School is required')
    .customSanitizer(sanitizeText),

  body('hometown')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .customSanitizer(sanitizeText),

  body('pronouns')
    .optional()
    .trim()
    .isIn(['He/Him/His', 'She/Her/Hers', 'They/Them/Theirs', 'Other'])
    .withMessage('Invalid pronoun format'),

  body('major')
    .optional()
    .isArray({ max: 3 })
    .withMessage('Maximum 3 majors allowed'),

  body('major.*')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .customSanitizer(sanitizeText),

  body('interests')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 interests allowed'),

  body('interests.*')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .customSanitizer(sanitizeText),

  body('clubs')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 clubs allowed'),

  body('clubs.*')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .customSanitizer(sanitizeText),

  body('instagram')
    .optional()
    .trim()
    .customSanitizer((value: string) => {
      if (!value) return value;
      // Extract username from Instagram URL if provided
      const urlMatch = value.match(/instagram\.com\/([A-Za-z0-9_.]+)/);
      if (urlMatch) return urlMatch[1];
      // Remove @ prefix if present
      return value.replace(/^@/, '');
    })
    .matches(/^[A-Za-z0-9_.]+$/)
    .withMessage('Invalid Instagram handle')
    .isLength({ max: 30 }),

  body('snapchat')
    .optional()
    .trim()
    .customSanitizer((value: string) => {
      if (!value) return value;
      // Extract username from Snapchat URL if provided
      const urlMatch = value.match(/snapchat\.com\/add\/([A-Za-z0-9._-]+)/);
      if (urlMatch) return urlMatch[1];
      return value;
    })
    .matches(/^[A-Za-z0-9._-]+$/)
    .withMessage('Invalid Snapchat handle')
    .isLength({ max: 30 }),

  body('phoneNumber')
    .optional()
    .trim()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format'),

  body('website').optional().trim().isURL().withMessage('Invalid website URL'),

  body('linkedIn')
    .optional()
    .trim()
    .isURL()
    .withMessage('Invalid LinkedIn URL'),

  body('github')
    .optional()
    .trim()
    .customSanitizer((value: string) => {
      if (!value) return value;
      // Extract username from GitHub URL if provided
      const urlMatch = value.match(/github\.com\/([A-Za-z0-9-]+)/);
      if (urlMatch) return urlMatch[1];
      return value;
    })
    .matches(/^[A-Za-z0-9-]+$/)
    .withMessage('Invalid GitHub username'),

  body('pictures')
    .optional()
    .isArray({ max: 6 })
    .withMessage('Maximum 6 pictures allowed'),

  body('pictures.*').optional().isURL().withMessage('Invalid picture URL'),
];

/**
 * Validation rules for prompt answer submission
 */
export const validatePromptAnswer: ValidationChain[] = [
  body('promptId')
    .trim()
    .matches(/^(TEST-W\d{2}|\d{4}-W?\d{1,2})$/)
    .withMessage(
      'Invalid prompt ID format (expected: YYYY-WW, YYYY-W-WW, or TEST-W##)'
    ),

  body('answer')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Answer must be between 1 and 500 characters')
    .customSanitizer(sanitizeText),
];

/**
 * Validation rules for preferences update
 */
export const validatePreferences: ValidationChain[] = [
  body('ageRange.min')
    .optional()
    .isInt({ min: 18, max: 100 })
    .withMessage('Minimum age must be between 18 and 100'),

  body('ageRange.max')
    .optional()
    .isInt({ min: 18, max: 100 })
    .withMessage('Maximum age must be between 18 and 100')
    .custom((max, { req }) => {
      if (req.body.ageRange?.min && max < req.body.ageRange.min) {
        throw new Error(
          'Maximum age must be greater than or equal to minimum age'
        );
      }
      return true;
    }),

  body('genders')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one gender preference is required'),

  body('genders.*')
    .optional()
    .isIn(['female', 'male', 'non-binary'])
    .withMessage('Invalid gender value'),

  body('years')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one year preference is required'),

  body('years.*')
    .optional()
    .isIn([
      'Freshman',
      'Sophomore',
      'Junior',
      'Senior',
      'Graduate',
      'PhD',
      'Post-Doc',
    ])
    .withMessage('Invalid year value'),

  body('schools').optional().isArray().withMessage('Schools must be an array'),

  body('schools.*')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Invalid school name'),

  body('majors').optional().isArray().withMessage('Majors must be an array'),

  body('majors.*')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Invalid major name'),
];

/**
 * Validation rules for user creation
 */
export const validateUserCreation: ValidationChain[] = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email address')
    .matches(/^[a-zA-Z0-9._%+-]+@cornell\.edu$/)
    .withMessage('Only Cornell email addresses are allowed'),
];

/**
 * Validation rules for bulk email upload
 */
export const validateBulkEmailUpload: ValidationChain[] = [
  body('emails')
    .isArray({ min: 1, max: 1000 })
    .withMessage('Must provide between 1 and 1000 emails'),

  body('emails.*.email')
    .trim()
    .isEmail()
    .withMessage('Invalid email address in array'),
];
