from __future__ import annotations

from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

_hasher = PasswordHasher()

# A hash of an unguessable, unused password. Verifying against this on an
# unknown-email login keeps the response time close to a real password
# check, so the endpoint doesn't leak which emails are registered via timing.
_DUMMY_HASH = _hasher.hash("prelegal-dummy-password-for-timing-safety")


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str | None) -> bool:
    try:
        return _hasher.verify(password_hash or _DUMMY_HASH, password)
    except VerifyMismatchError:
        return False


def create_session_token(user_id: int, secret: str) -> str:
    serializer = URLSafeTimedSerializer(secret, salt="prelegal-session")
    return serializer.dumps({"user_id": user_id})


def verify_session_token(token: str, secret: str, max_age_seconds: int) -> int | None:
    serializer = URLSafeTimedSerializer(secret, salt="prelegal-session")
    try:
        payload = serializer.loads(token, max_age=max_age_seconds)
    except (BadSignature, SignatureExpired):
        return None
    user_id = payload.get("user_id")
    return user_id if isinstance(user_id, int) else None
