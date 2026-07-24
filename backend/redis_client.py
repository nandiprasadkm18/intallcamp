import os
import redis

# Redis Configuration loaded from Environment Variables or falling back to localhost defaults
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)

# Initialize the Redis Client
redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    password=REDIS_PASSWORD,
    decode_responses=True
)

def test_redis_connection():
    """Simple ping utility to verify the Redis server is responsive."""
    try:
        response = redis_client.ping()
        if response:
            print("Successfully connected to Redis!")
            return True
    except redis.ConnectionError as e:
        print(f"Redis Connection Failed: {e}")
        return False

# Self-run test connection
if __name__ == "__main__":
    test_redis_connection()
