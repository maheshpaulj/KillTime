import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Connects automatically using UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from your .env.local
const redis = Redis.fromEnv();

const LEADERBOARD_KEY = 'flappy_leaderboard';

export async function GET() {
  try {
    // Fetch top 10 scores (highest to lowest)
    // zrange with { rev: true, withScores: true } returns a flat array: ["Player1#id", 50, "Player2#id", 45]
    const results = await redis.zrange(LEADERBOARD_KEY, 0, 9, { rev: true, withScores: true });

    const leaderboard = [];
    for (let i = 0; i < results.length; i += 2) {
      leaderboard.push({
        name: results[i], 
        score: Number(results[i + 1]),
      });
    }

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error("Flappy Leaderboard GET Error:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { deviceId, name, score } = body;

    if (!deviceId || !name || typeof score !== 'number') {
      return NextResponse.json({ error: 'Invalid data payload' }, { status: 400 });
    }

    // We append the deviceId to the name in the database so that if two people are named "GUEST",
    // they don't overwrite each other's scores. (Our frontend splits the '#' off before displaying it).
    const uniqueMember = `${name.substring(0, 10)}#${deviceId}`;

    // Check if this specific player already has a score
    const currentScore = await redis.zscore(LEADERBOARD_KEY, uniqueMember);

    // Only update the database if this is their first time playing, OR if their new score is strictly higher
    if (currentScore === null || score > Number(currentScore)) {
      await redis.zadd(LEADERBOARD_KEY, { score, member: uniqueMember });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Flappy Leaderboard POST Error:", error);
    return NextResponse.json({ error: 'Failed to save score' }, { status: 500 });
  }
}