import os # <-- 1. ADD THIS IMPORT
from .models import db, User, Role, Restaurant, Category, MenuItem
from .security import user_datastore
import sys

def create_roles(ds):
    """Finds or creates the 'admin', 'owner', and 'customer' roles."""
    print("Finding or creating roles...")
    roles_to_create = {
        "admin": "Full administrative access",
        "owner": "Restaurant owner access",
        "customer": "Customer access"
    }
    
    role_objects = {}
    for role_name, role_desc in roles_to_create.items():
        role = ds.find_role(role_name)
        if not role:
            try:
                role = ds.create_role(name=role_name, description=role_desc)
                print(f"Role '{role_name}' created.")
            except Exception as e:
                print(f"Error creating role '{role_name}': {e}")
                continue
        role_objects[role_name] = role
        
    try:
        db.session.commit()
        print("Roles check/creation complete.")
    except Exception as e:
        print(f"Error committing roles: {e}")
        db.session.rollback()
        
    return role_objects

def create_users_and_data(ds, roles):
    """
    Finds or creates default users and sample restaurant data.
    """
    
    print("Finding, creating, or updating users...")
    
    # --- 2. USE ENVIRONMENT VARIABLES FOR PASSWORDS ---
    admin_pass = os.environ.get('DEFAULT_ADMIN_PASS', 'admin123')
    owner_pass = os.environ.get('DEFAULT_OWNER_PASS', 'owner123')
    cust_pass = os.environ.get('DEFAULT_CUST_PASS', 'cust123')
    
    # --- Admin User ---
    admin_email = "admin@crav.com"
    try:
        admin_user = ds.find_user(email=admin_email)
        
        if not admin_user:
            admin_user = ds.create_user(
                email=admin_email,
                password=admin_pass, # <-- USE VARIABLE
                name="Admin User"
            )
            print(f"Admin user '{admin_email}' created.")
        
        if not admin_user.has_role("admin"):
            ds.add_role_to_user(admin_user, roles["admin"])
            print(f"Added 'admin' role to '{admin_email}'.")
    except Exception as e:
        print(f"Error with admin user: {e}")

    # --- Owner User ---
    owner_email = "owner1@email.com"
    try:
        owner_user = ds.find_user(email=owner_email)
        
        if not owner_user:
            owner_user = ds.create_user(
                email=owner_email,
                password=owner_pass, # <-- USE VARIABLE
                name="Owner One"
            )
            print(f"Owner user '{owner_email}' created.")
            
        if not owner_user.has_role("owner"):
            ds.add_role_to_user(owner_user, roles["owner"])
            print(f"Added 'owner' role to '{owner_email}'.")
    except Exception as e:
        print(f"Error with owner user: {e}")
    
    # --- Customer User ---
    cust_email = "customer1@email.com"
    try:
        cust_user = ds.find_user(email=cust_email)
        
        if not cust_user:
            cust_user = ds.create_user(
                email=cust_email,
                password=cust_pass, # <-- USE VARIABLE
                name="Customer One"
            )
            print(f"Customer user '{cust_email}' created.")
            
        if not cust_user.has_role("customer"):
            ds.add_role_to_user(cust_user, roles["customer"])
            print(f"Added 'customer' role to '{cust_email}'.")
    except Exception as e:
        print(f"Error with customer user: {e}")
    
    try:
        db.session.commit()
        print("Users check/creation/update complete.")
    except Exception as e:
        print(f"Error committing users: {e}")
        db.session.rollback()

    # --- Create Restaurant Data ---
    # ... (rest of the file is fine) ...
    try:
        owner_user_from_db = ds.find_user(email=owner_email) 

        print("Finding or creating sample restaurant data...")
        if owner_user_from_db and not Restaurant.query.filter_by(owner_id=owner_user_from_db.id).first():
            new_resto = Restaurant(
                owner_id=owner_user_from_db.id,
                name="Owner One's Eatery",
                description="A default restaurant for testing.",
                address="123 Food St",
                city="Flavor Town",
                latitude=40.7128,
                longitude=-74.0060,
                delivery_fee=40.0,
                platform_fee=15.0,
                is_verified=True,
                is_active=True
            )
            db.session.add(new_resto)
            db.session.commit()
            print(f"Restaurant '{new_resto.name}' created.")

            # Create Categories
            cat1 = Category(name="Appetizers", restaurant_id=new_resto.id)
            cat2 = Category(name="Main Courses", restaurant_id=new_resto.id)
            db.session.add_all([cat1, cat2])
            db.session.commit()
            print("Sample categories created.")

            # Create Menu Items
            item1 = MenuItem(name="Spring Rolls", description="Crispy fried rolls with vegetable filling.", price=5.99, category_id=cat1.id, restaurant_id=new_resto.id, food_type='Veg')
            item2 = MenuItem(name="House Burger", description="Juicy beef patty with cheese and fresh vegetables.", price=12.99, category_id=cat2.id, restaurant_id=new_resto.id, food_type='Non-Veg')
            item3 = MenuItem(name="Pasta Carbonara", description="Creamy pasta with bacon and parmesan.", price=15.50, category_id=cat2.id, restaurant_id=new_resto.id, food_type='Non-Veg')
            db.session.add_all([item1, item2, item3])
            db.session.commit()
            print("Sample menu items created.")
        else:
            print("Sample restaurant data already exists or owner not found.")
    except Exception as e:
        print(f"Error creating restaurant data: {e}")
        db.session.rollback()

def init_app(app):
    """
    Main function to initialize data. 
    This is called by our temporary route.
    """
    with app.app_context():
        try:
            print("--- Starting Initial Data Setup ---")
            
            roles = create_roles(user_datastore)
            create_users_and_data(user_datastore, roles)
            print("--- Data Setup Complete ---")
        except Exception as e:
            print(f"An error occurred during data setup: {e}", file=sys.stderr)
            db.session.rollback()
            # Don't re-raise the exception - let the route handle it