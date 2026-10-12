import json
import os
import sqlite3
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
from datetime import datetime

from flask import Flask, jsonify, request, send_from_directory, session
from flask_cors import CORS

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'biteora.db')
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID') or ''

app = Flask(__name__, static_folder='.', static_url_path='')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or 'biteora-local-secret-key'
CORS(app)

MENU_ITEMS = [
    {"id": 1, "name": "Truffle Mushroom Pasta", "price": 310, "category": "pasta", "restaurant": "Basil & Bloom", "rating": "4.9", "image": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?auto=format&fit=crop&w=1200&q=80", "description": "Creamy truffle mushroom pasta finished with parmesan and herbs.", "type": "veg"},
    {"id": 2, "name": "Classic Margherita Pizza", "price": 340, "category": "pizza", "restaurant": "Napoli Corner", "rating": "4.8", "image": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80", "description": "Wood-fired pizza topped with fresh basil, mozzarella and tomato sauce.", "type": "veg"},
    {"id": 3, "name": "Crispy Chicken Burger", "price": 260, "category": "burger", "restaurant": "Burger Lab", "rating": "4.7", "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80", "description": "Crispy fried chicken with cheddar, lettuce and smoky sauce.", "type": "nonveg"},
    {"id": 4, "name": "Butter Chicken Bowl", "price": 390, "category": "bowl", "restaurant": "Curry Tadka", "rating": "4.9", "image": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=1200&q=80", "description": "Tender chicken in velvety butter sauce with basmati rice.", "type": "nonveg"},
    {"id": 5, "name": "Classic Chicken Biryani", "price": 380, "category": "biryani", "restaurant": "Royal Spice", "rating": "4.9", "image": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=1200&q=80", "description": "Fragrant basmati rice layered with spiced chicken and rich biryani masala.", "type": "nonveg"},
    {"id": 6, "name": "Veggie Tacos", "price": 250, "category": "tacos", "restaurant": "Sunset Grill", "rating": "4.6", "image": "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=1200&q=80", "description": "Soft tortillas loaded with grilled vegetables and lime crema.", "type": "veg"},
    {"id": 7, "name": "Ocean Shrimp Pasta", "price": 370, "category": "pasta", "restaurant": "Harbor Kitchen", "rating": "4.8", "image": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80", "description": "Garlicky shrimp tossed with spaghetti and lemon butter sauce.", "type": "nonveg"},
    {"id": 8, "name": "Loaded Fries", "price": 180, "category": "fries", "restaurant": "Snack Street", "rating": "4.5", "image": "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=1200&q=80", "description": "Golden fries topped with cheese, herbs and chili flakes.", "type": "veg"},
    {"id": 9, "name": "Hawaiian Pizza", "price": 360, "category": "pizza", "restaurant": "Pizza Orbit", "rating": "4.7", "image": "https://images.unsplash.com/photo-1548365328-9f547fb9587c?auto=format&fit=crop&w=1200&q=80", "description": "Sweet pineapple, ham and mozzarella on a crisp crust.", "type": "nonveg"},
    {"id": 10, "name": "Grilled Salmon", "price": 520, "category": "seafood", "restaurant": "Coastal Table", "rating": "4.9", "image": "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=80", "description": "Perfectly grilled salmon with lemon herb glaze and greens.", "type": "nonveg"},
    {"id": 11, "name": "Paneer Tikka Wrap", "price": 240, "category": "wrap", "restaurant": "Wrap House", "rating": "4.7", "image": "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=1200&q=80", "description": "Charred paneer tikka wrapped in soft flatbread with chutney.", "type": "veg"},
    {"id": 12, "name": "Steam Chicken Momo", "price": 220, "category": "momo", "restaurant": "Hill Dumplings", "rating": "4.8", "image": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1200&q=80", "description": "Tender chicken dumplings with garlic soy dip and fresh herbs.", "type": "nonveg"},
    {"id": 13, "name": "Mango Smoothie Bowl", "price": 210, "category": "smoothie", "restaurant": "Fresh & Fruity", "rating": "4.8", "image": "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=1200&q=80", "description": "Refreshing mango bowl with granola, seeds and tropical fruit.", "type": "veg"},
    {"id": 14, "name": "BBQ Chicken Wings", "price": 300, "category": "starter", "restaurant": "Smokehouse", "rating": "4.8", "image": "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=1200&q=80", "description": "Sticky BBQ wings glazed with smoky honey chili sauce.", "type": "nonveg"},
    {"id": 15, "name": "Garden Salad Bowl", "price": 220, "category": "salad", "restaurant": "Green Crate", "rating": "4.6", "image": "https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=1200&q=80", "description": "Fresh greens, avocado, berries and feta with citrus dressing.", "type": "veg"},
    {"id": 16, "name": "Pesto Chicken Sandwich", "price": 280, "category": "sandwich", "restaurant": "Metro Bites", "rating": "4.7", "image": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80", "description": "Grilled chicken, pesto and mozzarella in artisan bread.", "type": "nonveg"},
    {"id": 17, "name": "Veggie Noodles", "price": 240, "category": "noodles", "restaurant": "Wok Avenue", "rating": "4.6", "image": "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80", "description": "Stir-fried noodles with colorful vegetables and soy glaze.", "type": "veg"},
    {"id": 18, "name": "Pepperoni Pizza", "price": 360, "category": "pizza", "restaurant": "Brick Oven", "rating": "4.8", "image": "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=1200&q=80", "description": "Pepperoni slices over mozzarella and rich tomato sauce.", "type": "nonveg"},
    {"id": 19, "name": "Sushi Platter", "price": 580, "category": "japanese", "restaurant": "Sora Sushi", "rating": "4.9", "image": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1200&q=80", "description": "Fresh sushi assortment with salmon, tuna and avocado.", "type": "nonveg"},
    {"id": 20, "name": "Choco Lava Cake", "price": 190, "category": "dessert", "restaurant": "Sugar Lane", "rating": "4.9", "image": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1200&q=80", "description": "Warm chocolate cake with gooey molten center and vanilla cream.", "type": "veg"},
    {"id": 21, "name": "Greek Falafel Bowl", "price": 260, "category": "bowl", "restaurant": "Mediterranean Spot", "rating": "4.7", "image": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80", "description": "Falafel, hummus, greens and roasted vegetables in a hearty bowl.", "type": "veg"},
    {"id": 22, "name": "Crispy Tofu Rice", "price": 260, "category": "rice", "restaurant": "Green Bowl", "rating": "4.6", "image": "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80", "description": "Golden tofu on jasmine rice with stir-fried greens and sauce.", "type": "veg"},
    {"id": 23, "name": "Chicken Shawarma", "price": 280, "category": "wrap", "restaurant": "Arabian Roll", "rating": "4.8", "image": "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=1200&q=80", "description": "Juicy chicken shawarma wrapped in Arabic flatbread and garlic sauce.", "type": "nonveg"},
    {"id": 24, "name": "Hot Pot Noodles", "price": 330, "category": "noodles", "restaurant": "Wok & Fire", "rating": "4.8", "image": "https://images.unsplash.com/photo-1557872943-16a5ac26437e?auto=format&fit=crop&w=1200&q=80", "description": "Comforting noodles simmered with broth and mushrooms.", "type": "nonveg"},
    {"id": 25, "name": "Roasted Veggie Platter", "price": 300, "category": "platter", "restaurant": "Farm Table", "rating": "4.6", "image": "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80", "description": "Seasonal vegetables roasted to perfection with herb oil.", "type": "veg"},
    {"id": 26, "name": "Chicken Caesar Salad", "price": 290, "category": "salad", "restaurant": "Little Greens", "rating": "4.7", "image": "https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=1200&q=80", "description": "Fresh romaine, grilled chicken, parmesan and caesar dressing.", "type": "nonveg"},
    {"id": 27, "name": "Beef Steak", "price": 690, "category": "steak", "restaurant": "Grill House", "rating": "4.9", "image": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80", "description": "Juicy grilled beef steak with herb butter and roasted potatoes.", "type": "nonveg"},
    {"id": 28, "name": "Mango Cheesecake", "price": 220, "category": "dessert", "restaurant": "Dairy Love", "rating": "4.8", "image": "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=1200&q=80", "description": "Creamy cheesecake with a bright tropical mango finish.", "type": "veg"},
    {"id": 29, "name": "Cheese Quesadilla", "price": 230, "category": "quesadilla", "restaurant": "La Mesa", "rating": "4.6", "image": "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=1200&q=80", "description": "Golden tortillas filled with melted cheese and roasted peppers.", "type": "veg"},
    {"id": 30, "name": "Spicy Ramen", "price": 340, "category": "ramen", "restaurant": "Tokyo Noodle", "rating": "4.8", "image": "https://images.unsplash.com/photo-1557872943-16a5ac26437e?auto=format&fit=crop&w=1200&q=80", "description": "Rich broth with noodles, soft-boiled egg and chili oil.", "type": "nonveg"},
    {"id": 31, "name": "Herb Chicken Platter", "price": 410, "category": "platter", "restaurant": "Roast & Co", "rating": "4.7", "image": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1200&q=80", "description": "Grilled chicken with roasted vegetables and smoky seasoning.", "type": "nonveg"},
    {"id": 32, "name": "Berry Pancakes", "price": 210, "category": "breakfast", "restaurant": "Morning Crumb", "rating": "4.8", "image": "https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=1200&q=80", "description": "Fluffy pancakes layered with fresh berries and syrup.", "type": "veg"},
    {"id": 33, "name": "Smoked BBQ Ribs", "price": 560, "category": "bbq", "restaurant": "Pit Stop BBQ", "rating": "4.9", "image": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80", "description": "Tender slow-smoked ribs glazed in tangy barbecue sauce.", "type": "nonveg"},
    {"id": 34, "name": "Egg Fried Rice", "price": 260, "category": "rice", "restaurant": "Rice Republic", "rating": "4.7", "image": "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80", "description": "Classic fried rice loaded with egg, peas and spring onions.", "type": "nonveg"},
    {"id": 35, "name": "Mac & Cheese", "price": 240, "category": "comfort", "restaurant": "Cheese Haven", "rating": "4.7", "image": "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?auto=format&fit=crop&w=1200&q=80", "description": "Baked creamy macaroni with rich cheddar and breadcrumbs.", "type": "veg"},
    {"id": 36, "name": "Lemon Herb Pasta", "price": 290, "category": "pasta", "restaurant": "Olive & Oregano", "rating": "4.7", "image": "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1200&q=80", "description": "Lemon zest, herbs and parmesan in a silky pasta sauce.", "type": "veg"},
    {"id": 37, "name": "Chicken Kebab Plate", "price": 420, "category": "kebab", "restaurant": "Desert Grill", "rating": "4.8", "image": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80", "description": "Skewered grilled chicken served with rice and salad.", "type": "nonveg"},
    {"id": 38, "name": "Coconut Dessert Bowl", "price": 180, "category": "dessert", "restaurant": "Island Sweets", "rating": "4.5", "image": "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80", "description": "Coconut pudding with fresh fruit and toasted coconut flakes.", "type": "veg"},
    {"id": 39, "name": "Turkey Club Sandwich", "price": 330, "category": "sandwich", "restaurant": "Daily Deli", "rating": "4.6", "image": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80", "description": "Turkey, bacon, lettuce and tomato in toasted artisan bread.", "type": "nonveg"},
    {"id": 40, "name": "Avocado Toast", "price": 200, "category": "breakfast", "restaurant": "Morning Bloom", "rating": "4.6", "image": "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=80", "description": "Sourdough toast topped with avocado, seeds and chili flakes.", "type": "veg"},
    {"id": 41, "name": "Crab Roll", "price": 390, "category": "japanese", "restaurant": "Harbor Sushi", "rating": "4.8", "image": "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=1200&q=80", "description": "Soft sushi roll packed with crab, cucumber and spicy mayo.", "type": "nonveg"},
    {"id": 42, "name": "Mushroom Risotto", "price": 340, "category": "risotto", "restaurant": "Velvet Fork", "rating": "4.8", "image": "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1200&q=80", "description": "Creamy arborio rice with mushrooms and parmesan.", "type": "veg"},
    {"id": 43, "name": "Crispy Chicken Tacos", "price": 310, "category": "tacos", "restaurant": "Taco Rush", "rating": "4.7", "image": "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=1200&q=80", "description": "Crunchy tacos with spiced chicken and crunchy slaw.", "type": "nonveg"},
    {"id": 44, "name": "Iced Mocha", "price": 170, "category": "drink", "restaurant": "Brew & Bean", "rating": "4.5", "image": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80", "description": "Cold espresso and chocolate blended into a creamy mocha.", "type": "veg"},
    {"id": 45, "name": "Fruit Parfait", "price": 190, "category": "dessert", "restaurant": "Sunrise Cafe", "rating": "4.7", "image": "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80", "description": "Layered yogurt, fruit and granola for a fresh finish.", "type": "veg"},
    {"id": 46, "name": "Grilled Cheese Toast", "price": 180, "category": "sandwich", "restaurant": "Crust & Co", "rating": "4.5", "image": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80", "description": "Golden grilled sourdough stacked with melted cheddar.", "type": "veg"},
    {"id": 47, "name": "Thai Green Curry", "price": 380, "category": "curry", "restaurant": "Thai Ember", "rating": "4.8", "image": "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80", "description": "Green curry with vegetables, basil and fragrant coconut broth.", "type": "veg"},
    {"id": 48, "name": "Prawn Fried Rice", "price": 360, "category": "rice", "restaurant": "Dragon Wok", "rating": "4.8", "image": "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80", "description": "Savory fried rice with juicy prawns and scallions.", "type": "nonveg"},
    {"id": 49, "name": "Beef Burger Deluxe", "price": 330, "category": "burger", "restaurant": "Burger District", "rating": "4.9", "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80", "description": "Smashed beef burger with cheddar, onion jam and brioche bun.", "type": "nonveg"},
    {"id": 50, "name": "Shrimp Scampi", "price": 420, "category": "seafood", "restaurant": "Blue Harbor", "rating": "4.9", "image": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80", "description": "Garlicky shrimp with lemon, parsley and buttery crusty bread.", "type": "nonveg"},
    {"id": 51, "name": "Cappuccino", "price": 160, "category": "hot-drinks", "restaurant": "Brew & Bean", "rating": "4.8", "image": "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=1200&q=80", "description": "Espresso with steamed milk and a soft layer of foam.", "type": "veg"},
    {"id": 52, "name": "Masala Chai", "price": 90, "category": "hot-drinks", "restaurant": "Chiya Ghar", "rating": "4.7", "image": "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1200&q=80", "description": "Warm black tea brewed with milk and aromatic spices.", "type": "veg"},
    {"id": 53, "name": "Hot Chocolate", "price": 180, "category": "hot-drinks", "restaurant": "Cocoa House", "rating": "4.8", "image": "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=1200&q=80", "description": "Rich chocolate drink finished with creamy foam.", "type": "veg"},
    {"id": 54, "name": "Iced Latte", "price": 190, "category": "cold-drinks", "restaurant": "Brew & Bean", "rating": "4.8", "image": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=1200&q=80", "description": "Chilled espresso and milk poured over ice.", "type": "veg"},
    {"id": 55, "name": "Fresh Lemonade", "price": 130, "category": "cold-drinks", "restaurant": "Fresh & Fruity", "rating": "4.7", "image": "https://images.unsplash.com/photo-1523677011781-c91d1v?auto=format&fit=crop&w=1200&q=80", "description": "Freshly squeezed lemon with chilled water and a touch of sweetness.", "type": "veg"},
    {"id": 56, "name": "Mango Lassi", "price": 180, "category": "cold-drinks", "restaurant": "Curry Tadka", "rating": "4.8", "image": "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=1200&q=80", "description": "Creamy yogurt blended with ripe mango and cardamom.", "type": "veg"},
    {"id": 57, "name": "Vegetable Chow Mein", "price": 240, "category": "noodles", "restaurant": "Wok Avenue", "rating": "4.7", "image": "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=1200&q=80", "description": "Wok-tossed noodles with cabbage, peppers and spring onions.", "type": "veg"},
    {"id": 58, "name": "Chicken Chow Mein", "price": 290, "category": "noodles", "restaurant": "Wok & Fire", "rating": "4.8", "image": "https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=1200&q=80", "description": "Stir-fried noodles with tender chicken and crunchy vegetables.", "type": "nonveg"},
    {"id": 59, "name": "Dal Bhat Thali", "price": 320, "category": "thali", "restaurant": "Himalayan Kitchen", "rating": "4.9", "image": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=1200&q=80", "description": "Dal, steamed rice, seasonal vegetables, pickle and fresh salad.", "type": "veg"},
    {"id": 60, "name": "Paneer Butter Masala", "price": 350, "category": "curry", "restaurant": "Curry Tadka", "rating": "4.8", "image": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=1200&q=80", "description": "Soft paneer cooked in a creamy tomato and butter gravy.", "type": "veg"},
    {"id": 61, "name": "Chicken Tikka", "price": 390, "category": "starter", "restaurant": "Spice Route", "rating": "4.8", "image": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=1200&q=80", "description": "Char-grilled chicken pieces marinated with yogurt and spices.", "type": "nonveg"},
    {"id": 62, "name": "Garlic Naan", "price": 140, "category": "bread", "restaurant": "Tandoor House", "rating": "4.7", "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80", "description": "Soft tandoor-baked naan brushed with garlic butter and herbs.", "type": "veg"},
    {"id": 63, "name": "Chicken Sausage Pizza", "price": 390, "category": "pizza", "restaurant": "Brick Oven", "rating": "4.7", "image": "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1200&q=80", "description": "Stone-baked pizza with chicken sausage, mozzarella and herbs.", "type": "nonveg"},
    {"id": 64, "name": "Chocolate Brownie", "price": 180, "category": "dessert", "restaurant": "Sugar Lane", "rating": "4.8", "image": "https://images.unsplash.com/photo-1564355808539-22fda35bed7e?auto=format&fit=crop&w=1200&q=80", "description": "Warm fudgy brownie with a rich chocolate center.", "type": "veg"},
    {"id": 65, "name": "Strawberry Milkshake", "price": 220, "category": "cold-drinks", "restaurant": "Fresh & Fruity", "rating": "4.7", "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80", "description": "Creamy chilled milkshake blended with ripe strawberries.", "type": "veg"},
    {"id": 66, "name": "Ginger Green Tea", "price": 110, "category": "hot-drinks", "restaurant": "Chiya Ghar", "rating": "4.6", "image": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=1200&q=80", "description": "Light green tea steeped with fresh ginger and lemon.", "type": "veg"}
]


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def is_admin_email(email):
    return (email or '').strip().lower() == 'admin@biteora.com'


def current_user():
    user = session.get('user') or {}
    return {
        'id': user.get('id'),
        'name': user.get('name'),
        'email': (user.get('email') or '').strip().lower()
    }


def require_admin():
    user = current_user()
    if not user.get('email'):
        return False
    return is_admin_email(user['email'])


def init_db():
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS menu_items (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            price INTEGER NOT NULL,
            category TEXT NOT NULL,
            restaurant TEXT NOT NULL,
            rating TEXT NOT NULL,
            image TEXT,
            description TEXT,
            type TEXT NOT NULL
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            customer_name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            address TEXT NOT NULL,
            city TEXT NOT NULL,
            pin TEXT NOT NULL,
            payment TEXT NOT NULL,
            subtotal INTEGER NOT NULL,
            delivery INTEGER NOT NULL,
            tax INTEGER NOT NULL,
            total INTEGER NOT NULL,
            items TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    try:
        conn.execute('SELECT status FROM orders LIMIT 1')
    except sqlite3.Error:
        conn.execute('ALTER TABLE orders ADD COLUMN status TEXT DEFAULT "pending"')

    existing_menu_count = conn.execute('SELECT COUNT(*) FROM menu_items').fetchone()[0]
    if existing_menu_count == 0:
        conn.executemany(
            'INSERT INTO menu_items (id, name, price, category, restaurant, rating, image, description, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                (
                    item['id'], item['name'], item['price'], item['category'], item['restaurant'],
                    item['rating'], item['image'], item['description'], item['type']
                )
                for item in MENU_ITEMS
            ]
        )

    conn.executemany(
        'INSERT OR IGNORE INTO menu_items (id, name, price, category, restaurant, rating, image, description, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
            (
                item['id'], item['name'], item['price'], item['category'], item['restaurant'],
                item['rating'], item['image'], item['description'], item['type']
            )
            for item in MENU_ITEMS
        ]
    )

    default_email = 'admin@biteora.com'
    existing_user = conn.execute('SELECT id FROM users WHERE email = ?', (default_email,)).fetchone()
    if not existing_user:
        conn.execute(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            ('Admin User', default_email, 'admin123')
        )

    conn.commit()
    conn.close()


@app.route('/')
def index():
    return send_from_directory(BASE_DIR, 'index.html')


@app.before_request
def protect_admin_routes():
    admin_routes = {'/database-records.html', '/data-management.html', '/api-console.html'}
    if request.path in admin_routes:
        if not require_admin():
            return jsonify({'success': False, 'message': 'Admin access required.'}), 403
    if request.path.startswith('/api/database/') and not require_admin():
        return jsonify({'success': False, 'message': 'Admin access required.'}), 403


@app.route('/dashboard.html')
def dashboard():
    return send_from_directory(BASE_DIR, 'dashboard.html')


@app.route('/database-records.html')
def database_records_page():
    if not require_admin():
        return send_from_directory(BASE_DIR, 'index.html')
    return send_from_directory(BASE_DIR, 'database-records.html')


@app.route('/data-management.html')
def data_management_page():
    if not require_admin():
        return send_from_directory(BASE_DIR, 'index.html')
    return send_from_directory(BASE_DIR, 'data-management.html')


@app.route('/api-console.html')
def api_console():
    if not require_admin():
        return send_from_directory(BASE_DIR, 'index.html')
    return send_from_directory(BASE_DIR, 'api-console.html')


@app.route('/api/health')
def health():
    return jsonify({'status': 'ok', 'database': DB_PATH})


@app.route('/api/database/records')
def database_records():
    if not require_admin():
        return jsonify({'success': False, 'message': 'Admin access required.'}), 403

    conn = get_db_connection()
    users = conn.execute('SELECT id, name, email, created_at FROM users ORDER BY id DESC').fetchall()
    menu_items = conn.execute('SELECT id, name, category, price, restaurant, type FROM menu_items ORDER BY id ASC').fetchall()
    orders = conn.execute('SELECT id, customer_name, email, payment, total, status, created_at, items FROM orders ORDER BY created_at DESC').fetchall()
    conn.close()

    order_records = []
    for row in orders:
        order = dict(row)
        order['items'] = json.loads(order['items'])
        order_records.append(order)

    return jsonify({
        'tables': {
            'users': [dict(row) for row in users],
            'menu_items': [dict(row) for row in menu_items],
            'orders': order_records
        }
    })


@app.route('/api/database/manage/<table>', methods=['POST'])
@app.route('/api/database/manage/<table>/<record_id>', methods=['PUT', 'DELETE'])
def manage_database_record(table, record_id=None):
    if not require_admin():
        return jsonify({'success': False, 'message': 'Admin access required.'}), 403
    if table not in {'users', 'menu_items', 'orders'}:
        return jsonify({'message': 'Unknown table.'}), 404

    conn = get_db_connection()
    try:
        if request.method == 'DELETE':
            cursor = conn.execute(f'DELETE FROM {table} WHERE id = ?', (record_id,))
            if cursor.rowcount == 0:
                return jsonify({'message': 'Record not found.'}), 404
            conn.commit()
            return jsonify({'success': True})

        data = request.get_json(silent=True) or {}
        if table == 'users':
            if not data.get('name') or not data.get('email'):
                return jsonify({'message': 'Name and email are required.'}), 400
            if request.method == 'POST' and not data.get('password'):
                return jsonify({'message': 'Password is required for a new user.'}), 400
            if request.method == 'POST':
                conn.execute('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', (data['name'], data['email'].lower(), data['password']))
            else:
                fields = {'name': data['name'], 'email': data['email'].lower()}
                if data.get('password'):
                    fields['password'] = data['password']
                assignments = ', '.join(f'{field} = ?' for field in fields)
                cursor = conn.execute(f'UPDATE users SET {assignments} WHERE id = ?', (*fields.values(), record_id))
                if cursor.rowcount == 0:
                    return jsonify({'message': 'Record not found.'}), 404
        elif table == 'menu_items':
            fields = ['name', 'price', 'category', 'restaurant', 'rating', 'type']
            if not all(data.get(field) not in (None, '') for field in fields):
                return jsonify({'message': 'Name, price, category, restaurant, rating, and type are required.'}), 400
            if request.method == 'POST':
                next_id = conn.execute('SELECT COALESCE(MAX(id), 0) + 1 FROM menu_items').fetchone()[0]
                conn.execute('INSERT INTO menu_items (id, name, price, category, restaurant, rating, image, description, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', (next_id, data['name'], data['price'], data['category'], data['restaurant'], data['rating'], data.get('image', ''), data.get('description', ''), data['type']))
            else:
                values = [data[field] for field in fields] + [data.get('image', ''), data.get('description', ''), record_id]
                cursor = conn.execute('UPDATE menu_items SET name = ?, price = ?, category = ?, restaurant = ?, rating = ?, type = ?, image = ?, description = ? WHERE id = ?', values)
                if cursor.rowcount == 0:
                    return jsonify({'message': 'Record not found.'}), 404
        else:
            required = ['id', 'customer_name', 'email', 'phone', 'address', 'city', 'pin', 'payment', 'total']
            if not all(data.get(field) not in (None, '') for field in required):
                return jsonify({'message': 'Order ID, customer, contact, address, payment, and total are required.'}), 400
            items = json.dumps(data.get('items') or [])
            status = (data.get('status') or 'pending').strip().lower()
            if status not in {'pending', 'preparing', 'out_for_delivery', 'delivered'}:
                status = 'pending'
            values = (data['id'], data['customer_name'], data['email'], data['phone'], data['address'], data['city'], data['pin'], data['payment'], data.get('subtotal', 0), data.get('delivery', 0), data.get('tax', 0), data['total'], items, status)
            if request.method == 'POST':
                conn.execute('INSERT OR REPLACE INTO orders (id, customer_name, email, phone, address, city, pin, payment, subtotal, delivery, tax, total, items, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', values)
            else:
                cursor = conn.execute('UPDATE orders SET customer_name = ?, email = ?, phone = ?, address = ?, city = ?, pin = ?, payment = ?, subtotal = ?, delivery = ?, tax = ?, total = ?, items = ?, status = ? WHERE id = ?', values[1:] + (record_id,))
                if cursor.rowcount == 0:
                    return jsonify({'message': 'Record not found.'}), 404

        conn.commit()
        return jsonify({'success': True})
    except sqlite3.IntegrityError as error:
        return jsonify({'message': 'A record with this ID or email already exists.'}), 409
    finally:
        conn.close()


@app.route('/api/google-config')
def google_config():
    return jsonify({'clientId': GOOGLE_CLIENT_ID})


@app.route('/api/menu')
def get_menu():
    conn = get_db_connection()
    rows = conn.execute('SELECT * FROM menu_items ORDER BY id ASC').fetchall()
    menu = [dict(row) for row in rows]
    conn.close()
    return jsonify(menu)


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = (data.get('password') or '').strip()

    if not email or not password:
        return jsonify({'success': False, 'message': 'Email and password are required.'}), 400

    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    conn.close()

    if user is None:
        return jsonify({'success': False, 'message': 'User not found.'}), 404

    if user['password'] != password:
        return jsonify({'success': False, 'message': 'Incorrect password.'}), 401

    session['user'] = {
        'id': user['id'],
        'name': user['name'],
        'email': user['email']
    }

    return jsonify({
        'success': True,
        'user': {
            'id': user['id'],
            'name': user['name'],
            'email': user['email']
        }
    })


@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = (data.get('password') or '').strip()

    if not name or not email or not password:
        return jsonify({'success': False, 'message': 'Name, email, and password are required.'}), 400

    if len(password) < 6:
        return jsonify({'success': False, 'message': 'Password must be at least 6 characters.'}), 400

    conn = get_db_connection()
    try:
        conn.execute(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            (name, email, password)
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'success': False, 'message': 'Email already exists.'}), 409

    user = conn.execute('SELECT id, name, email FROM users WHERE email = ?', (email,)).fetchone()
    conn.close()
    session['user'] = {
        'id': user['id'],
        'name': user['name'],
        'email': user['email']
    }
    return jsonify({'success': True, 'user': dict(user)})


@app.route('/api/google-login', methods=['POST'])
def google_login():
    data = request.get_json(silent=True) or {}
    credential = data.get('credential')
    client_id = GOOGLE_CLIENT_ID

    if not client_id:
        return jsonify({'success': False, 'message': 'Google login is not configured on this server.'}), 503
    if not credential:
        return jsonify({'success': False, 'message': 'Google did not return a login credential.'}), 400

    try:
        request_url = f'https://oauth2.googleapis.com/tokeninfo?id_token={credential}'
        with urlopen(Request(request_url, headers={'Accept': 'application/json'}), timeout=5) as response:
            token = json.loads(response.read().decode('utf-8'))
    except (HTTPError, URLError, ValueError):
        return jsonify({'success': False, 'message': 'Google could not verify this login.'}), 401

    if token.get('aud') != client_id or token.get('email_verified') != 'true':
        return jsonify({'success': False, 'message': 'The Google account could not be verified.'}), 401

    email = (token.get('email') or '').strip().lower()
    name = (token.get('name') or email.split('@')[0] or 'Google User').strip()
    if not email:
        return jsonify({'success': False, 'message': 'Google did not provide an email address.'}), 401

    conn = get_db_connection()
    user = conn.execute('SELECT id, name, email FROM users WHERE email = ?', (email,)).fetchone()
    if user is None:
        conn.execute(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            (name, email, 'google-account')
        )
        conn.commit()
        user = conn.execute('SELECT id, name, email FROM users WHERE email = ?', (email,)).fetchone()
    conn.close()
    session['user'] = {
        'id': user['id'],
        'name': user['name'],
        'email': user['email']
    }
    return jsonify({'success': True, 'user': dict(user)})


@app.route('/api/orders', methods=['GET', 'POST'])
def orders():
    if request.method == 'GET':
        email = request.args.get('email', '').strip().lower()
        conn = get_db_connection()
        if email:
            rows = conn.execute('SELECT * FROM orders WHERE email = ? ORDER BY created_at DESC', (email,)).fetchall()
        else:
            rows = conn.execute('SELECT * FROM orders ORDER BY created_at DESC').fetchall()
        orders_data = []
        for row in rows:
            item = dict(row)
            item['items'] = json.loads(item['items'])
            orders_data.append(item)
        conn.close()
        return jsonify(orders_data)

    data = request.get_json(silent=True) or {}
    required = ['id', 'customer', 'items', 'total']
    if not all(key in data for key in required):
        return jsonify({'success': False, 'message': 'Order payload is incomplete.'}), 400

    customer = data['customer']
    items = data.get('items') or []
    status = (data.get('status') or 'pending').strip().lower()
    if status not in {'pending', 'preparing', 'out_for_delivery', 'delivered'}:
        status = 'pending'

    conn = get_db_connection()
    conn.execute(
        '''
        INSERT OR REPLACE INTO orders (id, customer_name, email, phone, address, city, pin, payment, subtotal, delivery, tax, total, items, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''',
        (
            data['id'],
            customer.get('name', ''),
            customer.get('email', ''),
            customer.get('phone', ''),
            customer.get('address', ''),
            customer.get('city', ''),
            customer.get('pin', ''),
            customer.get('payment', 'Cash on Delivery'),
            data.get('subtotal', 0),
            data.get('delivery', 0),
            data.get('tax', 0),
            data.get('total', 0),
            json.dumps(items),
            status
        )
    )
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'orderId': data['id'], 'status': status})


@app.route('/api/orders/<order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    if not require_admin():
        return jsonify({'success': False, 'message': 'Admin access required.'}), 403

    data = request.get_json(silent=True) or {}
    status = (data.get('status') or '').strip().lower()
    if status not in {'pending', 'preparing', 'out_for_delivery', 'delivered'}:
        return jsonify({'success': False, 'message': 'Invalid order status.'}), 400

    conn = get_db_connection()
    cursor = conn.execute('UPDATE orders SET status = ? WHERE id = ?', (status, order_id))
    conn.commit()
    conn.close()

    if cursor.rowcount == 0:
        return jsonify({'success': False, 'message': 'Order not found.'}), 404

    return jsonify({'success': True, 'orderId': order_id, 'status': status})


if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=False)
