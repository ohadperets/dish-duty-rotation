// Application State Management

export const state = {
    isTestMode: false,
    selectedBrothers: new Set(),
    dishHistory: [],
    isBlocked: false,
    blockCountdown: 0,
    currentResult: null
};

export function getEnvironment() {
    return state.isTestMode ? 'test' : 'production';
}

export function toggleTestMode() {
    state.isTestMode = !state.isTestMode;
}

export function setTestMode(value) {
    state.isTestMode = value;
}

export function addSelectedBrother(brother) {
    state.selectedBrothers.add(brother);
}

export function removeSelectedBrother(brother) {
    state.selectedBrothers.delete(brother);
}

export function clearSelectedBrothers() {
    state.selectedBrothers.clear();
}

export function setDishHistory(history) {
    state.dishHistory = history;
}

export function addDishEntry(entry) {
    state.dishHistory.push(entry);
}

export function setBlocked(value, countdown = 0) {
    state.isBlocked = value;
    state.blockCountdown = countdown;
}

export function decrementBlockCountdown() {
    if (state.blockCountdown > 0) {
        state.blockCountdown--;
    }
}

export function setCurrentResult(result) {
    state.currentResult = result;
}
