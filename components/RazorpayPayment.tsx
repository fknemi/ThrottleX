"use client";
// components/RazorpayPayment.tsx
import { useState } from "react";
import Script from "next/script";
import { Button } from "./ui/button";

type PaymentProps = {
  amount: number;
  name: string;
  email: string;
  contact: string;
  onSuccessAction: (
    paymentId: string,
    orderId: string,
    signature: string,
  ) => void;
};

export default function RazorpayPayment({
  amount,
  name,
  email,
  contact,
  onSuccessAction,
}: PaymentProps) {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const initializePayment = async () => {
    setLoading(true);
    try {
      // Create order on your backend
      const response = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, receipt: `rcpt_${Date.now()}` }),
      });

      const { order } = await response.json();

      if (!order) throw new Error("Failed to create order");

      // Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Your Company Name",
        description: "Payment for services",
        order_id: order.id,
        prefill: {
          name,
          email,
          contact,
        },
        handler: function (response: any) {
          onSuccessAction(
            response.razorpay_payment_id,
            response.razorpay_order_id,
            response.razorpay_signature,
          );
        },
        theme: {
          color: "#3399cc",
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment initialization failed:", error);
      alert("Payment failed to initialize. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setScriptLoaded(true)}
      />

      <Button
        onClick={initializePayment}
        disabled={loading || !scriptLoaded}
        className=""
      >
        {loading ? "Processing..." : "Pay Now"}
      </Button>
    </>
  );
}
