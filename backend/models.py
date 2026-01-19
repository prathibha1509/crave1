from flask_sqlalchemy import SQLAlchemy
from flask_security import UserMixin, RoleMixin
from datetime import datetime
from .extensions import db 

# Association table for the many-to-many relationship between Users and Roles
class RolesUsers(db.Model):
    __tablename__ = 'roles_users'
    id = db.Column(db.Integer(), primary_key=True)
    user_id = db.Column('user_id', db.Integer(), db.ForeignKey('user.id'))
    role_id = db.Column('role_id', db.Integer(), db.ForeignKey('role.id'))

# Role model for Flask-Security
class Role(db.Model, RoleMixin):
    __tablename__ = 'role'
    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(80), unique=True)
    description = db.Column(db.String(255))

# User model for all roles (Customer, Owner, Admin)
class User(db.Model, UserMixin):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(255))
    active = db.Column(db.Boolean())
    fs_uniquifier = db.Column(db.String(64), unique=True, nullable=False)
    roles = db.relationship('Role', secondary='roles_users', backref=db.backref('users', lazy='dynamic'))

    orders = db.relationship('Order', backref='customer', lazy=True)
    reviews = db.relationship('Review', backref='customer', lazy=True)
    favorites = db.relationship('Restaurant', secondary='favorite', backref='favorited_by', lazy='dynamic')
    
class Restaurant(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    address = db.Column(db.String(255), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    
    # --- ✅ START: GEOLOCATION FIELDS ADDED ---
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    # --- ✅ END: GEOLOCATION FIELDS ADDED ---
    # --- ✅ START: ADDED RESTAURANT OPERATIONAL FIELD ---
    opening_hours = db.Column(db.String(255), nullable=True) # e.g. "9:00 AM - 10:00 PM"
    # --- ✅ END: ADDED RESTAURANT OPERATIONAL FIELD ---

    is_verified = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    gallery = db.Column(db.JSON, nullable=True)

    # --- ✅ NEW: FEE FIELDS ADDED ---
    delivery_fee = db.Column(db.Float, default=0.0)
    platform_fee = db.Column(db.Float, default=0.0)
    # --- ✅ END: FEE FIELDS ADDED ---



    owner = db.relationship('User', backref='restaurants_owned')
    menu_items = db.relationship('MenuItem', backref='restaurant', lazy=True, cascade="all, delete-orphan")
    categories = db.relationship('Category', backref='restaurant', lazy=True, cascade="all, delete-orphan")
    orders = db.relationship('Order', backref='restaurant', lazy=True)
    reviews = db.relationship('Review', backref='restaurant', lazy=True, cascade="all, delete-orphan")
    time_slots = db.relationship('TimeSlot', backref='restaurant', lazy=True, cascade="all, delete-orphan")


# ... (The rest of your models.py file remains unchanged) ...
class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurant.id'), nullable=False)
    menu_items = db.relationship('MenuItem', backref='category', lazy=True)

class MenuItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    is_available = db.Column(db.Boolean, default=True)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurant.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    image_url = db.Column(db.String(255), nullable=True)
    food_type = db.Column(db.String(10), nullable=True) # e.g., 'Veg', 'Non-Veg'


class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurant.id'), nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default='placed')
    order_type = db.Column(db.String(50), nullable=False)
    table_number = db.Column(db.String(20), nullable=True)
    pickup_ready = db.Column(db.Boolean, default=False)
    otp = db.Column(db.String(6), nullable=True)
    qr_payload = db.Column(db.String(255), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_scheduled = db.Column(db.Boolean, default=False)

    scheduled_time = db.Column(db.DateTime, nullable=True)
    coupon_code = db.Column(db.String(50), nullable=True)
    discount_amount = db.Column(db.Float, default=0.0)

    # --- ✅ NEW: FEE FIELDS ADDED ---
    delivery_fee = db.Column(db.Float, default=0.0)
    platform_fee = db.Column(db.Float, default=0.0)
    # --- ✅ END: FEE FIELDS ADDED ---
    
    # Payment integration fields
    razorpay_order_id = db.Column(db.String(255), nullable=True)
    razorpay_payment_id = db.Column(db.String(255), nullable=True)
    payment_status = db.Column(db.String(50), default='pending')
    payment_amount = db.Column(db.Float, nullable=True)

    
    # Payment integration fields
    razorpay_order_id = db.Column(db.String(255), nullable=True)
    razorpay_payment_id = db.Column(db.String(255), nullable=True)
    payment_status = db.Column(db.String(50), default='pending')
    payment_amount = db.Column(db.Float, nullable=True)

    
    review = db.relationship('Review', backref='order', uselist=False, cascade="all, delete-orphan")
    items = db.relationship('OrderItem', backref='order', lazy=True, cascade="all, delete-orphan")

class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    menu_item_id = db.Column(db.Integer, db.ForeignKey('menu_item.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price_at_order = db.Column(db.Float, nullable=False)
    menu_item = db.relationship('MenuItem')

class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurant.id'), nullable=False)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False, unique=True)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
class Favorite(db.Model):
    __tablename__ = 'favorite'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurant.id'), nullable=False)

class RewardPoint(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=True)
    points = db.Column(db.Integer, nullable=False)
    transaction_type = db.Column(db.String(50), nullable=False)
    reason = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Coupon(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurant.id'), nullable=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    discount_type = db.Column(db.String(50), nullable=False)
    discount_value = db.Column(db.Float, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    restaurant = db.relationship('Restaurant', backref='coupons')

# ✅ ADDED: New TimeSlot model
class TimeSlot(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurant.id'), nullable=False)
    day_of_week = db.Column(db.String(10), nullable=False) # e.g., "Monday", "Tuesday"
    start_time = db.Column(db.Time, nullable=False)

    end_time = db.Column(db.Time, nullable=False)