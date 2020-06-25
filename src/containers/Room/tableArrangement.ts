const getSeatsForTable = (noOfSeats: number = 6) => Array.from({length: noOfSeats}, (v, i) => ({
  order: i,
  id: `seat-${i + 1}`,
}));

const tableIds = [
  'first-table',
  'second-table',
  'third-table',
  'fourth-table',
  'fifth-table',
  'sixth-table',
  'seventh-table',
  'eighth-table',
  'ninth-table',
  'tenth-table',
  'eleventh-table',
  'twelfth-table',
  'thirteenth-table',
  'fourteenth-table',
  'fifteenth-table',
  'left-top-table',
  'right-top-table',
  'left-bottom-table',
  'right-bottom-table',
];

const getTables = () => tableIds.map((id, index) => ({
  id,
  order: index,
  seats: getSeatsForTable(6) ,
}));

export const getRoomWithTable = (roomId: string) => ({
  id: roomId,
  tables: getTables(),
});