import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent

# Email configuration test file
def test_email_config():
    print("Current email settings:")
    print("-" * 50)
    
    # Required settings
    required_settings = {
        'EMAIL_HOST': os.getenv('EMAIL_HOST', 'smtp.gmail.com'),
        'EMAIL_PORT': os.getenv('EMAIL_PORT', '465'),
        'EMAIL_USE_SSL': os.getenv('EMAIL_USE_SSL', 'True'),
        'EMAIL_USE_TLS': os.getenv('EMAIL_USE_TLS', 'False'),
        'EMAIL_HOST_USER': os.getenv('EMAIL_HOST_USER'),
        'EMAIL_HOST_PASSWORD': os.getenv('EMAIL_HOST_PASSWORD'),
    }
    
    # Check each setting
    missing_settings = []
    for key, value in required_settings.items():
        if value is None or value == '':
            missing_settings.append(key)
        print(f"{key}: {'*' * 8 if 'PASSWORD' in key else value}")
    
    if missing_settings:
        print("\n❌ Missing required settings:", ', '.join(missing_settings))
    else:
        print("\n✓ All required settings are present")
    
    # Network connectivity test
    print("\nTesting network connectivity...")
    import socket
    try:
        # Try to resolve Gmail's SMTP server
        host_ip = socket.gethostbyname('smtp.gmail.com')
        print(f"✓ DNS resolution successful: smtp.gmail.com -> {host_ip}")
        
        # Try to connect to the SMTP port
        port = int(required_settings['EMAIL_PORT'])
        sock = socket.create_connection((host_ip, port), timeout=5)
        sock.close()
        print(f"✓ Successfully connected to {host_ip}:{port}")
    except socket.gaierror:
        print("❌ Failed to resolve smtp.gmail.com")
    except socket.timeout:
        print(f"❌ Connection timed out to {host_ip}:{port}")
    except ConnectionRefusedError:
        print(f"❌ Connection refused to {host_ip}:{port}")
    except Exception as e:
        print(f"❌ Connection test failed: {str(e)}")

if __name__ == '__main__':
    test_email_config()