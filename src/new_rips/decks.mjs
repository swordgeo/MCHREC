//decks.mjs
import fetch from "node-fetch";
import { queryWithRetry } from "../js/server-utils.js";

// export async function ripDeckData(connection,formattedDate) {
//turn these on for day to day
export async function ripDeckData(pool) {
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2); // *this is the number to change to go back in time*
  const formattedDate = twoDaysAgo.toISOString().slice(0, 10);

  const sql = `SELECT * FROM decks WHERE date_creation = ?`;
  const values = [formattedDate];

  try {
    const [results] = await queryWithRetry(pool, sql, values);

    // if there is any data, stop what we're doing
    if (results.length != 0) {
      console.log(`data found for ${formattedDate}`);
      return;
    }
    console.log(`data not found for ${formattedDate}, fetching...`);


    const response = await fetch(`https://marvelcdb.com/api/public/decklists/by_date/${formattedDate}`);
    if (response.status === 404) {
      console.log(`No decklists found for date ${formattedDate}`);
      return;
    }
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const decks = await response.json();

    for (const deck of decks) {
      const { date_creation, hero_code, slots, meta } = deck;
      // console.log(deck);

        //pull aspect from meta, if possible
        let aspect = meta && meta !== '' ? JSON.parse(meta).aspect : null;
        if (hero_code == '21031a') {//Adam Warlock
          aspect = 'none';
        } else if (hero_code == '04031a') {//Spider-Woman
          let aspect2 = meta && meta !== '' ? JSON.parse(meta).aspect2 : null;
          if ((aspect == null ) || (aspect2 == null)) {
            continue;
          }
          const aspectArr = [aspect, aspect2].sort();
          aspect = aspectArr.join('/');
        }
        if (aspect == null) {
          continue;
        }

        // query the aspects table to get the aspect_id
        const aspectSql = `SELECT aspect_id FROM aspects WHERE aspect_name = ?`;
        const aspectValues = [aspect];
  
        const [aspectResults] = await pool.query(aspectSql, aspectValues);
        if (aspectResults.length === 0) {
          throw new Error(`Aspect not found in the database ${aspect}`);
        }
        const aspect_id = aspectResults[0].aspect_id;
  
        const deckSql = `INSERT INTO decks (date_creation, master_code, aspect_id) VALUES (?, ?, ?)`;
        const deckValues = [date_creation, hero_code, aspect_id];
  
        const [insertDeckResult] = await pool.query(deckSql, deckValues);
        const decks_id = insertDeckResult.insertId;
  
        for (const slot in slots) {
          const cardCode = slot.split(':')[0]; // Ensure this logic is correct as 'slot' is a key (string), not an object.
          const dlSql = `INSERT INTO decklists (decks_id, code) VALUES (?, ?)`;
          const dlValues = [decks_id, cardCode];
  
          await pool.query(dlSql, dlValues); // If an error occurs here, it will be caught by the outer try/catch.
        }
      }
    } catch (error) {
      console.error(error); // Use console.error to log errors 
    }
}


//if it fails, we redo it
async function ripDeckDataWithRetry(pool, retries = 5) {
  while (retries--) {
    try {
      await ripDeckData(pool); // Your existing function as is
      break; // If successful, break out of the loop
    } catch (err) {
      if (retries > 0 && (err.code === 'ECONNRESET' || err.code === 'PROTOCOL_CONNECTION_LOST')) {
        console.error('Error in ripDeckData, retrying...', err);
        await delay(60000); // Wait for 60 seconds before retrying
        continue;
      } else {
        console.error('Failed to execute ripDeckData after retries or unrecoverable error:', err);
        break; // If out of retries or unrecoverable error, break out of the loop
      }
    }
  }
}


// Call this function four times per day (every six hours) to update the deck data
// We do it four times because sometimes MArvelCDB goes down for a few hours and we don't want to miss our pull.
export function startRipDeckDataInterval(pool) {
  ripDeckDataWithRetry(pool);
  setInterval(() => ripDeckDataWithRetry(pool), 6 * 60 * 60 * 1000);
}


