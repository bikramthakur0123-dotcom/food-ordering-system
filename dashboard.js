document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = 'index.html';
    return;
  }

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => document.querySelectorAll(selector);

  const dashboardLoader = $('#dashboardLoader');
  const profileButton = $('#profileButton');
  const profileDropdown = $('#profileDropdown');
  const profileName = $('#profileName');
  const dropdownUserName = $('#dropdownUserName');
  const dropdownUserEmail = $('#dropdownUserEmail');
  const cartSidebar = $('#cartSidebar');
  const cartOverlay = $('#cartOverlay');
  const cartButton = $('#cartButton');
  const closeCart = $('#closeCart');
  const cartItems = $('#cartItems');
  const cartCount = $('#cartCount');
  const cartSubtotal = $('#cartSubtotal');
  const cartDelivery = $('#cartDelivery');
  const cartTax = $('#cartTax');
  const cartTotal = $('#cartTotal');
  const deliveryProgressBar = $('#deliveryProgressBar');
  const deliveryProgressText = $('#deliveryProgressText');
  const menuResultCount = $('#menuResultCount');
  const checkoutButton = $('#checkoutButton');
  const startShopping = $('#startShopping');
  const foodModal = $('#foodModal');
  const foodModalClose = $('#foodModalClose');
  const checkoutModal = $('#checkoutModal');
  const checkoutClose = $('#checkoutClose');
  const checkoutForm = $('#checkoutForm');
  const successModal = $('#successModal');
  const successClose = $('#successClose');
  const trackingModal = $('#trackingModal');
  const trackingClose = $('#trackingClose');
  const trackingTitle = $('#trackingTitle');
  const trackingSummary = $('#trackingSummary');
  const trackingTimeline = $('#trackingTimeline');
  const dashboardToast = $('#dashboardToast');
  const dashboardToastIcon = $('#dashboardToastIcon');
  const dashboardToastTitle = $('#dashboardToastTitle');
  const dashboardToastMessage = $('#dashboardToastMessage');
  const dashboardToastClose = $('#dashboardToastClose');
  const apiBase = window.location.port === '5000' ? '' : 'http://127.0.0.1:5000';

  const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
  const isAdminUser = (userEmail || '').toLowerCase() === 'admin@biteora.com';
  let userName = localStorage.getItem('userName') || userEmail.split('@')[0] || 'Biteora User';
  const fallbackFoodImage = 'food-placeholder.png';

  document.querySelectorAll('.admin-only-link').forEach((element) => {
    if (!isAdminUser) {
      element.style.display = 'none';
    }
  });

  const safeFoodImage = (image) => image && image.trim() ? image : fallbackFoodImage;

  if ($('#checkoutName')) $('#checkoutName').value = userName;
  if ($('#checkoutEmail')) $('#checkoutEmail').value = userEmail;

  if (profileName) profileName.textContent = userName;
  if (dropdownUserName) dropdownUserName.textContent = userName;
  if (dropdownUserEmail) dropdownUserEmail.textContent = userEmail;

  const baseFoodData = [
    { id: 1, name: 'Truffle Mushroom Pasta', price: 310, category: 'pasta', restaurant: 'Basil & Bloom', rating: '4.9', image: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?auto=format&fit=crop&w=1200&q=80', description: 'Creamy truffle mushroom pasta finished with parmesan and herbs.', type: 'veg' },
    { id: 2, name: 'Classic Margherita Pizza', price: 340, category: 'pizza', restaurant: 'Napoli Corner', rating: '4.8', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80', description: 'Wood-fired pizza topped with fresh basil, mozzarella and tomato sauce.', type: 'veg' },
    { id: 3, name: 'Crispy Chicken Burger', price: 260, category: 'burger', restaurant: 'Burger Lab', rating: '4.7', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80', description: 'Crispy fried chicken with cheddar, lettuce and smoky sauce.', type: 'nonveg' },
    { id: 4, name: 'Butter Chicken Bowl', price: 390, category: 'bowl', restaurant: 'Curry Tadka', rating: '4.9', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=1200&q=80', description: 'Tender chicken in velvety butter sauce with basmati rice.', type: 'nonveg' },
    { id: 5, name: 'Classic Chicken Biryani', price: 380, category: 'biryani', restaurant: 'Royal Spice', rating: '4.9', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=1200&q=80', description: 'Fragrant basmati rice layered with spiced chicken and rich biryani masala.', type: 'nonveg' },
    { id: 6, name: 'Veggie Tacos', price: 250, category: 'tacos', restaurant: 'Sunset Grill', rating: '4.6', image: 'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=1200&q=80', description: 'Soft tortillas loaded with grilled vegetables and lime crema.', type: 'veg' },
    { id: 7, name: 'Ocean Shrimp Pasta', price: 370, category: 'pasta', restaurant: 'Harbor Kitchen', rating: '4.8', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80', description: 'Garlicky shrimp tossed with spaghetti and lemon butter sauce.', type: 'nonveg' },
    { id: 8, name: 'Loaded Fries', price: 180, category: 'fries', restaurant: 'Snack Street', rating: '4.5', image: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=1200&q=80', description: 'Golden fries topped with cheese, herbs and chili flakes.', type: 'veg' },
    { id: 9, name: 'Hawaiian Pizza', price: 360, category: 'pizza', restaurant: 'Pizza Orbit', rating: '4.7', image: 'https://images.unsplash.com/photo-1548365328-9f547fb9587c?auto=format&fit=crop&w=1200&q=80', description: 'Sweet pineapple, ham and mozzarella on a crisp crust.', type: 'nonveg' },
    { id: 10, name: 'Grilled Salmon', price: 520, category: 'seafood', restaurant: 'Coastal Table', rating: '4.9', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=80', description: 'Perfectly grilled salmon with lemon herb glaze and greens.', type: 'nonveg' },
    { id: 11, name: 'Paneer Tikka Wrap', price: 240, category: 'wrap', restaurant: 'Wrap House', rating: '4.7', image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=1200&q=80', description: 'Charred paneer tikka wrapped in soft flatbread with chutney.', type: 'veg' },
    { id: 12, name: 'Steam Chicken Momo', price: 220, category: 'momo', restaurant: 'Hill Dumplings', rating: '4.8', image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1200&q=80', description: 'Tender chicken dumplings with garlic soy dip and fresh herbs.', type: 'nonveg' },
    { id: 13, name: 'Mango Smoothie Bowl', price: 210, category: 'smoothie', restaurant: 'Fresh & Fruity', rating: '4.8', image: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=1200&q=80', description: 'Refreshing mango bowl with granola, seeds and tropical fruit.', type: 'veg' },
    { id: 14, name: 'BBQ Chicken Wings', price: 300, category: 'starter', restaurant: 'Smokehouse', rating: '4.8', image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=1200&q=80', description: 'Sticky BBQ wings glazed with smoky honey chili sauce.', type: 'nonveg' },
    { id: 15, name: 'Garden Salad Bowl', price: 220, category: 'salad', restaurant: 'Green Crate', rating: '4.6', image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=1200&q=80', description: 'Fresh greens, avocado, berries and feta with citrus dressing.', type: 'veg' },
    { id: 16, name: 'Pesto Chicken Sandwich', price: 280, category: 'sandwich', restaurant: 'Metro Bites', rating: '4.7', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80', description: 'Grilled chicken, pesto and mozzarella in artisan bread.', type: 'nonveg' },
    { id: 17, name: 'Veggie Noodles', price: 240, category: 'noodles', restaurant: 'Wok Avenue', rating: '4.6', image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80', description: 'Stir-fried noodles with colorful vegetables and soy glaze.', type: 'veg' },
    { id: 18, name: 'Pepperoni Pizza', price: 360, category: 'pizza', restaurant: 'Brick Oven', rating: '4.8', image: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=1200&q=80', description: 'Pepperoni slices over mozzarella and rich tomato sauce.', type: 'nonveg' },
    { id: 19, name: 'Sushi Platter', price: 580, category: 'japanese', restaurant: 'Sora Sushi', rating: '4.9', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1200&q=80', description: 'Fresh sushi assortment with salmon, tuna and avocado.', type: 'nonveg' },
    { id: 20, name: 'Choco Lava Cake', price: 190, category: 'dessert', restaurant: 'Sugar Lane', rating: '4.9', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1200&q=80', description: 'Warm chocolate cake with gooey molten center and vanilla cream.', type: 'veg' },
    { id: 21, name: 'Greek Falafel Bowl', price: 260, category: 'bowl', restaurant: 'Mediterranean Spot', rating: '4.7', image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80', description: 'Falafel, hummus, greens and roasted vegetables in a hearty bowl.', type: 'veg' },
    { id: 22, name: 'Crispy Tofu Rice', price: 260, category: 'rice', restaurant: 'Green Bowl', rating: '4.6', image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80', description: 'Golden tofu on jasmine rice with stir-fried greens and sauce.', type: 'veg' },
    { id: 23, name: 'Chicken Shawarma', price: 280, category: 'wrap', restaurant: 'Arabian Roll', rating: '4.8', image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=1200&q=80', description: 'Juicy chicken shawarma wrapped in Arabic flatbread and garlic sauce.', type: 'nonveg' },
    { id: 24, name: 'Hot Pot Noodles', price: 330, category: 'noodles', restaurant: 'Wok & Fire', rating: '4.8', image: 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?auto=format&fit=crop&w=1200&q=80', description: 'Comforting noodles simmered with broth and mushrooms.', type: 'nonveg' },
    { id: 25, name: 'Roasted Veggie Platter', price: 300, category: 'platter', restaurant: 'Farm Table', rating: '4.6', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80', description: 'Seasonal vegetables roasted to perfection with herb oil.', type: 'veg' },
    { id: 26, name: 'Chicken Caesar Salad', price: 290, category: 'salad', restaurant: 'Little Greens', rating: '4.7', image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=1200&q=80', description: 'Fresh romaine, grilled chicken, parmesan and caesar dressing.', type: 'nonveg' },
    { id: 27, name: 'Beef Steak', price: 690, category: 'steak', restaurant: 'Grill House', rating: '4.9', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80', description: 'Juicy grilled beef steak with herb butter and roasted potatoes.', type: 'nonveg' },
    { id: 28, name: 'Mango Cheesecake', price: 220, category: 'dessert', restaurant: 'Dairy Love', rating: '4.8', image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=1200&q=80', description: 'Creamy cheesecake with a bright tropical mango finish.', type: 'veg' },
    { id: 29, name: 'Cheese Quesadilla', price: 230, category: 'quesadilla', restaurant: 'La Mesa', rating: '4.6', image: 'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=1200&q=80', description: 'Golden tortillas filled with melted cheese and roasted peppers.', type: 'veg' },
    { id: 30, name: 'Spicy Ramen', price: 340, category: 'ramen', restaurant: 'Tokyo Noodle', rating: '4.8', image: 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?auto=format&fit=crop&w=1200&q=80', description: 'Rich broth with noodles, soft-boiled egg and chili oil.', type: 'nonveg' },
    { id: 31, name: 'Herb Chicken Platter', price: 410, category: 'platter', restaurant: 'Roast & Co', rating: '4.7', image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=1200&q=80', description: 'Grilled chicken with roasted vegetables and smoky seasoning.', type: 'nonveg' },
    { id: 32, name: 'Berry Pancakes', price: 210, category: 'breakfast', restaurant: 'Morning Crumb', rating: '4.8', image: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=1200&q=80', description: 'Fluffy pancakes layered with fresh berries and syrup.', type: 'veg' },
    { id: 33, name: 'Smoked BBQ Ribs', price: 560, category: 'bbq', restaurant: 'Pit Stop BBQ', rating: '4.9', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80', description: 'Tender slow-smoked ribs glazed in tangy barbecue sauce.', type: 'nonveg' },
    { id: 34, name: 'Egg Fried Rice', price: 260, category: 'rice', restaurant: 'Rice Republic', rating: '4.7', image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80', description: 'Classic fried rice loaded with egg, peas and spring onions.', type: 'nonveg' },
    { id: 35, name: 'Mac & Cheese', price: 240, category: 'comfort', restaurant: 'Cheese Haven', rating: '4.7', image: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?auto=format&fit=crop&w=1200&q=80', description: 'Baked creamy macaroni with rich cheddar and breadcrumbs.', type: 'veg' },
    { id: 36, name: 'Lemon Herb Pasta', price: 290, category: 'pasta', restaurant: 'Olive & Oregano', rating: '4.7', image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1200&q=80', description: 'Lemon zest, herbs and parmesan in a silky pasta sauce.', type: 'veg' },
    { id: 37, name: 'Chicken Kebab Plate', price: 420, category: 'kebab', restaurant: 'Desert Grill', rating: '4.8', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80', description: 'Skewered grilled chicken served with rice and salad.', type: 'nonveg' },
    { id: 38, name: 'Coconut Dessert Bowl', price: 180, category: 'dessert', restaurant: 'Island Sweets', rating: '4.5', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80', description: 'Coconut pudding with fresh fruit and toasted coconut flakes.', type: 'veg' },
    { id: 39, name: 'Turkey Club Sandwich', price: 330, category: 'sandwich', restaurant: 'Daily Deli', rating: '4.6', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80', description: 'Turkey, bacon, lettuce and tomato in toasted artisan bread.', type: 'nonveg' },
    { id: 40, name: 'Avocado Toast', price: 200, category: 'breakfast', restaurant: 'Morning Bloom', rating: '4.6', image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=80', description: 'Sourdough toast topped with avocado, seeds and chili flakes.', type: 'veg' },
    { id: 41, name: 'Crab Roll', price: 390, category: 'japanese', restaurant: 'Harbor Sushi', rating: '4.8', image: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=1200&q=80', description: 'Soft sushi roll packed with crab, cucumber and spicy mayo.', type: 'nonveg' },
    { id: 42, name: 'Mushroom Risotto', price: 340, category: 'risotto', restaurant: 'Velvet Fork', rating: '4.8', image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1200&q=80', description: 'Creamy arborio rice with mushrooms and parmesan.', type: 'veg' },
    { id: 43, name: 'Crispy Chicken Tacos', price: 310, category: 'tacos', restaurant: 'Taco Rush', rating: '4.7', image: 'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=1200&q=80', description: 'Crunchy tacos with spiced chicken and crunchy slaw.', type: 'nonveg' },
    { id: 44, name: 'Iced Mocha', price: 170, category: 'drink', restaurant: 'Brew & Bean', rating: '4.5', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80', description: 'Cold espresso and chocolate blended into a creamy mocha.', type: 'veg' },
    { id: 45, name: 'Fruit Parfait', price: 190, category: 'dessert', restaurant: 'Sunrise Cafe', rating: '4.7', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80', description: 'Layered yogurt, fruit and granola for a fresh finish.', type: 'veg' },
    { id: 46, name: 'Grilled Cheese Toast', price: 180, category: 'sandwich', restaurant: 'Crust & Co', rating: '4.5', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80', description: 'Golden grilled sourdough stacked with melted cheddar.', type: 'veg' },
    { id: 47, name: 'Thai Green Curry', price: 380, category: 'curry', restaurant: 'Thai Ember', rating: '4.8', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80', description: 'Green curry with vegetables, basil and fragrant coconut broth.', type: 'veg' },
    { id: 48, name: 'Prawn Fried Rice', price: 360, category: 'rice', restaurant: 'Dragon Wok', rating: '4.8', image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=1200&q=80', description: 'Savory fried rice with juicy prawns and scallions.', type: 'nonveg' },
    { id: 49, name: 'Beef Burger Deluxe', price: 330, category: 'burger', restaurant: 'Burger District', rating: '4.9', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80', description: 'Smashed beef burger with cheddar, onion jam and brioche bun.', type: 'nonveg' },
    { id: 50, name: 'Shrimp Scampi', price: 420, category: 'seafood', restaurant: 'Blue Harbor', rating: '4.9', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80', description: 'Garlicky shrimp with lemon, parsley and buttery crusty bread.', type: 'nonveg' },
    { id: 51, name: 'Cappuccino', price: 160, category: 'hot-drinks', restaurant: 'Brew & Bean', rating: '4.8', image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=1200&q=80', description: 'Espresso with steamed milk and a soft layer of foam.', type: 'veg' },
    { id: 52, name: 'Masala Chai', price: 90, category: 'hot-drinks', restaurant: 'Chiya Ghar', rating: '4.7', image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1200&q=80', description: 'Warm black tea brewed with milk and aromatic spices.', type: 'veg' },
    { id: 53, name: 'Hot Chocolate', price: 180, category: 'hot-drinks', restaurant: 'Cocoa House', rating: '4.8', image: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=1200&q=80', description: 'Rich chocolate drink finished with creamy foam.', type: 'veg' },
    { id: 54, name: 'Iced Latte', price: 190, category: 'cold-drinks', restaurant: 'Brew & Bean', rating: '4.8', image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=1200&q=80', description: 'Chilled espresso and milk poured over ice.', type: 'veg' },
    { id: 55, name: 'Fresh Lemonade', price: 130, category: 'cold-drinks', restaurant: 'Fresh & Fruity', rating: '4.7', image: 'https://images.unsplash.com/photo-1523677011781-c91d1v?auto=format&fit=crop&w=1200&q=80', description: 'Freshly squeezed lemon with chilled water and a touch of sweetness.', type: 'veg' },
    { id: 56, name: 'Mango Lassi', price: 180, category: 'cold-drinks', restaurant: 'Curry Tadka', rating: '4.8', image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=1200&q=80', description: 'Creamy yogurt blended with ripe mango and cardamom.', type: 'veg' },
    { id: 57, name: 'Vegetable Chow Mein', price: 240, category: 'noodles', restaurant: 'Wok Avenue', rating: '4.7', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=1200&q=80', description: 'Wok-tossed noodles with cabbage, peppers and spring onions.', type: 'veg' },
    { id: 58, name: 'Chicken Chow Mein', price: 290, category: 'noodles', restaurant: 'Wok & Fire', rating: '4.8', image: 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=1200&q=80', description: 'Stir-fried noodles with tender chicken and crunchy vegetables.', type: 'nonveg' },
    { id: 59, name: 'Dal Bhat Thali', price: 320, category: 'thali', restaurant: 'Himalayan Kitchen', rating: '4.9', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=1200&q=80', description: 'Dal, steamed rice, seasonal vegetables, pickle and fresh salad.', type: 'veg' },
    { id: 60, name: 'Paneer Butter Masala', price: 350, category: 'curry', restaurant: 'Curry Tadka', rating: '4.8', image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=1200&q=80', description: 'Soft paneer cooked in a creamy tomato and butter gravy.', type: 'veg' },
    { id: 61, name: 'Chicken Tikka', price: 390, category: 'starter', restaurant: 'Spice Route', rating: '4.8', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=1200&q=80', description: 'Char-grilled chicken pieces marinated with yogurt and spices.', type: 'nonveg' },
    { id: 62, name: 'Garlic Naan', price: 140, category: 'bread', restaurant: 'Tandoor House', rating: '4.7', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80', description: 'Soft tandoor-baked naan brushed with garlic butter and herbs.', type: 'veg' },
    { id: 63, name: 'Chicken Sausage Pizza', price: 390, category: 'pizza', restaurant: 'Brick Oven', rating: '4.7', image: 'https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1200&q=80', description: 'Stone-baked pizza with chicken sausage, mozzarella and herbs.', type: 'nonveg' },
    { id: 64, name: 'Chocolate Brownie', price: 180, category: 'dessert', restaurant: 'Sugar Lane', rating: '4.8', image: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?auto=format&fit=crop&w=1200&q=80', description: 'Warm fudgy brownie with a rich chocolate center.', type: 'veg' },
    { id: 65, name: 'Strawberry Milkshake', price: 220, category: 'cold-drinks', restaurant: 'Fresh & Fruity', rating: '4.7', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80', description: 'Creamy chilled milkshake blended with ripe strawberries.', type: 'veg' },
    { id: 66, name: 'Ginger Green Tea', price: 110, category: 'hot-drinks', restaurant: 'Chiya Ghar', rating: '4.6', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=1200&q=80', description: 'Light green tea steeped with fresh ginger and lemon.', type: 'veg' }
  ];

  const foodData = baseFoodData;

  let cart = JSON.parse(localStorage.getItem('biteoraCart')) || [];
  let favorites = JSON.parse(localStorage.getItem('biteoraFavorites')) || [];
  let orders = JSON.parse(localStorage.getItem('biteoraOrders')) || [];
  let currentFood = null;
  let modalQuantity = 1;

  setTimeout(() => dashboardLoader && dashboardLoader.classList.add('hidden'), 700);

  function showToast(title = 'Success', message = '', icon = '✓') {
    if (!dashboardToast) return;
    if (dashboardToastTitle) dashboardToastTitle.textContent = title;
    if (dashboardToastMessage) dashboardToastMessage.textContent = message;
    if (dashboardToastIcon) dashboardToastIcon.textContent = icon;
    dashboardToast.classList.add('show');
    clearTimeout(window.biteoraToastTimer);
    window.biteoraToastTimer = setTimeout(() => dashboardToast.classList.remove('show'), 3000);
  }

  if (dashboardToastClose) {
    dashboardToastClose.addEventListener('click', () => dashboardToast.classList.remove('show'));
  }

  if (profileButton) {
    profileButton.addEventListener('click', (event) => {
      event.stopPropagation();
      profileDropdown?.classList.toggle('show');
    });
  }

  document.addEventListener('click', (event) => {
    if (profileDropdown && !profileDropdown.contains(event.target) && profileButton && !profileButton.contains(event.target)) {
      profileDropdown.classList.remove('show');
    }
  });

  const mobileMenuButton = $('#mobileMenuButton');
  const mobileNav = $('#mobileNav');

  mobileMenuButton?.addEventListener('click', () => mobileNav?.classList.toggle('show'));
  $$('.nav-link').forEach((link) => link.addEventListener('click', () => mobileNav?.classList.remove('show')));

  const searchToggle = $('#searchToggle');
  const searchContainer = $('#searchContainer');
  const closeSearch = $('#closeSearch');
  const foodSearch = $('#foodSearch');

  searchToggle?.addEventListener('click', () => {
    searchContainer?.classList.toggle('active');
    setTimeout(() => foodSearch?.focus(), 100);
  });

  closeSearch?.addEventListener('click', () => {
    searchContainer?.classList.remove('active');
    if (foodSearch) foodSearch.value = '';
    showAllFood();
  });

  if (foodSearch) {
    foodSearch.addEventListener('input', () => {
      const searchText = foodSearch.value.trim().toLowerCase();
      searchFood(searchText);
    });
  }

  function renderFoodCards() {
    const grid = $('#foodGrid');
    if (!grid) return;

    grid.innerHTML = foodData.map((food) => `
      <article class="food-card" data-id="${food.id}" data-category="${food.category}" data-type="${food.type}" data-name="${food.name}">
        <div class="food-card-image">
          <button class="favorite-food ${favorites.includes(food.id) ? 'active' : ''}" data-id="${food.id}" aria-label="Favorite">${favorites.includes(food.id) ? '♥' : '♡'}</button>
          <img src="${safeFoodImage(food.image)}" alt="${food.name}" onerror="this.onerror=null;this.src='food-placeholder.png';" />
        </div>
        <div class="food-card-content">
          <div class="food-top">
            <h3 class="food-name">${food.name}</h3>
            <span class="food-price">₹${food.price}</span>
          </div>
          <span class="restaurant-name">${food.restaurant}</span>
          <div class="food-meta">
            <span class="rating">★ ${food.rating}</span>
            <button class="add-button" data-id="${food.id}">Add</button>
          </div>
        </div>
      </article>
    `).join('');

    $$('.food-card').forEach((card) => {
      card.addEventListener('click', (event) => {
        if (event.target.closest('.add-button') || event.target.closest('.favorite-food')) return;
        openFoodModal(Number(card.dataset.id));
      });
    });

    $$('.add-button').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        addToCart(Number(button.dataset.id), 1);
      });
    });

    $$('.favorite-food').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleFavorite(Number(button.dataset.id), button);
      });
    });

  }

  function searchFood(searchText) {
    const cards = $$('.food-card');
    let found = 0;

    cards.forEach((card) => {
      const name = card.dataset.name?.toLowerCase() || '';
      const category = card.dataset.category?.toLowerCase() || '';
      const restaurant = card.querySelector('.restaurant-name')?.textContent?.toLowerCase() || '';
      const match = name.includes(searchText) || category.includes(searchText) || restaurant.includes(searchText);
      card.style.display = match ? '' : 'none';
      if (match) found++;
    });

    $('#noResults')?.classList.toggle('show', found === 0);
    updateMenuResultCount(found);
  }

  function showAllFood() {
    $$('.food-card').forEach((card) => card.style.display = '');
    $('#noResults')?.classList.remove('show');
    $('#favoriteButton')?.classList.remove('active');
    updateMenuResultCount(foodData.length);
  }

  function updateMenuResultCount(count) {
    if (menuResultCount) menuResultCount.textContent = `${count} ${count === 1 ? 'item' : 'items'}`;
  }

  $$('.category-card').forEach((category) => {
    category.addEventListener('click', () => {
      const selectedCategory = category.dataset.category;
      filterFood(selectedCategory);
      document.querySelector('#menu')?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  function filterFood(category) {
    const cards = $$('.food-card');
    let found = 0;

    cards.forEach((card) => {
      const cardCategory = card.dataset.category;
      const isMatch = category === 'all' || category === cardCategory;
      card.style.display = isMatch ? '' : 'none';
      if (isMatch) found++;
    });

    $$('.filter-button').forEach((button) => button.classList.remove('active'));
    const matchingFilter = document.querySelector(`.filter-button[data-filter="${category}"]`);
    matchingFilter?.classList.add('active');
    $('#favoriteButton')?.classList.remove('active');
    $('#noResults')?.classList.toggle('show', found === 0);
    updateMenuResultCount(found);
  }

  $$('.filter-button').forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      if (filter === 'all' || filter === 'veg' || filter === 'nonveg') {
        filterByType(filter);
      } else {
        filterFood(filter);
      }
    });
  });

  function filterByType(type) {
    const cards = $$('.food-card');
    let found = 0;

    cards.forEach((card) => {
      const cardType = card.dataset.type;
      const isMatch = type === 'all' || cardType === type;
      card.style.display = isMatch ? '' : 'none';
      if (isMatch) found++;
    });

    $$('.filter-button').forEach((button) => button.classList.remove('active'));
    document.querySelector(`.filter-button[data-filter="${type}"]`)?.classList.add('active');
    $('#favoriteButton')?.classList.remove('active');
    $('#noResults')?.classList.toggle('show', found === 0);
    updateMenuResultCount(found);
  }

  function saveCart() {
    localStorage.setItem('biteoraCart', JSON.stringify(cart));
  }

  function updateCart() {
    if (!cartItems) return;

    if (cart.length === 0) {
      cartItems.innerHTML = `
        <div class="empty-cart">
          <div style="font-size:50px;">🛒</div>
          <h3>Your cart is empty</h3>
          <p style="color:#777;margin-top:8px;">Add some delicious food to continue.</p>
        </div>
      `;
    } else {
      cartItems.innerHTML = '';
      cart.forEach((item) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
          <div class="cart-item-image">
            <img src="${foodData.find((food) => food.id === item.id)?.image || ''}" alt="${item.name}" />
          </div>
          <div>
            <h4>${item.name}</h4>
            <div class="cart-item-price">₹${item.price}</div>
            <div class="quantity-controls">
              <button class="cart-minus" data-id="${item.id}">−</button>
              <span>${item.quantity}</span>
              <button class="cart-plus" data-id="${item.id}">+</button>
            </div>
          </div>
          <button class="remove-cart-item" data-id="${item.id}">×</button>
        `;
        cartItems.appendChild(itemElement);
      });
    }

    const totalQuantity = cart.reduce((total, item) => total + item.quantity, 0);
    const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    const delivery = subtotal >= 500 ? 0 : subtotal > 0 ? 40 : 0;
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + delivery + tax;

    if (cartCount) cartCount.textContent = totalQuantity;
    if (cartSubtotal) cartSubtotal.textContent = `₹${subtotal}`;
    if (cartDelivery) cartDelivery.textContent = `₹${delivery}`;
    if (cartTax) cartTax.textContent = `₹${tax}`;
    if (cartTotal) cartTotal.textContent = `₹${total}`;

    const deliveryProgress = Math.min(100, Math.round((subtotal / 500) * 100));
    if (deliveryProgressBar) deliveryProgressBar.style.width = `${deliveryProgress}%`;
    if (deliveryProgressText) {
      deliveryProgressText.textContent = subtotal >= 500
        ? 'Free delivery unlocked.'
        : `Add ₹${500 - subtotal} more for free delivery.`;
    }

    bindCartButtons();
  }

  function bindCartButtons() {
    $$('.cart-minus').forEach((button) => button.addEventListener('click', () => changeQuantity(Number(button.dataset.id), -1)));
    $$('.cart-plus').forEach((button) => button.addEventListener('click', () => changeQuantity(Number(button.dataset.id), 1)));
    $$('.remove-cart-item').forEach((button) => button.addEventListener('click', () => removeFromCart(Number(button.dataset.id))));
  }

  function changeQuantity(id, amount) {
    const item = cart.find((entry) => entry.id === id);
    if (!item) return;

    item.quantity += amount;
    if (item.quantity <= 0) {
      cart = cart.filter((entry) => entry.id !== id);
    }

    saveCart();
    updateCart();
  }

  function removeFromCart(id) {
    const item = cart.find((entry) => entry.id === id);
    cart = cart.filter((entry) => entry.id !== id);
    saveCart();
    updateCart();
    if (item) showToast('Removed', `${item.name} removed from cart.`, '×');
  }

  function addToCart(id, quantity = 1) {
    const food = foodData.find((entry) => entry.id === id);
    if (!food) return;

    const existing = cart.find((item) => item.id === id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ id: food.id, name: food.name, price: food.price, image: food.image, quantity });
    }

    saveCart();
    updateCart();
    openCartSidebar();
    showToast('Added to cart', `${food.name} added to your cart.`, '✓');
  }

  function openCartSidebar() {
    cartSidebar?.classList.add('active');
    cartOverlay?.classList.add('active');
    updateCart();
  }

  cartButton?.addEventListener('click', openCartSidebar);

  function closeCartSidebar() {
    cartSidebar?.classList.remove('active');
    cartOverlay?.classList.remove('active');
  }

  closeCart?.addEventListener('click', closeCartSidebar);
  cartOverlay?.addEventListener('click', closeCartSidebar);
  startShopping?.addEventListener('click', closeCartSidebar);

  function openFoodModal(id) {
    const food = foodData.find((entry) => entry.id === id);
    if (!food || !foodModal) return;

    currentFood = food;
    modalQuantity = 1;
    const imageWrap = $('#modalFoodImage');
    imageWrap.innerHTML = `<img src="${food.image}" alt="${food.name}" />`;
    $('#modalRestaurant').textContent = food.restaurant;
    $('#modalFoodName').textContent = food.name;
    $('#modalRating').textContent = `★ ${food.rating}`;
    $('#modalFoodDescription').textContent = food.description;
    $('#modalFoodPrice').textContent = `₹${food.price}`;
    $('#modalQuantity').textContent = modalQuantity;
    foodModal.classList.add('active');
  }

  function closeFoodModal() {
    foodModal?.classList.remove('active');
    currentFood = null;
  }

  foodModalClose?.addEventListener('click', closeFoodModal);

  $('#modalMinus')?.addEventListener('click', () => {
    if (modalQuantity > 1) {
      modalQuantity--;
      $('#modalQuantity').textContent = modalQuantity;
    }
  });

  $('#modalPlus')?.addEventListener('click', () => {
    modalQuantity++;
    $('#modalQuantity').textContent = modalQuantity;
  });

  $('#modalAddButton')?.addEventListener('click', () => {
    if (!currentFood) return;
    addToCart(currentFood.id, modalQuantity);
    closeFoodModal();
  });

  [foodModal, checkoutModal, successModal, trackingModal].forEach((modal) => {
    modal?.addEventListener('click', (event) => {
      if (event.target === modal) modal.classList.remove('active');
    });
  });

  function toggleFavorite(id, button) {
    if (favorites.includes(id)) {
      favorites = favorites.filter((item) => item !== id);
      button.classList.remove('active');
      button.innerHTML = '♡';
      showToast('Removed from favorites', 'Food removed from your favorites.', '♡');
    } else {
      favorites.push(id);
      button.classList.add('active');
      button.innerHTML = '♥';
      showToast('Added to favorites', 'Food saved to your favorites.', '♥');
    }
    localStorage.setItem('biteoraFavorites', JSON.stringify(favorites));
    if ($('#favoriteButton')?.classList.contains('active')) showFavorites();
  }

  $('#favoriteButton')?.addEventListener('click', () => {
    showFavorites();
    document.querySelector('#menu')?.scrollIntoView({ behavior: 'smooth' });
  });

  $$('.offer-button').forEach((button) => {
    button.addEventListener('click', () => {
      const offer = button.dataset.offer;
      showToast('Offer Activated', offer ? `${offer} offer selected.` : 'Special offer selected.', '🎁');
      document.querySelector('#menu')?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  checkoutButton?.addEventListener('click', () => {
    if (cart.length === 0) {
      showToast('Cart is empty', 'Please add food before checkout.', '🛒');
      return;
    }
    closeCartSidebar();
    checkoutModal?.classList.add('active');
  });

  checkoutClose?.addEventListener('click', () => checkoutModal?.classList.remove('active'));

  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (cart.length === 0) {
        showToast('Cart is empty', 'Please add food first.', '🛒');
        return;
      }

      const name = $('#checkoutName')?.value.trim();
      const email = $('#checkoutEmail')?.value.trim();
      const phone = $('#checkoutPhone')?.value.trim();
      const address = $('#checkoutAddress')?.value.trim();
      const city = $('#checkoutCity')?.value.trim();
      const pin = $('#checkoutPin')?.value.trim();
      const payment = document.querySelector('input[name="payment"]:checked')?.value || 'Cash on Delivery';

      if (!name || !email || !phone || !address || !city || !pin) {
        showToast('Incomplete details', 'Please fill all contact details.', '!');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('Invalid email', 'Please enter a valid email address.', '!');
        return;
      }
      if (phone.length < 10) {
        showToast('Invalid phone', 'Please enter a valid phone number.', '!');
        return;
      }
      if (pin.length < 4) {
        showToast('Invalid PIN', 'Please enter a valid postal code.', '!');
        return;
      }

      placeOrder({ name, email, phone, address, city, pin, payment });
    });
  }

  async function placeOrder(customer) {
    const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    const delivery = subtotal > 0 ? 40 : 0;
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + delivery + tax;
    const orderId = 'BIT' + Date.now().toString().slice(-6);

    const newOrder = {
      id: orderId,
      date: new Date().toLocaleString(),
      customer,
      items: [...cart],
      subtotal,
      delivery,
      tax,
      total,
      status: 'Preparing'
    };

    try {
      const response = await fetch(`${apiBase}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          customer,
          items: [...cart],
          subtotal,
          delivery,
          tax,
          total
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Order failed.');
      }
    } catch (error) {
      showToast('Order saved locally', 'Your order was added locally because the backend is unavailable.', '✓');
    }

    orders.unshift(newOrder);
    localStorage.setItem('biteoraOrders', JSON.stringify(orders));
    cart = [];
    saveCart();
    updateCart();
    checkoutModal?.classList.remove('active');
    checkoutForm?.reset();
    $('#successOrderId').textContent = `Order ID: ${orderId}`;
    successModal?.classList.add('active');
    renderOrders();
    showToast('Order placed', 'Your food order has been successfully placed.', '✓');
  }

  successClose?.addEventListener('click', () => successModal?.classList.remove('active'));
  trackingClose?.addEventListener('click', () => trackingModal?.classList.remove('active'));

  function normalizeOrderRecord(order) {
    if (!order) return null;

    const items = Array.isArray(order.items)
      ? order.items
      : typeof order.items === 'string'
        ? JSON.parse(order.items || '[]')
        : [];

    return {
      id: order.id || order.orderId || 'UNKNOWN',
      date: order.created_at || order.date || new Date().toLocaleString(),
      customer: {
        name: order.customer_name || order.customer?.name || '',
        email: order.email || order.customer?.email || '',
        phone: order.phone || order.customer?.phone || '',
        address: order.address || order.customer?.address || '',
        city: order.city || order.customer?.city || '',
        pin: order.pin || order.customer?.pin || '',
        payment: order.payment || order.customer?.payment || 'Cash on Delivery'
      },
      items,
      subtotal: Number(order.subtotal || 0),
      delivery: Number(order.delivery || 0),
      tax: Number(order.tax || 0),
      total: Number(order.total || 0),
      status: order.status || 'Preparing'
    };
  }

  async function loadUserOrders() {
    const email = (userEmail || '').trim().toLowerCase();
    if (!email) return;

    try {
      const response = await fetch(`${apiBase}/api/orders?email=${encodeURIComponent(email)}`);
      if (!response.ok) throw new Error('Fetch failed');

      const serverOrders = await response.json();
      const normalizedServerOrders = (Array.isArray(serverOrders) ? serverOrders : []).map(normalizeOrderRecord).filter(Boolean);
      const localOrders = JSON.parse(localStorage.getItem('biteoraOrders') || '[]').filter((order) => {
        const orderEmail = (order.customer?.email || order.email || '').toLowerCase();
        return orderEmail === email;
      });

      const mergedOrders = [...normalizedServerOrders, ...localOrders].filter((order, index, source) => {
        const firstIndex = source.findIndex((entry) => String(entry.id) === String(order.id));
        return firstIndex === index;
      });

      orders = mergedOrders;
      localStorage.setItem('biteoraOrders', JSON.stringify(orders));
      renderOrders();
    } catch (error) {
      const localOrders = JSON.parse(localStorage.getItem('biteoraOrders') || '[]').filter((order) => {
        const orderEmail = (order.customer?.email || order.email || '').toLowerCase();
        return orderEmail === email;
      });
      orders = localOrders;
      renderOrders();
    }
  }

  function renderOrders() {
    const ordersContainer = $('#ordersContainer');
    if (!ordersContainer) return;

    if (orders.length === 0) {
      ordersContainer.innerHTML = `
        <div class="empty-orders">
          <div class="empty-orders-icon">🍽️</div>
          <h3>No orders yet</h3>
          <p>Your recent food orders will appear here.</p>
        </div>
      `;
      return;
    }

    ordersContainer.innerHTML = orders.map((order) => `
      <div class="order-card">
        <div class="order-info">
          <div class="order-icon">🍱</div>
          <div>
            <h3>Order #${order.id}</h3>
            <p style="color:#777;font-size:12px;margin-top:3px;">${(order.items || []).map((item) => item.name || item.productName || 'Item').join(', ')}</p>
            <span class="order-status">${order.status}</span>
          </div>
        </div>
        <div class="order-card-actions">
          <div>
            <strong>₹${order.total}</strong>
            <p>${order.date}</p>
          </div>
          <button class="track-order-button" data-order-id="${order.id}">Track Order</button>
        </div>
      </div>
    `).join('');

    $$('.track-order-button').forEach((button) => {
      button.addEventListener('click', () => openTrackingModal(button.dataset.orderId));
    });
  }

  function openTrackingModal(orderId) {
    const order = orders.find((entry) => entry.id === orderId);
    if (!order || !trackingModal) return;

    const steps = [
      ['Order placed', 'Your order was received.', 'Placed'],
      ['Kitchen preparing', 'The restaurant is preparing your food.', 'Preparing'],
      ['Out for delivery', 'A delivery partner is bringing your order.', 'On the way'],
      ['Delivered', 'Enjoy your meal!', 'Delivered']
    ];
    const currentStep = Math.max(0, steps.findIndex((step) => step[2] === order.status));
    trackingTitle.textContent = `Order #${order.id}`;
    trackingSummary.textContent = `${order.items.map((item) => `${item.name} ×${item.quantity}`).join(', ')} · ₹${order.total}`;
    trackingTimeline.innerHTML = steps.map((step, index) => `
      <div class="tracking-step ${index <= currentStep ? 'complete' : ''} ${index === currentStep ? 'current' : ''}">
        <span class="tracking-dot">${index < currentStep ? '✓' : index + 1}</span>
        <div><strong>${step[0]}</strong><p>${index <= currentStep ? step[1] : 'Coming up next.'}</p></div>
      </div>
    `).join('');
    trackingModal.classList.add('active');
  }

  $('#myOrdersButton')?.addEventListener('click', () => {
    profileDropdown?.classList.remove('show');
    document.querySelector('#orders')?.scrollIntoView({ behavior: 'smooth' });
  });

  $('#myFavoritesButton')?.addEventListener('click', () => {
    profileDropdown?.classList.remove('show');
    showFavorites();
    document.querySelector('#menu')?.scrollIntoView({ behavior: 'smooth' });
  });

  function showFavorites() {
    const cards = $$('.food-card');
    let found = 0;

    cards.forEach((card) => {
      const id = Number(card.dataset.id);
      const match = favorites.includes(id);
      card.style.display = match ? '' : 'none';
      if (match) found++;
    });

    $('#noResults')?.classList.toggle('show', found === 0);
    $$('.filter-button').forEach((button) => button.classList.remove('active'));
    $('#favoriteButton')?.classList.add('active');
    updateMenuResultCount(found);
    if (found === 0) showToast('No favorites', "You haven't added any favorite food yet.", '♡');
  }

  $('#accountButton')?.addEventListener('click', () => {
    const enteredName = window.prompt('Enter your name', userName);
    const updatedName = enteredName?.trim();
    if (!updatedName) return;

    userName = updatedName;
    localStorage.setItem('userName', userName);
    if (profileName) profileName.textContent = userName;
    if (dropdownUserName) dropdownUserName.textContent = userName;
    profileDropdown?.classList.remove('show');
    showToast('Profile updated', `Welcome, ${userName}.`, '✓');
  });

  function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('rememberMe');
    window.location.href = 'index.html';
  }

  $('#logoutButton')?.addEventListener('click', logout);
  $('#mobileLogout')?.addEventListener('click', logout);

  $('#showcaseButton')?.addEventListener('click', () => document.querySelector('#menu')?.scrollIntoView({ behavior: 'smooth' }));

  $$('.nav-link').forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        event.preventDefault();
        const target = document.querySelector(href);
        target?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  const sections = $$('main section');
  window.addEventListener('scroll', () => {
    let currentSection = '';

    sections.forEach((section) => {
      const top = section.offsetTop - 150;
      if (window.scrollY >= top) currentSection = section.id;
    });

    $$('.nav-link').forEach((link) => {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      if (href === `#${currentSection}`) link.classList.add('active');
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    closeCartSidebar();
    foodModal?.classList.remove('active');
    checkoutModal?.classList.remove('active');
    successModal?.classList.remove('active');
    trackingModal?.classList.remove('active');
    profileDropdown?.classList.remove('show');
    searchContainer?.classList.remove('active');
  });

  renderFoodCards();
  renderOrders();
  loadUserOrders();
  updateCart();
  updateMenuResultCount(foodData.length);
});
