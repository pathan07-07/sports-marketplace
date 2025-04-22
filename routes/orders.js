const express = require('express');
const router = express.Router();
const uuid = require('uuid');
const { loadDatabase, saveDatabase } = require('../utils/db');

// Get All Orders
router.get('/get-orders/:id', (req, res) => {
    const userId = req.params.id;

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    const db = loadDatabase();
    const orders = db.orders.filter(order => order.userId === userId);

    if (!orders || orders.length === 0) {
        return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json(orders);
});


// Get Single Order
router.get('/:id', (req, res) => {
    const db = loadDatabase();
    const order = db.orders.find(order => order.id === req.params.id);
    
    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json(order);
});

// Create New Order
router.post('/', (req, res) => {
    const { userId, shippingAddress } = req.body;
    if (!userId || !shippingAddress) {
        return res.status(400).json({ message: 'User ID and shipping address are required' });
    }

    let db = loadDatabase();
    
    if (db.cart.length === 0) {
        return res.status(400).json({ message: 'Cart is empty' });
    }

    let cartItems = db.cart.filter(item => item.userId === userId);

    const newOrder = {
        id: uuid.v4(),
        userId,
        items: [...cartItems],
        shippingAddress,
        status: 'pending',
        totalAmount: db.cart.reduce((total, item) => total + (item.price * item.quantity), 0),
        createdAt: new Date().toISOString()
    };

    db.orders.push(newOrder);
    db.cart = []; // Clear the cart after order creation
    saveDatabase(db);
    
    res.status(201).json(newOrder);
});

// Update Order Status
router.put('/:id/status', (req, res) => {
    const { status } = req.body;
    if (!status) {
        return res.status(400).json({ message: 'Status is required' });
    }

    let db = loadDatabase();
    const order = db.orders.find(order => order.id === req.params.id);
    
    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    saveDatabase(db);
    res.status(200).json(order);
});

module.exports = router; 