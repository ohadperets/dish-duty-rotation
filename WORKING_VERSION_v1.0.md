# Working Version v2.0 - November 24, 2025

## Status: ✅ FULLY FUNCTIONAL - Production Ready

This version has all core features working correctly with complete production/test separation:

### Features Working
- ✅ Multiple groups (independent data per group)
- ✅ Counter persistence (saves to Firestore, loads correctly)
- ✅ Group switching (clears selections, loads correct dishwashers)
- ✅ **Production/Test environment COMPLETE SEPARATION**
- ✅ Subgroup tracking (each combination of people tracked independently)
- ✅ Stats display (accurate counts and last dates per subgroup)
- ✅ Photo/emoji support for groups and dishwashers
- ✅ Firebase Authentication (Google/Facebook)
- ✅ Group creation with 5-digit codes
- ✅ Dynamic dishwasher management (synced across both environments)
- ✅ Photo/icon validation (buttons disabled until selection made)

### Database Structure
```
Firestore Collections:
- groups/{groupId} - Group metadata (name, photoUrl, creatorUid, createdAt)
- groupMembers/{groupId}_{uid} - Membership relationships
- groupData_production/{groupId} - Production: {dishwashers{}, history[]}
- groupData_test/{groupId} - Test: {dishwashers{}, history[]} (separate copy)
- dishData/{production|test} - Legacy environment data (for backward compatibility)
```

### Key Files State

**src/js/main.js**
- Line 92-93: `isTestMode` initialized and synced to localStorage
- Lines 133-153: `initDishRotation()` - Clears selections, loads history for current environment
- Lines 225-248: Environment toggle - Reloads group data when switching, saves to localStorage
- Lines 421-450: `determineWhoDoesTheDishes()` - Filters by SUBGROUP (groupKey), not all history
- Lines 488-552: `displayResult()` - Shows winner and stats for selected subgroup
- Lines 562-602: Confirm button - Saves to current environment only

**src/js/app.js**
- Lines 1-7: Exposes Groups module globally
- Lines 140-192: `selectGroup()` - Loads dishwashers and history, calls initDishRotation
- Lines 277-295: Group photo validation - Create button disabled until selection
- Lines 447-472: `renderSelectionScreen()` - Clears and renders dishwashers
- Lines 560-612: Dishwasher photo validation - Add button disabled until selection

**src/js/groups.js**
- Lines 53-68: `createGroup()` - Initializes BOTH production and test environments
- Lines 168-198: `getGroupData()` - Returns {dishwashers, history} from current environment
- Lines 200-218: `saveGroupData()` - Saves to current environment only
- Lines 220-242: `addDishwasher()` - Updates dishwashers in BOTH environments (synced)
- Lines 244-266: `removeDishwasher()` - Removes from BOTH environments (synced)
- Lines 268-283: `getDishwashers()` - Gets from current environment

**firestore.rules**
- Lines 38-51: Security rules for groupData_production and groupData_test collections

### Critical Logic
1. **Group Creation**: Creates empty data in BOTH `groupData_production` and `groupData_test`
2. **Add/Remove Dishwashers**: Updates in BOTH environments so they stay synced
3. **Loading**: Reads from current environment (`localStorage.getItem('testMode')`)
4. **Saving History**: Saves to current environment only (production or test)
5. **Environment Switch**: Reloads group data from new environment, updates localStorage
6. **Subgroup Tracking**: Filters history by `groupKey` (sorted presentBrothers array)
7. **UI Validation**: Create/Add buttons disabled until photo or icon selected

### Production/Test Separation
- **Dishwashers**: Synced across both environments (add/remove updates both)
- **History**: Completely separate per environment
- **Switching**: Seamless - same dishwashers, different history counts
- **localStorage**: Used to communicate current mode to Groups module

### No Known Issues
All features tested and working correctly. Production and test environments completely independent.

---
**Restore Point**: Version 2.0 - Complete production/test separation with subgroup tracking
