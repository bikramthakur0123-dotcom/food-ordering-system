import json
import hashlib
import os
import sqlite3
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
from datetime import datetime

from flask import Flask, jsonify, request, send_from_directory, session
from flask_cors import CORS

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.environ.get(
    'BITEORA_DB_PATH',
    os.path.join('/tmp', 'biteora.db') if os.environ.get('VERCEL') else os.path.join(BASE_DIR, 'biteora.db'),
)
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID') or ''

app = Flask(__name__, static_folder='.', static_url_path='')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or 'biteora-local-secret-key'
CORS(app)

from catalog import MENU_ITEMS, menu_item_values


def catalog_fingerprint():
    payload = json.dumps(
        [menu_item_values(item) for item in MENU_ITEMS],
        ensure_ascii=True,
        separators=(',', ':'),
    )
    return hashlib.sha256(payload.encode('utf-8')).hexdigest()



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
            type TEXT NOT NULL,
            slug TEXT,
            region TEXT,
            cultural_history TEXT,
            traditional_preparation TEXT,
            flavor_profile TEXT,
            nutrition_info TEXT,
            safety_risks TEXT,
            image_attribution TEXT,
            source_references TEXT,
            availability_status TEXT DEFAULT 'catalogue-only',
            orderable INTEGER DEFAULT 0
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

    menu_columns = {row[1] for row in conn.execute('PRAGMA table_info(menu_items)').fetchall()}
    new_columns = {
        'slug': 'TEXT',
        'region': 'TEXT',
        'cultural_history': 'TEXT',
        'traditional_preparation': 'TEXT',
        'flavor_profile': 'TEXT',
        'nutrition_info': 'TEXT',
        'safety_risks': 'TEXT',
        'image_attribution': 'TEXT',
        'source_references': 'TEXT',
        'availability_status': "TEXT DEFAULT 'catalogue-only'",
        'orderable': 'INTEGER DEFAULT 0',
    }
    for column, definition in new_columns.items():
        if column not in menu_columns:
            conn.execute(f'ALTER TABLE menu_items ADD COLUMN {column} {definition}')

    conn.execute('CREATE TABLE IF NOT EXISTS catalog_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)')
    catalog_version = conn.execute(
        "SELECT value FROM catalog_meta WHERE key = 'catalog_version'"
    ).fetchone()
    current_catalog_version = catalog_fingerprint()
    if not catalog_version or catalog_version[0] != current_catalog_version:
        conn.execute('DELETE FROM menu_items')
        conn.executemany(
            '''INSERT INTO menu_items (
                id, slug, name, price, category, restaurant, rating, image,
                description, type, region, cultural_history,
                traditional_preparation, flavor_profile, nutrition_info,
                safety_risks, image_attribution, source_references,
                availability_status, orderable
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
            [menu_item_values(item) for item in MENU_ITEMS]
        )
        conn.execute(
            "INSERT OR REPLACE INTO catalog_meta (key, value) VALUES ('catalog_version', ?)",
            (current_catalog_version,)
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
    response = jsonify(menu)
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    return response


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
