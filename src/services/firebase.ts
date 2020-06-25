import * as firebase from 'firebase';

// TODO: fill in your firebase config
const firebaseConfig = {
    apiKey: '***********************',
    authDomain: '***********************',
    databaseURL: '***********************',
    projectId: '***********************',
    appId: '***********************'
};

firebase.initializeApp(firebaseConfig);

interface IUserPublicProfile {
  id: string; 
  profilePic : string | null; 
  name: string | null; 
}

interface ISeat {
  id: string;
  order: number;
  user?: string;
}

interface ITable {
  id: string;
  order: number;
  seats: ISeat[];
}

interface ITableWithSeatStatus extends ITable {
  noOfSeatsOccupied: number;
}

export const saveUserProfile = async (user:  IUserPublicProfile): Promise<IUserPublicProfile | undefined> => {
  const db = firebase.firestore();
  const userRef = db.collection('publicProfile').doc(user.id);
  const userSnapshot = await userRef.get();

  if (userSnapshot.exists) {
    return userSnapshot.data() as IUserPublicProfile;
  }

  try {
    await userRef.set(user);

    return user;
  } catch (error) {
    console.log('Got error in saving user profile:');
    console.error(error);

    return undefined;
  }
};

export const getRoomData = async (roomId: string) => {
  const db = firebase.firestore();
  const roomRef = db.collection('rooms').doc(roomId); 
  const theaterRoomSnapshot = await roomRef.get();
  const theaterRoom = theaterRoomSnapshot.data();

  return theaterRoom;
}; 

export const getConfig = async () => {
  const db = firebase.firestore();
  const configRef = db.collection('config').doc('2ifjRvQXJQx5SJDmzgoJ');
  const configSnapshot = await configRef.get();
  const config = configSnapshot.data();

  return config;
}; 

const isUserAlreadySeated = (tables: ITable[], userId: string) => {
  return tables.some((table: ITable) => table.seats.some((seat: ISeat) => seat.user === userId));
};

const getNoOfOccupiedSeats = (tables: ITable[]) => {
  return tables.map((table: ITable) => ({
    ...table,
    noOfSeatsOccupied: table.seats.reduce((acc: number, cur: ISeat) => cur.user ? acc + 1 : acc, 0)
  }));
};

const isRoomFull = (seatsStatus: ITableWithSeatStatus[], maxAllowedPerTable: number) => {
  return seatsStatus.reduce((acc: boolean, cur: ITableWithSeatStatus) => {
    return cur.noOfSeatsOccupied === maxAllowedPerTable && acc; 
  }, true);
};

export const assignSeatToUser = async (user:  IUserPublicProfile): Promise<any> => {
  const theaterRoom = await getRoomData('theater');
  const config = await getConfig();

  const maxAllowedPerTable = (config && config.maxAllowedPerTable) || 6;

  if (theaterRoom) {
    const { tables } = theaterRoom;

    const isAlreadySeated = isUserAlreadySeated(tables, user.id);

    if (isAlreadySeated) {
      return;
    }

    const seatsStatus: ITableWithSeatStatus[] = getNoOfOccupiedSeats(tables);
    seatsStatus.sort((a, b) => a.order - b.order);

    const isFull = isRoomFull(seatsStatus, maxAllowedPerTable);

    if (isFull) {
      return {
        isFull,
      };
    }

    const table1SeatsOccupied = seatsStatus[0].noOfSeatsOccupied;
    const seatsToBeFilled = getSeatsFilledPerTable(table1SeatsOccupied);
    
    let i = 0;
    let nextTable: ITableWithSeatStatus = seatsStatus[0];

    for (i = 0; i < seatsStatus.length; i += 1) {
      if (seatsStatus[i].noOfSeatsOccupied < seatsToBeFilled) {
        nextTable = seatsStatus[i];
        break;
      }
    }

    const nextSeat: ISeat | undefined = nextTable.seats.find((seat: ISeat) => !seat.user);
     
    if (!nextSeat) {
      console.error('Seat already occupied!', nextSeat);

      return;
    }
    const table = { ...nextTable };
    delete table.noOfSeatsOccupied;

    if (!isAlreadySeated) {
      const db = firebase.firestore();
      const roomRef = db.collection('rooms').doc('theater'); 

      const batch = db.batch();

      batch.update(roomRef, {
        tables: firebase.firestore.FieldValue.arrayRemove({
          ...table,
        })
      });

      batch.update(roomRef, { 
        tables: firebase.firestore.FieldValue.arrayUnion({
          ...table,
          seats: table.seats.map((seat: any) => seat.id === nextSeat.id ? {...seat, user: user.id } : seat)
        })
      });

      await batch.commit();
    }
  }
};

