// date.js
let currentStartDate = '2023-12-10'; // default start date
let currentEndDate = '2024-12-10';   // default end date

// Function to get the current start date
export function getCurrentStartDate() {
    return currentStartDate;
}

// Function to set the current start date
export function setCurrentStartDate(newStartDate) {
    currentStartDate = newStartDate;
}

// Function to get the current end date
export function getCurrentEndDate() {
    return currentEndDate;
}

// Function to set the current end date
export function setCurrentEndDate(newEndDate) {
    currentEndDate = newEndDate;
}

// Function to validate start and end dates
export function validateDates(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const now = new Date();
    const minimumDate = new Date('2023-12-10');
    const maximumDate = new Date('2024-12-10');

    if (startDate > endDate) {
        return { isValid: false, message: "Start date cannot be after end date." };
    }

    if (startDate < minimumDate || endDate > maximumDate) {
        return { isValid: false, message: `Please select dates between ${minimumDate.toDateString()} and ${maximumDate.toDateString()}.` };
    }

    if (startDate > now || endDate > now) {
        return { isValid: false, message: "Dates cannot be in the future." };
    }

    return { isValid: true, message: "Dates are valid." };
}