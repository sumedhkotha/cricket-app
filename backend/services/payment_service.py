import hmac
import hashlib
import logging
from typing import Optional, Dict, Any
from backend.config import settings

logger = logging.getLogger(__name__)

# Try importing razorpay SDK if available
try:
    import razorpay
    _HAS_RAZORPAY_SDK = True
except ImportError:
    _HAS_RAZORPAY_SDK = False


class PaymentService:
    @staticmethod
    def get_razorpay_client():
        if _HAS_RAZORPAY_SDK and settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET:
            try:
                return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            except Exception as e:
                logger.warning(f"Could not initialize Razorpay client: {e}")
        return None

    @classmethod
    def create_order(cls, amount_in_inr: int, receipt: str, notes: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Creates an order with Razorpay or generates a valid server-side mock order if mock mode is active.
        Amount must be in INR integer (e.g. 699). Razorpay expects amount in paise (69900).
        """
        amount_in_paise = int(amount_in_inr * 100)
        client = cls.get_razorpay_client()
        
        # If real keys and not mock payments, attempt Razorpay API
        if client and not settings.IS_MOCK_PAYMENTS and not settings.RAZORPAY_KEY_ID.startswith("rzp_test_cricketvault_demo"):
            try:
                order_payload = {
                    "amount": amount_in_paise,
                    "currency": "INR",
                    "receipt": receipt,
                    "notes": notes or {}
                }
                rzp_order = client.order.create(data=order_payload)
                return {
                    "order_id": rzp_order["id"],
                    "amount": amount_in_inr,
                    "currency": "INR",
                    "status": rzp_order.get("status", "created"),
                    "is_live_gateway": True
                }
            except Exception as e:
                logger.warning(f"Razorpay API order creation failed, falling back to mock: {e}")
                
        # Server-side test order creation
        order_id = f"order_{receipt}"
        return {
            "order_id": order_id,
            "amount": amount_in_inr,
            "currency": "INR",
            "status": "created",
            "is_live_gateway": False
        }

    @classmethod
    def compute_signature(cls, order_id: str, payment_id: str, secret: Optional[str] = None) -> str:
        """
        Computes HMAC-SHA256 signature for Razorpay verification:
        signature = hmac_sha256(order_id + "|" + payment_id, secret)
        """
        key_secret = secret or settings.RAZORPAY_KEY_SECRET
        msg = f"{order_id}|{payment_id}".encode("utf-8")
        return hmac.new(key_secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()

    @classmethod
    def verify_payment_signature(cls, order_id: str, payment_id: str, signature: str) -> bool:
        """
        Cryptographically verifies the payment signature using the secret key.
        Never trusts client-side success flags.
        """
        if not order_id or not payment_id or not signature:
            return False

        # Official Razorpay SDK verification if available
        client = cls.get_razorpay_client()
        if client:
            try:
                client.utility.verify_payment_signature({
                    "razorpay_order_id": order_id,
                    "razorpay_payment_id": payment_id,
                    "razorpay_signature": signature
                })
                return True
            except Exception:
                pass

        # Standard HMAC-SHA256 constant-time comparison
        expected_sig = cls.compute_signature(order_id, payment_id)
        return hmac.compare_digest(signature, expected_sig)

    @classmethod
    def verify_webhook_signature(cls, raw_body: bytes, signature: str) -> bool:
        """
        Verifies Razorpay webhook signature against the configured webhook secret.
        """
        if not signature or not raw_body:
            return False

        webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET or settings.RAZORPAY_KEY_SECRET
        
        # Verify via Razorpay SDK if available
        client = cls.get_razorpay_client()
        if client:
            try:
                client.utility.verify_webhook_signature(
                    raw_body.decode("utf-8") if isinstance(raw_body, (bytes, bytearray)) else raw_body,
                    signature,
                    webhook_secret
                )
                return True
            except Exception:
                pass

        # Standard HMAC-SHA256 check
        expected_sig = hmac.new(webhook_secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
        return hmac.compare_digest(signature, expected_sig)
