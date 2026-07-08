/**
 * Chapter- and transit-bound insert triggers (afterSeconds filled post-production).
 * Keys are waypoint/transit ids; values map chapter index → insert ids.
 */
export const INSERT_AFTER_CHAPTER = {
  w02: { 0: ['ins_whopaid'] },
  w03: { 0: ['ins_jerusalem'] },
  w06: { 0: ['ins_constantine'] },
  w16: { 0: ['ins_water_trevi'] },
  w17: { 3: ['ins_agrippa'] },
  w19: { 0: ['ins_fire'] },
}

export const INSERT_ON_TRANSIT_START = {
  t19: ['ins_caesar_tease'],
}
