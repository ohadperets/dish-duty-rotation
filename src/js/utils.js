// Utility Functions
import { DAY } from '../config/constants.js';

export function isFriday() {
    const today = new Date();
    return today.getDay() === DAY.FRIDAY;
}

export function hasRunToday(dishHistory) {
    const today = new Date().toDateString();
    
    // Check if there's any entry from today in the history
    return dishHistory.some(entry => {
        const entryDate = new Date(entry.date).toDateString();
        return entryDate === today;
    });
}

export function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

export function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}
