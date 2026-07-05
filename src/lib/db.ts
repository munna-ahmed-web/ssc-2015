import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable in .env.local"
  );
}

/**
 * Cached connection object — persisted across hot-reloads in Next.js dev mode.
 * In production, this avoids creating a new connection on every cold start.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend the global object to hold the cached connection.
declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongooseCache ?? {
  conn: null,
  promise: null,
};

// Persist across hot-reloads in dev.
global._mongooseCache = cached;

export async function connectDB(): Promise<typeof mongoose> {
  // Return existing connection if available.
  if (cached.conn) {
    return cached.conn;
  }

  // If a connection is already in progress, wait for it.
  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false, // Fail fast instead of queuing commands while disconnected.
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // Reset promise so next call retries.
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
