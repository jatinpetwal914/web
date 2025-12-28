DROP DATABASE IF EXISTS phadizon;
CREATE DATABASE phadizon;
USE phadizon;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image VARCHAR(255),
  category VARCHAR(50),
  stock INT DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cart (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  product_id INT,
  quantity INT DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  total DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'Pending',
  payment_id VARCHAR(100),
  payment_status VARCHAR(50) DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT,
  product_id INT,
  quantity INT,
  price DECIMAL(10, 2),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Seed Data
INSERT INTO products (name, description, price, image, category) VALUES
('Chakkidari Flour', 'Fresh Rasoi Ka Saman from Himalayas', 450.00, 'images/flour.jpg', 'Home'),
('Green Tea', 'Organic Green Tea for Health Care', 350.00, 'images/tea.png', 'Health-Care'),
('Snacks Pack', 'Tasty Chatar-Patar from Hills', 150.00, 'images/snacks.jpg', 'Snacks'),
('Pidantar Oil', 'Relief Oil', 200.00, 'images/oil.jpg', 'Top-Products'),
('Kemomile', 'Chamomile Flowers', 300.00, 'images/chamomile.jpg', 'Top-Products'),
('Alsi', 'Flax Seeds', 120.00, 'images/alsi.jpg', 'Top-Products'),
('Rosemarie', 'Rosemary Herb', 180.00, 'images/rosemary.jpg', 'Top-Products');
