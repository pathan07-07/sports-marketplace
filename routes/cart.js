const express = require('express');
const router = express.Router();
const uuid = require('uuid');
const { loadDatabase, saveDatabase } = require('../utils/db');

// Get Cart Items
router.get('/', (req, res) => {
    const user = req.user
    const db = loadDatabase();
    const cartItems = db.cart.filter(item => item.userId === user.id);

    // Get full product details for each cart item
    const cartItemsWithDetails = cartItems.map(item => {
        const product = db.products.find(p => p.id === item.productId);
        return {
            ...item,
            product
        };
    });

    res.status(200).json(cartItemsWithDetails);
});

// Add Item to Cart
router.post('/', (req, res) => {
    const user = req.user

    const { productId, quantity, size } = req.body;
    if (!productId || !quantity || !size) {
        return res.status(400).json({ message: 'Product ID, quantity and size are required' });
    }

    let db = loadDatabase();
    const product = db.products.find(p => p.id === productId);

    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    const existingItem = db.cart.find(item => item.productId === productId && item.userId === user.id && item.size === size);
    if (existingItem) {
        existingItem.quantity = Number(existingItem.quantity) + Number(quantity);
    } else {
        db.cart.push({
            id: uuid.v4(),
            productId,
            quantity,
            size,
            price: product.price,
            userId: user.id,
        });
    }

    saveDatabase(db);
    res.status(200).json(db.cart);
});

// Remove Item from Cart
router.delete('/:id', (req, res) => {
    const user = req.user

    let db = loadDatabase();
    const itemIndex = db.cart.findIndex(item => item.id === req.params.id && item.userId === user.id);

    if (itemIndex === -1) {
        return res.status(404).json({ message: 'Cart item not found' });
    }

    db.cart.splice(itemIndex, 1);
    saveDatabase(db);
    res.status(200).json({ message: 'Item removed from cart' });
});

// Update Cart Item Quantity
router.put('/:id', (req, res) => {
    const user = req.user

    const { quantity } = req.body;
    if (!quantity) {
        return res.status(400).json({ message: 'Quantity is required' });
    }

    let db = loadDatabase();
    const item = db.cart.find(item => item.id === req.params.id && item.userId === user.id);

    if (!item) {
        return res.status(404).json({ message: 'Cart item not found' });
    }

    item.quantity = quantity;
    saveDatabase(db);
    res.status(200).json(item);
});

module.exports = router; 