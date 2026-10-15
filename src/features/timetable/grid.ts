// Timetable geometry for the Penpot "Design #1" Weekly Timetable card (88px day columns).
// The board draws fixed slots; the app keeps a linear hour scale so any class time lands in the right place.
export const GRID_START = 8 * 60; // 08:00 in minutes
export const GRID_END = 18 * 60; // 18:00
export const HOUR_PX = 36; // height of one hour
export const GRID_HEIGHT = ((GRID_END - GRID_START) / 60) * HOUR_PX;
