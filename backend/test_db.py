from db import test_connection, create_tables

if __name__ == "__main__":
    test_connection()
    create_tables()
    print("DB OK + tables created")