const tableOccupiedByUser = (tables: ITable[], userId: string) => {
  return tables.find((table: ITable) => (
    table.seats.some((seat: ISeat) => {
      return seat.user === userId;
    }))
  );
};

export const emptySeat = async () => {
  const user = firebase.auth().currentUser;
  const room = await getRoomData('theater');

  if (!room || !user) {
    console.error('Room or user not defined');

    return;
  }

  const occupiedTableByUser = tableOccupiedByUser(room.tables, user.uid);
  
  if (occupiedTableByUser) {
    const db = firebase.firestore();
    const roomRef = db.collection('rooms').doc('theater'); 

    const batch = db.batch();

    batch.update(roomRef, {
      tables: firebase.firestore.FieldValue.arrayRemove({
        ...occupiedTableByUser,
      })
    });

    batch.update(roomRef, { 
      tables: firebase.firestore.FieldValue.arrayUnion({
        ...occupiedTableByUser,
        seats: occupiedTableByUser.seats.map((seat: any) => {
          if (seat.user === user?.uid) {
            delete seat.user;
          }

          return seat;
        })
      })
    });

    await batch.commit();
  }
};

export const switchSeat = async (toTableId: string) => {
  const user = firebase.auth().currentUser;
  const room = await getRoomData('theater');
  const config = await getConfig();

  if (!room || !user || !config) {
    console.error('Room or user or config not defined');

    return;
  }
  
  const nextTable = room.tables.find((table: ITable) => table.id === toTableId);
  const noOfSeatsAvailable = nextTable.seats.reduce((acc: number, cur: ISeat) => {
    return !!cur.user ? acc + 1 : acc;
  }, 0);

  const nextSeat: ISeat | undefined = nextTable.seats.find((seat: ISeat) => !seat.user);

  if (!nextSeat || noOfSeatsAvailable > config.maxAllowedPerTable) {
    console.log('Reached max. capacity!');

    return;
  }

  const occupiedTableByUser = tableOccupiedByUser(room.tables, user.uid);

  if (occupiedTableByUser) {
    const db = firebase.firestore();
    const roomRef = db.collection('rooms').doc('theater'); 

    const batch = db.batch();

    batch.update(roomRef, {
      tables: firebase.firestore.FieldValue.arrayRemove({
        ...occupiedTableByUser,
      })
    });

    batch.update(roomRef, { 
      tables: firebase.firestore.FieldValue.arrayUnion({
        ...occupiedTableByUser,
        seats: occupiedTableByUser.seats.map((seat: any) => {
          if (seat.user === user?.uid) {
            delete seat.user;
          }

          return seat;
        })
      })
    });

    batch.update(roomRef, {
      tables: firebase.firestore.FieldValue.arrayRemove({
        ...nextTable,
      })
    });

    batch.update(roomRef, { 
      tables: firebase.firestore.FieldValue.arrayUnion({
        ...nextTable,
        seats: nextTable.seats.map((seat: any) => seat.id === nextSeat.id ? {...seat, user: user.uid } : seat)
      })
    });

    await batch.commit();
  }

};

const getSeatsFilledPerTable = (current: number): number => {
  if (current <= 2) {
    return 2;
  }

  return current;
};

export default firebase;
