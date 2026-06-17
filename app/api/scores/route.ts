import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// Automatically picks up the UPSTASH_REDIS_REST_URL and TOKEN from your .env
const redis = Redis.fromEnv();

export async function GET() {
  try {
    // Fetch top 10 scores from a Redis Sorted Set
    const leaderboard: any[] = await redis.zrange('traffic_leaderboard', 0, 9, {
      rev: true,
      withScores: true,
    });

    const formatted = [];
    if (leaderboard.length > 0) {
      if (typeof leaderboard[0] === 'object' && leaderboard[0] !== null) {
        // Upstash returns { member: 'Name', score: 5000 }
        for (const item of leaderboard) {
          formatted.push({ name: item.member, score: item.score });
        }
      } else {
        // Fallback for flat array responses
        for (let i = 0; i < leaderboard.length; i += 2) {
          formatted.push({ name: leaderboard[i], score: Number(leaderboard[i + 1]) });
        }
      }
    }

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { deviceId, name, score, frames } = await request.json();

    // ANTI-CHEAT VALIDATION
    // Score increases by 1 every 10 frames.
    const minimumExpectedFrames = score * 10;
    if (frames < minimumExpectedFrames || score < 0) {
      return NextResponse.json({ error: 'Invalid score data detected.' }, { status: 400 });
    }

    // Check personal best mapped to their Device ID
    const currentBest = await redis.hget<number>('traffic_personal_bests', deviceId) || 0;
    
    if (score > currentBest) {
      // Update personal best
      await redis.hset('traffic_personal_bests', { [deviceId]: score });
      
      // Add to global leaderboard. We append a tiny random string to the name to prevent unique name collisions.
      const uniqueName = `${name.substring(0, 10)}#${Math.floor(Math.random() * 9999)}`;
      await redis.zadd('traffic_leaderboard', { score: score, member: uniqueName });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save score' }, { status: 500 });
  }
}