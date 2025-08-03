import fetch from 'node-fetch';
import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  try {
    if (!event.body) {
      console.log("Missing request body");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing request body" }),
      };
    }

    const { url } = JSON.parse(event.body);
    console.log("Fetching URL:", url);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
      },
    });

    console.log("Response Status:", response.status);

    if (!response.ok) {
      console.log("Fetch failed:", response.statusText);
      throw new Error(`Failed to fetch from URL: ${response.status} ${response.statusText}`);
    }

    const data = await response.text();
    //console.log("Fetched HTML (First 500 chars):", data.substring(0, 500));

    return {
      statusCode: 200,
      body: JSON.stringify({ data }),
    };
  } catch (error: unknown) {
    console.error("Error fetching HTML:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch HTML data", details: (error as Error).message }),
    };
  }
};

