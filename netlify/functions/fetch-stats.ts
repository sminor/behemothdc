import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import type { Handler, HandlerEvent } from '@netlify/functions';

// Define types for the response data
interface ADLPlayer {
  name: string;
  playerId: string;
  games01: number;
  cricketGames: number;
  avg01: number;
  cricketAvg: number;
  rating01: number;
  cricketRating: number;
  rollingRating: number;
}

interface NADORawPlayer {
  firstName: string;
  lastName: string;
  gamesPlayed: number;
  marksPerRound: number;
  pointsPerDart: number;
  actualRating: number;
  points: {
    cappedPoints: number;
  };
}

interface NADOPlayer {
  firstName: string;
  lastName: string;
  gamesPlayed: number;
  marksPerRound: number;
  pointsPerDart: number;
  rating: number;
  nadoPoints: number;
}

type Player = ADLPlayer | NADOPlayer;

export const handler: Handler = async (event: HandlerEvent) => {
  const { searchValue, searchSource } = JSON.parse(event.body || '{}');

  if (!searchValue || !['adl', 'nado'].includes(searchSource)) {
    console.log('Invalid input:', { searchValue, searchSource });
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing or invalid searchValue/searchSource' }),
    };
  }

  const urls = {
    adl: 'http://actiondartl.web709.discountasp.net/Player/StatisticSearch',
    nado: 'https://api.nado.net/v2/franchiseePlayers/JayMar-Entertainment',
  };

  try {
    let players: Player[] = [];

    if (searchSource === 'adl') {
      console.log('Fetching ADL data for:', searchValue);
      const response = await fetch(urls.adl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `searchValue=${encodeURIComponent(searchValue)}&regionId=&lowRating=&highRating=`,
      });

      if (!response.ok) {
        console.error('ADL fetch failed:', response.status, response.statusText);
        throw new Error(`ADL fetch failed: ${response.statusText}`);
      }

      const html = await response.text();
      console.log('ADL HTML length:', html.length); // Check if we got data
      const $ = cheerio.load(html);
      const rows = $('tr');
      console.log('ADL rows found:', rows.length); // Check if <tr> elements exist

      rows.each((i: number, el: cheerio.Element) => {
        const name = $(el).find('.rowTitleRoster').text().trim();
        if (name) {
          const player = {
            name,
            playerId: $(el).find('.row1Roster').eq(1).text().trim(),
            games01: Number($(el).find('.row1Roster').eq(2).text().trim()),
            cricketGames: Number($(el).find('.row1Roster').eq(3).text().trim()),
            avg01: Number($(el).find('.row1Roster').eq(4).text().trim()),
            cricketAvg: Number($(el).find('.row1Roster').eq(5).text().trim()),
            rating01: Number($(el).find('.row1Roster').eq(6).text().trim()),
            cricketRating: Number($(el).find('.row1Roster').eq(7).text().trim()),
            rollingRating: Number($(el).find('.row1Roster').eq(8).text().trim()),
          };
          console.log('ADL player parsed:', player); // Log each parsed player
          players.push(player);
        }
      });

      if (players.length === 0) {
        console.log('No ADL players found in HTML');
      }
    }

    if (searchSource === 'nado') {
      console.log('Fetching NADO data for:', searchValue);
      const response = await fetch(urls.nado, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        console.error('NADO fetch failed:', response.status, response.statusText);
        throw new Error(`NADO fetch failed: ${response.statusText}`);
      }

      const json = (await response.json()) as NADORawPlayer[];
      players = json
        .filter((player) =>
          `${player.firstName} ${player.lastName}`
            .toLowerCase()
            .includes(searchValue.toLowerCase())
        )
        .map((player) => ({
          firstName: player.firstName,
          lastName: player.lastName,
          gamesPlayed: player.gamesPlayed,
          marksPerRound: player.marksPerRound,
          pointsPerDart: player.pointsPerDart,
          rating: player.actualRating,
          nadoPoints: player.points.cappedPoints,
        }));
      console.log('NADO players found:', players.length);
    }

    console.log('Returning players:', players);
    return {
      statusCode: 200,
      body: JSON.stringify({ players }),
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch stats' }),
    };
  }
};