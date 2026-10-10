"""
Cricket Vault - Razorpay Payment Utility & Link Generator
Uses the configured Razorpay test credentials to generate live orders and payment links.
"""
import sys
import os
import json
import razorpay

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
from backend.config import settings

def main():
    key_id = settings.RAZORPAY_KEY_ID
    key_secret = settings.RAZORPAY_KEY_SECRET

    print("=" * 60)
    print("CRICKET VAULT - RAZORPAY TEST GATEWAY")
    print("=" * 60)
    print(f"Key ID:     {key_id}")
    print(f"Key Secret: {key_secret[:4]}***{key_secret[-4:]}")
    print("=" * 60)

    client = razorpay.Client(auth=(key_id, key_secret))

    # 1. Create a Razorpay Order for ₹699 (Elite Plan)
    amount_inr = 699
    amount_paise = amount_inr * 100
    
    order = client.order.create(data={
        "amount": amount_paise,
        "currency": "INR",
        "receipt": "rcpt_elite_plan_live",
        "notes": {
            "plan_id": "plan_elite",
            "platform": "Cricket Vault Coaching"
        }
    })
    print(f"\n✔ Live Razorpay Order Created:")
    print(f"  Order ID:  {order['id']}")
    print(f"  Amount:    ₹{order['amount'] / 100:.2f} ({order['amount']} paise)")
    print(f"  Status:    {order['status']}")

    # 2. Create a direct Razorpay Hosted Payment Link for testing in browser
    try:
        payment_link = client.payment_link.create({
            "amount": amount_paise,
            "currency": "INR",
            "accept_partial": False,
            "description": "Cricket Vault - Elite Subscription Plan (₹699)",
            "customer": {
                "name": "Kotha Sumedh Royal",
                "email": "sumedh@cricketvault.demo",
                "contact": "+919876543210"
            },
            "notify": {"sms": False, "email": False},
            "reminder_enable": False,
            "notes": {
                "order_id": order["id"],
                "plan": "plan_elite"
            }
        })
        print(f"\n✔ Direct Razorpay Hosted Payment Link:")
        print(f"  Link ID:   {payment_link['id']}")
        print(f"  URL:       {payment_link['short_url']}")
        print(f"  Status:    {payment_link['status']}")
    except Exception as e:
        print(f"\nCould not create hosted payment link: {e}")

    print("=" * 60)
    return order

if __name__ == "__main__":
    main()
