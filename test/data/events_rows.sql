-- Add category column to events table if not exists
ALTER TABLE events ADD COLUMN IF NOT EXISTS category TEXT DEFAULT NULL;

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);

-- Test events data for Discover page filtering
-- Categories: Tech & AI, Food & Drink, Arts & Culture, Wellness, Fitness, Crypto

-- Insert test events with different categories
INSERT INTO "public"."events" (
    id, community_id, organizer_id, title, slug, description, cover_image_url,
    start_at, end_at, timezone, status, is_public, location_config,
    ticket_config, capacity, registrations_count, category
) VALUES
(
    gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
    'AI & Machine Learning Summit 2025',
    'ai-ml-summit-2025',
    '<p>Join industry leaders to explore the latest advancements in artificial intelligence and machine learning.</p>',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80',
    NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '3 hours', 'America/New_York',
    'PUBLISHED', true,
    '{"type": "offline", "address": "San Francisco Convention Center", "lat": 37.7749, "lng": -122.4194}',
    '{"tickets": [{"name": "General Admission", "price": 99, "limit": 500}]}',
    500, 42, 'Tech & AI'
),
(
    gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
    'Blockchain & Web3 Workshop',
    'blockchain-web3-workshop',
    '<p>Learn about decentralized applications and the future of blockchain technology.</p>',
    'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80',
    NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days' + INTERVAL '4 hours', 'America/Los_Angeles',
    'PUBLISHED', true,
    '{"type": "offline", "address": "Silicon Valley Tech Hub", "lat": 37.3861, "lng": -122.0839}',
    '{"tickets": [{"name": "Workshop Pass", "price": 149, "limit": 100}]}',
    100, 28, 'Crypto'
),
(
    gen_random_uuid(), '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002',
    'Gourmet Food & Wine Tasting',
    'gourmet-food-wine-tasting',
    '<p>Experience a curated selection of fine wines paired with artisanal cheeses and charcuterie.</p>',
    'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80',
    NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '2 hours', 'America/New_York',
    'PUBLISHED', true,
    '{"type": "offline", "address": "Manhattan Wine Room", "lat": 40.7128, "lng": -74.0060}',
    '{"tickets": [{"name": "VIP Tasting", "price": 75, "limit": 50}]}',
    50, 35, 'Food & Drink'
),
(
    gen_random_uuid(), '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002',
    'International Street Food Festival',
    'international-street-food-festival',
    '<p>Explore flavors from around the world at this vibrant street food celebration.</p>',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
    NOW() + INTERVAL '10 days', NOW() + INTERVAL '10 days' + INTERVAL '5 hours', 'America/Chicago',
    'PUBLISHED', true,
    '{"type": "offline", "address": "Grant Park Chicago", "lat": 41.8724, "lng": -87.6232}',
    '{"tickets": [{"name": "Entry", "price": 0, "limit": 1000}]}',
    1000, 156, 'Food & Drink'
),
(
    gen_random_uuid(), '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003',
    'Contemporary Art Exhibition Opening',
    'contemporary-art-exhibition',
    '<p>Discover works from emerging artists pushing boundaries in modern art.</p>',
    'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=800&q=80',
    NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days' + INTERVAL '3 hours', 'Europe/London',
    'PUBLISHED', true,
    '{"type": "offline", "address": "Tate Modern Gallery", "lat": 51.5074, "lng": -0.0994}',
    '{"tickets": [{"name": "Exhibition Entry", "price": 25, "limit": 200}]}',
    200, 67, 'Arts & Culture'
),
(
    gen_random_uuid(), '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003',
    'Jazz Night in the Park',
    'jazz-night-park',
    '<p>Enjoy an evening of live jazz performances under the stars.</p>',
    'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&q=80',
    NOW() + INTERVAL '8 days', NOW() + INTERVAL '8 days' + INTERVAL '4 hours', 'America/New_Orleans',
    'PUBLISHED', true,
    '{"type": "offline", "address": "City Park New Orleans", "lat": 29.9845, "lng": -90.0948}',
    '{"tickets": [{"name": "General", "price": 0, "limit": 500}]}',
    500, 234, 'Arts & Culture'
),
(
    gen_random_uuid(), '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004',
    'Morning Yoga & Meditation Retreat',
    'morning-yoga-meditation-retreat',
    '<p>Start your day with energizing yoga sessions and peaceful meditation practices.</p>',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
    NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '2 hours', 'America/Los_Angeles',
    'PUBLISHED', true,
    '{"type": "offline", "address": "Venice Beach Yoga Studio", "lat": 33.9850, "lng": -118.4695}',
    '{"tickets": [{"name": "Day Pass", "price": 35, "limit": 30}]}',
    30, 22, 'Wellness'
),
(
    gen_random_uuid(), '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004',
    'Mindfulness & Mental Health Workshop',
    'mindfulness-mental-health-workshop',
    '<p>Learn practical techniques for managing stress and improving mental well-being.</p>',
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
    NOW() + INTERVAL '12 days', NOW() + INTERVAL '12 days' + INTERVAL '3 hours', 'America/Seattle',
    'PUBLISHED', true,
    '{"type": "offline", "address": "Seattle Wellness Center", "lat": 47.6062, "lng": -122.3321}',
    '{"tickets": [{"name": "Workshop", "price": 45, "limit": 50}]}',
    50, 18, 'Wellness'
),
(
    gen_random_uuid(), '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005',
    'CrossFit Championship Qualifier',
    'crossfit-championship-qualifier',
    '<p>Watch elite athletes compete in grueling CrossFit workouts.</p>',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
    NOW() + INTERVAL '6 days', NOW() + INTERVAL '6 days' + INTERVAL '5 hours', 'America/Denver',
    'PUBLISHED', true,
    '{"type": "offline", "address": "Denver Sports Complex", "lat": 39.7392, "lng": -104.9903}',
    '{"tickets": [{"name": "Spectator", "price": 20, "limit": 300}]}',
    300, 145, 'Fitness'
),
(
    gen_random_uuid(), '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005',
    'Marathon Training Bootcamp',
    'marathon-training-bootcamp',
    '<p>8-week training program to prepare you for your first marathon.</p>',
    'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80',
    NOW() + INTERVAL '21 days', NOW() + INTERVAL '21 days' + INTERVAL '2 hours', 'America/Boston',
    'PUBLISHED', true,
    '{"type": "offline", "address": "Boston Common", "lat": 42.3601, "lng": -71.0589}',
    '{"tickets": [{"name": "Bootcamp Pass", "price": 199, "limit": 40}]}',
    40, 12, 'Fitness'
),
(
    gen_random_uuid(), '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000006',
    'Bitcoin & Cryptocurrency Meetup',
    'bitcoin-crypto-meetup',
    '<p>Monthly gathering for crypto enthusiasts to discuss trends and share insights.</p>',
    'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&q=80',
    NOW() + INTERVAL '4 days', NOW() + INTERVAL '4 days' + INTERVAL '2 hours', 'America/Miami',
    'PUBLISHED', true,
    '{"type": "offline", "address": "Miami Tech Hub", "lat": 25.7617, "lng": -80.1918}',
    '{"tickets": [{"name": "Free Entry", "price": 0, "limit": 100}]}',
    100, 58, 'Crypto'
),
(
    gen_random_uuid(), '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000006',
    'DeFi & NFT Workshop for Beginners',
    'defi-nft-workshop-beginners',
    '<p>Learn the fundamentals of decentralized finance and NFT ecosystem.</p>',
    'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=800&q=80',
    NOW() + INTERVAL '9 days', NOW() + INTERVAL '9 days' + INTERVAL '3 hours', 'America/New_York',
    'PUBLISHED', true,
    '{"type": "virtual", "link": "https://zoom.us/j/defi-workshop"}',
    '{"tickets": [{"name": "Online", "price": 0, "limit": 500}]}',
    500, 89, 'Crypto'
),
(
    gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
    'Startup Pitch Competition',
    'startup-pitch-competition-2025',
    '<p>Watch promising startups pitch their ideas to top investors.</p>',
    'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80',
    NOW() + INTERVAL '15 days', NOW() + INTERVAL '15 days' + INTERVAL '4 hours', 'America/San_Francisco',
    'PUBLISHED', true,
    '{"type": "offline", "address": "SF Startup Arena", "lat": 37.7749, "lng": -122.4194}',
    '{"tickets": [{"name": "Audience", "price": 0, "limit": 400}]}',
    400, 267, 'Tech & AI'
),
(
    gen_random_uuid(), '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002',
    'Craft Beer & Brewery Tour',
    'craft-beer-brewery-tour',
    '<p>Visit local breweries and taste unique craft beers.</p>',
    'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800&q=80',
    NOW() + INTERVAL '11 days', NOW() + INTERVAL '11 days' + INTERVAL '3 hours', 'America/Portland',
    'PUBLISHED', true,
    '{"type": "offline", "address": "Portland Brewing District", "lat": 45.5152, "lng": -122.6784}',
    '{"tickets": [{"name": "Tour + Tasting", "price": 55, "limit": 25}]}',
    25, 20, 'Food & Drink'
),
(
    gen_random_uuid(), '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003',
    'Photography Walk: Street Art District',
    'photography-walk-street-art',
    '<p>Explore colorful murals and street art while learning photography tips.</p>',
    'https://images.unsplash.com/photo-1493863641943-9b68992a8d07?w=800&q=80',
    NOW() + INTERVAL '6 days', NOW() + INTERVAL '6 days' + INTERVAL '2 hours', 'America/Los_Angeles',
    'PUBLISHED', true,
    '{"type": "offline", "address": "Melrose Arts District LA", "lat": 34.0837, "lng": -118.3536}',
    '{"tickets": [{"name": "Photography Walk", "price": 0, "limit": 30}]}',
    30, 15, 'Arts & Culture'
),
(
    gen_random_uuid(), '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004',
    'Sound Bath Healing Session',
    'sound-bath-healing-session',
    '<p>Experience deep relaxation with crystal singing bowls and gongs.</p>',
    'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=800&q=80',
    NOW() + INTERVAL '13 days', NOW() + INTERVAL '13 days' + INTERVAL '1 hour 30 mins', 'America/Austin',
    'PUBLISHED', true,
    '{"type": "offline", "address": "Austin Healing Space", "lat": 30.2672, "lng": -97.7431}',
    '{"tickets": [{"name": "Session", "price": 40, "limit": 20}]}',
    20, 14, 'Wellness'
),
(
    gen_random_uuid(), '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005',
    'Indoor Rock Climbing Meetup',
    'indoor-rock-climbing-meetup',
    '<p>Join fellow climbing enthusiasts for a day at the wall.</p>',
    'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800&q=80',
    NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days' + INTERVAL '3 hours', 'America/Denver',
    'PUBLISHED', true,
    '{"type": "offline", "address": "Denver Climbing Company", "lat": 39.7508, "lng": -104.9967}',
    '{"tickets": [{"name": "Day Pass", "price": 25, "limit": 40}]}',
    40, 23, 'Fitness'
),
(
    gen_random_uuid(), '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000006',
    'Ethereum 2.0 Development Conference',
    'ethereum-2-dev-conference',
    '<p>Deep dive into Ethereum scaling solutions and DeFi protocols.</p>',
    'https://images.unsplash.com/photo-1634193295627-1cdddf751ebf?w=800&q=80',
    NOW() + INTERVAL '18 days', NOW() + INTERVAL '18 days' + INTERVAL '6 hours', 'Europe/Berlin',
    'PUBLISHED', true,
    '{"type": "offline", "address": "Berlin Tech Conference Center", "lat": 52.5200, "lng": 13.4050}',
    '{"tickets": [{"name": "Conference Pass", "price": 199, "limit": 300}]}',
    300, 87, 'Crypto'
),
(
    gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
    'Cloud Computing Best Practices',
    'cloud-computing-best-practices',
    '<p>Learn from AWS, Azure, and GCP experts about modern cloud architecture.</p>',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
    NOW() + INTERVAL '20 days', NOW() + INTERVAL '20 days' + INTERVAL '4 hours', 'America/Seattle',
    'PUBLISHED', true,
    '{"type": "offline", "address": "Seattle Convention Center", "lat": 47.6097, "lng": -122.3331}',
    '{"tickets": [{"name": "Tech Talk", "price": 0, "limit": 250}]}',
    250, 134, 'Tech & AI'
),
(
    gen_random_uuid(), '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003',
    'Classical Music Evening',
    'classical-music-evening',
    '<p>An elegant evening of symphonies performed by the city orchestra.</p>',
    'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&q=80',
    NOW() + INTERVAL '16 days', NOW() + INTERVAL '16 days' + INTERVAL '2 hours 30 mins', 'America/New_York',
    'PUBLISHED', true,
    '{"type": "offline", "address": "Carnegie Hall", "lat": 40.7650, "lng": -73.9798}',
    '{"tickets": [{"name": "Premium", "price": 150, "limit": 100}]}',
    100, 45, 'Arts & Culture'
);
