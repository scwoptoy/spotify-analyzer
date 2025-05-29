"""
Database Configuration
MongoDB connection and initialization
"""
import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from loguru import logger

from ..models.playlist import Playlist, User

class Database:
    client: AsyncIOMotorClient = None
    database = None

db = Database()

async def connect_to_mongo():
    """Create database connection"""
    try:
        # Get MongoDB URL from environment
        mongodb_url = os.getenv("MONGODB_URL", "mongodb://admin:password123@mongodb:27017/spotify_analyzer?authSource=admin")
        
        logger.info(f"Connecting to MongoDB...")
        
        # Create connection
        db.client = AsyncIOMotorClient(mongodb_url)
        
        # Get database
        db.database = db.client.get_database("spotify_analyzer")
        
        # Test connection
        await db.client.admin.command('ping')
        logger.info("✅ Connected to MongoDB successfully")
        
        # Initialize Beanie with document models
        await init_beanie(
            database=db.database,
            document_models=[Playlist, User]
        )
        logger.info("✅ Beanie initialized with document models")
        
    except Exception as e:
        logger.error(f"❌ Failed to connect to MongoDB: {e}")
        raise

async def close_mongo_connection():
    """Close database connection"""
    try:
        if db.client:
            db.client.close()
            logger.info("✅ MongoDB connection closed")
    except Exception as e:
        logger.error(f"Error closing MongoDB connection: {e}")

async def get_database():
    """Get database instance"""
    return db.database