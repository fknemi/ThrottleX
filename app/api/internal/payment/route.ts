// app/api/payment/route.ts
import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: NextRequest) {
  try {
    const { amount, currency = "INR", receipt } = await req.json();

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const options = {
      amount: Number(amount) * 100, // Razorpay expects amount in paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const order = await instance.orders.create(options);

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error("Razorpay order creation failed:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 },
    );
  }
}
