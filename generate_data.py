import pandas as pd
import random

# Realistic Indian Data
categories = ['Electronics', 'Groceries', 'Fashion', 'Home', 'Beauty']
suppliers = ['Cloudtail India', 'Tata Consumer', 'Reliance Retail', 'Amul Coop', 'Flipkart Wholesale', 'Appario Retail', 'D-Mart']
products_map = {
    'Electronics': ['Wireless Mouse', 'Gaming Keyboard', 'HDMI Cable', 'USB-C Charger', 'Power Bank 20000mAh', 'Bluetooth Headset', 'HD Monitor 24in', 'Smartwatch Pro'],
    'Groceries': ['Basmati Rice 5kg', 'Sunflower Oil 1L', 'Tata Tea Gold', 'Organic Jaggery', 'Almonds 500g', 'Toor Dal 1kg', 'Digestive Biscuits', 'Cow Ghee 500ml'],
    'Fashion': ['Cotton Polo T-Shirt', 'Slim Fit Jeans', 'Silk Saree', 'Kurta Pajama', 'Running Shoes', 'Cotton Socks', 'Winter Jacket', 'Formal Shirt'],
    'Home': ['Double Bedsheet', 'Blackout Curtains', 'Memory Foam Pillow', 'Copper Water Bottle', 'Glass Lunch Box', 'Welcome Doormat', 'Bath Towel Set', 'Smart LED Bulb 9W'],
    'Beauty': ['Neem Face Wash', 'Onion Hair Oil', 'Sandalwood Soap', 'Aloe Vera Gel', 'Sunscreen SPF 50', 'Body Spray', 'Hair Serum', 'Lip Balm']
}

data = []
for i in range(1, 101):
    cat = random.choice(categories)
    base_name = random.choice(products_map[cat])
    sup = random.choice(suppliers)
    
    # Realistic Pricing (INR)
    price_range = (499, 4999) if cat == 'Electronics' else (40, 600) if cat == 'Groceries' else (299, 1999)
    
    item = {
        'Name': f'{base_name} (Batch {random.randint(100,999)})', 
        'SKU': f'{cat[:3].upper()}-{1000+i}', 
        'Category': cat, 
        'Price': round(random.uniform(*price_range), 2), 
        'Quantity': random.randint(20, 200), 
        'Supplier': sup
    }
    data.append(item)

df = pd.DataFrame(data)
df.to_excel('indian_inventory_100.xlsx', index=False)
print('✅ Success! Created indian_inventory_100.xlsx with 100 products.')
