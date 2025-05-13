const { body, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// User validation rules
const userValidationRules = () => {
    return [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters long'),
        body('role')
            .optional()
            .isIn(['client', 'worker', 'admin'])
            .withMessage('Invalid role'),
        body('phone')
            .optional()
            .matches(/^[0-9+\-\s()]*$/)
            .withMessage('Invalid phone number format')
    ];
};

// Task validation rules
const taskValidationRules = () => {
    return [
        body('title').trim().notEmpty().withMessage('Title is required'),
        body('description').trim().notEmpty().withMessage('Description is required'),
        body('category')
            .isIn(['Cleaning', 'IT & Technology', 'Gardening', 'Handyman', 'Delivery'])
            .withMessage('Invalid category'),
        body('location').trim().notEmpty().withMessage('Location is required'),
        body('budget')
            .isFloat({ min: 0 })
            .withMessage('Budget must be a positive number'),
        body('deadline')
            .isISO8601()
            .withMessage('Valid deadline date is required')
    ];
};

// Message validation rules
const messageValidationRules = () => {
    return [
        body('content').trim().notEmpty().withMessage('Message content is required'),
        body('receiver').isMongoId().withMessage('Valid receiver ID is required'),
        body('task').isMongoId().withMessage('Valid task ID is required')
    ];
};

// Review validation rules
const reviewValidationRules = () => {
    return [
        body('rating')
            .isInt({ min: 1, max: 5 })
            .withMessage('Rating must be between 1 and 5'),
        body('comment').trim().notEmpty().withMessage('Review comment is required'),
        body('reviewType')
            .isIn(['client-to-worker', 'worker-to-client'])
            .withMessage('Invalid review type')
    ];
};

module.exports = {
    validate,
    userValidationRules,
    taskValidationRules,
    messageValidationRules,
    reviewValidationRules
}; 