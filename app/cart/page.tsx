"use client";
import { useState } from "react";
import RazorpayPayment from "@/components/RazorpayPayment";

export default function CheckoutPage() {
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handlePaymentSuccess = async (
    paymentId: string,
    orderId: string,
    signature: string,
  ) => {
    // Verify the payment on your server
    const response = await fetch("/api/payment/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        razorpay_signature: signature,
      }),
    });

    const data = await response.json();

    if (data.success) {
      setPaymentSuccess(true);
      // You can redirect to order confirmation page
      // or update your UI as needed
    } else {
      alert("Payment verification failed. Please contact support.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>
      <RazorpayPayment
        amount={1000}
        name="John Doe"
        email="john@example.com"
        contact="9876543210"
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
