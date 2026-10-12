import unittest

from app import app, init_db


class FoodOrderingFlowTests(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        app.secret_key = 'test-secret-key'
        self.client = app.test_client()
        init_db()

    def test_non_admin_cannot_view_database_records(self):
        with self.client.session_transaction() as session:
            session['user'] = {'email': 'customer@example.com', 'name': 'Customer User'}

        response = self.client.get('/api/database/records')
        self.assertEqual(response.status_code, 403)

    def test_orders_store_status_and_return_it(self):
        payload = {
            'id': 'ORDER-TEST-001',
            'customer': {
                'name': 'Jane Doe',
                'email': 'jane@example.com',
                'phone': '9840000000',
                'address': 'Test Address',
                'city': 'Kathmandu',
                'pin': '44600',
                'payment': 'Cash on Delivery'
            },
            'items': [{'id': 1, 'name': 'Pizza', 'quantity': 2, 'price': 200}],
            'subtotal': 400,
            'delivery': 40,
            'tax': 20,
            'total': 460,
            'status': 'pending'
        }

        response = self.client.post('/api/orders', json=payload)
        self.assertEqual(response.status_code, 200)

        order_response = self.client.get('/api/orders?email=jane@example.com')
        self.assertEqual(order_response.status_code, 200)
        order_data = order_response.get_json()
        self.assertTrue(order_data)
        self.assertEqual(order_data[0]['status'], 'pending')


if __name__ == '__main__':
    unittest.main()
