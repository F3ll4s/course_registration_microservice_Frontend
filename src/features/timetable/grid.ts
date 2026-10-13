// Timetable geometry, measured on the Penpot "Screen 2" board
export const GRID_START = 8 * 60; // 08:00 in minutes
export const GRID_END = 18 * 60; // 18:00
export const HOUR_PX = 54; // height of one hour
export const GRID_LEAD = 10; // space above the 08:00 line
export const GRID_HEIGHT = GRID_LEAD + ((GRID_END - GRID_START) / 60) * HOUR_PX;
