// date.js

/**
 * @fileoverview
 * Manages global date state and validation logic for the Precipi-Tracker application.
 * 
 * This module provides:
 * - Getters and setters for the current start and end dates used across the app
 * - A validation function to ensure date ranges are in proper order, not in the future,
 *   and within the allowed historical bounds for precipitation data (Dec 10, 2023 – Dec 10, 2024)
 */

// Stores the globally selected start and end dates for precipitation filtering
let currentStartDate = '2023-12-10'; // Default start date
let currentEndDate = '2024-12-10'; // Default end date

/**
 * Gets the currently selected start date for data filtering.
 * 
 * @function getCurrentStartDate
 * @returns {string} The start date in YYYY-MM-DD format.
 */
export function getCurrentStartDate() {
    return currentStartDate;
}

/**
 * Sets the start date to be used in data filtering.
 * 
 * @function setCurrentStartDate
 * @param {string} newStartDate - A string representing the new start date in YYYY-MM-DD format.
 */
export function setCurrentStartDate(newStartDate) {
    currentStartDate = newStartDate;
}

/**
 * Gets the currently selected end date for data filtering.
 * 
 * @function getCurrentEndDate
 * @returns {string} The end date in YYYY-MM-DD format.
 */
export function getCurrentEndDate() {
    return currentEndDate;
}

/**
 * Sets the end date to be used in data filtering.
 * 
 * @function setCurrentEndDate
 * @param {string} newEndDate - A string representing the new end date in YYYY-MM-DD format.
 */
export function setCurrentEndDate(newEndDate) {
    currentEndDate = newEndDate;
}

/**
 * Validates a given start and end date pair.
 * Ensures the range is within allowed bounds, not in the future,
 * and that the start date does not come after the end date.
 * 
 * @function validateDates
 * @param {string} start - Start date in YYYY-MM-DD format.
 * @param {string} end - End date in YYYY-MM-DD format.
 * @returns {{ isValid: boolean, message: string }} An object containing validation status and explanation.
 */
export function validateDates(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const now = new Date();
    const minimumDate = new Date('2023-12-10');
    const maximumDate = new Date('2024-12-10');

    if (startDate > endDate) {
        return {
            isValid: false,
            message: "Start date cannot be after end date."
        };
    }

    if (startDate < minimumDate || endDate > maximumDate) {
        return {
            isValid: false,
            message: `Please select dates between ${minimumDate.toDateString()} and ${maximumDate.toDateString()}.`
        };
    }

    if (startDate > now || endDate > now) {
        return {
            isValid: false,
            message: "Dates cannot be in the future."
        };
    }

    return {
        isValid: true,
        message: "Dates are valid."
    };
}
