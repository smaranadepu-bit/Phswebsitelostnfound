from passlib.context import CryptContext
import sys

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

if len(sys.argv) < 2:
    print("Usage: python generate_admin_hash.py <password>")
    sys.exit(1)

pw = sys.argv[1]
print(pwd_context.hash(pw))
