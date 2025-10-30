import smtplib
import os
from dotenv import load_dotenv
import socket

load_dotenv()

def test_smtp_connection():
    # Get credentials from env
    host = "smtp.gmail.com"
    port = 465  # Use SSL port
    username = os.getenv('EMAIL_HOST_USER')
    password = os.getenv('EMAIL_HOST_PASSWORD')
    
    print(f"Testing SMTP connection to {host}:{port} (SSL)")
    print(f"Using account: {username}")
    
    try:
        # Set a shorter timeout for the initial connection
        socket.setdefaulttimeout(10)
        
        # Create SMTP_SSL object for direct SSL connection
        server = smtplib.SMTP_SSL(host, port, timeout=10)
        print("Initial SSL connection successful")
        
        # Debug mode
        server.set_debuglevel(1)
        print("Debug mode enabled")
        
        # Login
        server.login(username, password)
        print("Login successful")
        
        # Close connection
        server.quit()
        print("Test completed successfully!")
        return True
        
    except socket.timeout as e:
        print(f"Connection timed out: {str(e)}")
        print("Possible causes:")
        print("- Network connectivity issues")
        print("- Firewall blocking port 587")
        print("- VPN or proxy interference")
        return False
        
    except smtplib.SMTPAuthenticationError as e:
        print(f"Authentication failed: {str(e)}")
        print("Please check your Gmail app password")
        return False
        
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        return False

if __name__ == "__main__":
    test_smtp_connection()