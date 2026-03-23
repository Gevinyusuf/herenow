"""
Add category column to events_v1 table and insert test events
Run: python d:\Project\herenow\scripts\insert_test_events.py
"""
import os
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', 'apps', 'api-gateway', '.env'))

from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def add_category_column():
    """Add category column to events_v1 table"""
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    try:
        sql = """
        ALTER TABLE events_v1 ADD COLUMN IF NOT EXISTS category TEXT DEFAULT NULL;
        CREATE INDEX IF NOT EXISTS idx_events_v1_category ON events_v1(category);
        """
        result = supabase.rpc('exec', {'query': sql}).execute()
        print("✅ Category column added successfully")
    except Exception as e:
        print(f"⚠️ RPC method not available, trying direct approach: {e}")
        try:
            result = supabase.table("events_v1").select("category").limit(1).execute()
            print("✅ Category column already exists or accessible")
        except:
            print("❌ Could not verify category column. Please run the SQL manually:")
            print("   ALTER TABLE events_v1 ADD COLUMN IF NOT EXISTS category TEXT DEFAULT NULL;")

def insert_test_events():
    """Insert test events into events_v1 table"""
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    events = [
        {
            "title": "AI & Machine Learning Summit 2025",
            "slug": "ai-ml-summit-2025",
            "description": "<p>Join industry leaders to explore the latest advancements in artificial intelligence and machine learning.</p>",
            "cover_image_url": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80",
            "start_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            "end_at": (datetime.now(timezone.utc) + timedelta(days=7, hours=3)).isoformat(),
            "timezone": "America/New_York",
            "location_info": {"type": "offline", "address": "San Francisco Convention Center", "lat": 37.7749, "lng": -122.4194},
            "visibility": "public",
            "require_approval": False,
            "ticket_config": {"tickets": [{"name": "General Admission", "price": 99, "limit": 500}]},
            "category": "Tech & AI"
        },
        {
            "title": "Blockchain & Web3 Workshop",
            "slug": "blockchain-web3-workshop",
            "description": "<p>Learn about decentralized applications and the future of blockchain technology.</p>",
            "cover_image_url": "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80",
            "start_at": (datetime.now(timezone.utc) + timedelta(days=14)).isoformat(),
            "end_at": (datetime.now(timezone.utc) + timedelta(days=14, hours=4)).isoformat(),
            "timezone": "America/Los_Angeles",
            "location_info": {"type": "offline", "address": "Silicon Valley Tech Hub", "lat": 37.3861, "lng": -122.0839},
            "visibility": "public",
            "require_approval": False,
            "ticket_config": {"tickets": [{"name": "Workshop Pass", "price": 149, "limit": 100}]},
            "category": "Crypto"
        },
        {
            "title": "Gourmet Food & Wine Tasting",
            "slug": "gourmet-food-wine-tasting",
            "description": "<p>Experience a curated selection of fine wines paired with artisanal cheeses and charcuterie.</p>",
            "cover_image_url": "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80",
            "start_at": (datetime.now(timezone.utc) + timedelta(days=3)).isoformat(),
            "end_at": (datetime.now(timezone.utc) + timedelta(days=3, hours=2)).isoformat(),
            "timezone": "America/New_York",
            "location_info": {"type": "offline", "address": "Manhattan Wine Room", "lat": 40.7128, "lng": -74.0060},
            "visibility": "public",
            "require_approval": False,
            "ticket_config": {"tickets": [{"name": "VIP Tasting", "price": 75, "limit": 50}]},
            "category": "Food & Drink"
        },
        {
            "title": "International Street Food Festival",
            "slug": "international-street-food-festival",
            "description": "<p>Explore flavors from around the world at this vibrant street food celebration.</p>",
            "cover_image_url": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80",
            "start_at": (datetime.now(timezone.utc) + timedelta(days=10)).isoformat(),
            "end_at": (datetime.now(timezone.utc) + timedelta(days=10, hours=5)).isoformat(),
            "timezone": "America/Chicago",
            "location_info": {"type": "offline", "address": "Grant Park Chicago", "lat": 41.8724, "lng": -87.6232},
            "visibility": "public",
            "require_approval": False,
            "ticket_config": {"tickets": [{"name": "Entry", "price": 0, "limit": 1000}]},
            "category": "Food & Drink"
        },
        {
            "title": "Contemporary Art Exhibition Opening",
            "slug": "contemporary-art-exhibition",
            "description": "<p>Discover works from emerging artists pushing boundaries in modern art.</p>",
            "cover_image_url": "https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=800&q=80",
            "start_at": (datetime.now(timezone.utc) + timedelta(days=5)).isoformat(),
            "end_at": (datetime.now(timezone.utc) + timedelta(days=5, hours=3)).isoformat(),
            "timezone": "Europe/London",
            "location_info": {"type": "offline", "address": "Tate Modern Gallery", "lat": 51.5074, "lng": -0.0994},
            "visibility": "public",
            "require_approval": False,
            "ticket_config": {"tickets": [{"name": "Exhibition Entry", "price": 25, "limit": 200}]},
            "category": "Arts & Culture"
        },
        {
            "title": "Jazz Night in the Park",
            "slug": "jazz-night-park",
            "description": "<p>Enjoy an evening of live jazz performances under the stars.</p>",
            "cover_image_url": "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&q=80",
            "start_at": (datetime.now(timezone.utc) + timedelta(days=8)).isoformat(),
            "end_at": (datetime.now(timezone.utc) + timedelta(days=8, hours=4)).isoformat(),
            "timezone": "America/New_Orleans",
            "location_info": {"type": "offline", "address": "City Park New Orleans", "lat": 29.9845, "lng": -90.0948},
            "visibility": "public",
            "require_approval": False,
            "ticket_config": {"tickets": [{"name": "General", "price": 0, "limit": 500}]},
            "category": "Arts & Culture"
        },
        {
            "title": "Morning Yoga & Meditation Retreat",
            "slug": "morning-yoga-meditation-retreat",
            "description": "<p>Start your day with energizing yoga sessions and peaceful meditation practices.</p>",
            "cover_image_url": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
            "start_at": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
            "end_at": (datetime.now(timezone.utc) + timedelta(days=2, hours=2)).isoformat(),
            "timezone": "America/Los_Angeles",
            "location_info": {"type": "offline", "address": "Venice Beach Yoga Studio", "lat": 33.9850, "lng": -118.4695},
            "visibility": "public",
            "require_approval": False,
            "ticket_config": {"tickets": [{"name": "Day Pass", "price": 35, "limit": 30}]},
            "category": "Wellness"
        },
        {
            "title": "Mindfulness & Mental Health Workshop",
            "slug": "mindfulness-mental-health-workshop",
            "description": "<p>Learn practical techniques for managing stress and improving mental well-being.</p>",
            "cover_image_url": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80",
            "start_at": (datetime.now(timezone.utc) + timedelta(days=12)).isoformat(),
            "end_at": (datetime.now(timezone.utc) + timedelta(days=12, hours=3)).isoformat(),
            "timezone": "America/Seattle",
            "location_info": {"type": "offline", "address": "Seattle Wellness Center", "lat": 47.6062, "lng": -122.3321},
            "visibility": "public",
            "require_approval": False,
            "ticket_config": {"tickets": [{"name": "Workshop", "price": 45, "limit": 50}]},
            "category": "Wellness"
        },
        {
            "title": "CrossFit Championship Qualifier",
            "slug": "crossfit-championship-qualifier",
            "description": "<p>Watch elite athletes compete in grueling CrossFit workouts.</p>",
            "cover_image_url": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
            "start_at": (datetime.now(timezone.utc) + timedelta(days=6)).isoformat(),
            "end_at": (datetime.now(timezone.utc) + timedelta(days=6, hours=5)).isoformat(),
            "timezone": "America/Denver",
            "location_info": {"type": "offline", "address": "Denver Sports Complex", "lat": 39.7392, "lng": -104.9903},
            "visibility": "public",
            "require_approval": False,
            "ticket_config": {"tickets": [{"name": "Spectator", "price": 20, "limit": 300}]},
            "category": "Fitness"
        },
        {
            "title": "Marathon Training Bootcamp",
            "slug": "marathon-training-bootcamp",
            "description": "<p>8-week training program to prepare you for your first marathon.</p>",
            "cover_image_url": "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80",
            "start_at": (datetime.now(timezone.utc) + timedelta(days=21)).isoformat(),
            "end_at": (datetime.now(timezone.utc) + timedelta(days=21, hours=2)).isoformat(),
            "timezone": "America/Boston",
            "location_info": {"type": "offline", "address": "Boston Common", "lat": 42.3601, "lng": -71.0589},
            "visibility": "public",
            "require_approval": False,
            "ticket_config": {"tickets": [{"name": "Bootcamp Pass", "price": 199, "limit": 40}]},
            "category": "Fitness"
        },
        {
            "title": "Bitcoin & Cryptocurrency Meetup",
            "slug": "bitcoin-crypto-meetup",
            "description": "<p>Monthly gathering for crypto enthusiasts to discuss trends and share insights.</p>",
            "cover_image_url": "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&q=80",
            "start_at": (datetime.now(timezone.utc) + timedelta(days=4)).isoformat(),
            "end_at": (datetime.now(timezone.utc) + timedelta(days=4, hours=2)).isoformat(),
            "timezone": "America/Miami",
            "location_info": {"type": "offline", "address": "Miami Tech Hub", "lat": 25.7617, "lng": -80.1918},
            "visibility": "public",
            "require_approval": False,
            "ticket_config": {"tickets": [{"name": "Free Entry", "price": 0, "limit": 100}]},
            "category": "Crypto"
        },
        {
            "title": "DeFi & NFT Workshop for Beginners",
            "slug": "defi-nft-workshop-beginners",
            "description": "<p>Learn the fundamentals of decentralized finance and NFT ecosystem.</p>",
            "cover_image_url": "https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=800&q=80",
            "start_at": (datetime.now(timezone.utc) + timedelta(days=9)).isoformat(),
            "end_at": (datetime.now(timezone.utc) + timedelta(days=9, hours=3)).isoformat(),
            "timezone": "America/New_York",
            "location_info": {"type": "virtual", "link": "https://zoom.us/j/defi-workshop"},
            "visibility": "public",
            "require_approval": False,
            "ticket_config": {"tickets": [{"name": "Online", "price": 0, "limit": 500}]},
            "category": "Crypto"
        },
        {
            "title": "Startup Pitch Competition",
            "slug": "startup-pitch-competition-2025",
            "description": "<p>Watch promising startups pitch their ideas to top investors.</p>",
            "cover_image_url": "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80",
            "start_at": (datetime.now(timezone.utc) + timedelta(days=15)).isoformat(),
            "end_at": (datetime.now(timezone.utc) + timedelta(days=15, hours=4)).isoformat(),
            "timezone": "America/San_Francisco",
            "location_info": {"type": "offline", "address": "SF Startup Arena", "lat": 37.7749, "lng": -122.4194},
            "visibility": "public",
            "require_approval": False,
            "ticket_config": {"tickets": [{"name": "Audience", "price": 0, "limit": 400}]},
            "category": "Tech & AI"
        },
        {
            "title": "Craft Beer & Brewery Tour",
            "slug": "craft-beer-brewery-tour",
            "description": "<p>Visit local breweries and taste unique craft beers.</p>",
            "cover_image_url": "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800&q=80",
            "start_at": (datetime.now(timezone.utc) + timedelta(days=11)).isoformat(),
            "end_at": (datetime.now(timezone.utc) + timedelta(days=11, hours=3)).isoformat(),
            "timezone": "America/Portland",
            "location_info": {"type": "offline", "address": "Portland Brewing District", "lat": 45.5152, "lng": -122.6784},
            "visibility": "public",
            "require_approval": False,
            "ticket_config": {"tickets": [{"name": "Tour + Tasting", "price": 55, "limit": 25}]},
            "category": "Food & Drink"
        },
        {
            "title": "Photography Walk: Street Art District",
            "slug": "photography-walk-street-art",
            "description": "<p>Explore colorful murals and street art while learning photography tips.</p>",
            "cover_image_url": "https://images.unsplash.com/photo-1493863641943-9b68992a8d07?w=800&q=80",
            "start_at": (datetime.now(timezone.utc) + timedelta(days=6)).isoformat(),
            "end_at": (datetime.now(timezone.utc) + timedelta(days=6, hours=2)).isoformat(),
            "timezone": "America/Los_Angeles",
            "location_info": {"type": "offline", "address": "Melrose Arts District LA", "lat": 34.0837, "lng": -118.3536},
            "visibility": "public",
            "require_approval": False,
            "ticket_config": {"tickets": [{"name": "Photography Walk", "price": 0, "limit": 30}]},
            "category": "Arts & Culture"
        },
        {
            "title": "Sound Bath Healing Session",
            "slug": "sound-bath-healing-session",
            "description": "<p>Experience deep relaxation with crystal singing bowls and gongs.</p>",
            "cover_image_url": "https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=800&q=80",
            "start_at": (datetime.now(timezone.utc) + timedelta(days=13)).isoformat(),
            "end_at": (datetime.now(timezone.utc) + timedelta(days=13)).isoformat(),
            "timezone": "America/Austin",
            "location_info": {"type": "offline", "address": "Austin Healing Space", "lat": 30.2672, "lng": -97.7431},
            "visibility": "public",
            "require_approval": False,
            "ticket_config": {"tickets": [{"name": "Session", "price": 40, "limit": 20}]},
            "category": "Wellness"
        },
        {
            "title": "Indoor Rock Climbing Meetup",
            "slug": "indoor-rock-climbing-meetup",
            "description": "<p>Join fellow climbing enthusiasts for a day at the wall.</p>",
            "cover_image_url": "https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800&q=80",
            "start_at": (datetime.now(timezone.utc) + timedelta(days=5)).isoformat(),
            "end_at": (datetime.now(timezone.utc) + timedelta(days=5, hours=3)).isoformat(),
            "timezone": "America/Denver",
            "location_info": {"type": "offline", "address": "Denver Climbing Company", "lat": 39.7508, "lng": -104.9967},
            "visibility": "public",
            "require_approval": False,
            "ticket_config": {"tickets": [{"name": "Day Pass", "price": 25, "limit": 40}]},
            "category": "Fitness"
        },
        {
            "title": "Ethereum 2.0 Development Conference",
            "slug": "ethereum-2-dev-conference",
            "description": "<p>Deep dive into Ethereum scaling solutions and DeFi protocols.</p>",
            "cover_image_url": "https://images.unsplash.com/photo-1634193295627-1cdddf751ebf?w=800&q=80",
            "start_at": (datetime.now(timezone.utc) + timedelta(days=18)).isoformat(),
            "end_at": (datetime.now(timezone.utc) + timedelta(days=18, hours=6)).isoformat(),
            "timezone": "Europe/Berlin",
            "location_info": {"type": "offline", "address": "Berlin Tech Conference Center", "lat": 52.5200, "lng": 13.4050},
            "visibility": "public",
            "require_approval": False,
            "ticket_config": {"tickets": [{"name": "Conference Pass", "price": 199, "limit": 300}]},
            "category": "Crypto"
        },
        {
            "title": "Cloud Computing Best Practices",
            "slug": "cloud-computing-best-practices",
            "description": "<p>Learn from AWS, Azure, and GCP experts about modern cloud architecture.</p>",
            "cover_image_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80",
            "start_at": (datetime.now(timezone.utc) + timedelta(days=20)).isoformat(),
            "end_at": (datetime.now(timezone.utc) + timedelta(days=20, hours=4)).isoformat(),
            "timezone": "America/Seattle",
            "location_info": {"type": "offline", "address": "Seattle Convention Center", "lat": 47.6097, "lng": -122.3331},
            "visibility": "public",
            "require_approval": False,
            "ticket_config": {"tickets": [{"name": "Tech Talk", "price": 0, "limit": 250}]},
            "category": "Tech & AI"
        },
        {
            "title": "Classical Music Evening",
            "slug": "classical-music-evening",
            "description": "<p>An elegant evening of symphonies performed by the city orchestra.</p>",
            "cover_image_url": "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&q=80",
            "start_at": (datetime.now(timezone.utc) + timedelta(days=16)).isoformat(),
            "end_at": (datetime.now(timezone.utc) + timedelta(days=16)).isoformat(),
            "timezone": "America/New_York",
            "location_info": {"type": "offline", "address": "Carnegie Hall", "lat": 40.7650, "lng": -73.9798},
            "visibility": "public",
            "require_approval": False,
            "ticket_config": {"tickets": [{"name": "Premium", "price": 150, "limit": 100}]},
            "category": "Arts & Culture"
        }
    ]

    try:
        for event in events:
            result = supabase.table("events_v1").insert(event).execute()
            print(f"✅ Inserted: {event['title']}")

        print(f"\n🎉 Successfully inserted {len(events)} events!")

        result = supabase.table("events_v1").select("id, title, category").execute()
        print(f"\n📊 Total events in database: {len(result.data)}")

        categories = {}
        for e in result.data:
            cat = e.get('category', 'Uncategorized')
            categories[cat] = categories.get(cat, 0) + 1

        print("\n📂 Events by category:")
        for cat, count in categories.items():
            print(f"   {cat}: {count}")

    except Exception as e:
        print(f"❌ Error inserting events: {e}")
        raise

if __name__ == "__main__":
    print("Step 1: Adding category column...")
    add_category_column()
    print("\nStep 2: Inserting test events...")
    insert_test_events()
