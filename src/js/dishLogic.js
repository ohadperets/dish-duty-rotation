// Dish Duty Selection Logic

export function determineWhoDoesTheDishes(presentBrothers, dishHistory) {
    const groupKey = presentBrothers.sort().join(',');
    
    // Get history for this specific group
    const groupHistory = dishHistory.filter(entry => entry.group === groupKey);
    
    // Count dishes done by each brother in this group
    const counts = {};
    const lastDates = {};
    
    presentBrothers.forEach(brother => {
        counts[brother] = 0;
        lastDates[brother] = null;
    });
    
    groupHistory.forEach(entry => {
        if (counts.hasOwnProperty(entry.brother)) {
            counts[brother]++;
            if (!lastDates[entry.brother] || new Date(entry.date) > new Date(lastDates[entry.brother])) {
                lastDates[entry.brother] = entry.date;
            }
        }
    });
    
    // Find minimum count
    const minCount = Math.min(...Object.values(counts));
    
    // Get all brothers with minimum count
    const candidates = presentBrothers.filter(brother => counts[brother] === minCount);
    
    let chosen;
    let reason;
    
    if (candidates.length === 1) {
        chosen = candidates[0];
        reason = `${chosen} has done the dishes the least times in this group (${minCount} time${minCount !== 1 ? 's' : ''}).`;
    } else {
        // If tie, choose the one who did it least recently (or never)
        const candidatesWithDates = candidates.map(brother => ({
            brother,
            lastDate: lastDates[brother] ? new Date(lastDates[brother]) : new Date(0)
        }));
        
        candidatesWithDates.sort((a, b) => a.lastDate - b.lastDate);
        chosen = candidatesWithDates[0].brother;
        
        if (lastDates[chosen]) {
            const lastDateStr = new Date(lastDates[chosen]).toLocaleDateString();
            reason = `All tied at ${minCount} turns. ${chosen} did it earliest (${lastDateStr}).`;
        } else {
            reason = `All tied at ${minCount} turns. ${chosen} hasn't done it with this group yet.`;
        }
    }
    
    return {
        chosen,
        reason,
        group: groupKey,
        presentBrothers,
        counts,
        lastDates
    };
}
