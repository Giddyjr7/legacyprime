import socket
import ssl

def test_smtp_connection():
    # Test standard SMTP (port 587)
    print("Testing SMTP connection to smtp.gmail.com:587...")
    try:
        sock = socket.create_connection(('smtp.gmail.com', 587), timeout=10)
        print("Successfully connected to SMTP server on port 587")
        sock.close()
    except Exception as e:
        print(f"Failed to connect to port 587: {str(e)}")

    # Test SSL SMTP (port 465)
    print("\nTesting SMTP connection to smtp.gmail.com:465...")
    try:
        sock = socket.create_connection(('smtp.gmail.com', 465), timeout=10)
        ssl_sock = ssl.wrap_socket(sock)
        print("Successfully connected to SMTP server on port 465")
        ssl_sock.close()
    except Exception as e:
        print(f"Failed to connect to port 465: {str(e)}")

if __name__ == '__main__':
    test_smtp_connection()